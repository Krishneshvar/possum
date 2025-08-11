import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { startServer } from './backend/server.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const isDev = !app.isPackaged;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'dist/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL(`${process.env.VITE_BASE_URL}${process.env.VITE_UI_PORT}`);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../app/dist/index.html'));
  }
}

ipcMain.handle('ping', async () => {
  return 'pong';
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
