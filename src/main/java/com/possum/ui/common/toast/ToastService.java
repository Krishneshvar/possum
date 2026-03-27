package com.possum.ui.common.toast;

import javafx.animation.KeyFrame;
import javafx.animation.KeyValue;
import javafx.animation.Timeline;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.stage.Popup;
import javafx.stage.Stage;
import javafx.util.Duration;
import org.kordamp.ikonli.javafx.FontIcon;

/**
 * Service for displaying transient toast notifications.
 */
public class ToastService {

    private Stage mainStage;

    /**
     * Sets the main stage which will own the toast popups.
     * @param mainStage The application's primary stage.
     */
    public void setMainStage(Stage mainStage) {
        this.mainStage = mainStage;
    }

    /**
     * Shows a success toast notification.
     * @param message The message to display.
     */
    public void success(String message) {
        show(message, "toast-success", "bx-check-circle");
    }

    /**
     * Shows an error toast notification.
     * @param message The message to display.
     */
    public void error(String message) {
        show(message, "toast-error", "bx-error-circle");
    }

    /**
     * Shows an info/normal toast notification.
     * @param message The message to display.
     */
    public void info(String message) {
        show(message, "toast-info", "bx-info-circle");
    }

    /**
     * Shows a warning toast notification (using the normal blue style as requested).
     * @param message The message to display.
     */
    public void warning(String message) {
        show(message, "toast-info", "bx-error");
    }

    private void show(String message, String styleClass, String iconCode) {
        if (mainStage == null) {
            System.err.println("ToastService: mainStage not set. Cannot show toast: " + message);
            return;
        }

        Platform.runLater(() -> {
            Popup popup = new Popup();
            
            HBox toastBody = new HBox(12);
            toastBody.getStyleClass().addAll("toast-container", styleClass);
            toastBody.setAlignment(Pos.CENTER_LEFT);
            toastBody.setPadding(new Insets(12, 20, 12, 20));
            toastBody.setMinWidth(300);
            toastBody.setMaxWidth(450);

            FontIcon icon = new FontIcon(iconCode);
            icon.setIconSize(20);
            icon.getStyleClass().add("toast-icon");

            Label label = new Label(message);
            label.setWrapText(true);
            label.getStyleClass().add("toast-message");

            toastBody.getStylesheets().add(getClass().getResource("/styles/app-shell.css").toExternalForm());
            toastBody.getChildren().addAll(icon, label);
            popup.getContent().add(toastBody);

            // Auto-hide after some time
            popup.setAutoHide(true);

            // Positioning logic after popup is shown (to get width/height)
            popup.setOnShown(e -> {
                double x = mainStage.getX() + (mainStage.getWidth() / 2) - (toastBody.getWidth() / 2);
                double y = mainStage.getY() + 70; // Position below the navbar at the top
                popup.setX(x);
                popup.setY(y);
            });

            popup.show(mainStage);

            // Animation
            toastBody.setOpacity(0);
            Timeline fadeIn = new Timeline(
                new KeyFrame(Duration.ZERO, new KeyValue(toastBody.opacityProperty(), 0)),
                new KeyFrame(Duration.millis(300), new KeyValue(toastBody.opacityProperty(), 1))
            );

            Timeline fadeOut = new Timeline(
                new KeyFrame(Duration.ZERO, new KeyValue(toastBody.opacityProperty(), 1)),
                new KeyFrame(Duration.millis(300), new KeyValue(toastBody.opacityProperty(), 0))
            );
            fadeOut.setDelay(Duration.seconds(4));
            fadeOut.setOnFinished(e -> popup.hide());

            fadeIn.play();
            fadeIn.setOnFinished(e -> fadeOut.play());
        });
    }
}
