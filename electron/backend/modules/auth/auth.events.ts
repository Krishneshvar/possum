import { EventEmitter } from 'events';

export interface AuthEvent {
  type: 'login' | 'logout' | 'login_failed';
  userId?: number;
  username?: string;
  ip?: string;
  timestamp: string;
}

class AuthEventEmitter extends EventEmitter {}

export const authEvents = new AuthEventEmitter();
