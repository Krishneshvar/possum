/**
 * Database connection singleton
 * Provides a single database instance across the application
 */
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';
const isDev = !app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let dbInstance = null;
/**
 * Initialize and return the database instance
 * @returns {Database.Database} The database instance
 */
export function initDB() {
    if (dbInstance)
        return dbInstance;
    const dbPath = isDev
        ? path.join(__dirname, '../../../../../possum.db')
        : path.join(app.getPath('userData'), 'possum.db');
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    dbInstance = db;
    return db;
}
/**
 * Get the existing database instance
 * @returns {Database.Database} The database instance
 */
export function getDB() {
    if (!dbInstance) {
        return initDB();
    }
    return dbInstance;
}
/**
 * Close the database connection
 */
export function closeDB() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
        console.log('Database connection closed.');
    }
}
/**
 * Execute a function within a database transaction
 * @param {Function} fn - Function to execute within transaction
 * @returns {Database.Transaction} The transaction function
 */
export function transaction(fn) {
    const db = getDB();
    return db.transaction(fn);
}
//# sourceMappingURL=index.js.map