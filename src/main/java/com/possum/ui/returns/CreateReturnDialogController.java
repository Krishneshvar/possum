package com.possum.ui.returns;

import com.possum.application.auth.AuthContext;
import com.possum.application.returns.ReturnsService;
import com.possum.application.returns.dto.CreateReturnItemRequest;
import com.possum.application.returns.dto.CreateReturnRequest;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.dto.SaleResponse;
import com.possum.domain.model.Sale;
import com.possum.domain.model.SaleItem;
import com.possum.persistence.repositories.interfaces.SalesRepository;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.navigation.Parameterizable;
import javafx.application.Platform;
import javafx.beans.binding.Bindings;
import javafx.beans.property.BooleanProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public class CreateReturnDialogController implements Parameterizable {

    @FXML private TextField saleInput;
    @FXML private Button findSaleButton;
    @FXML private VBox saleDetailsArea;
    @FXML private Label saleIdLabel;
    @FXML private Label invoiceLabel;
    @FXML private Label customerLabel;
    
    @FXML private HBox refundSummaryCard;
    @FXML private Label totalRefundLabel;
    @FXML private Label itemsSelectedLabel;
    
    @FXML private VBox itemsListContainer;
    @FXML private TextArea reasonArea;
    @FXML private Button submitButton;
    @FXML private Button cancelButton;

    private final SalesService salesService;
    private final SalesRepository salesRepository;
    private final ReturnsService returnsService;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    private Sale currentSale;
    private SaleResponse saleDetails;
    private final List<ReturnItemRow> itemRows = new ArrayList<>();
    
    public interface OnSuccessCallback {
        void onSuccess();
    }
    
    private OnSuccessCallback onSuccess;

    public CreateReturnDialogController(SalesService salesService, SalesRepository salesRepository, ReturnsService returnsService) {
        this.salesService = salesService;
        this.salesRepository = salesRepository;
        this.returnsService = returnsService;
    }

    @FXML
    public void initialize() {
        saleDetailsArea.setVisible(false);
        submitButton.setDisable(true);
        totalRefundLabel.setText(currencyFormat.format(BigDecimal.ZERO));
        itemsSelectedLabel.setText("0 items selected");

        saleInput.setOnAction(e -> handleFindSale());
        findSaleButton.setOnAction(e -> handleFindSale());
        
        cancelButton.setOnAction(e -> ((Stage)cancelButton.getScene().getWindow()).close());
    }

    @Override
    public void setParameters(Map<String, Object> params) {
        if (params != null && params.containsKey("invoiceNumber")) {
            String inv = (String) params.get("invoiceNumber");
            saleInput.setText(inv);
            Platform.runLater(this::handleFindSale);
        }
    }

    public void setOnSuccess(OnSuccessCallback callback) {
        this.onSuccess = callback;
    }

    private void handleFindSale() {
        String input = saleInput.getText().trim();
        if (input.isEmpty()) return;

        try {
            Optional<Sale> sale;
            if (input.startsWith("INV-")) {
                sale = salesRepository.findSaleByInvoiceNumber(input);
            } else {
                sale = salesRepository.findSaleById(Long.parseLong(input));
            }

            sale.ifPresentOrElse(this::loadSaleDetails, () -> NotificationService.error("Sale not found"));
        } catch (NumberFormatException e) {
            NotificationService.error("Invalid ID format");
        }
    }

    private void loadSaleDetails(Sale sale) {
        this.currentSale = sale;
        this.saleDetails = salesService.getSaleDetails(sale.id());
        
        invoiceLabel.setText("#" + sale.invoiceNumber());
        saleIdLabel.setText("ID: " + sale.id());
        customerLabel.setText(sale.customerName() != null ? sale.customerName() : "Walk-in Customer");
        
        saleDetailsArea.setVisible(true);
        renderItemsList();
    }

    private void renderItemsList() {
        itemsListContainer.getChildren().clear();
        itemRows.clear();

        for (SaleItem item : saleDetails.items()) {
            int available = item.quantity() - (item.returnedQuantity() != null ? item.returnedQuantity() : 0);
            if (available <= 0) continue;

            ReturnItemRow row = new ReturnItemRow(item, available);
            itemRows.add(row);
            itemsListContainer.getChildren().add(row.node);
        }
    }

    private void updateSummary() {
        BigDecimal totalRefund = BigDecimal.ZERO;
        int selectedCount = 0;

        for (ReturnItemRow row : itemRows) {
            if (row.isSelected()) {
                selectedCount++;
                totalRefund = totalRefund.add(row.getRefundAmount());
            }
        }

        totalRefundLabel.setText(currencyFormat.format(totalRefund));
        itemsSelectedLabel.setText(selectedCount + " items selected");
        submitButton.setDisable(selectedCount == 0);
    }

    @FXML
    private void handleSubmit() {
        String reason = reasonArea.getText().trim();
        if (reason.isEmpty()) {
            NotificationService.error("Reason is required");
            return;
        }

        List<CreateReturnItemRequest> items = new ArrayList<>();
        for (ReturnItemRow row : itemRows) {
            if (row.isSelected()) {
                items.add(new CreateReturnItemRequest(row.item.id(), row.getQuantity()));
            }
        }

        try {
            CreateReturnRequest request = new CreateReturnRequest(
                currentSale.id(),
                items,
                reason,
                AuthContext.getCurrentUser().id()
            );

            returnsService.createReturn(request);
            NotificationService.success("Return processed successfully");
            if (onSuccess != null) onSuccess.onSuccess();
            ((Stage)submitButton.getScene().getWindow()).close();
        } catch (Exception e) {
            NotificationService.error("Return failed: " + e.getMessage());
        }
    }

    private class ReturnItemRow {
        final SaleItem item;
        final int maxQty;
        final VBox node;
        final CheckBox checkBox;
        final Spinner<Integer> qtySpinner;
        final Label lineTotalLabel;

        ReturnItemRow(SaleItem item, int maxQty) {
            this.item = item;
            this.maxQty = maxQty;

            checkBox = new CheckBox();
            checkBox.setStyle("-fx-font-size: 16px;");

            Label nameLabel = new Label(item.productName());
            nameLabel.setStyle("-fx-font-weight: 700; -fx-font-size: 15px; -fx-text-fill: #1e293b;");
            
            Label variantLabel = new Label(item.variantName() != null ? item.variantName() : "Standard Variant");
            variantLabel.setStyle("-fx-text-fill: #64748b; -fx-font-size: 12px;");
            
            Label detailsLabel = new Label(String.format("Price: %s  |  Available: %d", 
                currencyFormat.format(item.pricePerUnit()), maxQty));
            detailsLabel.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 11px;");

            VBox nameArea = new VBox(2, nameLabel, variantLabel, detailsLabel);
            HBox itemInfo = new HBox(12, checkBox, nameArea);
            itemInfo.setAlignment(javafx.geometry.Pos.CENTER_LEFT);

            qtySpinner = new Spinner<>(1, maxQty, maxQty);
            qtySpinner.setPrefWidth(90);
            qtySpinner.setDisable(true);
            qtySpinner.getStyleClass().add(Spinner.STYLE_CLASS_SPLIT_ARROWS_HORIZONTAL);
            qtySpinner.valueProperty().addListener((obs, old, val) -> updateLineTotal());

            lineTotalLabel = new Label("");
            lineTotalLabel.setStyle("-fx-font-weight: 800; -fx-text-fill: #ef4444; -fx-font-size: 16px;");

            VBox actionArea = new VBox(5, new Label("Qty to Return:"), qtySpinner);
            actionArea.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
            
            HBox mainRow = new HBox(15, itemInfo, new Region(), actionArea, lineTotalLabel);
            mainRow.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
            HBox.setHgrow(mainRow.getChildren().get(1), Priority.ALWAYS);
            
            mainRow.getStyleClass().add("return-item-card");
            mainRow.setStyle("-fx-background-color: #f8fafc; -fx-border-color: #e2e8f0; -fx-border-radius: 8; -fx-background-radius: 8; -fx-padding: 16;");

            checkBox.selectedProperty().addListener((obs, old, selected) -> {
                qtySpinner.setDisable(!selected);
                mainRow.setStyle(selected 
                    ? "-fx-background-color: #fef2f2; -fx-border-color: #fecaca; -fx-border-radius: 8; -fx-background-radius: 8; -fx-padding: 16;" 
                    : "-fx-background-color: #f8fafc; -fx-border-color: #e2e8f0; -fx-border-radius: 8; -fx-background-radius: 8; -fx-padding: 16;");
                updateLineTotal();
                updateSummary();
            });

            this.node = new VBox(mainRow); // Wrapped in VBox for future expansion if needed
            updateLineTotal();
        }

        void updateLineTotal() {
            BigDecimal amount = item.pricePerUnit().multiply(BigDecimal.valueOf(qtySpinner.getValue()));
            lineTotalLabel.setText(isSelected() ? currencyFormat.format(amount) : "");
        }

        boolean isSelected() {
            return checkBox.isSelected();
        }

        int getQuantity() {
            return qtySpinner.getValue();
        }

        BigDecimal getRefundAmount() {
            return item.pricePerUnit().multiply(BigDecimal.valueOf(qtySpinner.getValue()));
        }
    }
}
