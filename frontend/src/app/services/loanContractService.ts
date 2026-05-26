import { apiFetch, buildApiUrl } from './api';
import { getToken } from './session';

export interface ContractInstallment {
  number: number;
  dueDate: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

export interface LoanContractData {
  loanId: number;
  contractNumber: string;
  generatedAt: string;
  status: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerAddress: string;
  borrowerPhone: string;
  borrowerBlockchainId: string;
  lenderName: string | null;
  lenderEmail: string | null;
  amount: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  totalPayment: number;
  pendingBalance: number;
  installments: ContractInstallment[];
}

export const loanContractService = {
  getContractData: (loanId: number) =>
    apiFetch<LoanContractData>(`/contracts/${loanId}`),

  downloadContract: async (loanId: number): Promise<void> => {
    const token = getToken();
    const response = await fetch(buildApiUrl(`/contracts/${loanId}/download`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('No se pudo descargar el contrato');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-prestamo-${loanId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
