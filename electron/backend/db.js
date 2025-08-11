import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function initDB() {
  const userDataPath = app ? app.getPath('userData') : __dirname;
  const dbPath = path.join(userDataPath, 'possum.db');

  const firstTime = !fs.existsSync(dbPath);
  const db = new Database(dbPath);

  if (firstTime) {
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('Database initialized with schema.');
  }

  return db;
}

export { initDB };
