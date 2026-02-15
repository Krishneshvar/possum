import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  printBill: (html: string, token: string) => ipcRenderer.invoke('print-bill', { html, token }),
  printInvoice: (invoiceId: number, token: string) => ipcRenderer.invoke('print-invoice', { invoiceId, token }),
  getPrinters: (token: string) => ipcRenderer.invoke('get-printers', token),
  saveBillSettings: (settings: any, token: string) => ipcRenderer.invoke('save-bill-settings', { settings, token }),
  getBillSettings: (token: string) => ipcRenderer.invoke('get-bill-settings', token),
  saveGeneralSettings: (settings: any, token: string) => ipcRenderer.invoke('save-general-settings', { settings, token }),
  getGeneralSettings: (token: string) => ipcRenderer.invoke('get-general-settings', token)
});
