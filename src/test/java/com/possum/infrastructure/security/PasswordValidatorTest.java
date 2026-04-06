package com.possum.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class PasswordValidatorTest {
    
    @Test
    void testValidPassword() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate("MyP@ssw0rd123!");
        assertTrue(result.valid(), "Password should be valid");
        assertTrue(result.errors().isEmpty(), "Should have no errors");
    }
    
    @ParameterizedTest
    @ValueSource(strings = {"short", "abc", "12345"})
    void testPasswordTooShort(String password) {
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);
        assertFalse(result.valid(), "Password should be invalid");
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("at least")));
    }
    
    @Test
    void testPasswordMissingUppercase() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate("myp@ssw0rd123!");
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("uppercase")));
    }
    
    @Test
    void testPasswordMissingLowercase() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate("MYP@SSW0RD123!");
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("lowercase")));
    }
    
    @Test
    void testPasswordMissingDigit() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate("MyP@ssword!!!");
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("digit")));
    }
    
    @Test
    void testPasswordMissingSpecialChar() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate("MyPassword123");
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("special character")));
    }
    
    @ParameterizedTest
    @ValueSource(strings = {"Password123!", "Admin123!@#", "Letmein123!"})
    void testPasswordWithCommonPatterns(String password) {
        PasswordValidator.ValidationResult result = PasswordValidator.validate(password);
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("common patterns")));
    }
    
    @Test
    void testPasswordWithSequentialChars() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate("MyP@ssw0rd1234!");
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("common patterns")));
    }
    
    @Test
    void testPasswordWithRepeatingChars() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate("MyP@ssw0rd1111!");
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("common patterns")));
    }
    
    @Test
    void testNullPassword() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate(null);
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("cannot be empty")));
    }
    
    @Test
    void testEmptyPassword() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate("");
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("cannot be empty")));
    }
    
    @Test
    void testPasswordTooLong() {
        String longPassword = "A".repeat(129) + "a1!";
        PasswordValidator.ValidationResult result = PasswordValidator.validate(longPassword);
        assertFalse(result.valid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("must not exceed")));
    }
    
    @Test
    void testMultipleErrors() {
        PasswordValidator.ValidationResult result = PasswordValidator.validate("short");
        assertFalse(result.valid());
        assertTrue(result.errors().size() > 1, "Should have multiple errors");
    }
}
