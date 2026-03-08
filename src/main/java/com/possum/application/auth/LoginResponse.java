package com.possum.application.auth;

public record LoginResponse(
        AuthUser user,
        String token
) {
}
