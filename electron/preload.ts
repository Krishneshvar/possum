import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  printBill: (html: string) => ipcRenderer.invoke('print-bill', { html }),
  printInvoice: (invoiceId: number) => ipcRenderer.invoke('print-invoice', invoiceId),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  saveBillSettings: (settings: any) => ipcRenderer.invoke('save-bill-settings', settings),
  getBillSettings: () => ipcRenderer.invoke('get-bill-settings'),
  saveGeneralSettings: (settings: any) => ipcRenderer.invoke('save-general-settings', settings),
  getGeneralSettings: () => ipcRenderer.invoke('get-general-settings')
});
