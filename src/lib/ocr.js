import Tesseract from "tesseract.js";
import { PDFDocument } from "pdf-lib";
import { loadPdfDocument, renderPdfPageToCanvas } from "./pdf.js";

let workerPromise = null;
let activeLanguage = null;

async function terminateExistingWorker() {
  if (!workerPromise) {
    return;
  }

  const worker = await workerPromise;
  await worker.terminate();
  workerPromise = null;
  activeLanguage = null;
}

export async function getWorker(language, onProgress, totalPages) {
  if (workerPromise && activeLanguage === language) {
    return workerPromise;
  }

  await terminateExistingWorker();
  activeLanguage = language;

  workerPromise = Tesseract.createWorker(language, 1, {
    logger: (message) => {
      const progress = typeof message.progress === "number" ? message.progress : 0;
      const label = message.status
        ? message.status.replace(/^\w/, (char) => char.toUpperCase())
        : "Preparing OCR";

      onProgress?.({
        progress: Math.round(progress * Math.max(6, 18 / Math.max(totalPages, 1))),
        label: `${label}...`,
      });
    },
  });

  return workerPromise;
}

export async function processPdfInBrowser({ file, language = "eng", onProgress }) {
  await getWorker(language, onProgress, 1);

  const pdf = await loadPdfDocument(file);
  const totalPages = pdf.numPages;
  const pageResults = [];
  const pdfParts = [];

  const reusableWorker = await getWorker(language, onProgress, totalPages);

  for (let index = 0; index < totalPages; index += 1) {
    const pageNumber = index + 1;
    const canvas = await renderPdfPageToCanvas(pdf, pageNumber);

    onProgress?.({
      progress: Math.round((index / totalPages) * 100),
      label: `Running OCR on page ${pageNumber} of ${totalPages}...`,
    });

    const result = await reusableWorker.recognize(canvas, {}, { text: true, pdf: true });

    pageResults.push({
      pageNumber,
      text: result.data.text || "",
    });
    pdfParts.push(normalizePdfBytes(result.data.pdf));

    onProgress?.({
      progress: Math.round(((index + 1) / totalPages) * 100),
      label: `Finished page ${pageNumber} of ${totalPages}.`,
    });
  }

  return {
    pages: pageResults,
    pdfBytes: totalPages === 1 ? pdfParts[0] : await mergePdfPages(pdfParts),
  };
}

export async function disposeOcrWorker() {
  await terminateExistingWorker();
}

function normalizePdfBytes(pdfData) {
  if (!pdfData) {
    throw new Error("OCR engine did not return PDF output.");
  }

  if (pdfData instanceof Uint8Array) {
    return pdfData;
  }

  if (pdfData instanceof ArrayBuffer) {
    return new Uint8Array(pdfData);
  }

  if (typeof pdfData === "string") {
    const cleaned = pdfData.includes(",") ? pdfData.split(",").pop() : pdfData;
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  throw new Error("Unsupported OCR PDF output format.");
}

async function mergePdfPages(pdfByteParts) {
  const merged = await PDFDocument.create();

  for (const part of pdfByteParts) {
    const srcDoc = await PDFDocument.load(part);
    const copiedPages = await merged.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => merged.addPage(page));
  }

  return merged.save();
}
