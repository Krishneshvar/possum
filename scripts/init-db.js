import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../possum.db');
const schemaDir = path.join(__dirname, '../db');

const schemaFiles = [
  'schema_meta.sql',
  'users_and_security.sql',
  'customers.sql',
  'products.sql',
  'pricing_and_tax.sql',
  'inventory.sql',
  'sales.sql',
  'payments.sql',
  'returns_and_refunds.sql',
  'reporting.sql',
  'audit.sql',
  'security_seed.sql',
  'dummy_data.sql',
];

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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

  // Create default admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const password_hash = hashPassword('admin123');
    const result = db.prepare('INSERT INTO users (name, username, password_hash, is_active) VALUES (?, ?, ?, ?)').run('Administrator', 'admin', password_hash, 1);
    const userId = result.lastInsertRowid;

    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin');
    if (adminRole) {
      db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, adminRole.id);
    }
    console.log('Default admin user created: admin / admin123');
  }

  console.log('Database initialization complete.');
} catch (err) {
  console.error('Error initializing database schema:', err);
}

db.close();
console.log('Database connection closed.');
