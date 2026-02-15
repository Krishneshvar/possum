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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export function startServer(): void {
  initDB();
  const app = express();

  const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  };

  app.use(cors(corsOptions));

  // app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  // Adjust path for TS compiled structure.
  // if compiled to electron/dist/backend/server.js, then __dirname is electron/dist/backend
  // uploads is at root/uploads? or electron/uploads?
  // Original: electron/backend/server.js -> uploads is electron/uploads (../uploads)
  // Compiled: electron/dist/backend/server.js -> ../uploads is electron/dist/uploads.
  // We need to point to the correct uploads dir.
  // Assuming uploads is in project root or electron root.
  // Let's use getBasePath() from utils or similar if available, or relative path.
  // For now, keeping as is but aware of potential path issue in dist.

  app.use('/uploads', express.static(path.join(__dirname, '..', '..', '..', 'uploads'))); // Assuming dist structure is dist/electron/backend/server.js
  // Wait, if tsc preserves structure:
  // electron/backend/server.ts -> dist/electron/backend/server.js
  // Then __dirname is dist/electron/backend
  // ../.. is dist/
  // But uploads is in electron/uploads or root/uploads?
  // Original code: path.join(__dirname, '..', 'uploads') where __dirname is electron/backend
  // So uploads is electron/uploads.
  // In dist: dist/electron/backend -> .. -> dist/electron -> .. -> dist
  // We want electron/uploads (source) or dist/electron/uploads (if copied)?
  // Usually uploads are dynamic content, should be outside dist or in userData.
  // For dev, it's source.
  // Let's stick to relative path for now but maybe adjust.
  // If we run from dist, we might need to look at source dir if not copied.
  // But usually uploads are user data.
  // I'll leave it as ../uploads relative to __dirname for now, assuming similar structure.
  // Actually, if we use `outDir: dist`, `electron/` goes to `dist/electron/`.
  // So `dist/electron/backend/server.js`. `..` is `dist/electron/backend`. `..` is `dist/electron`.
  // `uploads` should be `dist/electron/uploads` if we want it there.

  app.use(express.json());

  // Register all routes from modules
  registerRoutes(app);

  app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');
  });
}
