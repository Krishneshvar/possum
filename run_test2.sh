#!/bin/bash
mkdir -p src/test/java/com/possum/ui/products/
cat << 'INNER_EOF' > src/test/java/com/possum/ui/products/ProductFormControllerTest.java
package com.possum.ui.products;

import org.junit.jupiter.api.Test;
import java.util.Map;

public class ProductFormControllerTest {
    @Test
    public void testSetParameters() {
        System.out.println("Test running");
    }
}
INNER_EOF
./gradlew test --tests "*ProductFormControllerTest"
