import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../possum.db');
const schemaPath = path.join(__dirname, '../db/schema.sql');

try {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  console.log('Existing database deleted.');
} catch (err) {
  console.error('Error deleting the database:', err);
}

const db = new Database(dbPath);

try {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('Database schema initialized.');
} catch (err) {
  console.error('Error initializing database schema:', err);
}

db.close();
console.log('Database connection closed.');
