export interface FlowQueryOptions {
  limit?: number;
  offset?: number;
  startDate?: string | null;
  endDate?: string | null;
  paymentMethods?: string[];
}

export interface IProductFlowRepository {
  findFlowByVariantId(variantId: number, options: FlowQueryOptions): any[];
  getFlowSummary(variantId: number): any;
  findFlowByReference(referenceType: string, referenceId: number): any[];
  insertProductFlow(data: any): { lastInsertRowid: number | bigint };
}
