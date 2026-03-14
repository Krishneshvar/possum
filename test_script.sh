#!/bin/bash
# Check if productId from edit is prefilled by injecting a debug statement
sed -i 's/Platform.runLater(() -> loadProductDetails(isView));/System.out.println("DEBUG: isView=" + isView + ", mode=" + mode + ", productId=" + productId);\n            Platform.runLater(() -> loadProductDetails(isView));/g' src/main/java/com/possum/ui/products/ProductFormController.java

# also print if an error occurs
sed -i 's/NotificationService.error("Failed to load product details: " + e.getMessage());/e.printStackTrace(); NotificationService.error("Failed to load product details: " + e.getMessage());/g' src/main/java/com/possum/ui/products/ProductFormController.java
