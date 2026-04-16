export default function TextPreview({
  text,
  eyebrow = "Text preview",
  title = "Combined OCR output",
  emptyText = "Extracted text will appear here after processing.",
}) {
  return (
    <section className="rounded-[2rem] border border-[#d3c7b7] bg-[rgba(255,252,247,0.72)] p-6 shadow-[0_20px_60px_rgba(45,47,39,0.07)] backdrop-blur dark:border-[#4f5953] dark:bg-[rgba(24,32,29,0.74)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.38)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#6f745f] dark:text-[#c6d0c6]">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#223128] dark:text-[#f3efe6]">
            {title}
          </h2>
        </div>
      </div>

      <div className="mt-5 min-h-80 rounded-[1.5rem] border border-[#ddd2c3] bg-[rgba(255,255,255,0.74)] p-5 text-sm leading-7 text-[#36443d] dark:border-[#556058] dark:bg-[rgba(30,38,35,0.82)] dark:text-[#eef1ec]">
        {text ? (
          <pre className="whitespace-pre-wrap font-sans">{text}</pre>
        ) : (
          <p className="text-[#727567] dark:text-[#bcc5bc]">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
