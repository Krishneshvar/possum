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
function initDB() {
    if (dbInstance) return dbInstance;

    const dbPath = isDev
        ? path.join(__dirname, '../../../../possum.db')
        : path.join(app.getPath('userData'), 'possum.db');

    const db = new Database(dbPath);
    dbInstance = db;

    return db;
}

/**
 * Get the existing database instance
 * @returns {Database.Database} The database instance
 */
function getDB() {
    if (!dbInstance) {
        return initDB();
    }
    return dbInstance;
}

/**
 * Close the database connection
 */
function closeDB() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
        console.log('Database connection closed.');
    }
}

export { initDB, getDB, closeDB };
