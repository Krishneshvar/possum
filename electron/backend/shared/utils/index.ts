/**
 * Shared utility functions
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { ParsedQs } from 'qs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the base directory for the electron app
 * @returns {string} The base directory path
 */
export function getBasePath(): string {
    return path.join(__dirname, '../../../..');
}

/**
 * Build an image URL from the stored path
 * @param {string|null} imagePath - The relative image path stored in DB
 * @returns {string|null} The full URL or null
 */
export function buildImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) {
        return null;
    }
    return `http://localhost:3001${imagePath}`;
}

/**
 * Helper to safely get a string from req.query
 */
export function getQueryString(param: any): string | undefined {
    if (typeof param === 'string') {
        return param;
    }
    if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string') {
        return param[0];
    }
    return undefined;
}

/**
 * Helper to safely get a number from req.query
 */
export function getQueryNumber(param: any, defaultValue?: number): number | undefined {
    const str = getQueryString(param);
    if (str) {
        const num = parseInt(str, 10);
        return isNaN(num) ? defaultValue : num;
    }
    return defaultValue;
}

/**
 * Helper to safely get an array of strings from req.query
 */
export function getQueryArray(param: any): string[] {
    if (Array.isArray(param)) {
        return param.filter((p: any): p is string => typeof p === 'string');
    }
    if (typeof param === 'string') {
        return [param];
    }
    return [];
}
