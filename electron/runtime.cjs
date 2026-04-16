const fs = require("node:fs");
const path = require("node:path");

function findFileRecursive(rootDir, fileName) {
  if (!rootDir || !fs.existsSync(rootDir)) {
    return null;
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
      return fullPath;
    }

    if (entry.isDirectory()) {
      const nested = findFileRecursive(fullPath, fileName);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function buildRuntimeConfig({ isPackaged, resourcesPath }) {
  const runtimeRoot = isPackaged ? path.join(resourcesPath, "runtime") : null;
  const pythonRoot = isPackaged ? path.join(runtimeRoot, "python") : "C:\\Python313";
  const tesseractRoot = isPackaged ? path.join(runtimeRoot, "Tesseract-OCR") : "C:\\Program Files\\Tesseract-OCR";
  const ghostscriptRoot = isPackaged ? path.join(runtimeRoot, "gs") : "C:\\Program Files\\gs";
  const pythonExe = path.join(pythonRoot, "python.exe");
  const pythonScripts = path.join(pythonRoot, "Scripts");
  const tesseractExe = path.join(tesseractRoot, "tesseract.exe");
  const ghostscriptExe = findFileRecursive(ghostscriptRoot, "gswin64c.exe");
  const missing = [];

  if (!fs.existsSync(pythonExe)) {
    missing.push("python");
  }

  if (!fs.existsSync(tesseractExe)) {
    missing.push("tesseract");
  }

  if (!ghostscriptExe || !fs.existsSync(ghostscriptExe)) {
    missing.push("ghostscript");
  }

  const envPathEntries = [
    pythonScripts,
    pythonRoot,
    tesseractRoot,
    ghostscriptExe ? path.dirname(ghostscriptExe) : null,
    process.env.PATH || "",
  ].filter(Boolean);

  return {
    pythonRoot,
    pythonExe,
    pythonScripts,
    tesseractRoot,
    tesseractExe,
    ghostscriptRoot,
    ghostscriptExe,
    missing,
    env: {
      ...process.env,
      PATH: envPathEntries.join(path.delimiter),
      PYTHONHOME: pythonRoot,
      PYTHONUTF8: "1",
      TESSDATA_PREFIX: path.join(tesseractRoot, "tessdata"),
    },
  };
}

module.exports = {
  buildRuntimeConfig,
};
