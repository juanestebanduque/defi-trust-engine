import { apiFetch } from './api';

export interface AdminUserDTO {
  id: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  fullName: string;
  phone: string;
  address: string;
  totalLoansTaken: number;
  totalRepaid: number;
  currentDebt: number;
  missedPayments: number;
  trustScore: number;
  trustLevel: 'ALTO' | 'MEDIO' | 'BAJO';
}

export const adminService = {
  listUsers: () =>
    apiFetch<AdminUserDTO[]>('/admin/users'),

  blockUser: (userId: number) =>
    apiFetch<AdminUserDTO>(`/admin/users/${userId}/block`, { method: 'PUT' }),

  activateUser: (userId: number) =>
    apiFetch<AdminUserDTO>(`/admin/users/${userId}/activate`, { method: 'PUT' }),
};
