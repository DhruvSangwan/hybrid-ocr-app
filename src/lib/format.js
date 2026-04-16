export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function buildCombinedText(pages) {
  return pages
    .map((page) => `Page ${page.pageNumber}\n${page.text.trim()}`.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function downloadTextFile(fileName, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const baseName = (fileName || "ocr-output").replace(/\.[^.]+$/, "");
  link.href = url;
  link.download = `${baseName}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadPdfFile(fileName, bytes) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const baseName = (fileName || "ocr-output").replace(/\.[^.]+$/, "");
  link.href = url;
  link.download = `${baseName}-ocr.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
