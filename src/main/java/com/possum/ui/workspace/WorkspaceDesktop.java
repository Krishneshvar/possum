package com.possum.ui.workspace;

import javafx.geometry.Insets;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.layout.*;
import javafx.scene.input.MouseEvent;

import java.util.ArrayList;
import java.util.List;

/**
 * WorkspaceDesktop – a BorderPane that fills the content area.
 *
 *  ┌──────────────────────────────────────┐
 *  │         content (center)             │  ← active InternalWindow fills this
 *  │                                      │
 *  ├──────────────────────────────────────┤
 *  │  [Tab A ×]  [Tab B ×]  [Tab C ×]    │  ← tab bar (bottom)
 *  └──────────────────────────────────────┘
 */
public class WorkspaceDesktop extends BorderPane {

    private final List<InternalWindow> windows = new ArrayList<>();
    private InternalWindow activeWindow;

    // Center: shows the active window
    private final StackPane contentPane = new StackPane();

    // Bottom: scrollable tab bar
    private final HBox tabBar = new HBox();
    private final ScrollPane tabScroll = new ScrollPane(tabBar);

    public WorkspaceDesktop() {
        getStyleClass().add("workspace-desktop");

        // ---- content area ----
        contentPane.getStyleClass().add("workspace-content-pane");
        setCenter(contentPane);

        // ---- tab bar ----
        tabBar.getStyleClass().add("workspace-tab-bar");
        tabBar.setSpacing(2);
        tabBar.setPadding(new Insets(4, 8, 4, 8));

        tabScroll.setFitToHeight(true);
        tabScroll.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        tabScroll.setVbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        tabScroll.getStyleClass().add("workspace-tab-scroll");
        setTop(tabScroll);
        rebuildTabBar();
    }

    // -----------------------------------------------------------------------
    // Window management
    // -----------------------------------------------------------------------

    public void addWindow(InternalWindow window) {
        windows.add(window);
        contentPane.getChildren().add(window);

        // Listen for focus clicks on the content pane so clicking inside
        // a window's content still activates it.
        window.addEventFilter(MouseEvent.MOUSE_PRESSED, e -> setActiveWindow(window));

        window.setOnCloseRequest(() -> removeWindow(window));

        addTab(window);
        setActiveWindow(window);
    }

    public void removeWindow(InternalWindow window) {
        windows.remove(window);
        contentPane.getChildren().remove(window);
        rebuildTabBar();

        if (activeWindow == window) {
            activeWindow = null;
            if (!windows.isEmpty()) {
                setActiveWindow(windows.get(windows.size() - 1));
            }
        }
    }

    public void setActiveWindow(InternalWindow window) {
        activeWindow = window;
        // Show only the active window; hide all others
        for (InternalWindow w : windows) {
            w.setVisible(w == activeWindow);
            w.setManaged(w == activeWindow);
        }
        refreshTabBar();
    }

    private void clearActiveWindow() {
        if (activeWindow != null) {
            activeWindow.setActive(false);
            activeWindow = null;
        }
    }

    public List<InternalWindow> getWindows() {
        return new ArrayList<>(windows);
    }

    public InternalWindow getActiveWindow() {
        return activeWindow;
    }

    // -----------------------------------------------------------------------
    // Tab bar
    // -----------------------------------------------------------------------

    private void addTab(InternalWindow window) {
        // Just rebuild the whole bar – it's cheap for typical tab counts
        rebuildTabBar();
    }

    private void rebuildTabBar() {
        tabBar.getChildren().clear();
        if (windows.isEmpty()) {
            Label placeholder = new Label("No tabs opened");
            placeholder.getStyleClass().add("workspace-tab-placeholder");
            // Set a soft color and font style for the placeholder
            placeholder.setStyle("-fx-text-fill: #94a3b8; -fx-font-style: italic; -fx-padding: 0 0 0 10;");
            tabBar.getChildren().add(placeholder);
        } else {
            for (InternalWindow w : windows) {
                tabBar.getChildren().add(buildTab(w));
            }
        }
    }

    private void refreshTabBar() {
        // Re-render so the active tab gets its style applied
        rebuildTabBar();
    }

    private HBox buildTab(InternalWindow window) {
        HBox tab = new HBox();
        tab.getStyleClass().add("workspace-tab");
        if (window == activeWindow) {
            tab.getStyleClass().add("workspace-tab-active");
        }
        tab.setSpacing(6);
        tab.setPadding(new Insets(4, 8, 4, 12));
        tab.setAlignment(javafx.geometry.Pos.CENTER_LEFT);

        Label title = new Label(window.getTitle());
        title.getStyleClass().add("workspace-tab-label");

        Button closeBtn = new Button("×");
        closeBtn.getStyleClass().add("workspace-tab-close");
        closeBtn.setOnAction(e -> {
            e.consume();
            Runnable req = window.getOnCloseRequest();
            if (req != null) req.run();
        });

        tab.getChildren().addAll(title, closeBtn);
        tab.setOnMouseClicked(e -> setActiveWindow(window));

        return tab;
    }

    // -----------------------------------------------------------------------
    // Tiling (kept for API compatibility; not used in tab mode)
    // -----------------------------------------------------------------------

    public void tileWindows() {
        // No-op – windows are now tabbed, not tiled.
    }
}
