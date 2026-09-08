import { Flame, Zap } from 'lucide-react';
import { DropSettings, Product } from '@/lib/supabase';

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function calculateCountdown(target: string): Countdown | null {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden bg-black border-2 border-white rounded-lg sm:rounded-xl w-14 h-16 sm:w-20 sm:h-24 flex items-center justify-center shadow-[4px_4px_0_0_#FF6B00]">
        <span
          key={padded}
          className="font-mono font-black text-2xl sm:text-4xl text-white tabular-nums animate-digit-flip"
        >
          {padded}
        </span>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20 -translate-y-1/2 pointer-events-none" />
      </div>
      <span className="text-[9px] sm:text-[11px] font-black text-black uppercase tracking-[0.18em] mt-2">
        {label}
      </span>
    </div>
  );
}

function FeaturedProductPreview({ product }: { product: Product }) {
  return (
    <div className="inline-flex items-center gap-3 bg-black border-2 border-black px-3 py-2 rounded-sm shadow-[4px_4px_0_0_#fff] -rotate-1 max-w-xs">
      <div className="w-10 h-10 rounded-md overflow-hidden bg-white/5 border border-white/20 flex-shrink-0">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-[10px]">Brak</div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[9px] font-black text-[#FF6B00] uppercase tracking-wider">Zapowiedź</p>
        <p className="text-xs font-bold text-white truncate">{product.name}</p>
        <p className="text-[10px] text-white/60">{product.brand} · EU {product.size_eu}</p>
      </div>
    </div>
  );
}

interface DropCountdownBannerProps {
  dropSettings: DropSettings | null;
  featuredProduct: Product | null;
  countdown: Countdown | null;
}

export default function DropCountdownBanner({ dropSettings, featuredProduct, countdown }: DropCountdownBannerProps) {
  const title = dropSettings?.title || 'Drop za chwilę';
  const subtitle = dropSettings?.subtitle || '';
  const isTbd = !dropSettings || dropSettings.is_tbd || !dropSettings.drop_date;

  return (
    <section className="relative overflow-hidden border-y-4 border-black bg-[#FF6B00]">
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, #000 0, #000 12px, transparent 12px, transparent 24px)',
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-black" />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9 relative">
        <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
          <div className="inline-flex items-center gap-2 bg-black text-[#FF6B00] px-3 py-1.5 rounded-sm rotate-[-2deg] border-2 border-black shadow-[3px_3px_0_0_#fff]">
            {isTbd ? <Zap className="w-4 h-4 sm:w-5 sm:h-5" /> : <Flame className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em]">
              {isTbd ? 'Nowy drop wkrótce' : 'Drop live soon'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-black uppercase tracking-tighter leading-[0.95] px-2 drop-shadow-[3px_3px_0_rgba(255,255,255,0.9)]">
            {title}
          </h2>

          {subtitle && (
            <p className="text-sm sm:text-base font-bold text-black/80 max-w-lg -mt-1">
              {subtitle}
            </p>
          )}

          {/* Countdown — only when a valid future date exists */}
          {!isTbd && countdown && (
            <div className="flex items-center gap-2 sm:gap-3">
              <CountdownUnit value={countdown.days} label="Dni" />
              <span className="text-3xl sm:text-4xl font-black text-black -mt-5">:</span>
              <CountdownUnit value={countdown.hours} label="Godz" />
              <span className="text-3xl sm:text-4xl font-black text-black -mt-5">:</span>
              <CountdownUnit value={countdown.minutes} label="Min" />
              <span className="text-3xl sm:text-4xl font-black text-black -mt-5">:</span>
              <CountdownUnit value={countdown.seconds} label="Sek" />
            </div>
          )}

          {/* Featured product preview */}
          {featuredProduct && (
            <FeaturedProductPreview product={featuredProduct} />
          )}
        </div>
      </div>
    </section>
  );
}
