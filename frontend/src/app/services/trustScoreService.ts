import { apiFetch } from './api';

export interface MyTrustScoreResponse {
  scoreValue: number;
  level: 'ALTO' | 'MEDIO' | 'BAJO';
  calculationDate: string;
}

export const trustScoreService = {
  getMyScore: () => apiFetch<MyTrustScoreResponse>('/trust-scores/me'),
};

