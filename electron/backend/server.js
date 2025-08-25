import express from 'express';
import { initDB } from './db.js';
import productsRouter from './routes/products.routes.js';
import categoriesRouter from './routes/categories.routes.js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

function startServer() {
  initDB();
  const app = express();

  const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  };

  app.use(cors(corsOptions));

  app.use(express.json());

  app.use('/api/products', productsRouter);
  app.use('/api/categories', categoriesRouter);

  app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');
  });
}

export { startServer };
