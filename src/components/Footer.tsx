import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Mail, Footprints, Send, Check } from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.2a2.6 2.6 0 1 1-1.86-2.5V9.5a5.7 5.7 0 1 0 4.96 5.65V8.7a7.3 7.3 0 0 0 4.06 1.24V6.86a4.26 4.26 0 0 1-3-1.04Z" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 4000);
    setEmail('');
  };

  return (
    <footer className="mt-16 border-t border-neutral-800/80 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 items-start">
          {/* O marce */}
          <div className="sm:col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#FF6B00] rounded-xl flex items-center justify-center">
                <Footprints className="w-4 h-4 text-black" />
              </div>
              <span className="font-black text-lg tracking-tight text-white uppercase">
                Foot<span className="text-[#FF6B00]">Bubr</span>
              </span>
            </Link>
            <p className="text-neutral-500 text-sm max-w-xs leading-relaxed">
              Unikatowe korki piłkarskie w dropach 1 of 1. Każda para sprawdzona i w 100% oryginalna.
            </p>
          </div>

          {/* Informacje i Prawo */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">Informacje</h3>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link to="/terms" className="hover:text-[#FF6B00] transition-colors">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-[#FF6B00] transition-colors">
                  Zwroty (14 dni)
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#FF6B00] transition-colors">
                  Polityka prywatności
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt & Social */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">Kontakt</h3>
            <a
              href="mailto:kontakt@footbubr.pl"
              className="flex items-center gap-2 text-sm font-semibold text-neutral-200 hover:text-[#FF6B00] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#FF6B00]" />
              kontakt@footbubr.pl
            </a>
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://instagram.com/footbubr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram FootBubr"
                className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-black hover:bg-[#FF6B00] hover:border-[#FF6B00] transition-all"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://tiktok.com/@footbubr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok FootBubr"
                className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-black hover:bg-[#FF6B00] hover:border-[#FF6B00] transition-all"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-3 w-full">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">Newsletter</h3>
            <p className="text-neutral-500 text-xs">Bądź pierwszy na liście dropów.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Twój e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 bg-white/5 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 transition-all"
              />
              <button
                type="submit"
                className="flex items-center justify-center bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold px-3.5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                aria-label="Zapisz się"
              >
                {subscribed ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            {subscribed && (
              <p className="text-emerald-400 text-xs flex items-center gap-1.5 animate-fade-in">
                <Check className="w-3 h-3" />
                Zapisano! Czekaj na drop alert.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-neutral-600">© 2026 FootBubr. Wszelkie prawa zastrzeżone.</p>
          <p className="text-xs text-neutral-600">Działalność nierejestrowana</p>
        </div>
      </div>
    </footer>
  );
}
