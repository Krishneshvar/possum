package com.possum.application.people;

import com.possum.domain.model.Permission;
import com.possum.domain.model.Role;
import com.possum.domain.model.User;
import com.possum.domain.model.UserPermissionOverride;
import com.possum.infrastructure.security.PasswordHasher;
import com.possum.persistence.repositories.interfaces.UserRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.UserFilter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public class UserService {
    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;

    public UserService(UserRepository userRepository, PasswordHasher passwordHasher) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
    }

    public PagedResult<User> getUsers(UserFilter filter) {
        return userRepository.findUsers(filter);
    }

    public Optional<User> getUserById(long id) {
        return userRepository.findUserById(id);
    }

    public User createUser(String name, String username, String password, boolean active, List<Long> roleIds) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.USERS_MANAGE);
        String hashedPassword = passwordHasher.hashPassword(password);
        User newUser = new User(null, name, username, hashedPassword, active, LocalDateTime.now(), LocalDateTime.now(), null);
        return userRepository.insertUserWithRoles(newUser, roleIds);
    }

    public User updateUser(long id, String name, String username, String password, boolean active, List<Long> roleIds) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.USERS_MANAGE);
        User existingUser = userRepository.findUserById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String hashedPassword = existingUser.passwordHash();
        if (password != null && !password.trim().isEmpty()) {
            hashedPassword = passwordHasher.hashPassword(password);
        }

        User updatedUser = new User(existingUser.id(), name, username, hashedPassword, active, existingUser.createdAt(), LocalDateTime.now(), existingUser.deletedAt());
        return userRepository.updateUserWithRolesById(id, updatedUser, roleIds);
    }

    public void deleteUser(long id) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.USERS_MANAGE);
        if (!userRepository.softDeleteUser(id)) {
            throw new RuntimeException("Failed to delete user or user not found");
        }
    }

    public List<Role> getAllRoles() {
        return userRepository.getAllRoles();
    }

    public List<Permission> getAllPermissions() {
        return userRepository.getAllPermissions();
    }

    public List<Role> getUserRoles(long userId) {
        return userRepository.getUserRoles(userId);
    }

    public List<String> getUserPermissions(long userId) {
        return userRepository.getUserPermissions(userId);
    }

    public void assignUserRoles(long userId, List<Long> roleIds) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.USERS_MANAGE);
        userRepository.assignUserRoles(userId, roleIds);
    }

    public List<UserPermissionOverride> getUserPermissionOverrides(long userId) {
        return userRepository.getUserPermissionOverrides(userId);
    }

    public void setUserPermission(long userId, long permissionId, boolean granted) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.USERS_MANAGE);
        userRepository.setUserPermission(userId, permissionId, granted);
    }
}
