const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  printBill: (html) => ipcRenderer.invoke('print-bill', { html }),
  printInvoice: (invoiceId) => ipcRenderer.invoke('print-invoice', invoiceId),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  saveBillSettings: (settings) => ipcRenderer.invoke('save-bill-settings', settings),
  getBillSettings: () => ipcRenderer.invoke('get-bill-settings'),
  saveGeneralSettings: (settings) => ipcRenderer.invoke('save-general-settings', settings),
  getGeneralSettings: () => ipcRenderer.invoke('get-general-settings')
});
