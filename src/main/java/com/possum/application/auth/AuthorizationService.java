package com.possum.application.auth;

import java.util.List;

public class AuthorizationService {

    private static final String ADMIN_ROLE = "admin";

    public boolean isAdmin(UserContext user) {
        return user.roles().contains(ADMIN_ROLE);
    }

    public boolean hasPermission(UserContext user, String permission) {
        if (isAdmin(user)) {
            return true;
        }
        return user.permissions().contains(permission);
    }

    public boolean hasAnyPermission(UserContext user, List<String> permissions) {
        if (isAdmin(user)) {
            return true;
        }
        return permissions.stream().anyMatch(p -> user.permissions().contains(p));
    }

    public boolean hasAllPermissions(UserContext user, List<String> permissions) {
        if (isAdmin(user)) {
            return true;
        }
        return permissions.stream().allMatch(p -> user.permissions().contains(p));
    }

    public boolean hasRole(UserContext user, String role) {
        return user.roles().contains(role);
    }

    public boolean hasAnyRole(UserContext user, List<String> roles) {
        return roles.stream().anyMatch(r -> user.roles().contains(r));
    }

    public boolean hasAllRoles(UserContext user, List<String> roles) {
        return roles.stream().allMatch(r -> user.roles().contains(r));
    }

    public boolean isValidPermission(String permission) {
        return permission != null && permission.matches("^[a-z_]+\\.[a-z_]+$");
    }

    public boolean isValidRoleName(String role) {
        return role != null && role.matches("^[a-z_]+$");
    }
}
