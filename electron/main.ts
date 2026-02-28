import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, Menu } from 'electron';
import path from 'path';
import { startServer } from './backend/server.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { printBillHtml } from './print/printController.js';
import { printInvoice, getPrinters } from './backend/services/printService.js';
import fs from 'fs/promises';
import { getSession } from '../core/index.js';

dotenv.config();
const isDev = !app.isPackaged;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

// Security Middleware Helpers
function requireAuth(token: string) {
  const session = getSession(token);
  if (!session) {
    throw new Error('Unauthorized: Invalid or expired session');
  }
  return session;
}

function requireAdmin(token: string) {
  const session = requireAuth(token);
  // Check if user has 'admin' role or 'settings.manage' permission (if we add it)
  // Using simple role check for now based on seed data
  const roles = session.roles || [];
  if (!roles.includes('admin')) {
    throw new Error('Forbidden: Admin access required');
  }
  return session;
}

ipcMain.handle('ping', async () => {
  return 'pong';
});

// Print Bill (Raw HTML) - Requires Auth
ipcMain.handle('print-bill', async (event: IpcMainInvokeEvent, { html, token }: { html: string; token: string }) => {
  requireAuth(token);
  // printerName handled by controller or settings?
  // main.ts original had printBillHtml directly.
  // We pass html.
  return printBillHtml(event, { html });
});

// Print Invoice - Requires Auth (Passed to Service)
ipcMain.handle('print-invoice', async (event: IpcMainInvokeEvent, { invoiceId, token }: { invoiceId: number; token: string }) => {
  // We pass token to service so it can check granular permissions
  // Note: We need to update printService.ts signature
  return printInvoice(invoiceId, token);
});

ipcMain.handle('get-printers', async (event: IpcMainInvokeEvent, token?: string) => {
  // Require at least being logged in to see printers?
  // Allow without token for login screen? Probably not needed there.
  if (token) requireAuth(token);
  return getPrinters();
});

// Settings - Require Admin
ipcMain.handle('save-bill-settings', async (event: IpcMainInvokeEvent, { settings, token }: { settings: any; token: string }) => {
  try {
    requireAdmin(token);
    const settingsPath = path.join(app.getPath('userData'), 'bill-settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
});

ipcMain.handle('get-bill-settings', async (event: IpcMainInvokeEvent, token?: string) => {
  try {
    // Read-only settings might be allowed for logged in users (e.g. for printing)
    if (token) requireAuth(token);
    const settingsPath = path.join(app.getPath('userData'), 'bill-settings.json');
    const data = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null; // Return null if no settings saved yet
  }
});

ipcMain.handle('save-general-settings', async (event: IpcMainInvokeEvent, { settings, token }: { settings: any; token: string }) => {
  try {
    requireAdmin(token);
    const settingsPath = path.join(app.getPath('userData'), 'general-settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Failed to save general settings:', error);
    throw error;
  }
});

ipcMain.handle('get-general-settings', async (event: IpcMainInvokeEvent, token?: string) => {
  try {
    if (token) requireAuth(token);
    const settingsPath = path.join(app.getPath('userData'), 'general-settings.json');
    const data = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
});

app.whenReady().then(() => {
  startServer();
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
