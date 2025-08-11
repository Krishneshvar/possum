import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const isDev = !app.isPackaged;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

function initDB() {
  if (dbInstance) return dbInstance;

  const dbPath = isDev 
    ? path.join(__dirname, '../../possum.db') 
    : path.join(app.getPath('userData'), 'possum.db');

  const firstTime = !fs.existsSync(dbPath);
  const db = new Database(dbPath);

  if (firstTime) {
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('Database initialized with schema.');
  }

  dbInstance = db;
  return db;
}

export { initDB };
