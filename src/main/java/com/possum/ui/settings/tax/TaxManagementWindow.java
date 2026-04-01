package com.possum.ui.settings.tax;

import com.possum.application.taxes.TaxManagementService;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import com.possum.ui.common.controls.ViewStateEnhancer;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Modality;
import javafx.stage.Stage;

public class TaxManagementWindow {

    public static void show(TaxRepository taxRepository, JsonService jsonService) {
        try {
            TaxManagementService taxService = new TaxManagementService(taxRepository);
            
            FXMLLoader loader = new FXMLLoader(
                TaxManagementWindow.class.getResource("/fxml/settings/tax/tax-management.fxml")
            );
            
            Parent root = loader.load();
            ViewStateEnhancer.enhance(root);
            
            TaxManagementController controller = loader.getController();
            controller.setServices(taxService, taxRepository, jsonService);
            
            Stage stage = new Stage();
            stage.setTitle("Tax Management");
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.setScene(new Scene(root, 900, 700));
            stage.show();
            
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to open tax management window", e);
        }
    }
}
