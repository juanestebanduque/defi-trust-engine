import { apiFetch } from './api';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  blockchainHashId?: string;
}

export interface UserProfileResponse {
  id: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  fullName: string;
  phone: string;
  address: string;
  blockchainHashId: string;
  totalLoansTaken: number;
  totalRepaid: number;
  missedPayments: number;
  currentDebt: number;
}

export const userService = {
  updateProfile: (userId: number, payload: UpdateProfilePayload) =>
    apiFetch<string>(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getTrustScore: (userId: number) => apiFetch<number>(`/users/${userId}/trust-score`),
  getMyProfile: () => apiFetch<UserProfileResponse>('/users/me'),
};
