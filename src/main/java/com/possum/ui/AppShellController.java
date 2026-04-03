package com.possum.ui;

import com.possum.ui.navigation.NavigationManager;
import com.possum.ui.navigation.RouteGuard;
import com.possum.ui.workspace.WorkspaceDesktop;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.ui.common.accessibility.AccessibilityEnhancer;
import com.possum.ui.common.controls.NotificationService;
import com.possum.application.auth.AuthContext;
import com.possum.ui.auth.SessionStore;
import com.possum.AppBootstrap;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.control.TextInputControl;
import org.kordamp.ikonli.javafx.FontIcon;
import java.util.List;
import java.util.Locale;
import java.util.function.Predicate;
import com.possum.ui.common.dialogs.DialogStyler;

public class AppShellController {

    private DependencyInjector dependencyInjector;

    public void setDependencyInjector(DependencyInjector dependencyInjector) {
        this.dependencyInjector = dependencyInjector;
        if (workspaceManager != null) {
            workspaceManager.setDependencyInjector(dependencyInjector);
            dependencyInjector.setWorkspaceManager(workspaceManager);
        }
        if (navigationManager != null) {
            navigationManager.setDependencyInjector(dependencyInjector);
            dependencyInjector.setNavigationManager(navigationManager);
        }
    }

    @FXML private HBox navbar;
    @FXML private HBox brandBox;
    @FXML private HBox navItems;
    @FXML private StackPane contentArea;
    @FXML private Label userAvatar;
    @FXML private MenuButton userMenuButton;
    @FXML private ImageView brandIcon;

    private NavigationManager navigationManager;
    private WorkspaceManager workspaceManager;
    private Button activeNavButton = null;
    private boolean isDarkTheme = false;
    private String currentUserName = "Admin User";

    @FXML
    public void initialize() {
        var currentUser = AuthContext.getCurrentUser();
        if (currentUser != null) {
            currentUserName = currentUser.name();
        }
        
        WorkspaceDesktop desktop = new WorkspaceDesktop();
        workspaceManager = new WorkspaceManager(desktop, dependencyInjector);
        if (dependencyInjector != null) {
            dependencyInjector.setWorkspaceManager(workspaceManager);
        }
        contentArea.getChildren().add(desktop);
        NotificationService.initialize(contentArea);
        // Let the desktop stretch to fill the StackPane in both directions
        desktop.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        
        RouteGuard routeGuard = new RouteGuard(new com.possum.application.auth.AuthorizationService());
        navigationManager = new NavigationManager(contentArea, routeGuard);
        buildNavigation();
        buildUserMenu();
        loadBrandIcon();
        
        initializeUserAvatar();
        setupGlobalKeyboardShortcuts();

        // Accessibility and tooltips for brand
        if (brandBox != null) {
            Tooltip brandTooltip = new Tooltip("Go to POSSUM Dashboard");
            Tooltip.install(brandBox, brandTooltip);
            brandBox.setAccessibleRole(javafx.scene.AccessibleRole.BUTTON);
            brandBox.setAccessibleText("POSSUM Dashboard");

            // Allow keyboard activation (Enter/Space) on the brand icon
            brandBox.setOnKeyPressed(e -> {
                if (e.getCode() == javafx.scene.input.KeyCode.ENTER || e.getCode() == javafx.scene.input.KeyCode.SPACE) {
                    workspaceManager.openOrFocusWindow("Dashboard", "/fxml/dashboard/dashboard-view.fxml");
                }
            });
            // Also enable click
            brandBox.setOnMouseClicked(e -> {
                workspaceManager.openOrFocusWindow("Dashboard", "/fxml/dashboard/dashboard-view.fxml");
            });
            brandBox.setFocusTraversable(true);
        }

        // Ensure user menu is focusable for keyboard users
        if (userMenuButton != null) {
            userMenuButton.setAccessibleRole(javafx.scene.AccessibleRole.MENU_BUTTON);
            userMenuButton.setAccessibleText("User options");
            userMenuButton.setTooltip(new Tooltip("User options"));
        }

        Platform.runLater(() -> {
            if (contentArea.getScene() != null) {
                AccessibilityEnhancer.enhance(contentArea.getScene().getRoot());
            }
        });
    }
    
    private void loadBrandIcon() {
        try {
            String iconPath = getClass().getResource("/icons/icon-shell.png").toExternalForm();
            brandIcon.setImage(new javafx.scene.image.Image(iconPath, 28, 28, true, true, true));
        } catch (Exception e) {
            System.err.println("Failed to load brand icon: " + e.getMessage());
        }
    }
    
