import { apiFetch } from './api';

export interface MakePaymentPayload {
  loanId: number;
  borrowerId: number;
  amount: number;
  installmentId: number | null;
}

export interface PaymentResponse {
  loanId: number;
  installmentId: number;
  installmentNumber: number;
  amountPaid: number;
  newPendingBalance: number;
  installmentStatus: string;
  transactionHash: string;
  paidAt: string;
}

export const paymentService = {
  makePayment: (payload: MakePaymentPayload) =>
    apiFetch<PaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

