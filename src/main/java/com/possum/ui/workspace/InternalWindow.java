package com.possum.ui.workspace;

import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Pane;
import javafx.scene.layout.Priority;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;

public class InternalWindow extends VBox {
    
    private final Label titleLabel;
    private final HBox titleBar;
    private final StackPane contentArea;
    private Runnable onCloseRequest;
    private boolean isActive = false;
    private boolean isMinimized = false;
    private boolean isMaximized = false;

    private double dragOffsetX;
    private double dragOffsetY;
    private double resizeStartX;
    private double resizeStartY;
    private double resizeStartWidth;
    private double resizeStartHeight;
    private double previousHeight;
    private double restoreX;
    private double restoreY;
    private double restoreWidth;
    private double restoreHeight;
    private ResizeMode resizeMode = ResizeMode.NONE;
    
    private static final double MIN_WIDTH = 300;
    private static final double MIN_HEIGHT = 200;
    private static final double RESIZE_MARGIN = 5;
    
    public InternalWindow(String title) {
        getStyleClass().add("internal-window");
        
        titleBar = new HBox();
        titleBar.getStyleClass().add("window-title-bar");
        titleBar.setSpacing(8);
        
        titleLabel = new Label(title);
        titleLabel.getStyleClass().add("window-title");
        HBox.setHgrow(titleLabel, Priority.ALWAYS);
        
        Button minimizeBtn = new Button("−");
        minimizeBtn.getStyleClass().add("window-btn");
        minimizeBtn.setOnAction(e -> toggleMinimize());

        Button maximizeBtn = new Button("□");
        maximizeBtn.getStyleClass().add("window-btn");
        maximizeBtn.setOnAction(e -> toggleMaximize());
        
        Button closeBtn = new Button("×");
        closeBtn.getStyleClass().add("window-btn-close");
        closeBtn.setOnAction(e -> {
            if (onCloseRequest != null) onCloseRequest.run();
        });
        
        titleBar.getChildren().addAll(titleLabel, minimizeBtn, maximizeBtn, closeBtn);
        
        contentArea = new StackPane();
        contentArea.getStyleClass().add("window-content");
        VBox.setVgrow(contentArea, Priority.ALWAYS);
        
        getChildren().addAll(titleBar, contentArea);
        
        setPrefSize(600, 400);
        setMinSize(MIN_WIDTH, MIN_HEIGHT);
        setManaged(false);
        setPickOnBounds(true);
        
        setupDragging();
        setupResizing();
    }
    
    private void setupDragging() {
        if (isMaximized) return;

        titleBar.setOnMouseClicked(e -> {
            if (e.getClickCount() == 2) {
                toggleMaximize();
            }
        });

        titleBar.setOnMousePressed(e -> {
            dragOffsetX = e.getSceneX() - getLayoutX();
            dragOffsetY = e.getSceneY() - getLayoutY();
        });

        titleBar.setOnMouseDragged(e -> {
            if (isMaximized) return;

            double newX = e.getSceneX() - dragOffsetX;
            double newY = e.getSceneY() - dragOffsetY;

            Pane parent = (Pane) getParent();
            if (parent == null) return;

            double maxX = Math.max(0, parent.getWidth() - getWidth());
            double maxY = Math.max(0, parent.getHeight() - getHeight());

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            setLayoutX(newX);
            setLayoutY(newY);

            // SNAP LEFT
            if (newX < 10) {
                setLayoutX(0);
                setLayoutY(0);
                setPrefWidth(parent.getWidth() / 2);
                setPrefHeight(parent.getHeight());
            }

            // SNAP RIGHT
            if (newX > parent.getWidth() - getWidth() - 10) {
                setLayoutX(parent.getWidth() / 2);
                setLayoutY(0);
                setPrefWidth(parent.getWidth() / 2);
                setPrefHeight(parent.getHeight());
            }

        });

        titleBar.setCursor(Cursor.MOVE);
    }
    
