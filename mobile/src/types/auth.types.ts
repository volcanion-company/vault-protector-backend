export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  hasMasterPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface LoginCredentials {
  email: string;
  masterPassword: string;
}

export interface RegisterCredentials {
  email: string;
  masterPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  salt: string;
  wrappedVaultKey: string;
}

export interface SaltResponse {
  salt: string;
  kdfParams: KdfParams;
}

export interface KdfParams {
  algorithm: 'argon2id';
  memory: number;
  iterations: number;
  parallelism: number;
}

export interface Session {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface Device {
  id: string;
  name: string;
  platform: string;
  lastSeenAt: string;
  createdAt: string;
}
