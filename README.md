# Hybrid OCR Platform

A hybrid OCR system that combines **browser-based OCR** and a **high-quality native OCR pipeline** to deliver fast, scalable, and accurate document digitization.

---

## 🚀 Features

### 🌐 Browser OCR (Instant Mode)

* No installation required
* Uses Tesseract.js (WebAssembly-based OCR)
* Suitable for small PDFs
* Outputs searchable text and basic PDFs

---

### 💻 Desktop OCR (Power Mode)

* High-quality OCR using a Python-based pipeline (OCRmyPDF)
* Built on:

  * Tesseract (text recognition)
  * Ghostscript (PDF processing & reconstruction)
* Preserves layout, formatting, and structure
* Handles large PDFs efficiently
* Runs locally for privacy and performance

---

## 🧠 Architecture

```text
Frontend (React)
   ├── Browser OCR (Tesseract.js)
   └── Desktop OCR (Electron)
            ↓
   Local OCR pipeline (Python + Tesseract + Ghostscript)
            ↓
     Searchable, layout-preserved PDF
```

---

## 📦 Desktop App Installation

1. Download the desktop app from Releases
2. Extract the ZIP file completely
3. Open the folder
4. Run `Hybrid OCR Desktop.exe`

---

## 🖥️ Web App Usage

1. Upload a PDF
2. If the file is small → processed in browser
3. If the file is large → use desktop app for best results
4. Download:

   * Extracted text
   * Searchable PDF

---

## ⚠️ Notes

* Browser OCR is fast but may have lower accuracy and poor layout retention
* Desktop OCR uses a full document processing pipeline for significantly better results
* All processing is done locally — no file is uploaded to external servers

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS

### Browser OCR

* Tesseract.js
* pdf.js

### Desktop Application

* Electron
* Node.js (Express server)

### OCR Pipeline

* OCRmyPDF (Python-based OCR orchestration)
* Tesseract OCR engine
* Ghostscript (PDF rendering and optimization)

---

## 📌 Future Improvements

* Multi-language OCR support
* Better preprocessing in browser OCR (denoising, thresholding)
* Page-wise progress tracking
* Cross-platform desktop builds (macOS, Linux)
* Optional cloud processing for heavy workloads

---

## 👤 Author

Dhruv Sangwan

---

## ⭐ Why this project stands out

* Hybrid architecture (Web + Native processing)
* Local-first design (privacy-focused, no server cost)
* Combines frontend, backend, and system-level integration
* Real-world problem solving (large document OCR at scale)
