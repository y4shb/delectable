import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import https from 'https';

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';

// Hop-by-hop headers that must not be forwarded
const HOP_BY_HOP = new Set([
  'transfer-encoding',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'upgrade',
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { path } = req.query;
  const targetPath = ('/api/' + (Array.isArray(path) ? path.join('/') : path) + '/').replace(/\/+/g, '/');

  const url = new URL(targetPath, BACKEND);
  // Forward query params
  Object.entries(req.query).forEach(([key, value]) => {
    if (key !== 'path') {
      url.searchParams.set(key, Array.isArray(value) ? value[0] : value || '');
    }
  });

  const body = req.method !== 'GET' && req.method !== 'HEAD' && req.body
    ? JSON.stringify(req.body)
    : null;

  // Forward headers (except host and connection)
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key === 'host' || key === 'connection') continue;
    if (typeof value === 'string') headers[key] = value;
    else if (Array.isArray(value)) headers[key] = value.join(', ');
  }
  if (body) {
    headers['content-type'] = 'application/json';
    headers['content-length'] = Buffer.byteLength(body).toString();
  }

  // Pick http or https based on backend URL protocol
  const transport = url.protocol === 'https:' ? https : http;

  return new Promise<void>((resolve) => {
    const proxyReq = transport.request(
      url.toString(),
      {
        method: req.method || 'GET',
        headers,
      },
      (proxyRes) => {
        // Forward status
        res.status(proxyRes.statusCode || 500);

        // Forward response headers, filtering hop-by-hop headers
        const responseHeaders = proxyRes.headers;
        for (const [key, value] of Object.entries(responseHeaders)) {
          if (value && !HOP_BY_HOP.has(key)) {
            res.setHeader(key, value);
          }
        }

        // Stream response body
        const chunks: Buffer[] = [];
        proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
        proxyRes.on('end', () => {
          const responseBody = Buffer.concat(chunks);
          res.end(responseBody);
          resolve();
        });
      },
    );

    proxyReq.setTimeout(30_000, () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: 'Backend timeout' });
      }
      resolve();
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.status(502).json({ error: 'Backend unavailable' });
      }
      resolve();
    });

    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
}
