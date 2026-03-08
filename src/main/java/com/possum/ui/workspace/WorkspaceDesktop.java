package com.possum.ui.workspace;

import javafx.scene.layout.Pane;
import java.util.ArrayList;
import java.util.List;

public class WorkspaceDesktop extends Pane {
    
    private final List<InternalWindow> windows = new ArrayList<>();
    private InternalWindow activeWindow;
    
    public WorkspaceDesktop() {
        getStyleClass().add("workspace-desktop");
        setOnMousePressed(e -> {
            if (e.getTarget() == this) {
                clearActiveWindow();
            }
        });
    }

    public void tileWindows() {
        int count = windows.size();
        if (count == 0) return;

        int cols = (int) Math.ceil(Math.sqrt(count));
        int rows = (int) Math.ceil((double) count / cols);

        double w = getWidth() / cols;
        double h = getHeight() / rows;

        for (int i = 0; i < count; i++) {

            int r = i / cols;
            int c = i % cols;

            InternalWindow win = windows.get(i);

            win.setLayoutX(c * w);
            win.setLayoutY(r * h);
            win.setPrefWidth(w);
            win.setPrefHeight(h);
        }
    }

    public void addWindow(InternalWindow window) {
        windows.add(window);
        getChildren().add(window);
        setActiveWindow(window);
        
        window.setOnMousePressed(e -> {
            setActiveWindow(window);
            e.consume();
        });
        
        window.setOnCloseRequest(() -> removeWindow(window));
    }
    
    public void removeWindow(InternalWindow window) {
        windows.remove(window);
        getChildren().remove(window);
        if (activeWindow == window) {
            activeWindow = null;
        }
    }
    
    public void setActiveWindow(InternalWindow window) {
        if (activeWindow != null) {
            activeWindow.setActive(false);
        }
        activeWindow = window;
        window.setActive(true);
        window.toFront();
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
}
