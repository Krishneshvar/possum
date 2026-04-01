package com.possum.ui.design;

import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.ComboBox;
import javafx.scene.control.DatePicker;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;

public class ComponentDemoController {

    @FXML
    private ComboBox<String> statusCombo;

    @FXML
    private DatePicker demoDate;

    @FXML
    private TableView<ComponentSample> componentTable;

    @FXML
    private TableColumn<ComponentSample, String> componentColumn;

    @FXML
    private TableColumn<ComponentSample, String> variantColumn;

    @FXML
    private TableColumn<ComponentSample, String> statusColumn;

    @FXML
    public void initialize() {
        statusCombo.setItems(FXCollections.observableArrayList("Draft", "Ready", "Deprecated"));

        componentColumn.setCellValueFactory(new PropertyValueFactory<>("component"));
        variantColumn.setCellValueFactory(new PropertyValueFactory<>("variant"));
        statusColumn.setCellValueFactory(new PropertyValueFactory<>("status"));

        componentTable.setItems(FXCollections.observableArrayList(
            new ComponentSample("BaseButton", "Primary", "Active"),
            new ComponentSample("BaseInput", "Text Field", "Active"),
            new ComponentSample("DataTable", "Default", "Active"),
            new ComponentSample("Card", "Elevated", "Active")
        ));
    }

    public static class ComponentSample {
        private final String component;
        private final String variant;
        private final String status;

        public ComponentSample(String component, String variant, String status) {
            this.component = component;
            this.variant = variant;
            this.status = status;
        }

        public String getComponent() {
            return component;
        }

        public String getVariant() {
            return variant;
        }

        public String getStatus() {
            return status;
        }
    }
}
