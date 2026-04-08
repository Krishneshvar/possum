package com.possum;


public final class AppLauncher {
    public static void main(String[] args) {
        javafx.application.Application.launch(MainApp.class, args);
    }

    public static class MainApp extends javafx.application.Application {
        private AppBootstrap appBootstrap;

        @Override
        public void start(javafx.stage.Stage primaryStage) {
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
}
