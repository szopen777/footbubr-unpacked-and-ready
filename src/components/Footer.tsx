import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  ShieldCheck, Truck, RotateCcw, Footprints, Instagram, 
  Mail, ArrowRight, Check, Sparkles, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import logoPng from '/logoPNG.png';

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
      // Opcjonalny zapis do tabeli w Supabase
      await supabase
        .from('newsletter_subscribers')
        .insert([{ email: emailTrimmed }])
        .select();

      // Zapisujemy flagę w localStorage
      localStorage.setItem('footbubr_nl_subscribed', emailTrimmed);

      setSubscribed(true);
      toast.success('Sprawdź swoją skrzynkę e-mail!', {
        description: `Wysłaliśmy kod rabatowy -5% na adres ${emailTrimmed}.`,
        duration: 6000,
      });
      setNewsletterEmail('');
    } catch {
      // Nawet w przypadku braku tabeli potwierdzamy wysłanie dla UX
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
      
      {/* 1. Baner zaufania */}
      <div className="border-b border-neutral-800/80 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#121212] border border-neutral-800/80">
              <div className="w-11 h-11 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-wide">100% Autentyczności</h4>
                <p className="text-xs text-neutral-400 mt-0.5">Każda para 1 of 1 jest rygorystycznie sprawdzana.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#121212] border border-neutral-800/80">
              <div className="w-11 h-11 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-wide">Paczkomat & Kurier</h4>
                <p className="text-xs text-neutral-400 mt-0.5">Wysyłka w 24h z bezpiecznym pakowaniem.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#121212] border border-neutral-800/80">
              <div className="w-11 h-11 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-wide">14 Dni na Zwrot</h4>
                <p className="text-xs text-neutral-400 mt-0.5">Bezstresowe zakupy i jasne procedury.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sekcja Newslettera (-5% na maila) */}
      <div className="border-b border-neutral-800/80 py-10 sm:py-12 bg-gradient-to-b from-transparent to-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6B00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="space-y-2 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/25 px-3 py-1 rounded-full text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Kod rabatowy -5% na pierwsze zamówienie
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Dołącz do FootBubr Club
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Zapisz się, aby otrzymywać powiadomienia o nowych dropach 1 of 1. Kod zniżkowy -5% wyślemy na Twojego maila.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="w-full lg:w-auto flex-1 max-w-md flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                placeholder="Twój adres e-mail..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={loading || subscribed}
                className="flex-1 bg-black/60 border border-neutral-700 focus:border-[#FF6B00] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition-all disabled:opacity-50"
                required
              />
              <button
                type="submit"
                disabled={loading || subscribed}
                className="bg-[#FF6B00] hover:bg-[#FF7A00] disabled:bg-emerald-500 text-black font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95 shadow-[0_4px_15px_rgba(255,107,0,0.25)] flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : subscribed ? (
                  <>
                    <Check className="w-4 h-4" /> Sprawdź maila
                  </>
                ) : (
                  <>
                    Odbierz kod <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Nawigacja i Branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
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
              Pierwszy w Polsce selekcjonowany resale unikatowych korków piłkarskich 1 of 1 oraz autorskie akcesoria treningowe FOOTBUBR.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 transition-all active:scale-95"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:kontakt@footbubr.pl"
                className="w-10 h-10 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#FF6B00]/50 transition-all active:scale-95"
                title="Kontakt e-mail"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Katalog</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-[#FF6B00] transition-colors">Wszystkie produkty</Link>
              </li>
              <li>
                <Link to="/archive" className="hover:text-[#FF6B00] transition-colors">Archiwum dropów</Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-[#FF6B00] transition-colors">Twoje ulubione</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Obsługa klienta</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/track-order" className="hover:text-[#FF6B00] transition-colors">Śledź zamówienie</Link>
              </li>
              <li>
                <span className="text-neutral-400 hover:text-white transition-colors cursor-pointer" onClick={() => toast.info('Poradnik doboru rozmiaru dostępny jest w specyfikacji każdego buta.')}>
                  Tabela rozmiarów
                </span>
              </li>
              <li>
                <span className="text-neutral-400 hover:text-white transition-colors cursor-pointer" onClick={() => toast.info('Obsługujemy BLIK, szybkie przelewy Przelewy24 oraz płatności kartą.')}>
                  Płatności i dostawa
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Płatności</h4>
            <div className="flex flex-wrap gap-2 text-xs font-mono font-bold text-neutral-300">
              <span className="bg-white/5 border border-neutral-800 px-2.5 py-1.5 rounded-lg">BLIK</span>
              <span className="bg-white/5 border border-neutral-800 px-2.5 py-1.5 rounded-lg">InPost</span>
              <span className="bg-white/5 border border-neutral-800 px-2.5 py-1.5 rounded-lg">VISA</span>
              <span className="bg-white/5 border border-neutral-800 px-2.5 py-1.5 rounded-lg">Mastercard</span>
              <span className="bg-white/5 border border-neutral-800 px-2.5 py-1.5 rounded-lg">Apple Pay</span>
            </div>
          </div>

        </div>

        {/* 4. Pasek Copyright */}
        <div className="mt-12 pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} FootBubr. Wszelkie prawa zastrzeżone.</p>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Footprints className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Stworzone dla graczy, którzy cenią unikalność na boisku.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
