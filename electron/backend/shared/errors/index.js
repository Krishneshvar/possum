/**
 * Custom error classes for consistent error handling
 */

export class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

export class ValidationError extends Error {
    constructor(message = 'Validation failed') {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

export class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409;
    }
}

export class InternalError extends Error {
    constructor(message = 'Internal server error') {
        super(message);
        this.name = 'InternalError';
        this.statusCode = 500;
    }
}
