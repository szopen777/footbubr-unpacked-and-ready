import { useState } from 'react';
import { Zap, Mail, Bell, Check, Loader as Loader2 } from 'lucide-react';
import { Drop, supabase } from '@/lib/supabase';
import { Countdown, calculateCountdown } from '@/components/DropCountdownBanner';

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden bg-black/80 border border-white/15 rounded-lg w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center backdrop-blur-md">
        <span
          key={padded}
          className="font-mono font-black text-xl sm:text-2xl text-[#FF6B00] tabular-nums animate-digit-flip"
        >
          {padded}
        </span>
      </div>
      <span className="text-[8px] sm:text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
}

interface HeroDropPanelProps {
  drop: Drop | null;
  countdownTarget: string | null;
  pairCount: number;
}

export default function HeroDropPanel({ drop, countdownTarget, pairCount }: HeroDropPanelProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setLoading(true);
    try {
      await supabase.from('drop_alerts').insert([
        { drop_id: drop?.id || null, contact: email, type: 'email', created_at: new Date().toISOString() },
      ]);
    } catch {
      // Fallback to localStorage
      const stored = JSON.parse(localStorage.getItem('footbubr_alerts') || '[]');
      stored.push({ contact: email, drop_id: drop?.id, date: new Date().toISOString() });
      localStorage.setItem('footbubr_alerts', JSON.stringify(stored));
    } finally {
      setLoading(false);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  if (countdownTarget) {
    const cd = calculateCountdown(countdownTarget);
    if (cd) {
      return (
        <div className="bg-[#141414]/80 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-5 sm:p-6 animate-fade-in-up delay-300">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-xs font-black text-[#FF6B00] uppercase tracking-wider">
              {drop?.name || 'Drop za chwilę'}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <CountdownUnit value={cd.days} label="Dni" />
            <span className="text-xl font-black text-neutral-700 -mt-5">:</span>
            <CountdownUnit value={cd.hours} label="Godz" />
            <span className="text-xl font-black text-neutral-700 -mt-5">:</span>
            <CountdownUnit value={cd.minutes} label="Min" />
            <span className="text-xl font-black text-neutral-700 -mt-5">:</span>
            <CountdownUnit value={cd.seconds} label="Sek" />
          </div>
          {drop?.description && (
            <p className="text-sm text-neutral-400 mb-3">{drop.description}</p>
          )}
          <div className="flex items-center gap-2 bg-black/40 border border-neutral-800 rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              {pairCount} {pairCount === 1 ? 'para' : pairCount < 5 ? 'pary' : 'par'} 1 of 1
            </span>
          </div>
        </div>
      );
    }
  }

  // No scheduled drop — show "coming soon" email box
  return (
    <div className="bg-[#141414]/80 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-5 sm:p-6 animate-fade-in-up delay-300">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[#FF6B00]" />
        <span className="text-xs font-black text-[#FF6B00] uppercase tracking-wider">Nowy drop już wkrótce</span>
      </div>
      <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
        Przygotowujemy kolejne unikatowe pary. Zapisz się, by dostać powiadomienie przed startem.
      </p>
      {!subscribed ? (
        <form onSubmit={handleSubscribe} className="space-y-2">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Twój e-mail..."
              className="w-full bg-white/5 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Powiadom mnie
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-center gap-2 bg-emerald-400/10 border border-emerald-400/30 rounded-xl py-2.5 px-3 text-sm text-emerald-400 font-semibold">
          <Check className="w-4 h-4" />
          Zapisano! Czekaj na drop alert.
        </div>
      )}
    </div>
  );
}
