package com.possum.application.auth;

import com.possum.domain.exceptions.AuthorizationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ServiceSecurity {

    private static final Logger LOGGER = LoggerFactory.getLogger(ServiceSecurity.class);
    private static final AuthorizationService authService = new AuthorizationService();

    public static void requirePermission(String permission) {
        AuthUser currentUser = AuthContext.getCurrentUser();
        if (currentUser == null) {
            LOGGER.warn("ACCESS_DENIED permission={} reason=no_active_session", permission);
            throw new AuthorizationException("Unauthorized: No active user session.");
        }
        UserContext userContext = new UserContext(
                currentUser.id(),
                currentUser.roles(),
                currentUser.permissions()
        );
        if (!authService.hasPermission(userContext, permission)) {
            LOGGER.warn("ACCESS_DENIED userId={} username={} permission={}",
                    currentUser.id(), currentUser.username(), permission);
            throw new AuthorizationException("Forbidden: Missing required permission (" + permission + ")");
        }
    }
}
