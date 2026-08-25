import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export const SURFACE_LABELS: Record<string, string> = {
  FG: 'FG — Lanki',
  SG: 'SG — Wkręty/Mixy',
  AG: 'AG — Sztuczna trawa',
  TF: 'TF — Turfy',
  IC: 'IC — Halówki',
};

export const CONDITION_COLORS: Record<string, string> = {
  'Nowe z metką': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  'Nowe bez metki': 'text-green-400 bg-green-400/10 border-green-400/30',
  'Używane 9/10': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'Używane 8/10': 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  'Używane 7/10': 'text-red-400 bg-red-400/10 border-red-400/30',
  'Używane 6/10': 'text-red-500 bg-red-500/10 border-red-500/30',
};

/** Shared input/select class string for consistent dark-mode styling across the app. */
export const INPUT_CLASS =
  'w-full bg-white/5 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 transition-all text-sm';

/** Select-specific class with dark dropdown styling for native <select> elements. */
export const SELECT_CLASS =
  'w-full bg-[#1a1a1a] border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-100 focus:outline-none focus:border-[#FF6B00]/60 transition-all text-sm cursor-pointer appearance-none [&>option]:bg-[#1a1a1a] [&>option]:text-neutral-100 [&>option]:py-1';
