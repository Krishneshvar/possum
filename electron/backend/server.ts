/**
 * Express Server Bootstrap
 * Initializes and starts the HTTP server
 */
import express from 'express';
import { initDB } from './shared/db/index.js';
import { registerRoutes } from './routes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { app as electronApp } from 'electron';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export function startServer(): void {
  initDB();
  const expressApp = express(); // Renamed to avoid conflict

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

  expressApp.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');
  });
}
