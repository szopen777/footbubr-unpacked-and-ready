import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X, Sparkles, Footprints, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRODUCT_LEVELS } from '@/lib/supabase';

export type MainCategory = 'all' | 'boots' | 'accessories';

export interface FilterState {
  category?: MainCategory;
  sizes?: number[];
  brands?: string[];
  levels?: string[];
  surfaces?: string[];
  conditions?: string[];
  accessoryTypes?: string[];
  priceMin?: string;
  priceMax?: string;
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
          open ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, sortBy, onSortChange }: FilterSidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentCategory = filters.category || 'all';
  const currentSizes = filters.sizes || [];
  const currentBrands = filters.brands || [];
  const currentLevels = filters.levels || [];
  const currentSurfaces = filters.surfaces || [];
  const currentConditions = filters.conditions || [];
  const currentAccTypes = filters.accessoryTypes || [];

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const setCategory = (cat: MainCategory) => {
    onChange({ ...filters, category: cat });
  };

  const activeCount =
    currentSizes.length +
    currentBrands.length +
    currentLevels.length +
    currentSurfaces.length +
    currentConditions.length +
    currentAccTypes.length +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0);

  const clearAll = () =>
    onChange({
      category: currentCategory,
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

  const categoryTabs = (
    <div className="pb-3 border-b border-neutral-800/80">
      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2.5 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" /> Kategoria
      </p>
      <div className="grid grid-cols-3 gap-1.5 bg-[#101010] p-1.5 rounded-2xl border border-neutral-800">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={cn(
            'py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 active:scale-95',
            currentCategory === 'all'
              ? 'bg-[#FF6B00] text-black shadow-[0_4px_15px_rgba(255,107,0,0.3)] scale-[1.02]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Wszystko</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('boots')}
          className={cn(
            'py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 active:scale-95',
            currentCategory === 'boots'
              ? 'bg-[#FF6B00] text-black shadow-[0_4px_15px_rgba(255,107,0,0.3)] scale-[1.02]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          )}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>Korki</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('accessories')}
          className={cn(
            'py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 active:scale-95',
            currentCategory === 'accessories'
              ? 'bg-[#FF6B00] text-black shadow-[0_4px_15px_rgba(255,107,0,0.3)] scale-[1.02]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          )}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Akcesoria</span>
        </button>
      </div>
    </div>
  );

  const filterContent = (
    <div className="divide-y-0">
      {categoryTabs}

      {/* FILTRY KORKÓW */}
      {(currentCategory === 'all' || currentCategory === 'boots') && (
        <div className="animate-fade-in">
          <FilterSection title="Rozmiar (EU)" defaultOpen={true}>
            <div className="grid grid-cols-4 gap-1.5">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChange({ ...filters, sizes: toggle(currentSizes, size) })}
                  className={cn(
                    'text-xs py-1.5 rounded-lg font-medium transition-all active:scale-90 duration-200',
                    currentSizes.includes(size)
                      ? 'bg-[#FF6B00] text-black font-bold shadow-[0_2px_8px_rgba(255,107,0,0.3)]'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Marka" defaultOpen={true}>
            <div className="space-y-1.5">
              {BRANDS.map((brand) => {
                const active = currentBrands.includes(brand);
                return (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer group py-0.5">
                    <div onClick={() => onChange({ ...filters, brands: toggle(currentBrands, brand) })} className={checkboxClass(active)}>
                      {active && <CheckIcon />}
                    </div>
                    <span onClick={() => onChange({ ...filters, brands: toggle(currentBrands, brand) })} className={labelClass(active)}>{brand}</span>
                  </label>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title="Nawierzchnia" defaultOpen={false}>
            <div className="space-y-1.5">
              {SURFACES.map(({ value, label }) => {
                const active = currentSurfaces.includes(value);
                return (
                  <label key={value} className="flex items-center gap-2 cursor-pointer group py-0.5">
                    <div onClick={() => onChange({ ...filters, surfaces: toggle(currentSurfaces, value) })} className={checkboxClass(active)}>
                      {active && <CheckIcon />}
                    </div>
                    <span onClick={() => onChange({ ...filters, surfaces: toggle(currentSurfaces, value) })} className={labelClass(active)}>{label}</span>
                  </label>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title="Poziom zaawansowania" defaultOpen={false}>
            <div className="space-y-1.5">
              {PRODUCT_LEVELS.map(({ value, label }) => {
                const active = currentLevels.includes(value);
                return (
                  <label key={value} className="flex items-center gap-2 cursor-pointer group py-0.5">
                    <div onClick={() => onChange({ ...filters, levels: toggle(currentLevels, value) })} className={checkboxClass(active)}>
                      {active && <CheckIcon />}
                    </div>
                    <span onClick={() => onChange({ ...filters, levels: toggle(currentLevels, value) })} className={labelClass(active)}>{label}</span>
                  </label>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title="Stan obuwia" defaultOpen={false}>
            <div className="space-y-1.5">
              {CONDITIONS.map((cond) => {
                const active = currentConditions.includes(cond);
                return (
                  <label key={cond} className="flex items-center gap-2 cursor-pointer group py-0.5">
                    <div onClick={() => onChange({ ...filters, conditions: toggle(currentConditions, cond) })} className={checkboxClass(active)}>
                      {active && <CheckIcon />}
                    </div>
                    <span onClick={() => onChange({ ...filters, conditions: toggle(currentConditions, cond) })} className={labelClass(active)}>{cond}</span>
                  </label>
                );
              })}
            </div>
          </FilterSection>
        </div>
      )}

      {/* FILTRY AKCESORIÓW */}
      {(currentCategory === 'all' || currentCategory === 'accessories') && (
        <div className="animate-fade-in">
          <FilterSection title="Rodzaj akcesorium" defaultOpen={true}>
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
        </div>
      )}

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
          <span className="text-neutral-600 flex-shrink-0">—</span>
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
      {/* Mobile button */}
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

      {/* Mobile sheet */}
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

      {/* Desktop sidebar */}
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
