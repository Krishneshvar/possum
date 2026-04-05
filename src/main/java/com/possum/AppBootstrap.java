package com.possum;

import com.possum.application.ApplicationModule;
import com.possum.application.audit.AuditService;
import com.possum.application.categories.CategoryService;
import com.possum.application.inventory.InventoryService;
import com.possum.application.inventory.ProductFlowService;
import com.possum.application.products.ProductModule;
import com.possum.application.products.ProductService;
import com.possum.application.variants.VariantService;
import com.possum.application.sales.SalesService;
import com.possum.ui.sales.ProductSearchIndex;
import com.possum.application.transactions.TransactionService;
import com.possum.application.returns.ReturnsService;
import com.possum.application.reports.ReportsService;
import com.possum.application.purchase.PurchaseService;
import com.possum.persistence.repositories.sqlite.*;
import com.possum.ui.DependencyInjector;
import com.possum.application.auth.AuthBootstrapStatus;
import com.possum.application.auth.AuthContext;
import com.possum.ui.auth.SessionStore;
import com.possum.ui.navigation.NavigationManager;
import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import com.possum.infrastructure.filesystem.AppPaths;
import com.possum.infrastructure.backup.DatabaseBackupService;
import com.possum.persistence.db.DatabaseManager;
import com.possum.persistence.db.TransactionManager;
import com.possum.application.auth.AuthModule;
import com.possum.infrastructure.lazy.ServiceLocator;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.infrastructure.security.PasswordHasher;
import com.possum.infrastructure.logging.LoggingConfig;
import com.possum.ui.AppShellController;

public final class AppBootstrap {

    private static final Logger LOGGER = LoggerFactory.getLogger(AppBootstrap.class);

    private AppPaths appPaths;
    private DatabaseManager databaseManager;
    private DatabaseBackupService backupService;
    private TransactionManager transactionManager;
    private AuthModule authModule;
    private ServiceLocator serviceLocator;
    private ApplicationModule applicationModule;
    private DependencyInjector dependencyInjector;
    private SalesService salesService;
    private ProductSearchIndex productSearchIndex;
    private TransactionService transactionService;
    private ReturnsService returnsService;
    private ReportsService reportsService;
    private PurchaseService purchaseService;
    private SqliteVariantRepository variantRepository;
    private SqliteSalesRepository salesRepository;
    private SqliteSupplierRepository supplierRepository;
    private SqliteTaxRepository taxRepository;
    private com.possum.persistence.repositories.sqlite.SqliteAuditRepository auditRepository;


    public void start(Stage stage) {
        try {
            initializeCore();
            runStartupHealthChecks(stage);

            // Check session/bootstrap status
            AuthBootstrapStatus bootstrapStatus = authModule.getAuthService().getAuthBootstrapStatus();
            
            if (bootstrapStatus.requiresInitialSetup() || bootstrapStatus.requiresPasswordRotation()) {
                loadLoginScreen(stage);
            } else {
                // Try to restore existing session
                SessionStore sessionStore = new SessionStore(appPaths, new JsonService());
                var tokenOpt = sessionStore.getToken();
                if (tokenOpt.isPresent()) {
                    try {
                        var authUser = authModule.getAuthService().validateSession(tokenOpt.get());
                        if (authUser != null) {
                            AuthContext.setCurrentUser(authUser);
                            loadMainShell(stage);
                            return;
                        }
                    } catch (Exception e) {
                        LOGGER.warn("Failed to validate existing session", e);
                    }
                }
                loadLoginScreen(stage);
            }
            
            LOGGER.info("Application bootstrap completed");
        } catch (RuntimeException ex) {
            shutdown();
            throw ex;
        }
    }

    public void shutdown() {
        if (backupService != null) {
            backupService.stopDailyBackups();
        }
        if (databaseManager != null) {
            databaseManager.close();
        }
        LOGGER.info("Application shutdown completed");
    }

    public AuthModule getAuthModule() {
        return authModule;
    }

    public ServiceLocator getServiceLocator() {
        return serviceLocator;
    }

    private void initializeCore() {
        appPaths = new AppPaths();
        LoggingConfig.configure(appPaths);
        initializePersistence();
        initializeApplication();
        initializeUI();
        LOGGER.info("Core services initialized");
    }

