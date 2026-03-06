import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import https from 'https';

export const config = {
  api: {
    bodyParser: false,
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

// Only forward these request headers to the backend
const ALLOWED_REQUEST_HEADERS = new Set([
  'authorization',
  'content-type',
  'content-length',
  'cookie',
  'accept',
  'user-agent',
  'x-requested-with',
]);

// Validate that the path is safe to proxy
function isValidPath(p: string): boolean {
  // Block path traversal and protocol injections
  if (p.includes('..') || p.includes('://') || p.includes('\\')) return false;
  // Must start with /api/
  if (!p.startsWith('/api/')) return false;
  return true;
}

// Read the raw request body as a Buffer
function readRawBody(req: NextApiRequest): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return resolve(null);
    }
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : null));
    req.on('error', reject);
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { path } = req.query;
  const targetPath = ('/api/' + (Array.isArray(path) ? path.join('/') : path) + '/').replace(/\/+/g, '/');

  if (!isValidPath(targetPath)) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }

  const url = new URL(targetPath, BACKEND);
  // Forward query params (preserve arrays via append)
  Object.entries(req.query).forEach(([key, value]) => {
    if (key !== 'path') {
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, v || '');
        }
      } else {
        url.searchParams.set(key, value || '');
      }
    }
  });

  const body = await readRawBody(req);

  // Forward only allowed headers
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!ALLOWED_REQUEST_HEADERS.has(key)) continue;
    if (typeof value === 'string') headers[key] = value;
    else if (Array.isArray(value)) headers[key] = value.join(', ');
  }
  if (body) {
    headers['content-length'] = body.length.toString();
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