    private void buildUserMenu() {
        Label nameLabel = new Label(currentUserName);
        nameLabel.getStyleClass().add("user-menu-header-name");
        
        Label roleLabel = new Label("Administrator");
        roleLabel.getStyleClass().add("user-menu-header-role");

        VBox headerBox = new VBox(nameLabel, roleLabel);
        headerBox.setStyle("-fx-background-color: transparent;"); // Ensure no artifacts
        
        CustomMenuItem headerItem = new CustomMenuItem(headerBox);
        headerItem.setHideOnClick(false);
        
        SeparatorMenuItem sep1 = new SeparatorMenuItem();
        
        MenuItem themeItem = new MenuItem("Toggle Theme");
        themeItem.getStyleClass().add("menu-item");
        themeItem.setOnAction(e -> handleThemeToggle());
        
        SeparatorMenuItem sep2 = new SeparatorMenuItem();
        
        MenuItem logoutItem = new MenuItem("Logout");
        logoutItem.getStyleClass().add("logout-menu-item");
        logoutItem.setOnAction(e -> handleLogout());
        
        userMenuButton.getItems().addAll(headerItem, sep1, themeItem, sep2, logoutItem);
    }
    
    private void initializeUserAvatar() {
        if (currentUserName != null && !currentUserName.isEmpty()) {
            userAvatar.setText(String.valueOf(currentUserName.charAt(0)).toUpperCase());
        }
    }

    private void buildNavigation() {
        createNavButton("Dashboard", "bx-home", "Dashboard", "/fxml/dashboard/dashboard-view.fxml", null);
        createNavMenu("Inventory", "bx-package", new Object[][]{
            {"Products", "/fxml/products/products-view.fxml", com.possum.application.auth.Permissions.PRODUCTS_VIEW},
            {"Variants", "/fxml/inventory/variants-view.fxml", com.possum.application.auth.Permissions.INVENTORY_VIEW},
            {"Categories", "/fxml/categories/categories-view.fxml", com.possum.application.auth.Permissions.CATEGORIES_VIEW},
            {"Stock", "/fxml/inventory/inventory-view.fxml", com.possum.application.auth.Permissions.INVENTORY_VIEW},
            {"Stock History", "/fxml/inventory/stock-history-view.fxml", com.possum.application.auth.Permissions.INVENTORY_VIEW}
        });
        createNavMenu("Sales", "bx-cart", new Object[][]{
            {"Point of Sale", "/fxml/sales/pos-view.fxml", com.possum.application.auth.Permissions.SALES_CREATE},
            {"Bill History", "/fxml/sales/sales-history-view.fxml", com.possum.application.auth.Permissions.SALES_VIEW},
            {"Transactions", "/fxml/transactions/transactions-view.fxml", com.possum.application.auth.Permissions.TRANSACTIONS_VIEW},
            {"Returns", "/fxml/returns/returns-view.fxml", com.possum.application.auth.Permissions.RETURNS_VIEW}
        });
        createNavMenu("Purchase", "bx-purchase-tag", new Object[][]{
            {"Suppliers", "/fxml/purchase/suppliers-view.fxml", com.possum.application.auth.Permissions.SUPPLIERS_VIEW},
            {"Purchase Orders", "/fxml/purchase/purchase-view.fxml", com.possum.application.auth.Permissions.PURCHASE_VIEW}
        });
        createNavMenu("People", "bx-group", new Object[][]{
            {"Employees", "/fxml/people/users-view.fxml", com.possum.application.auth.Permissions.USERS_VIEW},
            {"Customers", "/fxml/people/customers-view.fxml", com.possum.application.auth.Permissions.CUSTOMERS_VIEW}
        });
        createNavMenu("Insights", "bx-bar-chart-alt-2", new Object[][]{
            {"Sales Reports", "/fxml/reports/sales-reports-view.fxml", com.possum.application.auth.Permissions.REPORTS_VIEW},
            {"Sales Analytics", "/fxml/reports/sales-analytics-view.fxml", com.possum.application.auth.Permissions.REPORTS_VIEW},
            {"Product Flow", "/fxml/insights/product-flow-view.fxml", com.possum.application.auth.Permissions.REPORTS_VIEW},
            {"Audit Log", "/fxml/audit/audit-view.fxml", com.possum.application.auth.Permissions.AUDIT_VIEW}
        });
        createNavButton("Settings", "bx-cog", "Settings", "/fxml/settings/settings-view.fxml", com.possum.application.auth.Permissions.SETTINGS_VIEW);

    }

    private void createNavButton(String label, String iconName, String title, String fxmlPath, String permission) {
        if (permission != null && !com.possum.ui.common.UIPermissionUtil.hasPermission(permission)) {
            return;
        }

        Button btn = new Button(label);
        FontIcon icon = new FontIcon(iconName);
        icon.getStyleClass().add("nav-icon");
        btn.setGraphic(icon);
        btn.setGraphicTextGap(8);
        
        btn.getStyleClass().add("nav-menu-btn");
        btn.setOnAction(e -> workspaceManager.openOrFocusWindow(title, fxmlPath));
        btn.setAccessibleText(label);
        btn.setTooltip(new Tooltip(label));
        HBox.setMargin(btn, new javafx.geometry.Insets(0, 4, 0, 4));
        navItems.getChildren().add(btn);
    }

