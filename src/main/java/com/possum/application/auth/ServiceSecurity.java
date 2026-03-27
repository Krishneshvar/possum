package com.possum.application.auth;

import com.possum.domain.exceptions.AuthorizationException;

public class ServiceSecurity {

    private static final AuthorizationService authService = new AuthorizationService();

    public static void requirePermission(String permission) {
        AuthUser currentUser = AuthContext.getCurrentUser();
        if (currentUser == null) {
            throw new AuthorizationException("Unauthorized: No active user session.");
        }
        UserContext userContext = new UserContext(
                currentUser.id(),
                currentUser.roles(),
                currentUser.permissions()
        );
        if (!authService.hasPermission(userContext, permission)) {
            throw new AuthorizationException("Forbidden: Missing required permission (" + permission + ")");
        }
    }
}
