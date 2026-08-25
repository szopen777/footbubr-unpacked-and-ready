'use client';

import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRODUCT_LEVELS } from '@/lib/supabase';

export interface FilterState {
  sizes: number[];
  brands: string[];
  levels: string[];
  surfaces: string[];
  conditions: string[];
  priceMin: string;
  priceMax: string;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

const SIZES = [39, 39.5, 40, 40.5, 41, 41.5, 42, 42.5, 43, 43.5, 44, 44.5, 45, 45.5, 46, 46.5, 47, 47.5];
const BRANDS = ['Nike', 'Adidas', 'Puma', 'Mizuno', 'New Balance', 'Under Armour', 'Umbro', 'Lotto'];
const SURFACES = [
  { value: 'FG', label: 'FG — Lanki' },
  { value: 'SG', label: 'SG — Wkręty/Mixy' },
  { value: 'AG', label: 'AG — Sztuczna trawa' },
  { value: 'TF', label: 'TF — Turfy' },
  { value: 'IC', label: 'IC — Halówki' },
];
const CONDITIONS = [
  'Nowe z metką',
  'Nowe bez metki',
  'Używane 9/10',
  'Używane 8/10',
  'Używane 7/10',
  'Używane 6/10',
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Najnowsze' },
  { value: 'price_asc', label: 'Cena: rosnąco' },
  { value: 'price_desc', label: 'Cena: malejąco' },
];

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-800/80 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-neutral-500 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      {open && <div className="animate-fade-in">{children}</div>}
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, sortBy, onSortChange }: FilterSidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const activeCount =
    filters.sizes.length +
    filters.brands.length +
    filters.levels.length +
    filters.surfaces.length +
    filters.conditions.length +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0);

  const clearAll = () =>
    onChange({ sizes: [], brands: [], levels: [], surfaces: [], conditions: [], priceMin: '', priceMax: '' });

  const checkboxClass = (active: boolean) =>
    cn(
      'w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0',
      active ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-neutral-700 group-hover:border-[#FF6B00]/60'
    );

  const CheckIcon = () => (
    <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 10 10" fill="none">
      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const labelClass = (active: boolean) =>
    cn('text-sm transition-colors cursor-pointer', active ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200');

  const filterContent = (
    <div className="space-y-0">
      <FilterSection title="Rozmiar (EU)">
        <div className="grid grid-cols-4 gap-1.5">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onChange({ ...filters, sizes: toggle(filters.sizes, size) })}
              className={cn(
                'text-xs py-1.5 rounded-lg font-medium transition-all active:scale-90',
                filters.sizes.includes(size)
                  ? 'bg-[#FF6B00] text-black'
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Marka">
        <div className="space-y-1.5">
          {BRANDS.map((brand) => {
            const active = filters.brands.includes(brand);
            return (
              <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                <div onClick={() => onChange({ ...filters, brands: toggle(filters.brands, brand) })} className={checkboxClass(active)}>
                  {active && <CheckIcon />}
                </div>
                <span onClick={() => onChange({ ...filters, brands: toggle(filters.brands, brand) })} className={labelClass(active)}>{brand}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Poziom">
        <div className="space-y-1.5">
          {PRODUCT_LEVELS.map(({ value, label }) => {
            const active = filters.levels.includes(value);
            return (
              <label key={value} className="flex items-center gap-2 cursor-pointer group">
                <div onClick={() => onChange({ ...filters, levels: toggle(filters.levels, value) })} className={checkboxClass(active)}>
                  {active && <CheckIcon />}
                </div>
                <span onClick={() => onChange({ ...filters, levels: toggle(filters.levels, value) })} className={labelClass(active)}>{label}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Nawierzchnia">
        <div className="space-y-1.5">
          {SURFACES.map(({ value, label }) => {
            const active = filters.surfaces.includes(value);
            return (
              <label key={value} className="flex items-center gap-2 cursor-pointer group">
                <div onClick={() => onChange({ ...filters, surfaces: toggle(filters.surfaces, value) })} className={checkboxClass(active)}>
                  {active && <CheckIcon />}
                </div>
                <span onClick={() => onChange({ ...filters, surfaces: toggle(filters.surfaces, value) })} className={labelClass(active)}>{label}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Stan">
        <div className="space-y-1.5">
          {CONDITIONS.map((cond) => {
            const active = filters.conditions.includes(cond);
            return (
              <label key={cond} className="flex items-center gap-2 cursor-pointer group">
                <div onClick={() => onChange({ ...filters, conditions: toggle(filters.conditions, cond) })} className={checkboxClass(active)}>
                  {active && <CheckIcon />}
                </div>
                <span onClick={() => onChange({ ...filters, conditions: toggle(filters.conditions, cond) })} className={labelClass(active)}>{cond}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Cena (PLN)" defaultOpen={true}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
            className="w-full bg-white/5 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 transition-all"
          />
          <span className="text-neutral-600 flex-shrink-0">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
            className="w-full bg-white/5 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 transition-all"
          />
        </div>
      </FilterSection>
    </div>
  );

  const sortContent = (
    <div className="space-y-2">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => { onSortChange(opt.value); }}
          className={cn(
            'flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95',
            sortBy === opt.value
              ? 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/30'
              : 'bg-white/5 text-neutral-400 border border-neutral-800 hover:text-white'
          )}
        >
          {opt.label}
          {sortBy === opt.value && <X className="w-3.5 h-3.5" />}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile: "Filtruj i Sortuj" button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 bg-white/5 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white font-medium hover:bg-white/8 transition-all active:scale-95 w-full justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtruj i Sortuj
          {activeCount > 0 && (
            <span className="ml-1 bg-[#FF6B00] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile: Bottom sheet */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-backdrop-in lg:hidden"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            <div className="bg-[#141414] border-t border-neutral-800 rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-neutral-700 rounded-full" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
                <span className="text-sm font-bold text-white uppercase tracking-wider">Filtry i sortowanie</span>
                <button onClick={() => setSheetOpen(false)} className="p-2 text-neutral-400 hover:text-white rounded-lg active:scale-90">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sort */}
              <div className="px-5 py-3 border-b border-neutral-800">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Sortowanie</p>
                {sortContent}
              </div>

              {/* Filters scroll area */}
              <div className="flex-1 overflow-y-auto px-5 py-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Filtry</span>
                  {activeCount > 0 && (
                    <button onClick={clearAll} className="text-xs text-[#FF6B00] hover:underline">
                      Wyczyść ({activeCount})
                    </button>
                  )}
                </div>
                {filterContent}
              </div>

              {/* Apply button */}
              <div className="px-5 py-4 border-t border-neutral-800">
                <button
                  onClick={() => setSheetOpen(false)}
                  className="w-full bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
                >
                  Pokaż wyniki
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block bg-[#141414] border border-neutral-800/80 rounded-2xl p-5 sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-[#FF6B00]" />
            Filtry
          </span>
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-[#FF6B00] hover:underline flex items-center gap-1 transition-all active:scale-90">
              <X className="w-3 h-3" />
              Wyczyść ({activeCount})
            </button>
          )}
        </div>
        {filterContent}
      </div>
    </>
  );
}
