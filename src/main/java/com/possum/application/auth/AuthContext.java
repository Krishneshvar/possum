package com.possum.application.auth;

public final class AuthContext {

    private static final ThreadLocal<AuthUser> currentUser = new ThreadLocal<>();

    public static void setCurrentUser(AuthUser user) {
        currentUser.set(user);
    }

    public static AuthUser getCurrentUser() {
        return currentUser.get();
    }

    public static void clear() {
        currentUser.remove();
    }

    private AuthContext() {
    }
}
