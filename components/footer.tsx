export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#e2e4e8] bg-white text-xs text-slate-500 dark:border-[#222c3a] dark:bg-[#141c26] dark:text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Academy Desk</span>
          <span>&bull;</span>
          <span>Sports Management &amp; Readiness System</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Season 2026-27</span>
          <span>&bull;</span>
          <span>Production Build</span>
        </div>
      </div>
    </footer>
  );
}
