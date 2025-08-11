import express from 'express';
import { initDB } from './db.js';
import dotenv from 'dotenv';

function startServer() {
  dotenv.config();
  const app = express();
  const db = initDB();

  app.use(express.json());

  app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', dbPath: db.name });
  });

  app.listen(process.env.SERVER_PORT, () => {
    console.log(`Backend running on ${process.env.VITE_BASE_URL}${process.env.SERVER_PORT}`);
  });
}

export { startServer };
