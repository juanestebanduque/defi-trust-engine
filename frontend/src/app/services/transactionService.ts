import { apiFetch } from './api';

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_PAYMENT';

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

export const transactionService = {
  register: (payload: RegisterTransactionPayload) =>
    apiFetch<TransactionResponse>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getByHash: (hash: string) => apiFetch<TransactionResponse>(`/transactions/${hash}`),
  getByUser: (userId: number) => apiFetch<TransactionResponse[]>(`/transactions/user/${userId}`),
};

