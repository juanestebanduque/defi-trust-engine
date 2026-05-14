import { apiFetch } from './api';

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_PAYMENT' | 'LOAN_FUNDING' | 'LOAN_RECEIPT';

export interface TransactionResponse {
  id: number;
  transactionHash: string;
  userId: number;
  type: TransactionType | string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface RegisterTransactionPayload {
  userId: number;
  type: TransactionType;
  amount: number;
  description: string;
}

export interface TransactionHistoryResponse {
  totalReceived: number;
  totalSent: number;
  totalTransactions: number;
  transactions: {
    content: TransactionResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

export interface GetHistoryParams {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const transactionService = {
  register: (payload: RegisterTransactionPayload) =>
    apiFetch<TransactionResponse>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getByHash: (hash: string) => apiFetch<TransactionResponse>(`/api/transactions/${hash}`),
  getByUser: (userId: number) => apiFetch<TransactionResponse[]>(`/api/transactions/user/${userId}`),
  getHistory: (params?: GetHistoryParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.size !== undefined) query.append('size', String(params.size));
    if (params?.sort) query.append('sort', params.sort);

    const queryString = query.toString();
    return apiFetch<TransactionHistoryResponse>(`/api/transactions/history${queryString ? `?${queryString}` : ''}`);
  },
};

