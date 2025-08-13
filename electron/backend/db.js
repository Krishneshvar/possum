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

  const db = new Database(dbPath);
  dbInstance = db;
  
  return db;
}

function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('Database connection closed.');
  }
}

export { initDB, closeDB };
