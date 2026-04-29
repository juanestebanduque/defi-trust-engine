import { apiFetch } from './api';

export interface LoanRequestResponse {
  id: number;
  amount: number;
  interestRate: number;
  status: string;
  startDate: string;
  endDate: string;
  pendingBalance: number;
  createdAt: string;
}

export const loanService = {
  requestLoan: (amount: number, termMonths: number) =>
    apiFetch<LoanRequestResponse>('/loans/request', {
      method: 'POST',
      body: JSON.stringify({ amount, termMonths }),
    }),
};

