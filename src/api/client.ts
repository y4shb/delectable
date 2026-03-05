import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ---------------------------------------------------------------------------
// Access token management (in-memory only — never persisted to storage)
// ---------------------------------------------------------------------------
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ---------------------------------------------------------------------------
// snake_case ↔ camelCase key transformers
// ---------------------------------------------------------------------------
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function transformKeys(
  obj: unknown,
  transformer: (key: string) => string,
): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item, transformer));
  }
  if (
    obj !== null &&
    typeof obj === 'object' &&
    !(obj instanceof Date) &&
    !(obj instanceof File) &&
    !(obj instanceof Blob)
  ) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        transformer(key),
        transformKeys(value, transformer),
      ]),
    );
  }
  return obj;
}

export function toCamelCase<T = unknown>(obj: unknown): T {
  return transformKeys(obj, snakeToCamel) as T;
}

export function toSnakeCase(obj: unknown): unknown {
  return transformKeys(obj, camelToSnake);
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token + transform body to snake_case
// ---------------------------------------------------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (config.data && !(config.data instanceof FormData)) {
    config.data = toSnakeCase(config.data);
  }
  if (config.params) {
    config.params = toSnakeCase(config.params);
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — camelCase transform + 401 token refresh with mutex
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use raw axios to avoid infinite interceptor loop
        const { data } = await axios.post(
          '/api/auth/refresh/',
          null,
          { withCredentials: true },
        );
        const newToken = data.access;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
