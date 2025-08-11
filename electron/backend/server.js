import express from 'express';
import { initDB } from './db.js';

function startServer() {
  const app = express();
  const db = initDB();
  const PORT = 3001;

  app.use(express.json());

  app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', dbPath: db.name });
  });

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export { startServer };
