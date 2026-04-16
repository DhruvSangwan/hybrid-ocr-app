const path = require("node:path");
const fs = require("node:fs/promises");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { startLocalServer } = require("./server.cjs");
const { buildRuntimeConfig } = require("./runtime.cjs");

let backend = null;

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    title: "Hybrid OCR Desktop",
    backgroundColor: "#020617",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  if (app.isPackaged) {
    await window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
    return window;
  }

  await window.loadURL("http://127.0.0.1:5173");
  window.webContents.openDevTools({ mode: "detach" });
  return window;
}

ipcMain.handle("desktop:save-pdf", async (event, arrayBuffer, suggestedName) => {
  const ownerWindow = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(ownerWindow, {
    defaultPath: path.join(app.getPath("downloads"), suggestedName || "processed-ocr.pdf"),
    filters: [{ name: "PDF Document", extensions: ["pdf"] }],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, Buffer.from(arrayBuffer));
  return {
    canceled: false,
    filePath: result.filePath,
  };
});

app.whenReady().then(async () => {
  const runtime = buildRuntimeConfig({
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
  });

  backend = await startLocalServer({
    port: 5000,
    runtime,
  });

  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  if (backend) {
    await backend.close().catch(() => {});
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});
