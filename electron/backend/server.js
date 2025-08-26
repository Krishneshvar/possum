import express from 'express';
import { initDB } from './db.js';
import productsRouter from './routes/products.routes.js';
import categoriesRouter from './routes/categories.routes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function startServer() {
  initDB();
  const app = express();

  const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  };

  app.use(cors(corsOptions));

  app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

  app.use(express.json());

  app.use('/api/products', productsRouter);
  app.use('/api/categories', categoriesRouter);

  app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');
  });
}

export { startServer };
