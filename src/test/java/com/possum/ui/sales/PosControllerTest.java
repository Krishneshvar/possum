package com.possum.ui.sales;

import com.possum.application.auth.AuthContext;
import com.possum.application.auth.AuthUser;
import com.possum.application.categories.CategoryService;
import com.possum.application.people.CustomerService;
import com.possum.application.products.ProductService;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.TaxEngine;
import com.possum.application.sales.dto.*;
import com.possum.domain.model.*;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.shared.dto.GeneralSettings;
import com.possum.ui.JavaFXInitializer;
import javafx.collections.ObservableList;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PosControllerTest {

    @BeforeAll
    static void initJFX() {
        JavaFXInitializer.initialize();
    }

    @Mock private SalesService salesService;
    @Mock private CustomerService customerService;
    @Mock private ProductSearchIndex searchIndex;
    @Mock private TaxEngine taxEngine;
    @Mock private PrinterService printerService;
    @Mock private SettingsStore settingsStore;
    @Mock private ProductService productService;
    @Mock private CategoryService categoryService;

    private PosController controller;

    @BeforeEach
    void setUp() throws Exception {
        AuthContext.setCurrentUser(new AuthUser(1L, "Test User", "testuser", List.of("admin"), List.of("sales:create")));
        controller = new PosController(salesService, customerService, searchIndex, taxEngine,
                printerService, settingsStore, productService, categoryService);
        
        // Initialize the controller's internal state which normally happens in initialize()
        // But since we can't easily run initialize() without JavaFX toolkit, we'll manually set up what's needed.
        java.lang.reflect.Field billsField = PosController.class.getDeclaredField("bills");
        billsField.setAccessible(true);
        List<Object> bills = new java.util.ArrayList<>();
        Class<?> billStateClass = Class.forName("com.possum.ui.sales.PosController$BillState");
        java.lang.reflect.Constructor<?> billStateConst = billStateClass.getDeclaredConstructor(int.class);
        billStateConst.setAccessible(true);
        for (int i = 0; i < 9; i++) {
            bills.add(billStateConst.newInstance(i));
        }
        billsField.set(controller, bills);
        
        java.lang.reflect.Field currentBillField = PosController.class.getDeclaredField("currentBill");
        currentBillField.setAccessible(true);
        currentBillField.set(controller, bills.get(0));
    }

    @AfterEach
    void tearDown() {
        AuthContext.clear();
    }

    @Test
    @DisplayName("Should add variant to cart")
    void addToCart_success() throws Exception {
        Variant variant = createTestVariant(1L, "Test Product", "Standard", "123", new BigDecimal("100.00"), 10);
        
        // Mock settings to avoid NPE in isInventoryRestrictionsEnabled
        GeneralSettings settings = new GeneralSettings();
        settings.setInventoryAlertsAndRestrictionsEnabled(false);
        when(settingsStore.loadGeneralSettings()).thenReturn(settings);

        // Access addToCart via reflection as it is private
        java.lang.reflect.Method addToCartMethod = PosController.class.getDeclaredMethod("addToCart", Variant.class);
        addToCartMethod.setAccessible(true);
        
        // Platform.runLater will fail in unit test context, so we'll wrap in try-catch
        try {
            addToCartMethod.invoke(controller, variant);
        } catch (Exception e) {
            // item should still be added to list before runLater is called
        }

        java.lang.reflect.Field currentBillField = PosController.class.getDeclaredField("currentBill");
        currentBillField.setAccessible(true);
        Object currentBill = currentBillField.get(controller);
        
        java.lang.reflect.Field itemsField = currentBill.getClass().getDeclaredField("items");
        itemsField.setAccessible(true);
        List<?> items = (List<?>) itemsField.get(currentBill);
        
        assertEquals(1, items.size());
    }

    @Test
    @DisplayName("Should recalculate totals correctly")
    @SuppressWarnings("unchecked")
    void recalculateTotals_success() throws Exception {
        java.lang.reflect.Field currentBillField = PosController.class.getDeclaredField("currentBill");
        currentBillField.setAccessible(true);
        Object currentBill = currentBillField.get(controller);
        
        java.lang.reflect.Field itemsField = currentBill.getClass().getDeclaredField("items");
        itemsField.setAccessible(true);
        ObservableList<Object> items = (ObservableList<Object>) itemsField.get(currentBill);
        
        Variant variant = createTestVariant(1L, "Test Product", "Standard", "123", new BigDecimal("100.00"), 10);
        Class<?> cartItemClass = Class.forName("com.possum.ui.sales.PosController$CartItem");
        java.lang.reflect.Constructor<?> cartItemConst = cartItemClass.getDeclaredConstructor(Variant.class, int.class);
        cartItemConst.setAccessible(true);
        Object cartItem = cartItemConst.newInstance(variant, 2);
        items.add(cartItem);

        // Mock TaxEngine
        TaxCalculationResult taxResult = new TaxCalculationResult(
            List.of(), BigDecimal.ZERO, new BigDecimal("200.00")
        );
        when(taxEngine.calculate(any(TaxableInvoice.class), any())).thenReturn(taxResult);

        // Access recalculateTotals via reflection
        java.lang.reflect.Method recalculateMethod = PosController.class.getDeclaredMethod("recalculateTotals");
        recalculateMethod.setAccessible(true);
        
        try {
            recalculateMethod.invoke(controller);
        } catch (Exception e) {
            // UI label updates will fail, but calculations should proceed
        }

        java.lang.reflect.Field totalField = currentBill.getClass().getDeclaredField("total");
        totalField.setAccessible(true);
        BigDecimal total = (BigDecimal) totalField.get(currentBill);
        
        assertEquals(new BigDecimal("200.00"), total);
    }

    private Variant createTestVariant(Long id, String productName, String variantName, 
                                     String sku, BigDecimal price, Integer stock) {
        return new Variant(
            id, 1L, productName, variantName, sku, price, BigDecimal.ZERO,
            0, true, "active", null, stock, "Electronics", null, null, null, null
        );
    }

    private Customer createTestCustomer(Long id, String name, String phone) {
        return new Customer(id, name, phone, null, null, "retail", false, null, null, null);
    }
}
