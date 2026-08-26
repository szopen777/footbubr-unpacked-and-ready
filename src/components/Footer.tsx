import { Link } from '@tanstack/react-router';
import { Mail, Instagram, Footprints } from 'lucide-react';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.2a2.6 2.6 0 1 1-1.86-2.5V9.5a5.7 5.7 0 1 0 4.96 5.65V8.7a7.3 7.3 0 0 0 4.06 1.24V6.86a4.26 4.26 0 0 1-3-1.04Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-800/80 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#FF6B00] rounded-xl flex items-center justify-center">
                <Footprints className="w-4 h-4 text-black" />
              </div>
              <span className="font-black text-lg tracking-tight text-white uppercase">
                Foot<span className="text-[#FF6B00]">Bubr</span>
              </span>
            </Link>
            <p className="text-neutral-500 text-sm max-w-xs">
              Unikatowe korki piłkarskie w dropach 1 of 1. Każda para sprawdzona i w 100% oryginalna.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">Kontakt</h3>
            <a
              href="mailto:kontakt@footbubr.pl"
              className="flex items-center gap-2 text-sm font-semibold text-neutral-200 hover:text-[#FF6B00] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#FF6B00]" />
              kontakt@footbubr.pl
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">Social</h3>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/footbubr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram FootBubr"
                className="w-10 h-10 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-black hover:bg-[#FF6B00] hover:border-[#FF6B00] transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://tiktok.com/@footbubr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok FootBubr"
                className="w-10 h-10 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-black hover:bg-[#FF6B00] hover:border-[#FF6B00] transition-all"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-800/80">
          <p className="text-xs text-neutral-600">© 2026 FootBubr. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
}
