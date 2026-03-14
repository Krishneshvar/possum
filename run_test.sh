#!/bin/bash
cat << 'INNER_EOF' > src/test/java/com/possum/ui/products/ProductFormControllerTest.java
package com.possum.ui.products;

import com.possum.application.products.ProductService;
import com.possum.application.categories.CategoryService;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import com.possum.ui.navigation.NavigationManager;
import org.junit.jupiter.api.Test;
import java.util.Map;

public class ProductFormControllerTest {
    @Test
    public void testSetParameters() {
        ProductFormController controller = new ProductFormController(null, null, null, null);
        try {
            controller.setParameters(Map.of("productId", 1L, "mode", "edit"));
            System.out.println("Success calling setParameters");
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
INNER_EOF
./gradlew test --tests "*ProductFormControllerTest"
