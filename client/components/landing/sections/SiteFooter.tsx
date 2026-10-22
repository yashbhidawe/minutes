export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0f0f0e]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-4 gap-12 mb-12">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Minutes
            </span>
            <p className="text-[12px] text-stone-500 dark:text-stone-400 max-w-xs leading-relaxed">
              Meeting notes that write themselves. For meetings you are authorized to record.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2.5 text-xs font-medium text-stone-500 dark:text-stone-400">
            <a href="#how" className="hover:text-stone-900 dark:hover:text-white transition-colors">How it works</a>
            <a href="/install" className="hover:text-stone-900 dark:hover:text-white transition-colors">Get the extension</a>
            <a href="/dashboard" className="hover:text-stone-900 dark:hover:text-white transition-colors">Dashboard</a>
          </div>
          <div className="flex flex-col items-start gap-2.5 text-xs font-medium text-stone-500 dark:text-stone-400">
            <a href="/login" className="hover:text-stone-900 dark:hover:text-white transition-colors">Sign in</a>
            <a href="/register" className="hover:text-stone-900 dark:hover:text-white transition-colors">Create account</a>
            <a href="/privacy" className="hover:text-stone-900 dark:hover:text-white transition-colors">Privacy policy</a>
          </div>
          <div className="flex flex-col items-start gap-2.5 text-xs font-medium text-stone-500 dark:text-stone-400">
            <a
              href="https://itsokyash.online"
              target="_blank"
              rel="noreferrer"
              className="hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              itsokyash.online
            </a>
            <a
              href="https://github.com/yashbhidawe"
              target="_blank"
              rel="noreferrer"
              className="hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-6">
          <p className="text-[11px] text-stone-400 dark:text-stone-500">© 2026 Minutes.</p>
          <p className="text-[11px] font-mono text-stone-400 dark:text-stone-500">No bots join your calls.</p>
        </div>
      </div>
    </footer>
  );
}
