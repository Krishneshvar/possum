package com.possum.application.auth;

import com.possum.domain.exceptions.AuthenticationException;
import com.possum.domain.model.SessionRecord;
import com.possum.domain.model.User;
import com.possum.infrastructure.security.PasswordHasher;
import com.possum.persistence.repositories.interfaces.SessionRepository;
import com.possum.persistence.repositories.interfaces.UserRepository;

import java.util.Optional;

public class AuthService {

    private static final int SESSION_DURATION_SECONDS = 30 * 60;
    private static final String DUMMY_HASH = "$2b$10$InCX8UtTmhbQP3NuHPaRAeCdfZeaIngIzsAjWjbAYxjprs6WHcoAG";

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final SessionService sessionService;
    private final PasswordHasher passwordHasher;

    public AuthService(
            UserRepository userRepository,
            SessionRepository sessionRepository,
            SessionService sessionService,
            PasswordHasher passwordHasher
    ) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
        this.passwordHasher = passwordHasher;
    }

    public LoginResponse login(String username, String password) {
        Optional<User> userOpt = userRepository.findUserByUsername(username);
        
        String userPasswordHash = userOpt
                .filter(u -> u.active() && u.deletedAt() == null)
                .map(User::passwordHash)
                .orElse(DUMMY_HASH);

        boolean isValid = passwordHasher.verifyPassword(password, userPasswordHash);

        if (userOpt.isEmpty() || !userOpt.get().active() || userOpt.get().deletedAt() != null || !isValid) {
            throw new AuthenticationException("Invalid username or password");
        }

        User user = userOpt.get();
        AuthUser userData = sessionService.buildAuthUser(user.id());
        String token = sessionService.createSession(userData);

        return new LoginResponse(userData, token);
    }

    public AuthUser validateSession(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        long now = System.currentTimeMillis() / 1000;

        if (Math.random() < 0.01) {
            sessionService.deleteExpiredSessions();
        }

        Optional<SessionRecord> sessionOpt = sessionService.findByToken(token);
        if (sessionOpt.isEmpty()) {
            return null;
        }

        SessionRecord session = sessionOpt.get();

        Optional<User> currentUserOpt = userRepository.findUserById(session.userId());
        if (currentUserOpt.isEmpty() || !currentUserOpt.get().active() || currentUserOpt.get().deletedAt() != null) {
            sessionService.deleteSession(token);
            return null;
        }

        if (session.expiresAt() < now) {
            sessionService.deleteSession(token);
            return null;
        }

        AuthUser authUser = sessionService.buildAuthUser(session.userId());

        long newExpiresAt = now + SESSION_DURATION_SECONDS;
        sessionService.updateExpiration(token, newExpiresAt);

        return authUser;
    }

    public void logout(String token) {
        sessionService.deleteSession(token);
    }

    public AuthUser getCurrentUser(long userId) {
        return sessionService.buildAuthUser(userId);
    }

    public void revokeUserSessions(long userId) {
        sessionService.deleteUserSessions(userId);
    }

    public void clearAllSessions() {
        sessionRepository.deleteAll();
    }
}
