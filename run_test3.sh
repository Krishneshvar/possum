#!/bin/bash
cat << 'INNER_EOF' > src/test/java/com/possum/ui/products/ProductFormControllerTest.java
package com.possum.ui.products;

import javafx.application.Platform;
import org.junit.jupiter.api.Test;
import java.util.Map;

public class ProductFormControllerTest {
    @Test
    public void testSetParameters() {
        try {
            ProductFormController controller = new ProductFormController(null, null, null, null);
            controller.setParameters(Map.of("productId", 1L, "mode", "edit"));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
INNER_EOF
./gradlew test --tests "*ProductFormControllerTest" --info | grep -C 10 "Exception"
