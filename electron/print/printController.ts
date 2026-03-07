import { BrowserWindow, IpcMainInvokeEvent, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export async function printBillHtml(event: IpcMainInvokeEvent | null, { html, printerName, paperWidth }: { html: string; printerName?: string | null; paperWidth?: string }): Promise<{ success: boolean }> {
    const win = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    let tempPath: string | null = null;
    try {
        // Write HTML to a temp file to avoid Windows Data URI length limits
        tempPath = path.join(app.getPath('temp'), `print_${Date.now()}_${Math.floor(Math.random() * 1000)}.html`);
        await fs.writeFile(tempPath, html, 'utf-8');
        // Debug: write a copy to desktop so user can verify HTML is correct
        await fs.writeFile(path.join(app.getPath('desktop'), `latest_print_debug.html`), html, 'utf-8');
        await win.loadFile(tempPath);

        // Determine paper width in microns (1mm = 1000 microns)
        // Thermal printers MUST receive the exact paper width — A4 (default) causes blank pages!
        const widthMm = paperWidth === '58mm' ? 58 : 80; // default to 80mm
        const widthMicrons = widthMm * 1000;
        // Height: set large enough for any receipt. Thermal printers cut at content's end.
        const heightMicrons = 2000 * 1000; // 2 meters is more than enough

        const options: Electron.WebContentsPrintOptions = {
            silent: true,
            printBackground: true,
            color: false,
            margins: {
                marginType: 'none'
            },
            pageSize: {
                width: widthMicrons,
                height: heightMicrons
            }
        };

        if (printerName) {
            options.deviceName = printerName;
        }

        return new Promise((resolve, reject) => {
            // Slightly longer delay to ensure rendering is complete before printing
            setTimeout(() => {
                win.webContents.print(options, (success, failureReason) => {
                    // Cleanup temp file
                    if (tempPath) {
                        fs.unlink(tempPath).catch(err => console.error('[PrintController] Failed to cleanup temp file:', err));
                    }

                    if (success) {
                        console.log(`[PrintController] Print successful on ${widthMm}mm paper`);
                        resolve({ success: true });
                    } else {
                        console.error('[PrintController] Print failed:', failureReason);
                        reject(new Error(failureReason));
                    }
                    if (!win.isDestroyed()) {
                        win.close();
                    }
                });
            }, 800);
        });

    } catch (error) {
        console.error('[PrintController] Print error:', error);
        if (tempPath) {
            fs.unlink(tempPath).catch(err => console.error('[PrintController] Failed to cleanup temp file on error:', err));
        }
        if (!win.isDestroyed()) {
            win.close();
        }
        throw error;
    }
}
