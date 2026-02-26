export interface IInventoryRepository {
  getStockByVariantId(variantId: number): number;
  findLotsByVariantId(variantId: number): any[];
  findAdjustmentsByVariantId(variantId: number, options: any): any[];
  findAllAdjustments(options: any): { adjustments: any[]; total: number };
  insertInventoryAdjustment(data: any): { lastInsertRowid: number | bigint };
  findAvailableLots(variantId: number): any[];
  insertInventoryLot(data: any): { lastInsertRowid: number | bigint };
  findAdjustmentsByReference(referenceType: string, referenceId: number): any[];
  findLowStockVariants(): any[];
  findExpiringLots(days: number): any[];
  getInventoryStats(): any;
}
