package com.possum.ui.common.controls;

import javafx.animation.FadeTransition;
import javafx.animation.PauseTransition;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.util.Duration;

public class NotificationService {
    private static StackPane notificationContainer;

    public enum Type {
        SUCCESS("#4caf50"),
        ERROR("#f44336"),
        WARNING("#ff9800");

        private final String color;
        Type(String color) { this.color = color; }
    }

    public static void initialize(StackPane container) {
        notificationContainer = container;
    }

    public static void show(String message, Type type) {
        if (notificationContainer == null) {
            System.err.println("NotificationService not initialized");
            return;
        }

        Label label = new Label(message);
        label.setStyle(String.format(
            "-fx-background-color: %s; -fx-text-fill: white; " +
            "-fx-padding: 15px 20px; -fx-background-radius: 5px; " +
            "-fx-font-size: 14px; -fx-effect: dropshadow(gaussian, rgba(0,0,0,0.3), 10, 0, 0, 2);",
            type.color
        ));

        VBox notification = new VBox(label);
        notification.setAlignment(Pos.TOP_CENTER);
        notification.setStyle("-fx-padding: 20px;");
        notification.setMouseTransparent(true);

        notificationContainer.getChildren().add(notification);
        StackPane.setAlignment(notification, Pos.TOP_CENTER);

        FadeTransition fadeIn = new FadeTransition(Duration.millis(300), notification);
        fadeIn.setFromValue(0);
        fadeIn.setToValue(1);

        PauseTransition pause = new PauseTransition(Duration.seconds(3));
        
        FadeTransition fadeOut = new FadeTransition(Duration.millis(300), notification);
        fadeOut.setFromValue(1);
        fadeOut.setToValue(0);
        fadeOut.setOnFinished(e -> notificationContainer.getChildren().remove(notification));

        fadeIn.setOnFinished(e -> pause.play());
        pause.setOnFinished(e -> fadeOut.play());
        fadeIn.play();
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
}
