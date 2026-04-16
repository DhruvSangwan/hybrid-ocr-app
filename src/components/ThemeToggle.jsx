export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full border border-[#cfc2ae] bg-[rgba(255,251,244,0.92)] px-4 py-2 text-sm font-semibold text-[#2f3b34] shadow-[0_10px_30px_rgba(44,46,38,0.08)] transition hover:-translate-y-0.5 hover:bg-white dark:border-[#5c665f] dark:bg-[rgba(23,31,28,0.92)] dark:text-[#eef0e9] dark:hover:bg-[rgba(30,38,35,0.96)]"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="text-base leading-none text-[#8a6a3f] dark:text-[#d7be8b]">{isDark ? "Sun" : "Moon"}</span>
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
