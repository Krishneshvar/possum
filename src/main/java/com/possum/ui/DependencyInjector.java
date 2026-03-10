package com.possum.ui;

import com.possum.application.ApplicationModule;
import com.possum.infrastructure.lazy.ServiceLocator;
import com.possum.application.sales.SalesService;
import com.possum.ui.sales.ProductSearchIndex;
import com.possum.application.transactions.TransactionService;
import com.possum.application.returns.ReturnsService;
import com.possum.application.reports.ReportsService;
import com.possum.application.purchase.PurchaseService;
import com.possum.persistence.repositories.interfaces.*;
import com.possum.ui.navigation.NavigationManager;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

public class DependencyInjector {

    private final ApplicationModule applicationModule;
    private final ServiceLocator serviceLocator;

    private final SalesService salesService;
    private final ProductSearchIndex productSearchIndex;
    private final TransactionService transactionService;
    private final ReturnsService returnsService;
    private final ReportsService reportsService;
    private final PurchaseService purchaseService;

    private final VariantRepository variantRepository;
    private final SalesRepository salesRepository;
    private final SupplierRepository supplierRepository;
    private final TaxRepository taxRepository;
    private final com.possum.infrastructure.filesystem.AppPaths appPaths;

    private NavigationManager navigationManager;

    public DependencyInjector(ApplicationModule applicationModule, ServiceLocator serviceLocator,
                              SalesService salesService, ProductSearchIndex productSearchIndex,
                              TransactionService transactionService, ReturnsService returnsService,
                              ReportsService reportsService, PurchaseService purchaseService,
                              VariantRepository variantRepository, SalesRepository salesRepository,
                              SupplierRepository supplierRepository, TaxRepository taxRepository, com.possum.infrastructure.filesystem.AppPaths appPaths) {
        this.applicationModule = applicationModule;
        this.serviceLocator = serviceLocator;
        this.salesService = salesService;
        this.productSearchIndex = productSearchIndex;
        this.transactionService = transactionService;
        this.returnsService = returnsService;
        this.reportsService = reportsService;
        this.purchaseService = purchaseService;
        this.variantRepository = variantRepository;
        this.salesRepository = salesRepository;
        this.supplierRepository = supplierRepository;
        this.taxRepository = taxRepository;
        this.appPaths = appPaths;
    }


    public javafx.util.Callback<Class<?>, Object> getControllerFactory() {
        return type -> {
            try {
                Object instance = type.getDeclaredConstructor().newInstance();
                injectDependencies(instance);
                return instance;
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
        };
    }

    public void setNavigationManager(NavigationManager navigationManager) {
        this.navigationManager = navigationManager;
    }

    public void injectDependencies(Object controller) {
        if (controller == null) return;

        try {
            Method[] methods = controller.getClass().getMethods();
            for (Method method : methods) {
                if (method.getName().equals("initialize") && method.getParameterCount() > 0) {
                    Object[] args = new Object[method.getParameterCount()];
                    Parameter[] parameters = method.getParameters();

                    for (int i = 0; i < parameters.length; i++) {
                        Class<?> type = parameters[i].getType();
                        args[i] = resolveDependency(type);
                    }

                    method.invoke(controller, args);
                    return;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to inject dependencies for controller: " + controller.getClass().getName());
        }
    }

    private Object resolveDependency(Class<?> type) {
        // Application layer services
        if (type.equals(com.possum.application.products.ProductService.class)) {
            return applicationModule.getProductService();
        } else if (type.equals(com.possum.application.variants.VariantService.class)) {
            return applicationModule.getVariantService();
        } else if (type.equals(com.possum.application.categories.CategoryService.class)) {
            return applicationModule.getCategoryService();
        } else if (type.equals(com.possum.application.inventory.InventoryService.class)) {
            return applicationModule.getInventoryService();
        } else if (type.equals(com.possum.application.auth.AuthService.class)) {
            return applicationModule.getAuthModule().getAuthService();
        } else if (type.equals(com.possum.application.auth.AuthorizationService.class)) {
            return new com.possum.application.auth.AuthorizationService();
        } else if (type.equals(com.possum.application.sales.SalesService.class)) {
            return salesService;
        } else if (type.equals(com.possum.ui.sales.ProductSearchIndex.class)) {
            return productSearchIndex;
        } else if (type.equals(com.possum.application.transactions.TransactionService.class)) {
            return transactionService;
        } else if (type.equals(com.possum.application.returns.ReturnsService.class)) {
            return returnsService;
        } else if (type.equals(com.possum.application.reports.ReportsService.class)) {
            return reportsService;
        } else if (type.equals(com.possum.application.purchase.PurchaseService.class)) {
            return purchaseService;
        } else if (type.equals(com.possum.application.audit.AuditService.class)) {
            return applicationModule.getAuditService();
        }

        // Repositories
        else if (type.equals(com.possum.persistence.repositories.interfaces.VariantRepository.class)) {
            return variantRepository;
        } else if (type.equals(com.possum.persistence.repositories.interfaces.SalesRepository.class)) {
            return salesRepository;
        } else if (type.equals(com.possum.persistence.repositories.interfaces.SupplierRepository.class)) {
            return supplierRepository;
        } else if (type.equals(com.possum.persistence.repositories.interfaces.TaxRepository.class)) {
            return taxRepository;
        }

        // Infrastructure layer
        else if (type.equals(com.possum.infrastructure.filesystem.SettingsStore.class)) {
            return serviceLocator.getSettingsStore();
        } else if (type.equals(com.possum.infrastructure.printing.PrinterService.class)) {
            return serviceLocator.getPrinterService();
        } else if (type.equals(com.possum.ui.navigation.NavigationManager.class)) {
            return navigationManager;
        } else if (type.equals(com.possum.ui.auth.SessionStore.class)) {
            return new com.possum.ui.auth.SessionStore(appPaths, serviceLocator.getJsonService()); // Or instantiate properly
        }

        System.err.println("Could not resolve dependency of type: " + type.getName());
        return null;
    }
}
