import { Link } from '@tanstack/react-router';
import { ShieldCheck, Truck, RotateCcw, Footprints, Instagram, Mail } from 'lucide-react';
import logoPng from '/logoPNG.png';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-neutral-800/80 text-neutral-400">
      {/* 3 Kluczowe Filary / Odznaki Zaufania */}
      <div className="border-b border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-center gap-3.5 bg-white/5 border border-neutral-800/60 rounded-2xl p-4 sm:p-5">
              <div className="w-11 h-11 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center flex-shrink-0 text-[#FF6B00]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-wide">100% Oryginalności</h4>
                <p className="text-xs text-neutral-400 mt-0.5 leading-snug">
                  Każda para korków i akcesoriów przechodzi rygorystyczną weryfikację autentyczności.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/5 border border-neutral-800/60 rounded-2xl p-4 sm:p-5">
              <div className="w-11 h-11 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center flex-shrink-0 text-[#FF6B00]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-wide">Ekspresowa Wysyłka</h4>
                <p className="text-xs text-neutral-400 mt-0.5 leading-snug">
                  Paczkomaty InPost oraz kurier. Bezpiecznie zapakowane i wysłane w 24h.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/5 border border-neutral-800/60 rounded-2xl p-4 sm:p-5">
              <div className="w-11 h-11 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center flex-shrink-0 text-[#FF6B00]">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-wide">Bezpieczne Zakupy</h4>
                <p className="text-xs text-neutral-400 mt-0.5 leading-snug">
                  Szybkie płatności online, przejrzyste zasady i prawo do zwrotu do 14 dni.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Główna sekcja stopki */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Kolumna 1: Logo i Misja FootBubr (szerokość 2 kolumn) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <img 
                  src={logoPng} 
                  alt="FootBubr Logo" 
                  className="w-full h-full object-contain invert brightness-200"
                />
              </div>
              <span className="font-black text-2xl tracking-tight text-white uppercase leading-none select-none">
                Foot<span className="text-[#FF6B00]">Bubr</span>
              </span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              Twój sprawdzony punkt na piłkarskiej mapie. Polujemy na unikatowe, limitowane korki w dropach 1 of 1 oraz dostarczamy autorski, profesjonalny sprzęt treningowy FOOTBUBR.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all active:scale-95"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:kontakt@footbubr.pl"
                className="w-10 h-10 rounded-xl bg-white/5 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all active:scale-95"
                title="Napisz do nas"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Kolumna 2: Sklep & Kolekcje */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Kolekcja</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-[#FF6B00] transition-colors">Wszystkie produkty</Link>
              </li>
              <li>
                <Link to="/archive" className="hover:text-[#FF6B00] transition-colors">Archiwum dropów</Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-[#FF6B00] transition-colors">Ulubione pary</Link>
              </li>
            </ul>
          </div>

          {/* Kolumna 3: Pomoc & Poradniki */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Pomoc i Obsługa</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/track-order" className="hover:text-[#FF6B00] transition-colors">Śledzenie zamówienia</Link>
              </li>
              <li>
                <span className="text-neutral-500 cursor-not-allowed">Jak zmierzyć stopę? (Wkrótce)</span>
              </li>
              <li>
                <span className="text-neutral-500 cursor-not-allowed">Formy płatności</span>
              </li>
              <li>
                <span className="text-neutral-500 cursor-not-allowed">Czas i koszt dostawy</span>
              </li>
            </ul>
          </div>

          {/* Kolumna 4: Informacje prawne */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Informacje</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-neutral-500 cursor-not-allowed">O nas</span>
              </li>
              <li>
                <span className="text-neutral-500 cursor-not-allowed">Regulamin sklepu</span>
              </li>
              <li>
                <span className="text-neutral-500 cursor-not-allowed">Polityka prywatności</span>
              </li>
              <li>
                <span className="text-neutral-500 cursor-not-allowed">Zwroty i reklamacje</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Dolny pasek praw autorskich */}
        <div className="mt-12 pt-8 border-t border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} FootBubr. Wszelkie prawa zastrzeżone.</p>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Footprints className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Stworzone dla graczy, którzy cenią unikalność.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
