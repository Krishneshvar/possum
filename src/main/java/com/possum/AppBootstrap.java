package com.possum;

import com.possum.application.auth.AuthModule;
import com.possum.infrastructure.filesystem.AppPaths;
import com.possum.infrastructure.lazy.ServiceLocator;
import com.possum.infrastructure.logging.LoggingConfig;
import com.possum.infrastructure.security.PasswordHasher;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.DatabaseManager;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.sqlite.SqliteSessionRepository;
import com.possum.persistence.repositories.sqlite.SqliteUserRepository;
import com.possum.ui.AppShellController;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

public final class AppBootstrap {

    private static final Logger LOGGER = LoggerFactory.getLogger(AppBootstrap.class);

    private AppPaths appPaths;
    private DatabaseManager databaseManager;
    private TransactionManager transactionManager;
    private AuthModule authModule;
    private ServiceLocator serviceLocator;

    public void start(Stage stage) {
        try {
            initializeCore();
            loadMainShell(stage);
            LOGGER.info("Application bootstrap completed");
        } catch (RuntimeException ex) {
            shutdown();
            throw ex;
        }
    }

    public void shutdown() {
        if (databaseManager != null) {
            databaseManager.close();
        }
        LOGGER.info("Application shutdown completed");
    }

    public AuthModule getAuthModule() {
        return authModule;
    }

    public ServiceLocator getServiceLocator() {
        return serviceLocator;
    }

    private void initializeCore() {
        appPaths = new AppPaths();
        LoggingConfig.configure(appPaths);
        
        databaseManager = new DatabaseManager(appPaths);
        databaseManager.initialize();
        transactionManager = new TransactionManager(databaseManager);
        
        JsonService jsonService = new JsonService();
        PasswordHasher passwordHasher = new PasswordHasher();
        SqliteUserRepository userRepository = new SqliteUserRepository(databaseManager);
        SqliteSessionRepository sessionRepository = new SqliteSessionRepository(databaseManager);
        
        authModule = new AuthModule(userRepository, sessionRepository, transactionManager, passwordHasher);
        serviceLocator = new ServiceLocator(databaseManager, transactionManager, appPaths);
        
        LOGGER.info("Core services initialized");
    }

    private void loadMainShell(Stage stage) {
        try {
            FXMLLoader loader = new FXMLLoader(AppBootstrap.class.getResource("/fxml/app-shell.fxml"));
            Parent root = loader.load();

            AppShellController shellController = loader.getController();

            Scene scene = new Scene(root, 1280, 800);
            stage.setTitle("POSSUM - Point of Sale System");
            stage.setMinWidth(1024);
            stage.setMinHeight(768);
            stage.setScene(scene);
            stage.show();

            LOGGER.info("Main application shell loaded");
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load main application shell", ex);
        }
    }
}
