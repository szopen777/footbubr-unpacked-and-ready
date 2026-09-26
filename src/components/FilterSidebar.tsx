import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MainCategory = 'all' | 'boots' | 'accessories';

export interface FilterState {
  category?: MainCategory;
  sizes?: string[];
  brands?: string[];
  levels?: string[];
  surfaces?: string[];
  conditions?: string[];
  accessoryTypes?: string[];
  priceMin?: string;
  priceMax?: string;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

const ACCESSORY_TYPES = [
  'Skarpety antypoślizgowe',
  'Mini ochraniacze',
  'Taśmy / Cohesive Tape',
  'Zestawy FOOTBUBR',
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

function FilterSection({
  title,
  children,
  defaultOpen = true,
  hasBorder = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  hasBorder?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn('py-3.5', hasBorder && 'border-b border-neutral-800/80')}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left py-0.5 group transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors">
          {title}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-neutral-500 group-hover:text-white transition-transform duration-300 ease-out',
            open && 'rotate-180 text-[#FF6B00]'
          )}
        />
      </button>
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          open ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, sortBy, onSortChange }: FilterSidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentAccTypes = filters.accessoryTypes || [];

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const activeCount =
    currentAccTypes.length +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0);

  const clearAll = () =>
    onChange({
      category: 'all',
      sizes: [],
      brands: [],
      levels: [],
      surfaces: [],
      conditions: [],
      accessoryTypes: [],
      priceMin: '',
      priceMax: '',
    });

  const checkboxClass = (active: boolean) =>
    cn(
      'w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 duration-200',
      active ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-neutral-700 group-hover:border-[#FF6B00]/60'
    );

  const CheckIcon = () => (
    <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 10 10" fill="none">
      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const labelClass = (active: boolean) =>
    cn('text-sm transition-colors cursor-pointer', active ? 'text-white font-medium' : 'text-neutral-400 group-hover:text-neutral-200');

  const filterContent = (
    <div className="divide-y-0">
      {/* RODZAJ PRODUKTU */}
      <FilterSection title="Produkt" defaultOpen={true}>
        <div className="space-y-1.5">
          {ACCESSORY_TYPES.map((type) => {
            const active = currentAccTypes.includes(type);
            return (
              <label key={type} className="flex items-center gap-2 cursor-pointer group py-0.5">
                <div onClick={() => onChange({ ...filters, accessoryTypes: toggle(currentAccTypes, type) })} className={checkboxClass(active)}>
                  {active && <CheckIcon />}
                </div>
                <span onClick={() => onChange({ ...filters, accessoryTypes: toggle(currentAccTypes, type) })} className={labelClass(active)}>{type}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* CENA (PLN) */}
      <FilterSection title="Cena (PLN)" defaultOpen={true} hasBorder={false}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin || ''}
            onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
            className="w-full bg-white/5 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 transition-all"
          />
          <span className="text-neutral-600 flex-shrink-0">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ''}
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
            'flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 duration-200',
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
      {/* Przycisk mobilny */}
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

      {/* Panel mobilny */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-backdrop-in lg:hidden"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            <div className="bg-[#141414] border-t border-neutral-800 rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-neutral-700 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
                <span className="text-sm font-bold text-white uppercase tracking-wider">Filtry i sortowanie</span>
                <button onClick={() => setSheetOpen(false)} className="p-2 text-neutral-400 hover:text-white rounded-lg active:scale-90">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-neutral-800">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Sortowanie</p>
                {sortContent}
              </div>

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

      {/* Boczny panel na desktopie */}
      <div className="hidden lg:block bg-[#141414] border border-neutral-800/80 rounded-2xl p-5 sticky top-24">
        <div className="flex items-center justify-between mb-2">
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
