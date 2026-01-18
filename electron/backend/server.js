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

function startServer() {
  initDB();
  const app = express();

  const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  };

  app.use(cors(corsOptions));

  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.use(express.json());

  // Register all routes from modules
  registerRoutes(app);

  app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');
  });
}

export { startServer };
