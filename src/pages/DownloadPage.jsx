import { Link } from "react-router-dom";

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eee6da_0%,#f7f3eb_44%,#e7dece_100%)] px-4 py-10 text-[#223128] dark:bg-[linear-gradient(180deg,#111815_0%,#17211d_45%,#1d2823_100%)] dark:text-[#f3efe6]">
      <div className="mx-auto max-w-4xl rounded-[2.8rem] border border-[#d3c7b7] bg-[rgba(255,251,245,0.82)] p-8 shadow-[0_35px_100px_rgba(45,47,39,0.10)] backdrop-blur dark:border-[#4f5953] dark:bg-[rgba(24,32,29,0.84)] dark:shadow-[0_35px_100px_rgba(0,0,0,0.42)]">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#6f745f] dark:text-[#c8d0c7]">
          Desktop edition
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Download the desktop build for heavier OCR jobs and cleaner final output.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[#5f6257] dark:text-[#d0d7ce]">
          This page is ready for your downloadable package. Once you zip the release contents or point to the final
          installer, this becomes the handoff page from the web app.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Best for", "Long PDFs and OCRmyPDF quality output"],
            ["Runtime", "Bundled Python, Tesseract, and Ghostscript"],
            ["Delivery", "Connect this page to your zipped desktop build"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[1.6rem] border border-[#d8cdbc] bg-[rgba(255,255,255,0.72)] p-5 dark:border-[#4f5953] dark:bg-[rgba(30,38,35,0.82)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f745f] dark:text-[#bdc7bc]">
                {label}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#314039] dark:text-[#edf0ea]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0/win-unpacked.zip"
            className="inline-flex rounded-full bg-[#24322c] px-5 py-3 text-sm font-semibold text-[#edf0ea] transition hover:-translate-y-0.5 dark:bg-[#edf0e7] dark:text-[#24322c]"
          >
            Download Desktop App
          </a>
          <Link
            to="/"
            className="inline-flex rounded-full border border-[#d8cdbc] bg-[rgba(255,255,255,0.72)] px-5 py-3 text-sm font-semibold text-[#314039] transition hover:-translate-y-0.5 dark:border-[#4f5953] dark:bg-[rgba(30,38,35,0.82)] dark:text-[#edf0ea]"
          >
            Back to OCR app
          </Link>
        </div>
      </div>
    </main>
  );
}
