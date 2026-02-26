import express from 'express';
import helmet from 'helmet';
import { initDB, getDB, transaction } from './shared/db/index.js';
import { registerRoutes } from './routes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { app as electronApp } from 'electron';
import { logger, httpLogger } from './shared/utils/logger.js';
import { globalErrorHandler } from './shared/middleware/error.middleware.js';
import { buildImageUrl } from './shared/utils/index.js';
import { logger as appLogger } from './shared/utils/logger.js';
import { hashPassword, verifyPassword } from './shared/utils/password.js';
import { INVENTORY_REASONS } from '../../types/index.js';

// Core services
import {
  initCustomerService,
  initSupplierService,
  initTransactionService,
  initReportsService,
  initVariantService,
  initProductFlowService,
  initInventoryService,
  initCategoryService,
  initUserService,
  initAuditService,
  initPurchaseService,
  initReturnService,
  initTaxEngine,
  initProductService,
  initSaleService,
  initAuthService,
  getSession,
  taxEngine,
  logCreate,
  logUpdate,
  logDelete,
  adjustInventory,
  getVariantStock,
  receiveInventory,
  addVariant,
  updateVariant
} from '../../core/index.js';

// Database repositories
import {
  CustomerRepository,
  SupplierRepository,
  TransactionRepository,
  ReportsRepository,
  VariantRepository,
  ProductFlowRepository,
  InventoryRepository,
  CategoryRepository,
  UserRepository,
  AuditRepository,
  PurchaseRepository,
  ReturnRepository,
  TaxRepository,
  ProductRepository,
  SaleRepository,
  SessionRepository
} from '../../database/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// Listen for unhandled rejections and exceptions
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at Promise', { 
    reason: reason?.stack || reason,
    message: reason?.message,
    promise: promise
  });
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown', { error: error.stack || error.message });
  // Recommended to exit after uncaughtException as the process is in an undefined state
  process.exit(1);
});

export function startServer(): void {
  initDB();
  
  // Initialize Audit Service
  const auditRepository = new AuditRepository();
  initAuditService(auditRepository);
  
  const auditService = { logCreate, logUpdate, logDelete };
  
  // Initialize Customer Service
  const customerRepository = new CustomerRepository();
  initCustomerService(customerRepository, auditService, getDB);
  
  // Initialize Supplier Service
  const supplierRepository = new SupplierRepository();
  initSupplierService(supplierRepository, auditService, getDB);
  
  // Initialize Transaction Service
  const transactionRepository = new TransactionRepository();
  initTransactionService(transactionRepository);
  
  // Initialize Reports Service
  const reportsRepository = new ReportsRepository();
  initReportsService(reportsRepository);
  
  // Initialize ProductFlow Service
  const productFlowRepository = new ProductFlowRepository();
  initProductFlowService(productFlowRepository, buildImageUrl);
  
  // Initialize Inventory Service
  const inventoryRepository = new InventoryRepository();
  const productFlowService = { logProductFlow: (data: any) => productFlowRepository.insertProductFlow(data) };
  initInventoryService(inventoryRepository, productFlowService, auditService, transaction);
  
  // Initialize Variant Service
  const variantRepository = new VariantRepository();
  initVariantService(variantRepository, inventoryRepository, auditService, transaction, buildImageUrl, appLogger);
  
  // Initialize Category Service
  const categoryRepository = new CategoryRepository();
  initCategoryService(categoryRepository);
  
  // Initialize User Service
  const userRepository = new UserRepository();
  initUserService(userRepository, { getSession }, auditService, hashPassword);
  
  // Initialize Purchase Service
  const purchaseRepository = new PurchaseRepository();
  initPurchaseService(purchaseRepository, auditService);
  
  // Initialize Tax Engine
  const taxRepository = new TaxRepository();
  initTaxEngine(taxRepository);
  
  // Initialize Sale Service
  const saleRepository = new SaleRepository();
  const saleDependencies = {
    fetchVariantsBatch: async (ids: number[]) => {
      const variants = await Promise.all(ids.map(id => variantRepository.findVariantById(id)));
      const map = new Map();
      variants.forEach(v => { if (v) map.set(v.id, v); });
      return map;
    },
    fetchProductById: (id: number) => new ProductRepository().findProductById(id),
    fetchCustomerById: (id: number) => customerRepository.findCustomerById(id),
    validatePaymentMethod: (id: number) => saleRepository.paymentMethodExists(id),
    getVariantStock: (id: number) => inventoryRepository.getStockByVariantId(id),
    INVENTORY_REASONS
  };
  initSaleService(saleRepository, { adjustStock: adjustInventory, getStockByVariantId: getVariantStock }, auditService, taxEngine, transaction, saleDependencies);
  
  // Initialize Return Service
  const returnRepository = new ReturnRepository();
  initReturnService(returnRepository, saleRepository, { getSaleById: saleRepository.findSaleById.bind(saleRepository) }, { adjustStock: adjustInventory }, auditService, transaction);
  
  // Initialize Product Service
  const productRepository = new ProductRepository();
  initProductService(productRepository, variantRepository, { addVariant, updateVariant }, { receiveInventory }, auditService, transaction, buildImageUrl);
  
  // Initialize Auth Service
  const sessionRepository = new SessionRepository();
  initAuthService(userRepository, sessionRepository, hashPassword, verifyPassword);
  
  const expressApp = express();

  // Security Middleware
  expressApp.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Technical Logging (HTTP Request Tracking)
  expressApp.use(httpLogger);

  const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  };

  expressApp.use(cors(corsOptions));

  // Serve uploads from userData directory (persistent and safe)
  const uploadsDir = path.join(electronApp.getPath('userData'), 'uploads');
  expressApp.use('/uploads', express.static(uploadsDir));

  expressApp.use(express.json());

  // Register all routes from modules
  registerRoutes(expressApp);

  // Global Technical Error Handling
  expressApp.use(globalErrorHandler);

  expressApp.listen(3001, () => {
    appLogger.info('Backend running on http://localhost:3001');
  });
}
