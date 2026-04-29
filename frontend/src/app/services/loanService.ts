import { apiFetch } from './api';

// Matches backend LoanRequestDTO
export interface LoanDTO {
  loanId: number;
  borrowerId: number;
  borrowerEmail: string;
  amount: number;
  termMonths?: number;
  interestRate: number;
  status: string;
  startDate: string;
  endDate: string;
  trustScore: number;
  saved: boolean;
  createdAt: string;
}

export function calcTermMonths(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  );
}

export const loanService = {
  requestLoan: (amount: number, termMonths: number) =>
    apiFetch<LoanDTO>('/loans/request', {
      method: 'POST',
      body: JSON.stringify({ amount, termMonths }),
    }),
  getMyLoans: () => apiFetch<LoanDTO[]>('/loans/me'),
};
