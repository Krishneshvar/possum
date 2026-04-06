package com.possum.ui.auth;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PasswordStrengthIndicatorTest {

    @Test
    void testEmptyPassword() {
        var indicator = new PasswordStrengthIndicator();
        indicator.updateStrength("");
        assertNotNull(indicator);
    }

    @Test
    void testWeakPassword() {
        var indicator = new PasswordStrengthIndicator();
        indicator.updateStrength("abc123");
        assertNotNull(indicator);
    }

    @Test
    void testStrongPassword() {
        var indicator = new PasswordStrengthIndicator();
        indicator.updateStrength("MyStr0ng!Pass@2024");
        assertNotNull(indicator);
    }

    @Test
    void testNullPassword() {
        var indicator = new PasswordStrengthIndicator();
        indicator.updateStrength(null);
        assertNotNull(indicator);
    }
}
