import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FileDetails from "../components/FileDetails.jsx";
import FileDropzone from "../components/FileDropzone.jsx";
import ProgressPanel from "../components/ProgressPanel.jsx";
import TextPreview from "../components/TextPreview.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { buildCombinedText, downloadPdfFile, downloadTextFile, formatBytes } from "../lib/format.js";
import { disposeOcrWorker, processPdfInBrowser } from "../lib/ocr.js";
import { postDesktopOcrJob, readDesktopStatus } from "../lib/desktopClient.js";
import { getPdfPageCount } from "../lib/pdf.js";

const BROWSER_PAGE_LIMIT = 10;

function getPreferredTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem("hybrid-ocr-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function isElectronDesktop() {
  return Boolean(window.desktopBridge?.isElectron?.());
}

export default function HomePage() {
  const [theme, setTheme] = useState(getPreferredTheme);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Upload a PDF to begin.");
  const [error, setError] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pages, setPages] = useState([]);
  const [webPdfBytes, setWebPdfBytes] = useState(null);
  const [desktopRuntime, setDesktopRuntime] = useState({
    status: "checking",
    missing: [],
    mode: "desktop",
  });
  const [desktopSummary, setDesktopSummary] = useState("");

  const desktopMode = isElectronDesktop();
  const combinedText = useMemo(() => buildCombinedText(pages), [pages]);
  const browserEnabled = pageCount > 0 && pageCount <= BROWSER_PAGE_LIMIT;
  const desktopReady = desktopRuntime.status === "running" && desktopRuntime.missing.length === 0;
  const webCompleted = !desktopMode && !isProcessing && Boolean(webPdfBytes);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("hybrid-ocr-theme", theme);
  }, [theme]);

  useEffect(() => () => {
    disposeOcrWorker().catch(() => {});
  }, []);

  useEffect(() => {
    if (!desktopMode) {
      return undefined;
    }

    let isActive = true;

    async function loadDesktopStatus() {
      try {
        const runtime = await readDesktopStatus();
        if (!isActive) {
          return;
        }

        setDesktopRuntime(runtime);
        if (runtime.missing.length > 0) {
          setError(`Missing desktop dependencies: ${runtime.missing.join(", ")}`);
          setStatus("Desktop runtime needs attention.");
        } else {
          setStatus("Desktop runtime ready. Upload a PDF to start OCR processing.");
        }
      } catch (statusError) {
        if (!isActive) {
          return;
        }

        setDesktopRuntime({
          status: "error",
          missing: ["local server"],
          mode: "desktop",
        });
        setError(statusError.message || "Unable to reach the local OCR server.");
        setStatus("Desktop runtime unavailable.");
      }
    }

    loadDesktopStatus();
    return () => {
      isActive = false;
    };
  }, [desktopMode]);

  async function loadFile(file) {
    if (!file) {
      return;
    }

    if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      setError("Please upload a PDF file.");
      return;
    }

    setIsLoadingFile(true);
    setError("");
    setSelectedFile(file);
    setPages([]);
    setWebPdfBytes(null);
    setDesktopSummary("");
    setProgress(0);
    setStatus(desktopMode ? "Preparing desktop OCR job..." : "Loading PDF metadata...");

    try {
      if (desktopMode) {
        setPageCount(0);
        setStatus(`Loaded ${file.name}. Ready for desktop OCR processing.`);
      } else {
        const count = await getPdfPageCount(file);
        setPageCount(count);

        if (count <= BROWSER_PAGE_LIMIT) {
          setStatus(`Loaded ${count} page${count === 1 ? "" : "s"}. Browser OCR is enabled.`);
        } else {
          setStatus("Large file detected. Use Desktop App for better performance.");
        }
      }
    } catch (loadError) {
      setSelectedFile(null);
      setPageCount(0);
      setStatus("Upload a PDF to begin.");
      setError(loadError.message || "Unable to read this PDF.");
    } finally {
      setIsLoadingFile(false);
    }
  }

  async function handleWebProcess() {
    if (!selectedFile || !browserEnabled) {
      return;
    }

    setIsProcessing(true);
    setError("");
    setPages([]);
    setWebPdfBytes(null);

    try {
      const result = await processPdfInBrowser({
        file: selectedFile,
        language: "eng",
        onProgress: ({ progress: nextProgress, label }) => {
          setProgress(nextProgress);
          setStatus(label);
        },
      });

      setPages(result.pages);
      setWebPdfBytes(result.pdfBytes);
      setProgress(100);
      setStatus(
        `OCR complete. Extracted text from ${result.pages.length} page${result.pages.length === 1 ? "" : "s"} and built a searchable PDF.`
      );
    } catch (processingError) {
      setError(processingError.message || "OCR failed.");
      setStatus("Processing stopped.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDesktopProcess() {
    if (!selectedFile || !desktopReady) {
      return;
    }

    setIsProcessing(true);
    setError("");
    setDesktopSummary("");
    setProgress(12);
    setStatus("Uploading PDF to the local OCR server...");

    try {
      const response = await postDesktopOcrJob(selectedFile);
      setProgress(72);
      setStatus("OCRmyPDF finished. Saving processed PDF...");

      const defaultFileName = response.fileName || `${selectedFile.name.replace(/\.pdf$/i, "")}-ocr.pdf`;
      const saved = await window.desktopBridge.saveProcessedPdf(response.bytes, defaultFileName);

      setProgress(100);
      setStatus(saved?.canceled ? "Processing completed. Save was canceled." : "OCR processing completed.");
      setDesktopSummary(
        saved?.canceled
          ? `Processed PDF is ready as ${defaultFileName}, but the save dialog was canceled.`
          : `Processed PDF saved to ${saved.filePath}.`
      );
    } catch (processingError) {
      setProgress(0);
      setError(processingError.message || "Desktop OCR failed.");
      setStatus("Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDownloadText() {
    if (!combinedText) {
      return;
    }

    downloadTextFile(selectedFile?.name, combinedText);
  }

  function handleDownloadPdf() {
    if (!webPdfBytes) {
      return;
    }

    downloadPdfFile(selectedFile?.name, webPdfBytes);
  }

  const detailItems = desktopMode
    ? [
        { key: "name", label: "File name", value: selectedFile?.name ?? "No file loaded" },
        { key: "size", label: "File size", value: selectedFile ? formatBytes(selectedFile.size) : "-" },
        { key: "runtime", label: "Server", value: desktopRuntime.status === "running" ? "localhost:5000" : "Starting" },
        {
          key: "deps",
          label: "Dependencies",
          value: desktopRuntime.missing.length > 0 ? `Missing: ${desktopRuntime.missing.join(", ")}` : "Bundled runtime ready",
        },
      ]
    : undefined;

  const infoItems = desktopMode
    ? [
        "The Electron app starts its own local Express backend for OCR requests.",
        "OCRmyPDF runs through bundled Python, Tesseract, and Ghostscript inside the packaged app.",
        "Processed PDFs are saved locally through the native save dialog.",
      ]
    : [
        "Browser OCR is best for quick files up to ten pages.",
        "Browser OCR can export a searchable PDF, but it will not preserve layout and quality as well as OCRmyPDF desktop.",
        "Drag, process, preview, then switch to desktop when the document quality or formatting matters.",
      ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe7da_0%,#f7f3ea_42%,#e8e0d0_100%)] text-[#223128] transition-colors dark:bg-[linear-gradient(180deg,#111815_0%,#17211d_46%,#1d2823_100%)] dark:text-[#f3efe6]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.7rem] border border-[#d3c7b7] bg-[rgba(255,251,245,0.74)] p-6 shadow-[0_40px_110px_rgba(45,47,39,0.10)] backdrop-blur dark:border-[#4e5952] dark:bg-[rgba(20,29,26,0.84)] dark:shadow-[0_40px_110px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(85,107,93,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(138,106,63,0.10),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.20),transparent)] dark:bg-[radial-gradient(circle_at_top_left,rgba(109,131,117,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(138,106,63,0.10),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

          <div className="relative mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#6f745f] dark:text-[#c8d0c7]">
                {desktopMode ? "Hybrid OCR desktop" : "Refined document OCR"}
              </p>
              <h1 className="mt-4 max-w-4xl font-serif text-5xl font-semibold leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">
                {desktopMode
                  ? "Desktop-grade OCR in a calmer, more polished shell."
                  : "Elegant browser OCR for quick scans, with a better-quality desktop path when the job matters."}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#5f6257] dark:text-[#d0d7ce]">
                {desktopMode
                  ? "Your Tailwind UI now sits on top of OCRmyPDF, a local Express backend, and bundled runtime dependencies so the desktop experience feels premium but stays practical."
                  : "Process shorter PDFs right in the browser, preview extracted text instantly, and move to the desktop edition for more dependable quality on larger or more important files."}
              </p>
            </div>

            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
            />
          </div>

          <div className="relative mb-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[2rem] border border-[#d6cbbe] bg-[rgba(255,255,255,0.52)] p-6 dark:border-[#4f5953] dark:bg-[rgba(28,36,33,0.60)]">
              <div className="flex flex-wrap gap-3">
                {(desktopMode
                  ? ["PDF upload", "OCRmyPDF", "Local server", "Bundled runtime"]
                  : ["Quick browser OCR", "Text preview", "Large file handoff", "Desktop quality"]
                ).map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#dad0c3] bg-[rgba(255,255,255,0.76)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#5a625a] dark:border-[#53605a] dark:bg-[rgba(31,39,36,0.82)] dark:text-[#d6ddd5]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {desktopMode ? (
              <div className="rounded-[2rem] border border-[#455149] bg-[#24322c] p-6 text-[#edf0ea] shadow-[0_18px_45px_rgba(24,35,30,0.28)] dark:border-[#617168] dark:bg-[#edf0e7] dark:text-[#24322c] dark:shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c3cec4] dark:text-[#6e735f]">
                  Runtime
                </p>
                <h2 className="mt-3 font-serif text-3xl font-semibold">Built for self-contained OCR.</h2>
                <p className="mt-3 text-sm leading-7 text-[#d7ddd6] dark:text-[#536256]">
                  The packaged desktop app carries its own OCR stack so end users do not need separate installations.
                </p>
              </div>
            ) : (
              <Link
                to="/download"
                className="block rounded-[2rem] border border-[#455149] bg-[#24322c] p-6 text-[#edf0ea] shadow-[0_18px_45px_rgba(24,35,30,0.28)] transition hover:-translate-y-1 dark:border-[#617168] dark:bg-[#edf0e7] dark:text-[#24322c] dark:shadow-none"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c3cec4] dark:text-[#6e735f]">
                  Better quality
                </p>
                <h2 className="mt-3 font-serif text-3xl font-semibold">Need more dependable OCR?</h2>
                <p className="mt-3 text-sm leading-7 text-[#d7ddd6] dark:text-[#536256]">
                  Download the desktop app for larger files, OCRmyPDF processing, and stronger output quality.
                </p>
                <span className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold dark:border-[#8b8c7c]/30">
                  Go to download page
                </span>
              </Link>
            )}
          </div>

          <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6">
              <div className="rounded-[2.4rem] border border-[#d3c7b7] bg-[rgba(255,252,247,0.66)] p-6 shadow-[0_24px_70px_rgba(45,47,39,0.08)] backdrop-blur dark:border-[#4f5953] dark:bg-[rgba(24,32,29,0.76)] sm:p-8">
                <FileDropzone
                  dragging={dragging}
                  disabled={isLoadingFile || isProcessing}
                  fileName={selectedFile?.name}
                  error={error}
                  title={
                    desktopMode
                      ? "Drop in a PDF and let the desktop runtime handle the heavy lifting."
                      : "Drop in a PDF for a quick browser pass, or move to desktop for richer OCR quality."
                  }
                  subtitle={
                    desktopMode
                      ? "The desktop app routes your file through its local backend, runs OCRmyPDF, and returns a clean searchable PDF."
                      : "This browser mode stays intentionally lightweight. For better quality on larger or more important files, use the desktop edition."
                  }
                  hintText="Click to browse or drop a PDF here"
                  onFileSelect={loadFile}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDragging(false);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    loadFile(event.dataTransfer.files?.[0] ?? null);
                  }}
                />

                <div className="mt-6 flex flex-wrap gap-3">
                  {desktopMode ? (
                    <button
                      type="button"
                      onClick={handleDesktopProcess}
                      disabled={!selectedFile || !desktopReady || isLoadingFile || isProcessing}
                      className="inline-flex rounded-full bg-[#24322c] px-5 py-3 text-sm font-semibold text-[#edf0ea] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#edf0e7] dark:text-[#24322c]"
                    >
                      {isProcessing ? "Processing..." : "Start OCR Processing"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleWebProcess}
                      disabled={!browserEnabled || isLoadingFile || isProcessing}
                      className="inline-flex rounded-full bg-[#24322c] px-5 py-3 text-sm font-semibold text-[#edf0ea] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#edf0e7] dark:text-[#24322c]"
                    >
                      {isProcessing ? "Processing..." : "Process in Browser"}
                    </button>
                  )}

                  {desktopMode ? null : (
                    <Link
                      to="/download"
                      className="inline-flex rounded-full border border-[#d6cbbe] bg-[rgba(255,255,255,0.68)] px-5 py-3 text-sm font-semibold text-[#314039] transition hover:-translate-y-0.5 dark:border-[#4f5953] dark:bg-[rgba(31,39,36,0.74)] dark:text-[#ecf0ea]"
                    >
                      Download Desktop App
                    </Link>
                  )}

                  {desktopMode ? null : (
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={!webPdfBytes || isProcessing}
                      className={[
                        "inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
                        webCompleted
                          ? "border border-[#40594c] bg-[#24322c] text-[#edf0ea] shadow-[0_16px_35px_rgba(36,50,44,0.22)] dark:border-[#d3dbc8] dark:bg-[#edf0e7] dark:text-[#24322c]"
                          : "border border-[#d6cbbe] bg-[rgba(255,255,255,0.68)] text-[#314039] dark:border-[#4f5953] dark:bg-[rgba(31,39,36,0.74)] dark:text-[#ecf0ea]",
                      ].join(" ")}
                    >
                      {webCompleted ? "Download PDF - Ready" : "Download PDF"}
                    </button>
                  )}

                  {desktopMode ? null : (
                    <button
                      type="button"
                      onClick={handleDownloadText}
                      disabled={!combinedText || isProcessing}
                      className="inline-flex rounded-full border border-[#d6cbbe] bg-[rgba(255,255,255,0.68)] px-5 py-3 text-sm font-semibold text-[#314039] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#4f5953] dark:bg-[rgba(31,39,36,0.74)] dark:text-[#ecf0ea]"
                    >
                      Download Text
                    </button>
                  )}
                </div>

                {!desktopMode && pageCount > BROWSER_PAGE_LIMIT ? (
                  <div className="mt-6 rounded-[1.7rem] border border-[#bdb59f] bg-[#ece6d8] px-5 py-4 text-sm font-medium text-[#556156] dark:border-[#526058] dark:bg-[#26342d] dark:text-[#dce4db]">
                    Large file detected. For better quality, steadier performance, and better layout retention, use the desktop app.
                  </div>
                ) : null}

                {webCompleted ? (
                  <div className="mt-6 rounded-[1.7rem] border border-[#9aac9f] bg-[#e6ece4] px-5 py-4 text-sm font-medium text-[#314039] dark:border-[#5e7267] dark:bg-[#213029] dark:text-[#dfebe1]">
                    Completed. Your searchable PDF is ready to download.
                  </div>
                ) : null}
              </div>

              <TextPreview
                text={desktopMode ? desktopSummary : combinedText}
                eyebrow={desktopMode ? "Job result" : "Text preview"}
                title={desktopMode ? "Processed PDF status" : "Combined OCR output"}
                emptyText={
                  desktopMode
                    ? "The app will show where the processed PDF was saved after OCR finishes."
                    : "Extracted text will appear here after processing."
                }
              />
            </section>

            <section className="space-y-6">
              <FileDetails
                file={selectedFile}
                pageCount={pageCount}
                browserCap={BROWSER_PAGE_LIMIT}
                title={desktopMode ? "Ready for local OCR execution" : "Ready before OCR starts"}
                items={detailItems}
              />

              <ProgressPanel
                progress={progress}
                status={status}
                isProcessing={isProcessing}
                activeTitle={desktopMode ? "Processing with OCRmyPDF" : "Processing in browser"}
                idleTitle={desktopMode ? "Waiting for a desktop OCR job" : "Waiting to process"}
                indeterminate={desktopMode && isProcessing && progress < 100}
              />

              <section className="rounded-[2rem] border border-[#d3c7b7] bg-[rgba(255,252,247,0.72)] p-6 shadow-[0_20px_60px_rgba(45,47,39,0.07)] backdrop-blur dark:border-[#4f5953] dark:bg-[rgba(24,32,29,0.74)]">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#6f745f] dark:text-[#c6d0c6]">
                  {desktopMode ? "Desktop flow" : "Why desktop helps"}
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#223128] dark:text-[#f3efe6]">
                  {desktopMode ? "Minimal interface, heavier OCR engine" : "When quality matters, leave the browser behind"}
                </h2>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-[#5f6257] dark:text-[#d0d7ce]">
                  {infoItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
