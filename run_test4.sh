#!/bin/bash
cat << 'INNER_EOF' > src/test/java/com/possum/ui/products/ProductFormControllerTest.java
package com.possum.ui.products;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import com.possum.domain.model.Variant;

public class ProductFormControllerTest {
    @Test
    public void test() {
        System.out.println("No syntax error in Variant");
    }
}
INNER_EOF
./gradlew test --tests "*ProductFormControllerTest"