    private void initializePersistence() {
        databaseManager = new DatabaseManager(appPaths);
        databaseManager.initialize();
        transactionManager = new TransactionManager(databaseManager);

        JsonService jsonService = new JsonService();
        PasswordHasher passwordHasher = new PasswordHasher();
        SqliteUserRepository userRepository = new SqliteUserRepository(databaseManager);
        SqliteSessionRepository sessionRepository = new SqliteSessionRepository(databaseManager);

        authModule = new AuthModule(userRepository, sessionRepository, transactionManager, passwordHasher,
                new com.possum.persistence.repositories.sqlite.SqliteAuditRepository(databaseManager));
        com.possum.application.auth.ServiceSecurity.setAuditRepository(
                new com.possum.persistence.repositories.sqlite.SqliteAuditRepository(databaseManager));
        serviceLocator = new ServiceLocator(databaseManager, transactionManager, appPaths);
        backupService = serviceLocator.getDatabaseBackupService();
        backupService.startDailyBackups();
    }

    private void initializeApplication() {
        JsonService jsonService = new JsonService();
        PasswordHasher passwordHasher = new PasswordHasher();
        SqliteUserRepository userRepository = new SqliteUserRepository(databaseManager);
        SqliteSessionRepository sessionRepository = new SqliteSessionRepository(databaseManager);

        SqliteProductRepository productRepository = new SqliteProductRepository(databaseManager);
        variantRepository = new SqliteVariantRepository(databaseManager);
        SqliteCategoryRepository categoryRepository = new SqliteCategoryRepository(databaseManager);
        SqliteInventoryRepository inventoryRepository = new SqliteInventoryRepository(databaseManager);
        SqliteProductFlowRepository productFlowRepository = new SqliteProductFlowRepository(databaseManager);
        SqliteAuditRepository auditRepository = new SqliteAuditRepository(databaseManager);
        com.possum.persistence.repositories.sqlite.SqliteCustomerRepository customerRepository =
                new com.possum.persistence.repositories.sqlite.SqliteCustomerRepository(databaseManager);

        applicationModule = new ApplicationModule(
                userRepository, sessionRepository, productRepository, variantRepository,
                categoryRepository, inventoryRepository, productFlowRepository, auditRepository,
                customerRepository, transactionManager, passwordHasher, jsonService, appPaths,
                serviceLocator.getSettingsStore()
        );

        salesRepository = new SqliteSalesRepository(databaseManager);
        com.possum.persistence.repositories.sqlite.SqliteTransactionRepository transactionRepo =
                new com.possum.persistence.repositories.sqlite.SqliteTransactionRepository(databaseManager);
        com.possum.persistence.repositories.sqlite.SqliteReturnsRepository returnRepository =
                new com.possum.persistence.repositories.sqlite.SqliteReturnsRepository(databaseManager);
        supplierRepository = new SqliteSupplierRepository(databaseManager);
        com.possum.persistence.repositories.sqlite.SqlitePurchaseRepository purchaseOrderRepository =
                new com.possum.persistence.repositories.sqlite.SqlitePurchaseRepository(databaseManager);
        taxRepository = new SqliteTaxRepository(databaseManager);

        com.possum.application.sales.TaxEngine taxEngine =
                new com.possum.application.sales.TaxEngine(taxRepository, jsonService);
        com.possum.application.sales.PaymentService paymentService =
                new com.possum.application.sales.PaymentService(salesRepository);
        com.possum.application.sales.InvoiceNumberService invoiceNumberService =
                new com.possum.application.sales.InvoiceNumberService(salesRepository);
        salesService = new SalesService(salesRepository, variantRepository, productRepository,
                customerRepository, auditRepository, applicationModule.getInventoryService(),
                taxEngine, paymentService, transactionManager, jsonService, serviceLocator.getSettingsStore(),
                invoiceNumberService);
        productSearchIndex = new ProductSearchIndex(variantRepository);
        transactionService = new com.possum.application.transactions.TransactionServiceImpl(transactionRepo, salesRepository);

        com.possum.shared.util.TimeUtil.initialize(serviceLocator.getSettingsStore());
        returnsService = new ReturnsService(returnRepository, salesRepository,
                applicationModule.getInventoryService(), auditRepository, transactionManager, jsonService);
        com.possum.persistence.repositories.sqlite.SqliteReportsRepository reportsRepository =
                new com.possum.persistence.repositories.sqlite.SqliteReportsRepository(databaseManager);
        reportsService = new ReportsService(reportsRepository, productFlowRepository);
        purchaseService = new PurchaseService(purchaseOrderRepository, supplierRepository, variantRepository,
                inventoryRepository, productFlowRepository, auditRepository, transactionManager, databaseManager, jsonService);
    }

