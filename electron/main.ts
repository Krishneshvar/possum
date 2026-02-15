import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import { startServer } from './backend/server.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { printBillHtml } from './print/printController.js'; // Converted to TS but imports via .js in TS with allowJs?
// Actually printController is now .ts.
// TS to TS import should be without extension or with .js if module: NodeNext.
// Since we use NodeNext, we should use .js extension in import path even for .ts files.
import { printInvoice, getPrinters } from './backend/services/printService.js';
import fs from 'fs/promises';

dotenv.config();
const isDev = !app.isPackaged;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Adjusted for dist structure?
      // If we compile electron/main.ts to electron/dist/main.js
      // and electron/preload.ts to electron/dist/preload.js
      // then they are in the same dir.
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../app/dist/index.html'));
  }
}

ipcMain.handle('ping', async () => {
  return 'pong';
});

ipcMain.handle('print-bill', printBillHtml);

ipcMain.handle('print-invoice', async (event: IpcMainInvokeEvent, invoiceId: number) => {
    return printInvoice(invoiceId);
});

ipcMain.handle('get-printers', async () => {
    return getPrinters();
});

ipcMain.handle('save-bill-settings', async (event: IpcMainInvokeEvent, settings: any) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'bill-settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
});

ipcMain.handle('get-bill-settings', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'bill-settings.json');
    const data = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null; // Return null if no settings saved yet
  }
});

ipcMain.handle('save-general-settings', async (event: IpcMainInvokeEvent, settings: any) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'general-settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Failed to save general settings:', error);
    throw error;
  }
});

ipcMain.handle('get-general-settings', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'general-settings.json');
    const data = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
});

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