    private void createNavMenu(String label, String iconName, Object[][] items) {
        MenuButton menuBtn = new MenuButton(label);
        FontIcon icon = new FontIcon(iconName);
        icon.getStyleClass().add("nav-icon");
        menuBtn.setGraphic(icon);
        menuBtn.setGraphicTextGap(8);

        menuBtn.getStyleClass().add("nav-menu-btn");
        menuBtn.setAccessibleText(label);
        menuBtn.setTooltip(new Tooltip(label));
        HBox.setMargin(menuBtn, new javafx.geometry.Insets(0, 4, 0, 4));
        
        int addedItems = 0;
        for (Object[] item : items) {
            String itemLabel = (String) item[0];
            String fxmlPath = (String) item[1];
            String permission = item.length > 2 ? (String) item[2] : null;

            if (permission == null || com.possum.ui.common.UIPermissionUtil.hasPermission(permission)) {
                MenuItem menuItem = new MenuItem(itemLabel);
                menuItem.setOnAction(e -> workspaceManager.openOrFocusWindow(itemLabel, fxmlPath));
                menuBtn.getItems().add(menuItem);
                addedItems++;
            }
        }
        
        if (addedItems > 0) {
            navItems.getChildren().add(menuBtn);
        }
    }



    public void loadContent(Node content) {
        contentArea.getChildren().clear();
        contentArea.getChildren().add(content);
    }

    public void setPageTitle(String title) {
        // Not needed with navbar
    }

    public void setUserName(String userName) {
        currentUserName = userName;
        initializeUserAvatar();
    }

