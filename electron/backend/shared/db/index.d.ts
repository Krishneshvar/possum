/**
 * Database connection singleton
 * Provides a single database instance across the application
 */
import Database from 'better-sqlite3';
/**
 * Initialize and return the database instance
 * @returns {Database.Database} The database instance
 */
export declare function initDB(): Database.Database;
/**
 * Get the existing database instance
 * @returns {Database.Database} The database instance
 */
export declare function getDB(): Database.Database;
/**
 * Close the database connection
 */
export declare function closeDB(): void;
/**
 * Execute a function within a database transaction
 * @param {Function} fn - Function to execute within transaction
 * @returns {Database.Transaction} The transaction function
 */
export declare function transaction<T extends (...args: any[]) => any>(fn: T): Database.Transaction<T>;
//# sourceMappingURL=index.d.ts.map