    private void setupResizing() {
        setOnMouseMoved(e -> {
            if (isMinimized) return;
            
            double x = e.getX();
            double y = e.getY();
            double w = getWidth();
            double h = getHeight();
            
            boolean left = x < RESIZE_MARGIN;
            boolean right = x > w - RESIZE_MARGIN;
            boolean top = y < RESIZE_MARGIN;
            boolean bottom = y > h - RESIZE_MARGIN;
            
            if (bottom && right) setCursor(Cursor.SE_RESIZE);
            else if (bottom && left) setCursor(Cursor.SW_RESIZE);
            else if (top && right) setCursor(Cursor.NE_RESIZE);
            else if (top && left) setCursor(Cursor.NW_RESIZE);
            else if (right) setCursor(Cursor.E_RESIZE);
            else if (left) setCursor(Cursor.W_RESIZE);
            else if (bottom) setCursor(Cursor.S_RESIZE);
            else if (top) setCursor(Cursor.N_RESIZE);
            else setCursor(Cursor.DEFAULT);
        });
        
        setOnMousePressed(e -> {
            if (getCursor() == Cursor.DEFAULT || getCursor() == Cursor.MOVE) return;
            
            resizeStartX = e.getSceneX();
            resizeStartY = e.getSceneY();
            resizeStartWidth = getWidth();
            resizeStartHeight = getHeight();
            resizeMode = getResizeMode(e.getX(), e.getY());
        });
        
        setOnMouseDragged(e -> {
            if (resizeMode == ResizeMode.NONE) return;
            
            double deltaX = e.getSceneX() - resizeStartX;
            double deltaY = e.getSceneY() - resizeStartY;
            
            switch (resizeMode) {
                case SE -> {
                    setPrefWidth(Math.max(MIN_WIDTH, resizeStartWidth + deltaX));
                    setPrefHeight(Math.max(MIN_HEIGHT, resizeStartHeight + deltaY));
                }
                case E -> setPrefWidth(Math.max(MIN_WIDTH, resizeStartWidth + deltaX));
                case S -> setPrefHeight(Math.max(MIN_HEIGHT, resizeStartHeight + deltaY));
                case SW -> {
                    double newWidth = Math.max(MIN_WIDTH, resizeStartWidth - deltaX);
                    if (newWidth > MIN_WIDTH) setLayoutX(getLayoutX() + deltaX);
                    setPrefWidth(newWidth);
                    setPrefHeight(Math.max(MIN_HEIGHT, resizeStartHeight + deltaY));
                }
                case W -> {
                    double newWidth = Math.max(MIN_WIDTH, resizeStartWidth - deltaX);
                    if (newWidth > MIN_WIDTH) setLayoutX(getLayoutX() + deltaX);
                    setPrefWidth(newWidth);
                }
                case NW -> {
                    double newWidth = Math.max(MIN_WIDTH, resizeStartWidth - deltaX);
                    double newHeight = Math.max(MIN_HEIGHT, resizeStartHeight - deltaY);
                    if (newWidth > MIN_WIDTH) setLayoutX(getLayoutX() + deltaX);
                    if (newHeight > MIN_HEIGHT) setLayoutY(getLayoutY() + deltaY);
                    setPrefWidth(newWidth);
                    setPrefHeight(newHeight);
                }
                case N -> {
                    double newHeight = Math.max(MIN_HEIGHT, resizeStartHeight - deltaY);
                    if (newHeight > MIN_HEIGHT) setLayoutY(getLayoutY() + deltaY);
                    setPrefHeight(newHeight);
                }
                case NE -> {
                    double newHeight = Math.max(MIN_HEIGHT, resizeStartHeight - deltaY);
                    if (newHeight > MIN_HEIGHT) setLayoutY(getLayoutY() + deltaY);
                    setPrefWidth(Math.max(MIN_WIDTH, resizeStartWidth + deltaX));
                    setPrefHeight(newHeight);
                }
            }
        });
        
        setOnMouseReleased(e -> resizeMode = ResizeMode.NONE);
    }
    
    private ResizeMode getResizeMode(double x, double y) {
        double w = getWidth();
        double h = getHeight();
        
        boolean left = x < RESIZE_MARGIN;
        boolean right = x > w - RESIZE_MARGIN;
        boolean top = y < RESIZE_MARGIN;
        boolean bottom = y > h - RESIZE_MARGIN;
        
        if (bottom && right) return ResizeMode.SE;
        if (bottom && left) return ResizeMode.SW;
        if (top && right) return ResizeMode.NE;
        if (top && left) return ResizeMode.NW;
        if (right) return ResizeMode.E;
        if (left) return ResizeMode.W;
        if (bottom) return ResizeMode.S;
        if (top) return ResizeMode.N;
        return ResizeMode.NONE;
    }
    
    public void setContent(Node content) {
        contentArea.getChildren().clear();
        contentArea.getChildren().add(content);
    }
    
    public void setActive(boolean active) {
        isActive = active;
        if (active) {
            titleBar.getStyleClass().add("active");
        } else {
            titleBar.getStyleClass().remove("active");
        }
    }
    
    private void toggleMinimize() {
        isMinimized = !isMinimized;

        if (isMinimized) {
            previousHeight = getHeight();
            contentArea.setVisible(false);
            contentArea.setManaged(false);
            setPrefHeight(titleBar.getHeight());
        } else {
            contentArea.setVisible(true);
            contentArea.setManaged(true);
            setPrefHeight(previousHeight);
        }
    }

    private void toggleMaximize() {
        Pane parent = (Pane) getParent();
        if (parent == null) return;

        if (!isMaximized) {

            restoreX = getLayoutX();
            restoreY = getLayoutY();
            restoreWidth = getWidth();
            restoreHeight = getHeight();

            setLayoutX(0);
            setLayoutY(0);
            setPrefWidth(parent.getWidth());
            setPrefHeight(parent.getHeight());

            isMaximized = true;

        } else {

            setLayoutX(restoreX);
            setLayoutY(restoreY);
            setPrefWidth(restoreWidth);
            setPrefHeight(restoreHeight);

            isMaximized = false;
        }
    }

    public String getTitle() {
        return titleLabel.getText();
    }
    
    public void setOnCloseRequest(Runnable handler) {
        this.onCloseRequest = handler;
    }
    
    private enum ResizeMode {
        NONE, N, S, E, W, NE, NW, SE, SW
    }
}