    private void initializeUI() {
        JsonService jsonService = new JsonService();
        com.possum.application.sales.TaxEngine taxEngine =
                new com.possum.application.sales.TaxEngine(taxRepository, jsonService);
        dependencyInjector = new DependencyInjector(applicationModule, serviceLocator, salesService,
                taxEngine, productSearchIndex, transactionService, returnsService, reportsService,
                purchaseService, variantRepository, salesRepository, supplierRepository, taxRepository, appPaths);
        dependencyInjector.getToastService().setMainStage(null);
    }

    private void runStartupHealthChecks(Stage stage) {
        java.util.List<String> failures = new java.util.ArrayList<>();

        // 1. Database accessible
        try {
            databaseManager.getConnection().createStatement().execute("PRAGMA schema_version");
        } catch (Exception e) {
            failures.add("Database is not accessible: " + e.getMessage());
        }

        // 2. Backup directory writable
        try {
            java.nio.file.Path backupDir = appPaths.getBackupsDir();
            java.nio.file.Files.createDirectories(backupDir);
            if (!java.nio.file.Files.isWritable(backupDir)) {
                failures.add("Backup directory is not writable: " + backupDir);
            }
        } catch (Exception e) {
            failures.add("Backup directory check failed: " + e.getMessage());
        }

        if (!failures.isEmpty()) {
            String message = String.join("\n", failures);
            LOGGER.error("Startup health check failed:\n{}", message);
            javafx.scene.control.Alert alert = new javafx.scene.control.Alert(
                    javafx.scene.control.Alert.AlertType.ERROR);
            alert.setTitle("Startup Error");
            alert.setHeaderText("POSSUM could not start");
            alert.setContentText(message);
            alert.showAndWait();
            shutdown();
            javafx.application.Platform.exit();
        }
    }

    private void loadLoginScreen(Stage stage) {
        try {
            FXMLLoader loader = new FXMLLoader(AppBootstrap.class.getResource("/fxml/auth/login-view.fxml"));
            
            // Navigate to main shell on login
            NavigationManager dummyNav = new NavigationManager(null, null) {
                @Override
                public void navigateTo(String routeId) {
                    if ("dashboard".equals(routeId)) {
                        Platform.runLater(() -> loadMainShell(stage));
                    }
                }
            };
            
            SessionStore sessionStore = new SessionStore(appPaths, new JsonService());
            loader.setControllerFactory(type -> {
                if (type.equals(com.possum.ui.auth.LoginController.class)) {
                    return new com.possum.ui.auth.LoginController(
                        authModule.getAuthService(),
                        dummyNav,
                        sessionStore,
                        dependencyInjector.getToastService()
                    );
                }
                return null;
            });

            Parent root = loader.load();
            Scene scene = new Scene(root, 1280, 800);
            stage.setTitle("POSSUM - Login");
            stage.setScene(scene);
            dependencyInjector.getToastService().setMainStage(stage);
            stage.show();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load login screen", ex);
        }
    }

    private void loadMainShell(Stage stage) {
        try {
            FXMLLoader loader = new FXMLLoader(AppBootstrap.class.getResource("/fxml/app-shell.fxml"));
            loader.setControllerFactory(dependencyInjector.getControllerFactory());
            Parent root = loader.load();

            AppShellController shellController = loader.getController();
            shellController.setDependencyInjector(dependencyInjector);

            Scene scene = new Scene(root, 1280, 800);
            stage.setTitle("POSSUM - Point of Sale System");
            stage.setMinWidth(1024);
            stage.setMinHeight(768);
            stage.setScene(scene);
            dependencyInjector.getToastService().setMainStage(stage);
            stage.show();

            LOGGER.info("Main application shell loaded");
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load main application shell", ex);
        }
    }
}
