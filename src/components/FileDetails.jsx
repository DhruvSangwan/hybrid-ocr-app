import { formatBytes } from "../lib/format.js";

export default function FileDetails({
  file,
  pageCount,
  browserCap,
  title = "Ready before OCR starts",
  items,
}) {
  const detailItems = items ?? [
    { key: "name", label: "File name", value: file?.name ?? "No file loaded" },
    { key: "size", label: "File size", value: file ? formatBytes(file.size) : "-" },
    { key: "pages", label: "Pages", value: pageCount ? String(pageCount) : "-" },
    {
      key: "mode",
      label: "Processing mode",
      value: pageCount ? (pageCount <= browserCap ? "Browser OCR enabled" : "Desktop app recommended") : "Awaiting file",
    },
  ];

  return (
    <section className="rounded-[2rem] border border-[#d3c7b7] bg-[rgba(255,252,247,0.72)] p-6 shadow-[0_20px_60px_rgba(45,47,39,0.07)] backdrop-blur dark:border-[#4f5953] dark:bg-[rgba(24,32,29,0.74)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.38)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#6f745f] dark:text-[#c6d0c6]">
            File details
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#223128] dark:text-[#f3efe6]">
            {title}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {detailItems.map((item) => (
          <div
            key={item.key}
            className="rounded-[1.5rem] border border-[#ddd2c3] bg-[rgba(255,255,255,0.72)] p-4 dark:border-[#556058] dark:bg-[rgba(30,38,35,0.82)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f745f] dark:text-[#bdc7bc]">
              {item.label}
            </p>
            <p className="mt-2 break-words text-sm font-medium text-[#2f3b34] dark:text-[#f0eee8]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
