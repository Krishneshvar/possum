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

let dbInstance: Database.Database | null = null;

/**
 * Initialize and return the database instance
 * @returns {Database.Database} The database instance
 */
export function initDB(): Database.Database {
    if (dbInstance) return dbInstance;

    const dbPath = isDev
        ? path.join(__dirname, '../../../../../possum.db')
        : path.join(app.getPath('userData'), 'possum.db');

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    dbInstance = db;

    return db;
}

/**
 * Get the existing database instance
 * @returns {Database.Database} The database instance
 */
export function getDB(): Database.Database {
    if (!dbInstance) {
        return initDB();
    }
    return dbInstance;
}

/**
 * Close the database connection
 */
export function closeDB(): void {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
        console.log('Database connection closed.');
    }
}

/**
 * Execute a function within a database transaction
 * @param {Function} fn - Function to execute within transaction
 * @returns {*} Result of the function
 */
export function transaction<T>(fn: (...args: any[]) => T): (...args: any[]) => T {
    const db = getDB();
    const runTransaction = db.transaction(fn);
    return runTransaction as (...args: any[]) => T;
}
