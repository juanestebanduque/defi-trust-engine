import { apiFetch } from './api';

export interface AuthResponse {
  id: number;
  token: string;
  email: string;
  role: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
  phone?: string;
  address?: string;
  blockchainHashId?: string;
  role?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
  securityAnswer: string;
  newPassword: string;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: LoginPayload) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiFetch<string>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => apiFetch<AuthResponse>('/auth/me'),
};
