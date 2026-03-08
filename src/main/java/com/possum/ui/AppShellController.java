package com.possum.ui;

import com.possum.ui.navigation.NavigationManager;
import com.possum.ui.navigation.RouteGuard;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.layout.*;

import java.util.HashMap;
import java.util.Map;

public class AppShellController {

    @FXML private VBox sidebar;
    @FXML private VBox navMain;
    @FXML private VBox navSecondary;
    @FXML private HBox navUser;
    @FXML private HBox header;
    @FXML private StackPane contentArea;
    @FXML private Label pageTitleLabel;
    @FXML private Label userNameLabel;
    @FXML private Button logoutButton;
    @FXML private Button themeToggleButton;

    private NavigationManager navigationManager;
    private final Map<String, VBox> expandableGroups = new HashMap<>();
    private Button activeNavButton = null;

    @FXML
    public void initialize() {
        // Setup mock admin user for testing
        TestAuthSetup.setupMockAdminUser();
        
        RouteGuard routeGuard = new RouteGuard(new com.possum.application.auth.AuthorizationService());
        navigationManager = new NavigationManager(contentArea, routeGuard);
        buildNavigation();
        
        // Add listener to update page title and active nav on route change
        navigationManager.addNavigationListener(this::onNavigationChanged);
        
        navigationManager.navigateTo("dashboard");
    }

    private void buildNavigation() {
        // Main Navigation
        createNavItem(navMain, "Dashboard", "dashboard", false);
        createExpandableNavGroup(navMain, "Inventory", new String[][]{
            {"Products", "products"},
            {"Stock", "inventory"}
        });
        createExpandableNavGroup(navMain, "Commercial", new String[][]{
            {"Point of Sale", "sales"},
            {"Transactions", "transactions"},
            {"Returns", "returns"}
        });
        createExpandableNavGroup(navMain, "Purchase", new String[][]{
            {"Purchase Orders", "purchase"}
        });
        createExpandableNavGroup(navMain, "Reports & Logs", new String[][]{
            {"Reports", "reports-sales"},
            {"Audit Log", "audit-log"}
        });

        // Secondary Navigation
        createNavItem(navSecondary, "Settings", "settings", false);
    }

    private void createNavItem(VBox container, String label, String routeId, boolean isSubItem) {
        Button navButton = new Button(label);
        navButton.setMaxWidth(Double.MAX_VALUE);
        navButton.getStyleClass().add(isSubItem ? "nav-sub-item" : "nav-item");
        navButton.setAlignment(Pos.CENTER_LEFT);
        navButton.setUserData(routeId);
        
        navButton.setOnAction(e -> {
            if (navigationManager != null) {
                navigationManager.navigateTo(routeId);
                setActiveNavButton(navButton);
            }
        });
        
        container.getChildren().add(navButton);
    }

    private void createExpandableNavGroup(VBox container, String groupLabel, String[][] items) {
        VBox groupContainer = new VBox(2);
        groupContainer.getStyleClass().add("nav-group");

        Button groupButton = new Button(groupLabel + " ▼");
        groupButton.setMaxWidth(Double.MAX_VALUE);
        groupButton.getStyleClass().add("nav-group-header");
        groupButton.setAlignment(Pos.CENTER_LEFT);

        VBox subItemsContainer = new VBox(2);
        subItemsContainer.getStyleClass().add("nav-sub-items");
        subItemsContainer.setManaged(false);
        subItemsContainer.setVisible(false);
        VBox.setMargin(subItemsContainer, new Insets(0, 0, 0, 15));

        for (String[] item : items) {
            createNavItem(subItemsContainer, item[0], item[1], true);
        }

        groupButton.setOnAction(e -> {
            boolean isExpanded = subItemsContainer.isVisible();
            subItemsContainer.setVisible(!isExpanded);
            subItemsContainer.setManaged(!isExpanded);
            groupButton.setText(groupLabel + (isExpanded ? " ▼" : " ▲"));
        });

        groupContainer.getChildren().addAll(groupButton, subItemsContainer);
        container.getChildren().add(groupContainer);
        expandableGroups.put(groupLabel, subItemsContainer);
    }

    private void handleNavigation(String routeId) {
        if (navigationManager != null) {
            navigationManager.navigateTo(routeId);
            updatePageTitle(routeId);
        }
    }

    private void setActiveNavButton(Button button) {
        if (activeNavButton != null) {
            activeNavButton.getStyleClass().remove("active");
        }
        button.getStyleClass().add("active");
        activeNavButton = button;
    }

    private void onNavigationChanged(String routeId) {
        updatePageTitle(routeId);
        highlightActiveRoute(routeId);
    }

    private void highlightActiveRoute(String routeId) {
        // Find and highlight the button with matching routeId
        highlightButtonInContainer(navMain, routeId);
        highlightButtonInContainer(navSecondary, routeId);
    }

    private void highlightButtonInContainer(VBox container, String routeId) {
        for (var node : container.getChildren()) {
            if (node instanceof Button button) {
                if (routeId.equals(button.getUserData())) {
                    setActiveNavButton(button);
                    return;
                }
            } else if (node instanceof VBox groupContainer) {
                // Check nested items in expandable groups
                for (var child : groupContainer.getChildren()) {
                    if (child instanceof VBox subItems) {
                        for (var subNode : subItems.getChildren()) {
                            if (subNode instanceof Button subButton && routeId.equals(subButton.getUserData())) {
                                setActiveNavButton(subButton);
                                // Expand parent group
                                subItems.setVisible(true);
                                subItems.setManaged(true);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }

    private void updatePageTitle(String routeId) {
        String title = switch (routeId) {
            case "dashboard" -> "Dashboard";
            case "products" -> "Products";
            case "inventory" -> "Inventory";
            case "sales" -> "Point of Sale";
            case "transactions" -> "Transactions";
            case "returns" -> "Returns";
            case "purchase" -> "Purchase Orders";
            case "reports-sales" -> "Reports";
            case "audit-log" -> "Audit Log";
            case "settings" -> "Settings";
            default -> "POSSUM";
        };
        pageTitleLabel.setText(title);
    }

    public void loadContent(Node content) {
        contentArea.getChildren().clear();
        contentArea.getChildren().add(content);
    }

    public void setPageTitle(String title) {
        pageTitleLabel.setText(title);
    }

    public void setUserName(String userName) {
        userNameLabel.setText(userName);
    }

    @FXML
    private void handleLogout() {
        System.out.println("Logout clicked");
        // AuthService logout will be integrated here
    }

    @FXML
    private void handleThemeToggle() {
        boolean isDark = themeToggleButton.getText().equals("🌙");
        themeToggleButton.setText(isDark ? "☀️" : "🌙");
        System.out.println("Theme toggled: " + (isDark ? "Light" : "Dark"));
        // Theme switching logic will be integrated here
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
