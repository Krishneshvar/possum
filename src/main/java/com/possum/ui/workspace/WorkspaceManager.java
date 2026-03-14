package com.possum.ui.workspace;

import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import com.possum.ui.navigation.Parameterizable;

import java.util.Map;

public class WorkspaceManager {

    private final WorkspaceDesktop desktop;
    private com.possum.ui.DependencyInjector dependencyInjector;

    public WorkspaceManager(WorkspaceDesktop desktop, com.possum.ui.DependencyInjector dependencyInjector) {
        this.dependencyInjector = dependencyInjector;
        this.desktop = desktop;
    }

    /**
     * Opens a window for the given title/fxml.
     * If a window with that title is already open, brings it to the front instead
     * of creating a duplicate.
     */
    public void openOrFocusWindow(String title, String fxmlPath) {
        // Check for existing window with the same title
        for (InternalWindow w : desktop.getWindows()) {
            if (w.getTitle().equals(title)) {
                desktop.setActiveWindow(w);
                return;
            }
        }

        openWindow(title, fxmlPath);
    }

    public void openWindow(String title, String fxmlPath) {
        openWindow(title, fxmlPath, null);
    }

    public void openWindow(String title, String fxmlPath, Map<String, Object> params) {
        if (desktop.getWindows().size() >= 10) return;

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
            if (dependencyInjector != null) {
                loader.setControllerFactory(dependencyInjector.getControllerFactory());
            }
            Node content = loader.load();

            Object controller = loader.getController();
            if (controller instanceof Parameterizable && params != null) {
                ((Parameterizable) controller).setParameters(params);
            }

            InternalWindow window = new InternalWindow(title);
            window.setContent(content);

            desktop.addWindow(window);

        } catch (Exception e) {
            System.err.println("Failed to load window: " + fxmlPath);
            e.printStackTrace();
        }
    }

    public void closeActiveWindow() {
        InternalWindow activeWindow = desktop.getActiveWindow();
        if (activeWindow != null) {
            desktop.removeWindow(activeWindow);
        }
    }

    public void setDependencyInjector(com.possum.ui.DependencyInjector dependencyInjector) {
        this.dependencyInjector = dependencyInjector;
    }

    public WorkspaceDesktop getDesktop() {
        return desktop;
    }
}
