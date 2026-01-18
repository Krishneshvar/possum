/**
 * Shared utility functions
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the base directory for the electron app
 * @returns {string} The base directory path
 */
export function getBasePath() {
    return path.join(__dirname, '../../../..');
}

/**
 * Build an image URL from the stored path
 * @param {string|null} imagePath - The relative image path stored in DB
 * @returns {string|null} The full URL or null
 */
export function buildImageUrl(imagePath) {
    if (!imagePath) {
        return null;
    }
    return `http://localhost:3001${imagePath}`;
}
