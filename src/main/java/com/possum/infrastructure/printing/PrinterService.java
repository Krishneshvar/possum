package com.possum.infrastructure.printing;

import javafx.application.Platform;
import javafx.concurrent.Worker;
import javafx.print.*;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;

import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

public final class PrinterService {

    public List<String> listPrinters() {
        return Printer.getAllPrinters().stream()
                .map(Printer::getName)
                .collect(Collectors.toList());
    }

    public CompletableFuture<Boolean> printInvoice(String htmlContent) {
        return printInvoice(htmlContent, null, "80mm");
    }

    public CompletableFuture<Boolean> printInvoice(String htmlContent, String printerName) {
        return printInvoice(htmlContent, printerName, "80mm");
    }

    public CompletableFuture<Boolean> printInvoice(String htmlContent, String printerName, String paperWidth) {
        Objects.requireNonNull(htmlContent, "htmlContent must not be null");

        CompletableFuture<Boolean> future = new CompletableFuture<>();

        Platform.runLater(() -> {
            try {
                WebView webView = new WebView();
                WebEngine engine = webView.getEngine();

                engine.getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
                    if (newState == Worker.State.SUCCEEDED) {
                        try {
                            Printer printer = null;
                            if (printerName != null) {
                                printer = findPrinterByName(printerName);
                            }
                            if (printer == null) {
                                printer = Printer.getDefaultPrinter();
                            }

                            PrinterJob job = PrinterJob.createPrinterJob(printer);
                            if (job == null) {
                                future.complete(false);
                                return;
                            }

                            PageLayout pageLayout = createPageLayout(printer, paperWidth);
                            job.getJobSettings().setPageLayout(pageLayout);

                            webView.setPrefSize(pageLayout.getPrintableWidth(), pageLayout.getPrintableHeight());

                            boolean success = job.printPage(webView) && job.endJob();
                            future.complete(success);
                        } catch (Exception ex) {
                            future.completeExceptionally(ex);
                        }
                    } else if (newState == Worker.State.FAILED) {
                        future.completeExceptionally(new IllegalStateException("Failed to load HTML content"));
                    }
                });

                engine.loadContent(htmlContent);
            } catch (Exception ex) {
                future.completeExceptionally(ex);
            }
        });

        return future;
    }

    private PageLayout createPageLayout(Printer printer, String paperWidth) {
        double targetWidth = paperWidth.equals("58mm") ? 164.4 : 226.8; // 58mm = 164.4pt, 80mm = 226.8pt
        
        Paper bestPaper = printer.getPrinterAttributes().getSupportedPapers().stream()
                .filter(p -> Math.abs(p.getWidth() - targetWidth) < 10)
                .findFirst()
                .orElse(printer.getPrinterAttributes().getDefaultPaper());

        return printer.createPageLayout(
            bestPaper,
            PageOrientation.PORTRAIT,
            0, 0, 0, 0 // No margins for thermal printing
        );
    }

    private Printer findPrinterByName(String name) {
        return Printer.getAllPrinters().stream()
                .filter(p -> p.getName().equals(name))
                .findFirst()
                .orElse(null);
    }
}
