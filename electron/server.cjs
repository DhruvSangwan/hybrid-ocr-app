const express = require("express");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const multer = require("multer");
const { spawn } = require("node:child_process");

function createTempRoot() {
  const tempRoot = path.join(os.tmpdir(), "hybrid-ocr-desktop");
  fs.mkdirSync(tempRoot, { recursive: true });
  return tempRoot;
}

async function cleanupOldJobs(tempRoot, maxAgeMs = 1000 * 60 * 60 * 6) {
  const entries = await fsp.readdir(tempRoot, { withFileTypes: true }).catch(() => []);
  const now = Date.now();

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory()) {
        return;
      }

      const fullPath = path.join(tempRoot, entry.name);
      const stats = await fsp.stat(fullPath).catch(() => null);
      if (!stats || now - stats.mtimeMs < maxAgeMs) {
        return;
      }

      await fsp.rm(fullPath, { recursive: true, force: true }).catch(() => {});
    })
  );
}

function createUploader(tempRoot) {
  return multer({
    storage: multer.diskStorage({
      destination: async (req, file, callback) => {
        try {
          const jobDir = path.join(tempRoot, crypto.randomUUID());
          await fsp.mkdir(jobDir, { recursive: true });
          req.jobDir = jobDir;
          callback(null, jobDir);
        } catch (error) {
          callback(error);
        }
      },
      filename: (req, file, callback) => {
        callback(null, file.originalname.replace(/[^\w.-]+/g, "_"));
      },
    }),
    limits: {
      fileSize: 100 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
      const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
      callback(isPdf ? null : new Error("Only PDF files are supported."), isPdf);
    },
  });
}

function runOcrmypdf({ runtime, inputPath, outputPath }) {
  return new Promise((resolve, reject) => {
    const child = spawn(runtime.pythonExe, ["-m", "ocrmypdf", inputPath, outputPath], {
      env: runtime.env,
      windowsHide: true,
    });

    let stderr = "";
    let stdout = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }

      reject(new Error(stderr.trim() || stdout.trim() || `OCRmyPDF exited with code ${code}.`));
    });
  });
}

async function startLocalServer({ port, runtime }) {
  const app = express();
  const tempRoot = createTempRoot();
  const upload = createUploader(tempRoot);
  await cleanupOldJobs(tempRoot);

  app.get("/status", (req, res) => {
    res.json({
      status: "running",
      mode: "desktop",
      missing: runtime.missing,
    });
  });

  app.post("/process", upload.single("file"), async (req, res) => {
    const jobDir = req.jobDir;

    try {
      if (runtime.missing.length > 0) {
        res.status(500).json({
          error: `Missing runtime dependencies: ${runtime.missing.join(", ")}`,
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No PDF file was uploaded." });
        return;
      }

      const inputPath = req.file.path;
      const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const outputPath = path.join(jobDir, `${baseName}-ocr.pdf`);

      await runOcrmypdf({
        runtime,
        inputPath,
        outputPath,
      });

      res.setHeader("X-Output-Filename", path.basename(outputPath));
      res.download(outputPath, path.basename(outputPath), async () => {
        await fsp.rm(jobDir, { recursive: true, force: true }).catch(() => {});
      });
    } catch (error) {
      if (jobDir) {
        await fsp.rm(jobDir, { recursive: true, force: true }).catch(() => {});
      }

      res.status(500).json({
        error: error.message || "OCR processing failed.",
      });
    }
  });

  const server = await new Promise((resolve, reject) => {
    const instance = app
      .listen(port, "127.0.0.1", () => resolve(instance))
      .on("error", (error) => reject(error));
  });

  return {
    server,
    tempRoot,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}

module.exports = {
  startLocalServer,
};
