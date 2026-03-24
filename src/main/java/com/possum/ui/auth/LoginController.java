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
    
    @FXML private VBox loginForm;
    @FXML private VBox setupForm;
    @FXML private VBox rotateForm;
    
    @FXML private TextField usernameField;
    @FXML private PasswordField passwordField;
    @FXML private Label errorLabel;
    @FXML private Label titleLabel;
    @FXML private Label subtitleLabel;
    @FXML private Button submitButton;

    // Setup fields
    @FXML private TextField setupNameField;
    @FXML private TextField setupUsernameField;
    @FXML private PasswordField setupPasswordField;
    @FXML private PasswordField setupConfirmPasswordField;

    // Rotate fields
    @FXML private TextField rotateUsernameField;
    @FXML private PasswordField rotateCurrentPasswordField;
    @FXML private PasswordField rotateNewPasswordField;
    @FXML private PasswordField rotateConfirmNewPasswordField;
    
    private final AuthService authService;
    private final NavigationManager navigationManager;
    private final SessionStore sessionStore;
    
    private enum Mode { LOGIN, SETUP, ROTATE }
    private Mode currentMode = Mode.LOGIN;

    public LoginController(AuthService authService, NavigationManager navigationManager, SessionStore sessionStore) {
this.authService = authService;
        this.navigationManager = navigationManager;
        this.sessionStore = sessionStore;
    }

    @FXML
    public void initialize() {
        passwordField.setOnAction(e -> handleAction());
        if (setupPasswordField != null) setupConfirmPasswordField.setOnAction(e -> handleAction());
        if (rotateNewPasswordField != null) rotateConfirmNewPasswordField.setOnAction(e -> handleAction());
        
        checkBootstrapStatus();
    }

    private void checkBootstrapStatus() {
        var status = authService.getAuthBootstrapStatus();
        if (status.requiresInitialSetup()) {
            setMode(Mode.SETUP);
        } else if (status.requiresPasswordRotation()) {
            setMode(Mode.ROTATE);
            if (rotateUsernameField != null) rotateUsernameField.setText("admin");
        } else {
            setMode(Mode.LOGIN);
        }
    }

    private void setMode(Mode mode) {
        this.currentMode = mode;
        loginForm.setVisible(mode == Mode.LOGIN);
        loginForm.setManaged(mode == Mode.LOGIN);
        setupForm.setVisible(mode == Mode.SETUP);
        setupForm.setManaged(mode == Mode.SETUP);
        rotateForm.setVisible(mode == Mode.ROTATE);
        rotateForm.setManaged(mode == Mode.ROTATE);

        switch (mode) {
            case LOGIN -> {
                titleLabel.setText("Welcome back");
                subtitleLabel.setText("Sign in to your account to continue");
                submitButton.setText("Sign In");
            }
            case SETUP -> {
                titleLabel.setText("Set Up Admin Account");
                subtitleLabel.setText("First run detected. Create the initial administrator.");
                submitButton.setText("Create Admin Account");
            }
            case ROTATE -> {
                titleLabel.setText("Rotate Default Password");
                subtitleLabel.setText("Security upgrade required before sign in.");
                submitButton.setText("Rotate Password");
            }
        }
    }

    @FXML
    private void handleAction() {
        errorLabel.setVisible(false);
        errorLabel.setManaged(false);

        try {
            switch (currentMode) {
                case LOGIN -> handleLogin();
                case SETUP -> handleSetup();
                case ROTATE -> handleRotate();
            }
        } catch (AuthenticationException e) {
            showError(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            showError("An unexpected error occurred");
        }
    }

    private void handleLogin() {
        String username = usernameField.getText().trim();
        String password = passwordField.getText();
        
        if (username.isEmpty() || password.isEmpty()) {
            showError("Username and password are required");
            return;
        }
        
        LoginResponse response = authService.login(username, password);
        completeLogin(response);
    }

    private void handleSetup() {
        String name = setupNameField.getText().trim();
        String username = setupUsernameField.getText().trim();
        String password = setupPasswordField.getText();
        String confirm = setupConfirmPasswordField.getText();

        if (name.isEmpty() || username.isEmpty() || password.isEmpty()) {
            showError("All fields are required");
            return;
        }

        if (!password.equals(confirm)) {
            showError("Passwords do not match");
            return;
        }

        LoginResponse response = authService.setupInitialAdmin(name, username, password);
        NotificationService.success("Initial setup complete");
        completeLogin(response);
    }

    private void handleRotate() {
        // Implementation for rotate if needed, for now just show error as it's not fully implemented in AuthService yet
        showError("Password rotation not yet implemented in UI");
    }

    private void completeLogin(LoginResponse response) {
        sessionStore.saveSession(response.token());
        AuthContext.setCurrentUser(response.user());
        NotificationService.success("Welcome, " + response.user().name());
        navigationManager.navigateTo("dashboard");
    }
    
    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
        errorLabel.setManaged(true);
    }
}
