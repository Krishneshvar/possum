
import { BrowserWindow, ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { printBillHtml } from '../../print/printController.js';
import { renderBill, DEFAULT_BILL_SCHEMA, RenderData, BillSchema } from '../utils/billRenderer.js';
import * as saleService from '../modules/sales/sale.service.js';

// Helper to get settings path
const getUserDataPath = () => app.getPath('userData');

export async function getPrinters(): Promise<Electron.PrinterInfo[]> {
    // We need a window to call getPrintersAsync
    // We can use the focused window or create a temp one
    const wins = BrowserWindow.getAllWindows();
    const win = wins.length > 0 ? wins[0] : null;

    if (win) {
        return await win.webContents.getPrintersAsync();
    }

    // If no window, we can't get printers easily in Electron Main without one
    // But printBillHtml creates a window.
    // Let's create a temp window if needed, but it's expensive.
    // Usually the main window is open.
    return [];
}

export async function printInvoice(invoiceId: number): Promise<{ success: boolean }> {
    try {
        console.log(`[PrintService] Printing invoice ID: ${invoiceId}`);

        // 1. Fetch Invoice Data
        const sale: any = saleService.getSale(invoiceId); // saleService is JS/any for now
        if (!sale) {
            throw new Error(`Invoice with ID ${invoiceId} not found.`);
        }

        // 2. Fetch Settings
        let billSettings: BillSchema = DEFAULT_BILL_SCHEMA;
        try {
            const settingsPath = path.join(getUserDataPath(), 'bill-settings.json');
            const settingsData = await fs.readFile(settingsPath, 'utf8');
            const savedSettings = JSON.parse(settingsData);
            billSettings = { ...DEFAULT_BILL_SCHEMA, ...savedSettings };
        } catch (err: any) {
            console.warn('[PrintService] Could not load bill settings, using default.', err.message);
        }

        let generalSettings: any = { currency: '₹' };
        try {
            const generalSettingsPath = path.join(getUserDataPath(), 'general-settings.json');
            const generalData = await fs.readFile(generalSettingsPath, 'utf8');
            generalSettings = { ...generalSettings, ...JSON.parse(generalData) };
        } catch (err: any) {
            console.warn('[PrintService] Could not load general settings, using default.', err.message);
        }

        // 3. Prepare Data for Renderer
        const items = sale.items.map((item: any) => {
            const variantText = item.variant_name && item.variant_name !== 'Default' ? ` (${item.variant_name})` : '';
            return {
                name: `${item.product_name}${variantText}`,
                qty: item.quantity,
                price: item.price_per_unit,
                // We use (Price * Qty) - Discount + Tax?
                // Or just (Price * Qty) - Discount?
                // The renderer just displays what we give.
                // Usually line total is (Price * Qty) - Discount. Tax is separate or included based on logic.
                // Let's assume inclusive for display simplicity if we don't know.
                // But wait, sale.total_amount matches the sum?
                total: (item.price_per_unit * item.quantity) - (item.discount_amount || 0)
            };
        });

        // Calculate subtotal from items to ensure consistency
        const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);

        const renderData: RenderData = {
            store: {
                // These will be overridden by billSettings sections if present
                name: 'Store Name',
                address: 'Store Address',
                phone: '',
                gst: ''
            },
            bill: {
                billNo: sale.invoice_number,
                date: sale.sale_date,
                cashier: sale.cashier_name || 'Admin',
                customer: sale.customer_name || 'Walk-in',
                subtotal: calculatedSubtotal,
                tax: sale.total_tax,
                discount: sale.discount,
                total: sale.total_amount,
                totalItems: items.reduce((acc: number, item: any) => acc + item.qty, 0)
            },
            items: items,
            currency: generalSettings.currency
        };

        // 4. Generate HTML
        const html = renderBill(renderData, billSettings);

        // 5. Determine Printer
        let printerName: string | null = null;
        if (generalSettings.defaultPrinter) {
            printerName = generalSettings.defaultPrinter;
        }

        // 6. Print
        await printBillHtml(null, { html, printerName });

        return { success: true };

    } catch (error) {
        console.error('[PrintService] Error printing invoice:', error);
        throw error;
    }
}
