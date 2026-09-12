import Link from "next/link";
import { Logo } from "../Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10">
        <div>
          <Logo />
          <p className="mt-4 text-[13px] leading-relaxed text-stone-500 max-w-xs">
            Automatic meeting notes for Google Meet. Decisions, action items and summaries — minutes after you hang up.
          </p>
        </div>
        <nav aria-label="Product">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-4">Product</p>
          <ul className="space-y-2.5 text-[13px] font-medium text-stone-600">
            <li><a href="#how" className="hover:text-stone-950 transition-colors">How it works</a></li>
            <li><a href="#features" className="hover:text-stone-950 transition-colors">Features</a></li>
            <li><a href="#extension" className="hover:text-stone-950 transition-colors">Chrome extension</a></li>
            <li><Link href="/dashboard" className="hover:text-stone-950 transition-colors">Dashboard</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-4">Account</p>
          <ul className="space-y-2.5 text-[13px] font-medium text-stone-600">
            <li><Link href="/login" className="hover:text-stone-950 transition-colors">Sign in</Link></li>
            <li><Link href="/register" className="hover:text-stone-950 transition-colors">Create account</Link></li>
            <li><a href="#faq" className="hover:text-stone-950 transition-colors">FAQ</a></li>
          </ul>
        </nav>
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-4">Built by</p>
          <ul className="space-y-2.5 text-[13px] font-medium text-stone-600">
            <li><a href="https://itsokyash.online" target="_blank" rel="noreferrer" className="ext-link hover:text-stone-950 transition-colors">itsokyash.online <span className="ext-arrow" aria-hidden>↗</span></a></li>
            <li><a href="https://github.com/yashbhidawe" target="_blank" rel="noreferrer" className="ext-link hover:text-stone-950 transition-colors">GitHub <span className="ext-arrow" aria-hidden>↗</span></a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-stone-400">© 2026 Minute AI. Meeting notes, automatically.</p>
          <p className="text-[11px] font-mono uppercase tracking-wider text-stone-300">No bots were invited to this meeting</p>
        </div>
      </div>
    </footer>
  );
}
