package com.possum.infrastructure.printing;

import javafx.application.Platform;
import javafx.concurrent.Worker;
import javafx.print.PageLayout;
import javafx.print.Printer;
import javafx.print.PrinterJob;
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
        return printInvoice(htmlContent, null);
    }

    public CompletableFuture<Boolean> printInvoice(String htmlContent, String printerName) {
        Objects.requireNonNull(htmlContent, "htmlContent must not be null");

        CompletableFuture<Boolean> future = new CompletableFuture<>();

        Platform.runLater(() -> {
            try {
                WebView webView = new WebView();
                WebEngine engine = webView.getEngine();

                engine.getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
                    if (newState == Worker.State.SUCCEEDED) {
                        try {
                            PrinterJob job = PrinterJob.createPrinterJob();
                            if (job == null) {
                                future.complete(false);
                                return;
                            }

                            if (printerName != null) {
                                Printer selectedPrinter = findPrinterByName(printerName);
                                if (selectedPrinter != null) {
                                    job = PrinterJob.createPrinterJob(selectedPrinter);
                                }
                            }

                            PageLayout pageLayout = job.getJobSettings().getPageLayout();
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

    private Printer findPrinterByName(String name) {
        return Printer.getAllPrinters().stream()
                .filter(p -> p.getName().equals(name))
                .findFirst()
                .orElse(null);
    }
}