    private void handleLogout() {
        AuthContext.clear();
        new SessionStore(dependencyInjector.getAppPaths(), new com.possum.infrastructure.serialization.JsonService()).clearSession();
        
        // Switch back to login screen
        javafx.stage.Stage stage = (javafx.stage.Stage) contentArea.getScene().getWindow();
        AppBootstrap bootstrap = new AppBootstrap(); 
        // Note: In a real app, we'd probably want to reuse the existing bootstrap instance
        // but since bootstrap doesn't hold much state once started, this is okay for now.
        // Or we can just call Platform.exit() and restart, but that's harsh.
        // Better yet, pass the bootstrap instance to the controller.
        
        // Let's assume AppBootstrap has a static instance or we can just redirect to login screen via the same logic as AppLauncher
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/auth/login-view.fxml"));
            
            // Re-using the logic from AppBootstrap.loadLoginScreen
            NavigationManager dummyNav = new NavigationManager(null, null) {
                @Override
                public void navigateTo(String routeId) {
                    if ("dashboard".equals(routeId)) {
                        com.possum.AppBootstrap b = new com.possum.AppBootstrap();
                        b.start(stage); // This will re-initialize everything, which is safe
                    }
                }
            };
            
            SessionStore sessionStore = new SessionStore(dependencyInjector.getAppPaths(), new com.possum.infrastructure.serialization.JsonService());
            com.possum.application.auth.AuthModule authModule = dependencyInjector.getApplicationModule().getAuthModule();
            
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
        } catch (java.io.IOException e) {
            e.printStackTrace();
        }
    }

    private void handleThemeToggle() {
        isDarkTheme = !isDarkTheme;
        System.out.println("Theme toggled: " + (isDarkTheme ? "Dark" : "Light"));
    }

    public StackPane getContentArea() {
        return contentArea;
    }

    public void setNavigationManager(NavigationManager navigationManager) {
        this.navigationManager = navigationManager;
    }

    public NavigationManager getNavigationManager() {
        return navigationManager;
    }

    private void setupGlobalKeyboardShortcuts() {
        Platform.runLater(() -> {
            Scene scene = contentArea != null ? contentArea.getScene() : null;
            if (scene == null) {
                return;
            }

            scene.addEventFilter(KeyEvent.KEY_PRESSED, this::handleGlobalShortcut);
        });
    }

    private void handleGlobalShortcut(KeyEvent event) {
        boolean commandOrCtrl = event.isControlDown() || event.isMetaDown();
        KeyCode code = event.getCode();

        if (commandOrCtrl && code == KeyCode.TAB) {
            if (workspaceManager != null) {
                workspaceManager.getDesktop().cycleActiveTab(event.isShiftDown() ? -1 : 1);
                event.consume();
            }
            return;
        }

        if (commandOrCtrl && code == KeyCode.W) {
            if (workspaceManager != null) {
                workspaceManager.getDesktop().closeActiveTab();
                event.consume();
            }
            return;
        }

        if (commandOrCtrl && code == KeyCode.K) {
            if (focusSearchFieldInActiveView()) {
                event.consume();
            }
            return;
        }

        if (commandOrCtrl && code == KeyCode.S) {
            if (fireContextPrimaryAction(List.of("save", "update", "apply", "complete"))) {
                event.consume();
            }
            return;
        }

        if (commandOrCtrl && code == KeyCode.N) {
            if (isPosActiveWindow()) {
                return;
            }
            if (fireContextPrimaryAction(List.of("new", "create", "add"))) {
                event.consume();
            }
            return;
        }

        if (!commandOrCtrl && event.isShiftDown() && code == KeyCode.SLASH) {
            showShortcutHelp();
            event.consume();
            return;
        }

        if (code == KeyCode.ESCAPE) {
            if (tryCloseOwnedModal()) {
                event.consume();
            }
        }
    }

    private boolean focusSearchFieldInActiveView() {
        Node root = getActiveContentRoot();
        TextInputControl searchField = findFirst(root, node -> node instanceof TextInputControl input
            && containsAny(input.getPromptText(), List.of("search", "find", "filter")));
        if (searchField != null) {
            searchField.requestFocus();
            searchField.selectAll();
            return true;
        }
        return false;
    }

    private boolean fireContextPrimaryAction(List<String> keywords) {
        Node root = getActiveContentRoot();
        Button target = findPrimaryActionButton(root, keywords);
        if (target != null && !target.isDisabled() && target.isVisible()) {
            target.fire();
            return true;
        }
        return false;
    }

    private Button findPrimaryActionButton(Node root, List<String> keywords) {
        return findFirst(root, node -> {
            if (!(node instanceof Button btn)) {
                return false;
            }
            if (!btn.isVisible() || btn.isDisabled()) {
                return false;
            }
            String text = btn.getText() == null ? "" : btn.getText().toLowerCase(Locale.ROOT);
            if (btn.isDefaultButton() && !text.isBlank()) {
                return true;
            }
            return keywords.stream().anyMatch(text::contains);
        });
    }

    private boolean tryCloseOwnedModal() {
        if (contentArea == null || contentArea.getScene() == null) {
            return false;
        }
        Scene scene = contentArea.getScene();
        if (scene.getWindow() instanceof javafx.stage.Stage stage) {
            for (javafx.stage.Window owned : javafx.stage.Window.getWindows()) {
                if (owned instanceof javafx.stage.Stage ownedStage
                    && ownedStage.isShowing()
                    && ownedStage.getOwner() == stage) {
                    ownedStage.close();
                    return true;
                }
            }
        }
        return false;
    }

    private void showShortcutHelp() {
        Alert help = new Alert(Alert.AlertType.INFORMATION);
        DialogStyler.apply(help);
        help.setTitle("Keyboard Shortcuts");
        help.setHeaderText("Keyboard Mastery");
        help.setContentText(
            "Ctrl+K: Focus Search\n" +
            "Ctrl+S: Save/Submit\n" +
            "Ctrl+N: Create New\n" +
            "Ctrl+Tab / Ctrl+Shift+Tab: Next/Previous Tab\n" +
            "Ctrl+W: Close Current Tab\n" +
            "Esc: Close Modal\n" +
            "?: Open Shortcuts Help"
        );
        help.show();
    }

    private Node getActiveContentRoot() {
        if (workspaceManager != null && workspaceManager.getDesktop() != null
            && workspaceManager.getDesktop().getActiveWindow() != null
            && !workspaceManager.getDesktop().getActiveWindow().getChildren().isEmpty()) {
            return workspaceManager.getDesktop().getActiveWindow().getChildren().get(0);
        }
        return contentArea;
    }

    private boolean isPosActiveWindow() {
        if (workspaceManager == null || workspaceManager.getDesktop() == null || workspaceManager.getDesktop().getActiveWindow() == null) {
            return false;
        }
        String title = workspaceManager.getDesktop().getActiveWindow().getTitle();
        return title != null && title.toLowerCase(Locale.ROOT).contains("point of sale");
    }

    @SuppressWarnings("unchecked")
    private <T extends Node> T findFirst(Node root, Predicate<Node> predicate) {
        if (root == null) {
            return null;
        }
        if (predicate.test(root)) {
            return (T) root;
        }
        if (root instanceof Parent parent) {
            for (Node child : parent.getChildrenUnmodifiable()) {
                T found = findFirst(child, predicate);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }

    private boolean containsAny(String source, List<String> terms) {
        if (source == null) {
            return false;
        }
        String lower = source.toLowerCase(Locale.ROOT);
        return terms.stream().anyMatch(lower::contains);
    }
}
