import { BrowserWindow, IpcMainInvokeEvent } from 'electron';

export async function printBillHtml(event: IpcMainInvokeEvent | null, { html, printerName }: { html: string; printerName?: string | null }): Promise<{ success: boolean }> {
    const win = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    try {
        // Encoded HTML to data URL
        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
        await win.loadURL(dataUrl);

        const options: Electron.WebContentsPrintOptions = {
            silent: true,
            printBackground: false,
            color: false,
            margins: {
                marginType: 'none'
            }
        };

        if (printerName) {
            options.deviceName = printerName;
        }

        return new Promise((resolve, reject) => {
            // Small delay to ensure rendering is complete
            setTimeout(() => {
                win.webContents.print(options, (success, failureReason) => {
                    if (success) {
                        console.log('Print successful');
                        resolve({ success: true });
                    } else {
                        console.error('Print failed:', failureReason);
                        reject(new Error(failureReason));
                    }
                    if (!win.isDestroyed()) {
                        win.close();
                    }
                });
            }, 500);
        });

    } catch (error) {
        console.error('Print error:', error);
        if (!win.isDestroyed()) {
            win.close();
        }
        throw error;
    }
}
