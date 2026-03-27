package com.possum.ui.common.controls;

import javafx.animation.KeyFrame;
import javafx.animation.KeyValue;
import javafx.animation.Timeline;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.StackPane;
import javafx.stage.Popup;
import javafx.stage.Stage;
import javafx.stage.Window;
import javafx.util.Duration;
import org.kordamp.ikonli.javafx.FontIcon;

/**
 * Legacy notification service, now upgraded to use the modern Toast system.
 */
public class NotificationService {
    private static StackPane notificationContainer;

    public enum Type {
        SUCCESS("toast-success", "bx-check-circle"),
        ERROR("toast-error", "bx-error-circle"),
        WARNING("toast-info", "bx-error"), // Map warning to info style for now
        INFO("toast-info", "bx-info-circle");

        private final String styleClass;
        private final String iconCode;
        Type(String styleClass, String iconCode) { 
            this.styleClass = styleClass;
            this.iconCode = iconCode;
        }
    }

    public static void initialize(StackPane container) {
        notificationContainer = container;
    }

    public static void show(String message, Type type) {
        if (notificationContainer == null || notificationContainer.getScene() == null) {
            // Fallback to console if not initialized
            System.err.println("NotificationService: " + type.name() + ": " + message);
            return;
        }

        Window window = notificationContainer.getScene().getWindow();
        if (!(window instanceof Stage stage)) return;

        Platform.runLater(() -> {
            Popup popup = new Popup();
            
            HBox toastBody = new HBox(12);
            toastBody.getStyleClass().addAll("toast-container", type.styleClass);
            toastBody.setAlignment(Pos.CENTER_LEFT);
            toastBody.setPadding(new Insets(12, 20, 12, 20));
            toastBody.setMinWidth(300);
            toastBody.setMaxWidth(450);

            FontIcon icon = new FontIcon(type.iconCode);
            icon.setIconSize(20);
            icon.getStyleClass().add("toast-icon");

            Label label = new Label(message);
            label.setWrapText(true);
            label.getStyleClass().add("toast-message");

            toastBody.getStylesheets().add(NotificationService.class.getResource("/styles/app-shell.css").toExternalForm());
            toastBody.getChildren().addAll(icon, label);
            popup.getContent().add(toastBody);
            popup.setAutoHide(true);

            popup.setOnShown(e -> {
                double x = stage.getX() + (stage.getWidth() / 2) - (toastBody.getWidth() / 2);
                double y = stage.getY() + 70; // Position below the navbar at the top
                popup.setX(x);
                popup.setY(y);
            });

            popup.show(stage);

            toastBody.setOpacity(0);
            Timeline fadeIn = new Timeline(
                new KeyFrame(Duration.ZERO, new KeyValue(toastBody.opacityProperty(), 0)),
                new KeyFrame(Duration.millis(300), new KeyValue(toastBody.opacityProperty(), 1))
            );

            Timeline fadeOut = new Timeline(
                new KeyFrame(Duration.ZERO, new KeyValue(toastBody.opacityProperty(), 1)),
                new KeyFrame(Duration.millis(300), new KeyValue(toastBody.opacityProperty(), 0))
            );
            fadeOut.setDelay(Duration.seconds(3));
            fadeOut.setOnFinished(ev -> popup.hide());

            fadeIn.play();
            fadeIn.setOnFinished(ev -> fadeOut.play());
        });
    }

    public static void success(String message) {
        show(message, Type.SUCCESS);
    }

    public static void error(String message) {
        show(message, Type.ERROR);
    }

    public static void warning(String message) {
        show(message, Type.WARNING);
    }

    public static void info(String message) {
        show(message, Type.INFO);
    }
}
