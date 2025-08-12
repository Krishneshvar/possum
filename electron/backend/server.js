import express from 'express';
import { initDB } from './db.js';
import productsRouter from './routes/products.routes.js';
import salesRouter from './routes/sales.routes.js';
import dotenv from 'dotenv';

function startServer() {
  dotenv.config();
  const app = express();
  initDB();

  app.use(express.json());

  app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong' });
  });

  app.use('/api/products', productsRouter);
  app.use('/api/sales', salesRouter);

  app.listen(process.env.SERVER_PORT, () => {
    console.log(`Backend running on ${process.env.VITE_BASE_URL}:${process.env.SERVER_PORT}`);
  });
}

export { startServer };
