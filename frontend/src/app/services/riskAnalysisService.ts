import { apiFetch } from './api';

export interface RiskFactor {
  type: 'POSITIVE' | 'NEGATIVE' | 'WARNING';
  description: string;
}

export interface RiskAnalysisResponse {
  borrowerId: number;
  borrowerEmail: string;
  borrowerName: string;
  trustScore: number;
  trustLevel: 'ALTO' | 'MEDIO' | 'BAJO';
  punctualityScore: number;
  activityScore: number;
  stabilityScore: number;
  totalLoans: number;
  activeLoans: number;
  paidLoans: number;
  defaultedLoans: number;
  totalInstallments: number;
  paidOnTime: number;
  latePayments: number;
  pendingOverdue: number;
  totalLateDays: number;
  averageDaysLate: number;
  totalLoansTaken: number;
  totalRepaid: number;
  currentDebt: number;
  missedPayments: number;
  riskFactors: RiskFactor[];
  dataAvailability: 'SUFFICIENT' | 'LIMITED' | 'NONE';
  dataAvailabilityMessage: string;
  overallRiskRating: 'BAJO' | 'MEDIO' | 'ALTO';
  lenderRecommendation: string;
  analysisDate: string;
}

export const riskAnalysisService = {
  getRiskAnalysis: (borrowerId: number) =>
    apiFetch<RiskAnalysisResponse>(`/risk-analysis/${borrowerId}`),
};
