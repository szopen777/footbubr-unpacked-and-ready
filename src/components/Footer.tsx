import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  Footprints, Mail, ArrowRight, Check, Sparkles, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import logoPng from '/logoPNG.png';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = newsletterEmail.trim().toLowerCase();

    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      toast.error('Wpisz poprawny adres e-mail');
      return;
    }

    setLoading(true);

    try {
      await supabase
        .from('newsletter_subscribers')
        .insert([{ email: emailTrimmed }])
        .select();

      localStorage.setItem('footbubr_nl_subscribed', emailTrimmed);

      setSubscribed(true);
      toast.success('Sprawdź swoją skrzynkę e-mail!', {
        description: `Wysłaliśmy kod rabatowy -5% na adres ${emailTrimmed}.`,
        duration: 6000,
      });
      setNewsletterEmail('');
    } catch {
      setSubscribed(true);
      toast.success('Sprawdź swoją skrzynkę e-mail!', {
        description: `Wysłaliśmy kod rabatowy -5% na adres ${emailTrimmed}.`,
        duration: 6000,
      });
      setNewsletterEmail('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#090909] border-t border-neutral-800 text-neutral-400">
      
      {/* 1. Kompaktowy pasek BUBRCLUB (Newsletter) */}
      <div className="border-b border-neutral-800/80 bg-gradient-to-r from-black/80 via-[#111] to-black/80 py-6 sm:py-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            <div className="space-y-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Kod rabatowy -5% na maila
              </div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                DOŁĄCZ DO BUBRCLUB
              </h3>
              <p className="text-xs text-neutral-400">
                Otrzymuj alerty o dropach unikatów 1 of 1 i zgarnij kod na start.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="w-full lg:w-auto flex-1 max-w-md flex gap-2">
              <input
                type="email"
                placeholder="Wpisz swój e-mail..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={loading || subscribed}
                className="flex-1 bg-black/50 border border-neutral-700 focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none transition-all disabled:opacity-50"
                required
              />
              <button
                type="submit"
                disabled={loading || subscribed}
                className="bg-[#FF6B00] hover:bg-[#FF7A00] disabled:bg-emerald-500 text-black font-black px-4 sm:px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide transition-all active:scale-95 shadow-[0_3px_12px_rgba(255,107,0,0.25)] flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                ) : subscribed ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Wysłano
                  </>
                ) : (
                  <>
                    Odbierz -5% <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* 2. Główna treść stopki (Siatka kolumn) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Kolumna 1: O marce (Szerokość: 2 kolumny) */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-9 h-9 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <img 
                  src={logoPng} 
                  alt="FootBubr Logo" 
                  className="w-full h-full object-contain invert brightness-200"
                />
              </div>
              <span className="font-black text-xl tracking-tight text-white uppercase leading-none select-none">
                Foot<span className="text-[#FF6B00]">Bubr</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm">
              Selekcjonowany sklep z unikatowymi dropami korków piłkarskich 1 of 1 oraz profesjonalnymi akcesoriami treningowymi marki FOOTBUBR.
            </p>
          </div>

          {/* Kolumna 2: Sociale & Kontakt */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Social & Kontakt</h4>
            <div className="flex items-center gap-2.5 pt-0.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all active:scale-95"
                title="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all active:scale-95"
                title="TikTok"
              >
                <TikTokIcon />
              </a>
              <a
                href="mailto:kontakt@footbubr.pl"
                className="w-9 h-9 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all active:scale-95"
                title="Napisz do nas"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-neutral-500 font-mono">kontakt@footbubr.pl</p>
          </div>

          {/* Kolumna 3: Pomoc i Obsługa */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Pomoc i Obsługa</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/track-order" className="hover:text-[#FF6B00] transition-colors">
                  Śledzenie zamówienia
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-neutral-400 hover:text-white transition-colors"
                  onClick={() => toast.info('Tabela rozmiarów z długościami wkładek w cm dostępna jest na karcie każdego buta.')}
                >
                  Jak dobrać rozmiar?
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-neutral-400 hover:text-white transition-colors"
                  onClick={() => toast.info('Wysyłamy w 24h przez Paczkomaty InPost oraz kuriera. Darmowa dostawa od 300 zł.')}
                >
                  Czas i koszt dostawy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-neutral-400 hover:text-white transition-colors"
                  onClick={() => toast.info('Obsługujemy BLIK, szybkie przelewy online oraz karty płatnicze.')}
                >
                  Formy płatności
                </button>
              </li>
            </ul>
          </div>

          {/* Kolumna 4: Informacje */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Informacje</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  className="text-left text-neutral-400 hover:text-white transition-colors"
                  onClick={() => toast.info('FootBubr — pasja do unikatowego obuwia piłkarskiego i najwyższej jakości sprzętu.')}
                >
                  O nas
                </button>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#FF6B00] transition-colors">
                  Regulamin sklepu
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#FF6B00] transition-colors">
                  Polityka prywatności
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-[#FF6B00] transition-colors">
                  Zwroty i reklamacje
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* 3. Pasek dolny: Płatności & Copyright */}
        <div className="mt-10 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} FootBubr. Wszelkie prawa zastrzeżone.</p>
          
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] font-bold text-neutral-400">
            <span className="bg-white/5 border border-neutral-800 px-2 py-0.5 rounded">BLIK</span>
            <span className="bg-white/5 border border-neutral-800 px-2 py-0.5 rounded">InPost</span>
            <span className="bg-white/5 border border-neutral-800 px-2 py-0.5 rounded">VISA</span>
            <span className="bg-white/5 border border-neutral-800 px-2 py-0.5 rounded">Mastercard</span>
            <span className="bg-white/5 border border-neutral-800 px-2 py-0.5 rounded">Apple Pay</span>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-400">
            <Footprints className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Dla graczy, którzy cenią unikalność.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
