package com.possum.ui.workspace;

import javafx.fxml.FXMLLoader;
import javafx.scene.Node;

public class WorkspaceManager {
    
    private final WorkspaceDesktop desktop;
    private int windowCounter = 0;
    private com.possum.ui.DependencyInjector dependencyInjector;
    
    public WorkspaceManager(WorkspaceDesktop desktop, com.possum.ui.DependencyInjector dependencyInjector) {
        this.dependencyInjector = dependencyInjector;
        this.desktop = desktop;
    }

    public void openOrFocusWindow(String title, String fxmlPath) {
        for (InternalWindow w : desktop.getWindows()) {

            if (w.getTitle().equals(title)) {
                desktop.setActiveWindow(w);
                w.toFront();
                return;
            }

        }

        openWindow(title, fxmlPath);
    }
    
    public void openWindow(String title, String fxmlPath) {
        if (desktop.getWindows().size() >= 10) return;

        try {

            FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
            if (dependencyInjector != null) {
                loader.setControllerFactory(dependencyInjector.getControllerFactory());
            }
            Node content = loader.load();



            InternalWindow window = new InternalWindow(title);
            window.setContent(content);

            desktop.addWindow(window);

            // maximize by default
            window.setLayoutX(0);
            window.setLayoutY(0);
            window.setPrefWidth(desktop.getWidth());
            window.setPrefHeight(desktop.getHeight());

            windowCounter++;

        } catch (Exception e) {
            System.err.println("Failed to load window: " + fxmlPath);
            e.printStackTrace();
        }
    }
    
    public void setDependencyInjector(com.possum.ui.DependencyInjector dependencyInjector) {
        this.dependencyInjector = dependencyInjector;
    }

    public WorkspaceDesktop getDesktop() {
        return desktop;
    }
}
