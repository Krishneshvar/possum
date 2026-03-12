package com.possum.ui;

import com.possum.ui.navigation.NavigationManager;
import com.possum.ui.navigation.RouteGuard;
import com.possum.ui.workspace.WorkspaceDesktop;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;

public class AppShellController {

    private DependencyInjector dependencyInjector;

    public void setDependencyInjector(DependencyInjector dependencyInjector) {
        this.dependencyInjector = dependencyInjector;
        if (workspaceManager != null) {
            workspaceManager.setDependencyInjector(dependencyInjector);
        }
        if (navigationManager != null) {
            navigationManager.setDependencyInjector(dependencyInjector);
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
        TestAuthSetup.setupMockAdminUser();
        
        WorkspaceDesktop desktop = new WorkspaceDesktop();
        workspaceManager = new WorkspaceManager(desktop, dependencyInjector);
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
            {"Stock", "/fxml/inventory/inventory-view.fxml"}
        });
        createNavMenu("🛒 Sales", new String[][]{
            {"Point of Sale", "/fxml/sales/pos-view.fxml"},
            {"Transactions", "/fxml/transactions/transactions-view.fxml"},
            {"Returns", "/fxml/returns/returns-view.fxml"}
        });
        createNavMenu("📋 Purchase", new String[][]{
            {"Suppliers", "/fxml/purchase/suppliers-view.fxml"},
            {"Purchase Orders", "/fxml/purchase/purchase-view.fxml"}
        });
        createNavMenu("📊 Insights", new String[][]{
            {"Reports", "/fxml/reports/reports-view.fxml"},
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
        System.out.println("Logout clicked");
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
