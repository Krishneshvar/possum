package com.possum.ui;

import com.possum.ui.navigation.NavigationManager;
import com.possum.ui.navigation.RouteGuard;
import com.possum.ui.workspace.WorkspaceDesktop;
import com.possum.ui.workspace.WorkspaceManager;
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
        // Let the desktop stretch to fill the StackPane in both directions
        desktop.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        
        RouteGuard routeGuard = new RouteGuard(new com.possum.application.auth.AuthorizationService());
        navigationManager = new NavigationManager(contentArea, routeGuard);
        buildNavigation();
        buildUserMenu();
        loadBrandIcon();
        
        initializeUserAvatar();
    }
    
    private void loadBrandIcon() {
        try {
            String iconPath = getClass().getResource("/icons/icon.png").toExternalForm();
            brandIcon.setImage(new javafx.scene.image.Image(iconPath));
        } catch (Exception e) {
            System.err.println("Failed to load brand icon: " + e.getMessage());
        }
    }
    
    private void buildUserMenu() {
        Label nameLabel = new Label(currentUserName);
        nameLabel.setStyle("-fx-font-weight: 600; -fx-font-size: 14px; -fx-padding: 8 12;");
        
        Label roleLabel = new Label("Administrator");
        roleLabel.setStyle("-fx-text-fill: #64748b; -fx-font-size: 12px; -fx-padding: 0 12 8 12;");
        
        CustomMenuItem headerItem = new CustomMenuItem(new VBox(nameLabel, roleLabel));
        headerItem.setHideOnClick(false);
        
        SeparatorMenuItem sep1 = new SeparatorMenuItem();
        
        MenuItem themeItem = new MenuItem("🌓 Toggle Theme");
        themeItem.setOnAction(e -> handleThemeToggle());
        
        SeparatorMenuItem sep2 = new SeparatorMenuItem();
        
        MenuItem logoutItem = new MenuItem("Logout");
        logoutItem.setStyle("-fx-text-fill: #dc2626;");
        logoutItem.setOnAction(e -> handleLogout());
        
        userMenuButton.getItems().addAll(headerItem, sep1, themeItem, sep2, logoutItem);
    }
    
    private void initializeUserAvatar() {
        if (currentUserName != null && !currentUserName.isEmpty()) {
            userAvatar.setText(String.valueOf(currentUserName.charAt(0)).toUpperCase());
        }
    }

    private void buildNavigation() {
        createNavButton("🏠 Dashboard", "Dashboard", "/fxml/dashboard/dashboard-view.fxml");
        createNavMenu("📦 Inventory", new String[][]{
            {"Products", "/fxml/products/products-view.fxml"},
            {"Variants", "/fxml/inventory/variants-view.fxml"},
            {"Categories", "/fxml/categories/categories-view.fxml"},
            {"Stock", "/fxml/inventory/inventory-view.fxml"},
            {"Stock History", "/fxml/inventory/stock-history-view.fxml"}
        });
        createNavMenu("🛒 Sales", new String[][]{
            {"Point of Sale", "/fxml/sales/pos-view.fxml"},
            {"Bill History", "/fxml/sales/sales-history-view.fxml"},
            {"Transactions", "/fxml/transactions/transactions-view.fxml"},
            {"Returns", "/fxml/returns/returns-view.fxml"}
        });
        createNavMenu("📋 Purchase", new String[][]{
            {"Suppliers", "/fxml/purchase/suppliers-view.fxml"},
            {"Purchase Orders", "/fxml/purchase/purchase-view.fxml"}
        });
        createNavMenu("👥 People", new String[][]{
            {"Employees", "/fxml/people/users-view.fxml"},
            {"Customers", "/fxml/people/customers-view.fxml"}
        });
        createNavMenu("📊 Insights", new String[][]{
            {"Sales Reports", "/fxml/reports/sales-reports-view.fxml"},
            {"Sales Analytics", "/fxml/reports/sales-analytics-view.fxml"},
            {"Product Flow", "/fxml/insights/product-flow-view.fxml"},
            {"Audit Log", "/fxml/audit/audit-view.fxml"}
        });
        createNavButton("⚙ Settings", "Settings", "/fxml/settings/settings-view.fxml");
    }

    private void createNavButton(String label, String title, String fxmlPath) {
        Button btn = new Button(label);
        btn.getStyleClass().add("nav-menu-btn");
        btn.setOnAction(e -> workspaceManager.openOrFocusWindow(title, fxmlPath));
        navItems.getChildren().add(btn);
    }

    private void createNavMenu(String label, String[][] items) {
        MenuButton menuBtn = new MenuButton(label);
        menuBtn.getStyleClass().add("nav-menu-btn");
        
        for (String[] item : items) {
            MenuItem menuItem = new MenuItem(item[0]);
            menuItem.setOnAction(e -> workspaceManager.openOrFocusWindow(item[0], item[1]));
            menuBtn.getItems().add(menuItem);
        }
        
        navItems.getChildren().add(menuBtn);
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
                        sessionStore
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
}
