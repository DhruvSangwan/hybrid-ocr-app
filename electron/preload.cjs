const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  isElectron: () => true,
  saveProcessedPdf: (arrayBuffer, suggestedName) => ipcRenderer.invoke("desktop:save-pdf", arrayBuffer, suggestedName),
});
