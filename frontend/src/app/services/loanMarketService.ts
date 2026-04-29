import { apiFetch, buildApiUrl, ApiError } from './api';
import { getToken } from './session';

export interface LoanRequestDTO {
  loanId: number;
  borrowerId: number;
  borrowerEmail: string;
  amount: number;
  termMonths: number;
  interestRate: number;
  status: string;
  startDate: string;
  endDate: string;
  trustScore: number;
  saved: boolean;
  createdAt: string;
}

export interface LoanMarketFilters {
  lenderId?: number;
  minAmount?: number;
  maxAmount?: number;
  minTrustScore?: number;
  maxTrustScore?: number;
}

function toQueryString(filters: LoanMarketFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function noContentRequest(path: string): Promise<void> {
  const token = getToken();
  const response = await fetch(buildApiUrl(path), {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 204) {
    return;
  }

  const text = await response.text().catch(() => 'Error desconocido');
  throw new ApiError(text || 'Error desconocido', response.status, { error: text || 'Error desconocido' });
}

export const loanMarketService = {
  getAvailable: (filters: LoanMarketFilters = {}) =>
    apiFetch<LoanRequestDTO[]>(`/loan-requests${toQueryString(filters)}`),
  save: (loanId: number, lenderId: number) =>
    apiFetch<LoanRequestDTO>(`/loan-requests/${loanId}/save?lenderId=${lenderId}`, {
      method: 'POST',
    }),
  unsave: (loanId: number, lenderId: number) =>
    noContentRequest(`/loan-requests/${loanId}/save?lenderId=${lenderId}`),
  getSaved: (lenderId: number) =>
    apiFetch<LoanRequestDTO[]>(`/loan-requests/saved?lenderId=${lenderId}`),
};

