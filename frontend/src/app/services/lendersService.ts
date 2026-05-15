import { apiFetch, buildApiUrl, ApiError } from './api';
import { getToken } from './session';

export interface UserCardResponse {
  userId: number;
  displayName: string;
  trustScore: number;       // escala 0–100 (mostrar ×10 = 0–1000)
  level: 'ALTO' | 'MEDIO' | 'BAJO';
  levelDescription: string;
  memberSince: string | null;
  saved: boolean;
}

export interface DirectoryFilters {
  name?: string;
  minScore?: number;   // 0–100
  maxScore?: number;   // 0–100
}

function toQueryString(filters: DirectoryFilters): string {
  const params = new URLSearchParams();
  if (filters.name)                          params.set('name',     filters.name);
  if (filters.minScore !== undefined)        params.set('minScore', String(filters.minScore));
  if (filters.maxScore !== undefined)        params.set('maxScore', String(filters.maxScore));
  const q = params.toString();
  return q ? `?${q}` : '';
}

async function deleteRequest(path: string): Promise<void> {
  const token = getToken();
  const response = await fetch(buildApiUrl(path), {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.status === 204 || response.ok) return;
  const text = await response.text().catch(() => 'Error desconocido');
  throw new ApiError(text, response.status, { error: text });
}

export const lendersService = {
  getDirectory: (filters: DirectoryFilters = {}) =>
    apiFetch<UserCardResponse[]>(`/lenders/directory${toQueryString(filters)}`),

  save: (lenderId: number) =>
    apiFetch<string>(`/lenders/${lenderId}/save`, { method: 'POST' }),

  unsave: (lenderId: number) =>
    deleteRequest(`/lenders/${lenderId}/save`),
};
