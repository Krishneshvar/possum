// Global Express type extension
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      permissions?: string[];
      token?: string;
    }
  }
}

// Explicit module declarations for JS files
declare module '*/audit.service.js' {
    const value: any;
    export = value;
}
declare module '*/tax.repository.js' {
    const value: any;
    export = value;
}
declare module '*/sale.service.js' {
    const value: any;
    export = value;
}
declare module '*.js' {
    const value: any;
    export = value;
}
