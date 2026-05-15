import { apiFetch } from './api';

export interface PublicProfileResponse {
  userId: number;
  displayName: string;
  trustScore: number;
  level: 'ALTO' | 'MEDIO' | 'BAJO';
  levelDescription: string;
  totalLoansTaken: number;
  totalRepaid: number;
  missedPayments: number;
  pendingBalance: number;
  blocked: boolean;
  scoreDate: string | null;
}

export const publicProfileService = {
  getPublicProfile: (userId: number) =>
    apiFetch<PublicProfileResponse>(`/users/${userId}/public-profile`),
};
