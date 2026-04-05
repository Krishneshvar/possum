package com.possum.application.auth;

import com.possum.domain.exceptions.AuthenticationException;
import com.possum.domain.model.Role;
import com.possum.domain.model.User;
import com.possum.infrastructure.security.PasswordHasher;
import com.possum.persistence.repositories.interfaces.SessionRepository;
import com.possum.persistence.repositories.interfaces.UserRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.UserFilter;
import com.possum.testutil.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock SessionRepository sessionRepository;
    @Mock SessionService sessionService;
    @Mock PasswordHasher passwordHasher;

    AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(userRepository, sessionRepository, sessionService, passwordHasher);
    }

    // --- login ---

    @Test
    void login_userNotFound_performsDummyHashAndThrows() {
        when(userRepository.findUserByUsername("ghost")).thenReturn(Optional.empty());
        when(passwordHasher.verifyPassword(anyString(), anyString())).thenReturn(false);
        assertThrows(AuthenticationException.class, () -> service.login("ghost", "pass"));
        verify(passwordHasher).verifyPassword(anyString(), anyString()); // dummy hash called
    }

    @Test
    void login_deletedUser_throwsAuthenticationException() {
        User deleted = Fixtures.deletedUser(1L, "deleted");
        when(userRepository.findUserByUsername("deleted")).thenReturn(Optional.of(deleted));
        when(passwordHasher.verifyPassword(anyString(), anyString())).thenReturn(false);
        assertThrows(AuthenticationException.class, () -> service.login("deleted", "pass"));
    }

    @Test
    void login_inactiveUser_throwsAuthenticationException() {
        User inactive = Fixtures.inactiveUser(1L, "inactive");
        when(userRepository.findUserByUsername("inactive")).thenReturn(Optional.of(inactive));
        when(passwordHasher.verifyPassword(anyString(), anyString())).thenReturn(false);
        assertThrows(AuthenticationException.class, () -> service.login("inactive", "pass"));
    }

    @Test
    void login_wrongPassword_throwsAuthenticationException() {
        User user = Fixtures.activeUser(1L, "alice");
        when(userRepository.findUserByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordHasher.verifyPassword("wrong", user.passwordHash())).thenReturn(false);
        assertThrows(AuthenticationException.class, () -> service.login("alice", "wrong"));
    }

    @Test
    void login_validCredentials_returnsLoginResponse() {
        User user = Fixtures.activeUser(1L, "alice");
        AuthUser authUser = Fixtures.authUser(1L, "alice");
        when(userRepository.findUserByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordHasher.verifyPassword("secret", user.passwordHash())).thenReturn(true);
        when(sessionService.buildAuthUser(1L)).thenReturn(authUser);
        when(sessionService.createSession(authUser)).thenReturn("token-abc");

        LoginResponse response = service.login("alice", "secret");

        assertNotNull(response);
        assertEquals("token-abc", response.token());
        assertFalse(response.mustRotate());
    }

    @Test
    void login_legacyAdminDefaultPassword_mustRotateIsTrue() {
        User admin = Fixtures.activeUser(1L, "admin");
        AuthUser authUser = Fixtures.authUser(1L, "admin");
        when(userRepository.findUserByUsername("admin")).thenReturn(Optional.of(admin));
        when(passwordHasher.verifyPassword("admin123", admin.passwordHash())).thenReturn(true);
        when(sessionService.buildAuthUser(1L)).thenReturn(authUser);
        when(sessionService.createSession(authUser)).thenReturn("token-xyz");

        LoginResponse response = service.login("admin", "admin123");
        assertTrue(response.mustRotate());
    }

    // --- validateSession ---

    @Test
    void validateSession_tokenNotFound_returnsNull() {
        when(sessionService.findByToken("bad-token")).thenReturn(Optional.empty());
        assertNull(service.validateSession("bad-token"));
    }

    @Test
    void validateSession_expiredSession_deletesAndReturnsNull() {
        when(sessionService.findByToken("expired")).thenReturn(Optional.of(Fixtures.expiredSession(1L, "expired")));
        User user = Fixtures.activeUser(1L, "alice");
        when(userRepository.findUserById(1L)).thenReturn(Optional.of(user));

        assertNull(service.validateSession("expired"));
        verify(sessionService).deleteSession("expired");
    }

    @Test
    void validateSession_userDeactivated_deletesSessionAndReturnsNull() {
        when(sessionService.findByToken("tok")).thenReturn(Optional.of(Fixtures.validSession(1L, "tok")));
        when(userRepository.findUserById(1L)).thenReturn(Optional.of(Fixtures.inactiveUser(1L, "alice")));

        assertNull(service.validateSession("tok"));
        verify(sessionService).deleteSession("tok");
    }

    @Test
    void validateSession_validToken_slidesExpiryAndReturnsAuthUser() {
        when(sessionService.findByToken("tok")).thenReturn(Optional.of(Fixtures.validSession(1L, "tok")));
        when(userRepository.findUserById(1L)).thenReturn(Optional.of(Fixtures.activeUser(1L, "alice")));
        when(sessionService.buildAuthUser(1L)).thenReturn(Fixtures.authUser(1L, "alice"));

        AuthUser result = service.validateSession("tok");

        assertNotNull(result);
        verify(sessionService).updateExpiration(eq("tok"), anyLong());
    }

    // --- logout ---

    @Test
    void logout_delegatesToSessionService() {
        service.logout("tok");
        verify(sessionService).deleteSession("tok");
    }

    // --- setupInitialAdmin ---

    @Test
    void setupInitialAdmin_whenUsersExist_throwsAuthenticationException() {
        when(userRepository.findUsers(any(UserFilter.class)))
                .thenReturn(new PagedResult<>(List.of(Fixtures.activeUser(1L, "existing")), 1, 1, 1, 1));
        assertThrows(AuthenticationException.class,
                () -> service.setupInitialAdmin("Admin", "admin", "password123"));
    }

    @Test
    void setupInitialAdmin_shortUsername_throwsAuthenticationException() {
        when(userRepository.findUsers(any(UserFilter.class)))
                .thenReturn(new PagedResult<>(List.of(), 0, 0, 1, 1));
        assertThrows(AuthenticationException.class,
                () -> service.setupInitialAdmin("Admin", "ab", "password123"));
    }

    @Test
    void setupInitialAdmin_shortPassword_throwsAuthenticationException() {
        when(userRepository.findUsers(any(UserFilter.class)))
                .thenReturn(new PagedResult<>(List.of(), 0, 0, 1, 1));
        assertThrows(AuthenticationException.class,
                () -> service.setupInitialAdmin("Admin", "admin", "short"));
    }

    @Test
    void setupInitialAdmin_usernameAlreadyExists_throwsAuthenticationException() {
        when(userRepository.findUsers(any(UserFilter.class)))
                .thenReturn(new PagedResult<>(List.of(), 0, 0, 1, 1));
        when(userRepository.findUserByUsername("admin")).thenReturn(Optional.of(Fixtures.activeUser(1L, "admin")));
        when(userRepository.getAllRoles()).thenReturn(List.of(Fixtures.adminRole()));
        assertThrows(AuthenticationException.class,
                () -> service.setupInitialAdmin("Admin", "admin", "password123"));
    }

    @Test
    void setupInitialAdmin_noAdminRole_throwsAuthenticationException() {
        when(userRepository.findUsers(any(UserFilter.class)))
                .thenReturn(new PagedResult<>(List.of(), 0, 0, 1, 1));
        when(userRepository.findUserByUsername("newadmin")).thenReturn(Optional.empty());
        when(userRepository.getAllRoles()).thenReturn(List.of()); // no roles
        assertThrows(AuthenticationException.class,
                () -> service.setupInitialAdmin("Admin", "newadmin", "password123"));
    }

    @Test
    void setupInitialAdmin_validInputs_createsUserAndReturnsToken() {
        when(userRepository.findUsers(any(UserFilter.class)))
                .thenReturn(new PagedResult<>(List.of(), 0, 0, 1, 1));
        when(userRepository.findUserByUsername("newadmin")).thenReturn(Optional.empty());
        when(userRepository.getAllRoles()).thenReturn(List.of(Fixtures.adminRole()));
        when(passwordHasher.hashPassword("password123")).thenReturn("hashed");

        User created = Fixtures.activeUser(99L, "newadmin");
        when(userRepository.insertUserWithRoles(any(), anyList())).thenReturn(created);

        AuthUser authUser = Fixtures.authUser(99L, "newadmin");
        when(sessionService.buildAuthUser(99L)).thenReturn(authUser);
        when(sessionService.createSession(authUser)).thenReturn("setup-token");

        LoginResponse response = service.setupInitialAdmin("Admin", "newadmin", "password123");

        assertEquals("setup-token", response.token());
        assertFalse(response.mustRotate());
    }
}
