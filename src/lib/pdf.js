import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function loadPdfDocument(file) {
  const pdfBytes = new Uint8Array(await file.arrayBuffer());
  return pdfjsLib.getDocument({ data: pdfBytes }).promise;
}

export async function getPdfPageCount(file) {
  const pdf = await loadPdfDocument(file);
  return pdf.numPages;
}

export async function renderPdfPageToCanvas(pdf, pageNumber, scale = 1.8) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}
