import { clearSession, getToken } from './session';

const API_URL = import.meta.env.VITE_API_URL ?? import.meta.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  payload: Record<string, string>;
  status: number;

  constructor(message: string, status: number, payload: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function toErrorPayload(data: unknown): Record<string, string> {
  if (!data || typeof data !== 'object') {
    return { error: 'Error desconocido' };
  }
  const source = data as Record<string, unknown>;
  const normalized = Object.entries(source).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    }
    return acc;
  }, {});
  return Object.keys(normalized).length > 0 ? normalized : { error: 'Error desconocido' };
}

function resolveApiUrl(path: string): string {
  if (!API_URL) {
    throw new Error('Falta configurar VITE_API_URL o NEXT_PUBLIC_API_URL');
  }
  return `${API_URL}${path}`;
}

export function buildApiUrl(path: string): string {
  return resolveApiUrl(path);
}

function parseErrorText(text: string): Record<string, string> {
  const normalized = text.trim();
  if (!normalized) {
    return { error: 'Error desconocido' };
  }
  return { error: normalized };
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(resolveApiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? toErrorPayload(await response.json().catch(() => ({ error: 'Error desconocido' })))
      : parseErrorText(await response.text().catch(() => 'Error desconocido'));
    const mainError = payload.error ?? 'Error desconocido';
    const isTokenInvalid = response.status === 400 && mainError.toLowerCase().includes('token inválido');
    if (isTokenInvalid) {
      clearSession();
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: payload }));
    }
    throw new ApiError(mainError, response.status, payload);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
}
