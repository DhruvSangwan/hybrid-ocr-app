export default function FileDropzone({
  dragging,
  disabled,
  fileName,
  error,
  title = "Drag and drop a PDF to process it in-browser.",
  subtitle = "Fast path for short files, desktop recommendation for large batches, and no duplicate OCR logic.",
  hintText = "Click to browse or drop a file here",
  onFileSelect,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}) {
  return (
    <label
      className={[
        "group relative block cursor-pointer overflow-hidden rounded-[2.25rem] border border-dashed p-8 transition duration-200",
        "border-[#cbbda9] bg-[rgba(253,249,243,0.85)] shadow-[0_28px_80px_rgba(45,47,39,0.08)] backdrop-blur",
        "hover:-translate-y-1 hover:border-[#5b6b5d] dark:border-[#5d655f] dark:bg-[rgba(23,31,28,0.82)] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]",
        dragging ? "border-[#5b6b5d] bg-[rgba(244,238,226,0.95)] dark:bg-[rgba(33,43,39,0.92)]" : "",
        disabled ? "cursor-not-allowed opacity-70" : "",
      ].join(" ")}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(90,107,93,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(138,106,63,0.10),transparent_26%),linear-gradient(180deg,rgba(255,252,247,0.42),transparent)] opacity-90" />

      <div className="relative flex min-h-64 flex-col items-center justify-center text-center">
        <p className="max-w-2xl font-serif text-3xl font-semibold tracking-tight text-[#223128] dark:text-[#f3efe6]">
          {title}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d6054] dark:text-[#cfd5ca]">
          {subtitle}
        </p>

        <div className="mt-6 inline-flex rounded-full border border-[#d4c8b7] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[#556156] dark:border-[#546058] dark:bg-[rgba(31,39,36,0.8)] dark:text-[#dbe2d7]">
          {fileName ? `Selected: ${fileName}` : hintText}
        </div>

        {error ? (
          <p className="mt-4 text-sm font-medium text-rose-700 dark:text-rose-300">{error}</p>
        ) : null}
      </div>
    </label>
  );
}
