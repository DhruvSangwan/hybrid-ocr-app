export default function ProgressPanel({
  progress,
  status,
  isProcessing,
  activeTitle = "Processing in browser",
  idleTitle = "Waiting to process",
  indeterminate = false,
}) {
  return (
    <section className="rounded-[2rem] border border-[#d3c7b7] bg-[rgba(255,252,247,0.72)] p-6 shadow-[0_20px_60px_rgba(45,47,39,0.07)] backdrop-blur dark:border-[#4f5953] dark:bg-[rgba(24,32,29,0.74)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.38)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#6f745f] dark:text-[#c6d0c6]">
            Progress
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#223128] dark:text-[#f3efe6]">
            {isProcessing ? activeTitle : idleTitle}
          </h2>
        </div>
        <div className="rounded-full border border-[#d8cdbc] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-semibold text-[#405047] dark:border-[#556058] dark:bg-[rgba(30,38,35,0.82)] dark:text-[#eef1ec]">
          {progress}%
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#d8d4c8] dark:bg-[#37443e]">
        <div
          className={[
            "h-full rounded-full bg-[linear-gradient(90deg,#556b5d,#8a6a3f)] transition-all duration-300",
            indeterminate ? "animate-pulse" : "",
          ].join(" ")}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-4 text-sm leading-7 text-[#5f6257] dark:text-[#d0d7ce]">{status}</p>
    </section>
  );
}
