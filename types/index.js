// Error
export class AppError extends Error {
    code;
    statusCode;
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
// Inventory Reasons
export const INVENTORY_REASONS = {
    SALE: 'sale',
    RETURN: 'return',
    CONFIRM_RECEIVE: 'confirm_receive',
    SPOILAGE: 'spoilage',
    DAMAGE: 'damage',
    THEFT: 'theft',
    CORRECTION: 'correction',
};
export const VALID_INVENTORY_REASONS = [
    INVENTORY_REASONS.SALE,
    INVENTORY_REASONS.RETURN,
    INVENTORY_REASONS.CONFIRM_RECEIVE,
    INVENTORY_REASONS.SPOILAGE,
    INVENTORY_REASONS.DAMAGE,
    INVENTORY_REASONS.THEFT,
    INVENTORY_REASONS.CORRECTION,
];
export const INVENTORY_REASON_LABELS = {
    [INVENTORY_REASONS.SALE]: 'Sale',
    [INVENTORY_REASONS.RETURN]: 'Return',
    [INVENTORY_REASONS.CONFIRM_RECEIVE]: 'Purchase',
    [INVENTORY_REASONS.SPOILAGE]: 'Spoilage',
    [INVENTORY_REASONS.DAMAGE]: 'Damage',
    [INVENTORY_REASONS.THEFT]: 'Theft',
    [INVENTORY_REASONS.CORRECTION]: 'Correction',
};
export const MANUAL_INVENTORY_REASONS = [
    INVENTORY_REASONS.CORRECTION,
    INVENTORY_REASONS.DAMAGE,
    INVENTORY_REASONS.THEFT,
    INVENTORY_REASONS.SPOILAGE,
    INVENTORY_REASONS.RETURN,
    INVENTORY_REASONS.CONFIRM_RECEIVE,
];
//# sourceMappingURL=index.js.map