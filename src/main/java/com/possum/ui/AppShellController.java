package com.possum.ui;

import com.possum.ui.navigation.NavigationManager;
import com.possum.ui.navigation.RouteGuard;
import javafx.fxml.FXML;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;

public class AppShellController {

    @FXML private HBox navbar;
    @FXML private HBox navItems;
    @FXML private StackPane contentArea;
    @FXML private Label userAvatar;
    @FXML private MenuButton userMenuButton;
    @FXML private ImageView brandIcon;

    private NavigationManager navigationManager;
    private Button activeNavButton = null;
    private boolean isDarkTheme = false;
    private String currentUserName = "Admin User";

    @FXML
    public void initialize() {
        TestAuthSetup.setupMockAdminUser();
        
        RouteGuard routeGuard = new RouteGuard(new com.possum.application.auth.AuthorizationService());
        navigationManager = new NavigationManager(contentArea, routeGuard);
        buildNavigation();
        buildUserMenu();
        loadBrandIcon();
        
        navigationManager.addNavigationListener(this::onNavigationChanged);
        navigationManager.navigateTo("dashboard");
        
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
        createNavButton("🏠 Dashboard", "dashboard");
        createNavMenu("📦 Inventory", new String[][]{
            {"Products", "products"},
            {"Stock", "inventory"}
        });
        createNavMenu("🛒 Sales", new String[][]{
            {"Point of Sale", "sales"},
            {"Transactions", "transactions"},
            {"Returns", "returns"}
        });
        createNavButton("📋 Purchase", "purchase");
        createNavMenu("📊 Insights", new String[][]{
            {"Reports", "reports-sales"},
            {"Audit Log", "audit-log"}
        });
        createNavButton("⚙ Settings", "settings");
    }

    private void createNavButton(String label, String routeId) {
        Button btn = new Button(label);
        btn.getStyleClass().add("nav-menu-btn");
        btn.setUserData(routeId);
        btn.setOnAction(e -> {
            navigationManager.navigateTo(routeId);
            setActiveNavButton(btn);
        });
        navItems.getChildren().add(btn);
    }

    private void createNavMenu(String label, String[][] items) {
        MenuButton menuBtn = new MenuButton(label);
        menuBtn.getStyleClass().add("nav-menu-btn");
        
        for (String[] item : items) {
            MenuItem menuItem = new MenuItem(item[0]);
            menuItem.setOnAction(e -> navigationManager.navigateTo(item[1]));
            menuBtn.getItems().add(menuItem);
        }
        
        navItems.getChildren().add(menuBtn);
    }

    private void setActiveNavButton(Button button) {
        if (activeNavButton != null) {
            activeNavButton.getStyleClass().remove("active");
        }
        button.getStyleClass().add("active");
        activeNavButton = button;
    }

    private void onNavigationChanged(String routeId) {
        highlightActiveRoute(routeId);
    }

    private void highlightActiveRoute(String routeId) {
        for (var node : navItems.getChildren()) {
            if (node instanceof Button button && routeId.equals(button.getUserData())) {
                setActiveNavButton(button);
                return;
            }
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
