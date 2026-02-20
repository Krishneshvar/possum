export interface AuthUser {
  id: number;
  name: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export interface SessionData extends AuthUser {
  token: string;
  expires_at: number;
}
