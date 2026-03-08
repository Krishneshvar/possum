package com.possum;

import javafx.application.Application;
import javafx.stage.Stage;

public final class AppLauncher extends Application {

    private AppBootstrap appBootstrap;

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage primaryStage) {
        appBootstrap = new AppBootstrap();
        appBootstrap.start(primaryStage);
    }

    @Override
    public void stop() {
        if (appBootstrap != null) {
            appBootstrap.shutdown();
        }
    }
}
