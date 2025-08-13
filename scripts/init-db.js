import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../possum.db');
const schemaDir = path.join(__dirname, '../db');

const schemaFiles = [
  'users_and_settings.sql',
  'products.sql',
  'sales.sql',
  'inventory.sql',
  'dummy_data.sql',
];

try {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  console.log('Existing database deleted.');
} catch (err) {
  console.error('Error deleting the database:', err);
  process.exit(1);
}

const db = new Database(dbPath);

try {
  schemaFiles.forEach(fileName => {
    const filePath = path.join(schemaDir, fileName);
    if (fs.existsSync(filePath)) {
      const schema = fs.readFileSync(filePath, 'utf8');
      db.exec(schema);
      console.log(`Database schema from ${fileName} initialized.`);
    } else {
      console.error(`Schema file not found: ${filePath}`);
    }
  });
  console.log('Database initialization complete.');
} catch (err) {
  console.error('Error initializing database schema:', err);
}

db.close();
console.log('Database connection closed.');
