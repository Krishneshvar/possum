package com.possum.ui.auth;

import com.possum.application.auth.AuthContext;
import com.possum.application.auth.AuthService;
import com.possum.application.auth.LoginResponse;
import com.possum.domain.exceptions.AuthenticationException;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.navigation.NavigationManager;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;

public class LoginController {
    
    @FXML private TextField usernameField;
    @FXML private PasswordField passwordField;
    @FXML private Label errorLabel;
    
    private AuthService authService;
    private NavigationManager navigationManager;
    private SessionStore sessionStore;

    public LoginController(AuthService authService, NavigationManager navigationManager, SessionStore sessionStore) {
this.authService = authService;
        this.navigationManager = navigationManager;
        this.sessionStore = sessionStore;
    }

    @FXML
    public void initialize() {
        
        passwordField.setOnAction(e -> handleLogin());
    }

    @FXML
    private void handleLogin() {
        String username = usernameField.getText().trim();
        String password = passwordField.getText();
        
        if (username.isEmpty() || password.isEmpty()) {
            showError("Username and password are required");
            return;
        }
        
        try {
            LoginResponse response = authService.login(username, password);
            
            sessionStore.saveSession(response.token());
            AuthContext.setCurrentUser(response.user());
            
            NotificationService.success("Login successful");
            navigationManager.navigateTo("dashboard");
            
        } catch (AuthenticationException e) {
            showError(e.getMessage());
            NotificationService.error("Login failed");
        } catch (Exception e) {
            showError("An error occurred during login");
            NotificationService.error("Login failed");
        }
    }
    
    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
        errorLabel.setManaged(true);
    }
}
