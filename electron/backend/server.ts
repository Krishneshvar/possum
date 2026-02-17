import express from 'express';
import helmet from 'helmet';
import { initDB } from './shared/db/index.js';
import { registerRoutes } from './routes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { app as electronApp } from 'electron';
import { logger, httpLogger } from './shared/utils/logger.js';
import { globalErrorHandler } from './shared/middleware/error.middleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// Listen for unhandled rejections and exceptions
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection at Promise', { reason: reason?.stack || reason });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown', { error: error.stack || error.message });
  // Recommended to exit after uncaughtException as the process is in an undefined state
  process.exit(1);
});

export function startServer(): void {
  initDB();
  const expressApp = express();

  // Security Middleware
  expressApp.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Technical Logging (HTTP Request Tracking)
  expressApp.use(httpLogger);

  const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  };

  expressApp.use(cors(corsOptions));

  // Serve uploads from userData directory (persistent and safe)
  const uploadsDir = path.join(electronApp.getPath('userData'), 'uploads');
  expressApp.use('/uploads', express.static(uploadsDir));

  expressApp.use(express.json());

  // Register all routes from modules
  registerRoutes(expressApp);

  // Global Technical Error Handling
  expressApp.use(globalErrorHandler);

  expressApp.listen(3001, () => {
    logger.info('Backend running on http://localhost:3001');
  });
}
