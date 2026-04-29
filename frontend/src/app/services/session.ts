export interface AuthSession {
  id: number;
  token: string;
  role: string;
  email: string;
}

const SESSION_KEYS = {
  id: 'userId',
  token: 'token',
  role: 'role',
  email: 'email',
  firstName: 'profileFirstName',
  lastName: 'profileLastName',
  phone: 'profilePhone',
  address: 'profileAddress',
  blockchainHashId: 'profileBlockchainHashId',
} as const;

export function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEYS.id, String(session.id));
  localStorage.setItem(SESSION_KEYS.token, session.token);
  localStorage.setItem(SESSION_KEYS.role, session.role);
  localStorage.setItem(SESSION_KEYS.email, session.email);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEYS.id);
  localStorage.removeItem(SESSION_KEYS.token);
  localStorage.removeItem(SESSION_KEYS.role);
  localStorage.removeItem(SESSION_KEYS.email);
  localStorage.removeItem(SESSION_KEYS.firstName);
  localStorage.removeItem(SESSION_KEYS.lastName);
  localStorage.removeItem(SESSION_KEYS.phone);
  localStorage.removeItem(SESSION_KEYS.address);
  localStorage.removeItem(SESSION_KEYS.blockchainHashId);
}

export function getToken(): string | null {
  return localStorage.getItem(SESSION_KEYS.token);
}

export function getUserId(): number | null {
  const raw = localStorage.getItem(SESSION_KEYS.id);
  if (!raw) {
    return null;
  }
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

export function getEmail(): string {
  return localStorage.getItem(SESSION_KEYS.email) ?? '';
}

export interface StoredProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  blockchainHashId: string;
}

export function saveProfileData(profile: Partial<StoredProfileData>): void {
  if (profile.firstName !== undefined) localStorage.setItem(SESSION_KEYS.firstName, profile.firstName);
  if (profile.lastName !== undefined) localStorage.setItem(SESSION_KEYS.lastName, profile.lastName);
  if (profile.phone !== undefined) localStorage.setItem(SESSION_KEYS.phone, profile.phone);
  if (profile.address !== undefined) localStorage.setItem(SESSION_KEYS.address, profile.address);
  if (profile.blockchainHashId !== undefined) localStorage.setItem(SESSION_KEYS.blockchainHashId, profile.blockchainHashId);
}

export function getStoredProfileData(): StoredProfileData {
  return {
    firstName: localStorage.getItem(SESSION_KEYS.firstName) ?? '',
    lastName: localStorage.getItem(SESSION_KEYS.lastName) ?? '',
    phone: localStorage.getItem(SESSION_KEYS.phone) ?? '',
    address: localStorage.getItem(SESSION_KEYS.address) ?? '',
    blockchainHashId: localStorage.getItem(SESSION_KEYS.blockchainHashId) ?? '',
  };
}

export function isProfileComplete(): boolean {
  const profile = getStoredProfileData();
  return Boolean(profile.phone.trim() && profile.blockchainHashId.trim());
}
