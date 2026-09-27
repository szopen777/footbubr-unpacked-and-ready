import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  Footprints, Mail, ArrowRight, Check, Sparkles, Loader2, X, ShieldCheck, HeartHandshake, Flame
} from 'lucide-react';
import { toast } from 'sonner';
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
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = newsletterEmail.trim().toLowerCase();

    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      toast.error('Wpisz poprawny adres e-mail');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'https://kwumqkqnwqbfvpzavclv.supabase.co/functions/v1/send-drop-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            type: 'welcome_code',
            email: emailTrimmed,
            dropId: 1,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Błąd serwera: ${response.status}`);
      }

      const data = await response.json();

      if (data?.success) {
        setSubscribed(true);
        localStorage.setItem('footbubr_nl_subscribed', emailTrimmed);

        if (data.isFirstTime) {
          toast.success('Zapisano do BubrClub!', {
            description: data?.code 
              ? `Twój kod: ${data.code} (-5%). Wysłaliśmy go też na adres ${emailTrimmed}.`
              : `Wysłaliśmy kod rabatowy -5% na adres ${emailTrimmed}.`,
            duration: 7000,
          });
        } else {
          toast.info('Witaj ponownie w BubrClub!', {
            description: `Jesteś z powrotem na liście powiadomień o premierach. (Kod rabatowy został już wcześniej wykorzystany na ten adres).`,
            duration: 7000,
          });
        }
      }

      setNewsletterEmail('');
    } catch (err: any) {
      console.error('Błąd zapisu newslettera:', err);
      toast.error('Wystąpił problem z wysyłką. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#090909] border-t border-neutral-800 text-neutral-400">
      
      {/* 1. Moduł BUBRCLUB (Newsletter) */}
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
                Bądź na bieżąco z premierami sprzętu FootBubr i zgarnij zniżkę na start.
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
                    <Check className="w-3.5 h-3.5" /> Zapisano
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

      {/* 2. Główna treść stopki */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Kolumna 1: O marce */}
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
              Polska marka tworząca nowoczesny sprzęt i akcesoria piłkarskie. Maksymalna lekkość i wygoda.
            </p>
          </div>

          {/* Kolumna 2: Social & Kontakt */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Social & Kontakt</h4>
            <div className="flex items-center gap-2.5 pt-0.5">
              <a
                href="https://www.instagram.com/footbubr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all active:scale-95"
                title="Instagram FootBubr"
                aria-label="Instagram FootBubr"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.tiktok.com/@footbubr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all active:scale-95"
                title="TikTok FootBubr"
                aria-label="TikTok FootBubr"
              >
                <TikTokIcon />
              </a>
              <a
                href="mailto:kontakt@footbubr.pl"
                className="w-9 h-9 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all active:scale-95"
                title="Napisz do nas"
                aria-label="Napisz do nas"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
            <a 
              href="mailto:kontakt@footbubr.pl" 
              className="text-xs text-neutral-500 hover:text-white font-mono transition-colors block"
            >
              kontakt@footbubr.pl
            </a>
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
                <Link to="/size-guide" className="hover:text-[#FF6B00] transition-colors">
                  Jak dobrać rozmiar?
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-neutral-400 hover:text-white transition-colors"
                  onClick={() => toast.info('Wysyłamy w 24h przez Paczkomaty InPost oraz kuriera. Darmowa dostawa od 150 zł.')}
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
                  className="text-left text-neutral-400 hover:text-[#FF6B00] transition-colors font-medium"
                  onClick={() => setIsAboutOpen(true)}
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

        {/* 3. Pasek dolny */}
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
            <span>Sprzęt twardy jak tama. Stworzone do ligowej gry.</span>
          </div>
        </div>
      </div>

                  {/* 4. MODAL O NAS */}
      {isAboutOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsAboutOpen(false)}
        >
          <div 
            className="bg-[#121212] border border-neutral-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative animate-scale-in text-neutral-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Przycisk zamknięcia */}
            <button
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Nagłówek modala */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center flex-shrink-0">
                <img src={logoPng} alt="FootBubr" className="w-7 h-7 object-contain invert brightness-200" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-[#FF6B00] tracking-widest block">
                  Autorski projekt piłkarski
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Historia FootBubr
                </h3>
              </div>
            </div>

            {/* Opowieść */}
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-neutral-300">
              <p>
                W piłkę gram od dzieciaka i spędziłem na boiskach setki godzin. Zawsze irytował mnie ten sam problem: plastikowe, niewygodne ochraniacze, wiecznie zsuwające się getry i stopa pływająca w bucie przy każdym zwrocie. Kiedy widziałem, jak wielkie marki każą sobie słono płacić za podstawowe akcesoria, postanowiłem wziąć sprawy w swoje ręce.
              </p>

              <div className="bg-black/50 border border-neutral-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                  <Flame className="w-4 h-4 text-[#FF6B00]" />
                  Skąd nazwa FootBubr?
                </div>
                <p className="text-xs text-neutral-400">
                  Pomysł zrodził się zupełnie naturalnie i ma bardzo bliskie, osobiste korzenie – to mały ukłon w stronę mojej dziewczyny, której nazwisko idealnie naprowadziło nas na ten motyw. Bóbr to w końcu symbol solidnej, nieustannej roboty, budowania mocnych rzeczy i nieustępliwości. Poza tym – kto nie lubi bobrów? Tak powstało hasło: <strong className="text-[#FF6B00]">Sprzęt twardy jak tama</strong>.
                </p>
              </div>

              <p>
                <strong className="text-white">Za FootBubr nie stoi żadna korporacja.</strong> Tworzę ten projekt sam, z ogromnym wsparciem mojej dziewczyny, która pomaga mi ogarniać wszystko poza boiskiem. Ja odpowiadam za to, co najważniejsze: <strong className="text-[#FF6B00]">każdy produkt testuję osobiście w ligowych meczach i na treningach</strong>. Wypuszczamy tylko to, w czym sam bez wahania wychodzę walczyć o 3 punkty.
              </p>

              <p className="text-neutral-400">
                Kupując tutaj, wspierasz niezależną, zajawkową markę tworzoną przez gracza dla graczy. Zero ściemy, uczciwe ceny i sprzęt, który ma po prostu robić robotę na murawie.
              </p>
            </div>

            {/* Wyróżniki */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-neutral-800/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                <span className="text-xs font-bold text-white">Testowane osobiście</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                <span className="text-xs font-bold text-white">100% Polska marka</span>
              </div>
            </div>

            <button
              onClick={() => setIsAboutOpen(false)}
              className="mt-6 w-full py-3 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-[0_4px_15px_rgba(255,107,0,0.25)] active:scale-95"
            >
              Jasne, wracamy do gry
            </button>
          </div>
        </div>
      )}


    </footer>
  );
}
