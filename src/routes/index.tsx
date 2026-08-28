import DropCelebrationOverlay from '@/components/DropCelebrationOverlay';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, Product, DropSettings } from '@/lib/supabase';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import FilterSidebar, { FilterState, SortOption } from '@/components/FilterSidebar';
import DropCountdownBanner, { Countdown, calculateCountdown } from '@/components/DropCountdownBanner';
import { Zap, Package2, ShieldCheck, Loader as Loader2, ChevronDown } from 'lucide-react';

const DEFAULT_FILTERS: FilterState = {
  category: 'all',
  sizes: [],
  brands: [],
  levels: [],
  surfaces: [],
  conditions: [],
  accessoryTypes: [],
  priceMin: '',
  priceMax: '',
};

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [dropSettings, setDropSettings] = useState<DropSettings | null>(null);
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showCelebration, setShowCelebration] = useState(false);
  
  const celebrationTriggeredRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();

    await supabase
      .from('products')
      .update({ status: 'available', drop_scheduled_at: null })
      .eq('status', 'draft')
      .lte('drop_scheduled_at', nowIso);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('status', ['available', 'draft'])
      .order('created_at', { ascending: false });

    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  }, []);

  const fetchDropSettings = useCallback(async () => {
    const { data } = await supabase
      .from('drop_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (data) {
      const s = data as DropSettings;
      setDropSettings(s);

      if (s.featured_product_id) {
        const { data: prod } = await supabase
          .from('products')
          .select('*')
          .eq('id', s.featured_product_id)
          .maybeSingle();
        setFeaturedProduct(prod as Product | null);
      } else {
        setFeaturedProduct(null);
      }
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      await fetchProducts();
      await fetchDropSettings();
    };
    boot();
  }, [fetchProducts, fetchDropSettings]);

  const countdownTarget = dropSettings && !dropSettings.is_tbd && dropSettings.drop_date
    ? dropSettings.drop_date
    : null;

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  useEffect(() => {
    if (!countdownTarget) {
      setCountdown(null);
      return;
    }

    const targetMs = new Date(countdownTarget).getTime();
    const celebrationKey = `drop_celebrated_${countdownTarget}`;

    const update = () => {
      const now = Date.now();
      const diff = targetMs - now;

      if (diff > 0) {
        const cd = calculateCountdown(countdownTarget);
        setCountdown(cd);
      } else {
        setCountdown(null);
        
        const alreadyCelebrated = sessionStorage.getItem(celebrationKey) === 'true';

        if (diff > -10000 && !celebrationTriggeredRef.current && !alreadyCelebrated) {
          celebrationTriggeredRef.current = true;
          sessionStorage.setItem(celebrationKey, 'true');
          setShowCelebration(true);
          fetchProducts();
        }
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [countdownTarget, fetchProducts]);

  const visibleProducts = products.filter((p) => {
    if (p.status === 'available') return true;
    if (p.status === 'draft' && p.drop_scheduled_at) {
      const dropTime = new Date(p.drop_scheduled_at).getTime();
      return !isNaN(dropTime) && dropTime <= currentTime;
    }
    return false;
  });

  const filtered = visibleProducts
    .filter((p: any) => {
      const pName = (p.name || '').toLowerCase();
      const pBrand = (p.brand || '').toLowerCase();
      const pModel = (p.model || '').toLowerCase();
      const pAccType = (p.accessory_type || '').toLowerCase();

      const isAccessory =
        pBrand === 'footbubr' ||
        pName.includes('skarpety') ||
        pName.includes('ochraniacze') ||
        pName.includes('taśma') ||
        pName.includes('tasma') ||
        pName.includes('zestaw') ||
        pModel.includes('skarpety') ||
        pModel.includes('ochraniacze') ||
        Boolean(p.accessory_type);

      const selectedCategory = filters.category || 'all';

      if (selectedCategory === 'boots' && isAccessory) return false;
      if (selectedCategory === 'accessories' && !isAccessory) return false;

      if (search) {
        const q = search.toLowerCase();
        if (!pName.includes(q) && !pBrand.includes(q) && !pModel.includes(q)) return false;
      }

      if (!isAccessory) {
        if (filters.sizes?.length && !filters.sizes.includes(p.size_eu)) return false;
        if (filters.brands?.length && !filters.brands.includes(p.brand)) return false;
        if (filters.levels?.length && !filters.levels.includes(p.level)) return false;
        if (filters.surfaces?.length && !filters.surfaces.includes(p.surface_type)) return false;
        if (filters.conditions?.length && !filters.conditions.includes(p.condition)) return false;
      }

      // Jeśli zaznaczono filtry rodzajów akcesoriów
      if (filters.accessoryTypes?.length) {
        if (!isAccessory) return false; // Ukryj buty, gdy filtrowane są konkretne akcesoria

        const matchesType = filters.accessoryTypes.some((type) => {
          const target = type.toLowerCase();
          if (target.includes('skarpety') && (pAccType.includes('skarpety') || pName.includes('skarpety') || pModel.includes('skarpety'))) return true;
          if (target.includes('ochraniacze') && (pAccType.includes('ochraniacze') || pName.includes('ochraniacze') || pModel.includes('ochraniacze'))) return true;
          if (target.includes('taśmy') && (pAccType.includes('taśm') || pName.includes('taśm') || pName.includes('tasm') || pName.includes('tape'))) return true;
          if (target.includes('zestawy') && (pAccType.includes('zestaw') || pName.includes('zestaw') || pModel.includes('set'))) return true;
          return false;
        });
        if (!matchesType) return false;
      }

      if (filters.priceMin && p.price < Number(filters.priceMin)) return false;
      if (filters.priceMax && p.price > Number(filters.priceMax)) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const allShown = filtered;

  const sortOptions = [
    { value: 'newest', label: 'Najnowsze' },
    { value: 'price_asc', label: 'Cena: rosnąco' },
    { value: 'price_desc', label: 'Cena: malejąco' },
  ];

  return (
    <div className="min-h-screen">
      <Header searchValue={search} onSearchChange={setSearch} />
      <CartDrawer />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-800/80">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/8 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute inset-0 bg-radial-grid opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/20 backdrop-blur-md rounded-full px-4 py-1.5 mb-4 sm:mb-6 animate-fade-in-up">
              <Zap className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">Dropy 1 of 1 & Akcesoria</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-3 sm:mb-4 uppercase tracking-tight animate-fade-in-up delay-100">
              Unikatowe korki<br />
              piłkarskie w<br />
              <span className="text-[#FF6B00]">dropach 1 of 1</span>
            </h1>
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto animate-fade-in-up delay-200">
              Każda para to unikat. Gdy sprzedana — znika na zawsze. Nie przegap swojego rozmiaru.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-neutral-500 animate-fade-in-up delay-300">
              <div className="flex items-center gap-1.5">
                <Package2 className="w-4 h-4 text-[#FF6B00]" />
                Wysyłka InPost / Kurier
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
                Weryfikacja autentyczności
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#FF6B00]" />
                {visibleProducts.length} produktów w ofercie
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown banner */}
      <DropCountdownBanner
        dropSettings={dropSettings}
        featuredProduct={featuredProduct}
        countdown={countdown}
      />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar filters={filters} onChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} />
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {/* Sort bar desktop */}
            <div className="hidden lg:flex items-center justify-between mb-6 gap-4">
              <p className="text-sm text-neutral-500">
                {loading ? 'Ładowanie...' : `${allShown.length} ${allShown.length === 1 ? 'produkt' : 'produktów'}`}
              </p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-[#1a1a1a] border border-neutral-800 rounded-xl pl-4 pr-9 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#FF6B00]/60 cursor-pointer transition-all [&>option]:bg-[#1a1a1a] [&>option]:text-neutral-100"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            {/* Mobile filter */}
            <div className="lg:hidden">
              <FilterSidebar filters={filters} onChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} />
            </div>

            {/* Mobile count */}
            <p className="lg:hidden text-sm text-neutral-500 mb-4 mt-3">
              {loading ? 'Ładowanie...' : `${allShown.length} ${allShown.length === 1 ? 'produkt' : 'produktów'}`}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
              </div>
            ) : allShown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-white/5 border border-neutral-800 rounded-2xl flex items-center justify-center mb-4">
                  <Package2 className="w-8 h-8 text-neutral-700" />
                </div>
                <p className="text-neutral-300 font-medium mb-1">Brak wyników</p>
                <p className="text-neutral-600 text-sm">Zmień filtry lub wyszukiwanie</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                {allShown.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCelebration && (
        <DropCelebrationOverlay onComplete={handleCloseCelebration} />
      )}
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => ({
    meta: [
      { title: 'FootBubr — unikatowe korki piłkarskie w dropach 1 of 1 & Akcesoria' },
      { name: 'description', content: 'Resale korków piłkarskich 1-of-1 oraz akcesoria piłkarskie FOOTBUBR. Wysyłka InPost lub kurier.' },
      { property: 'og:title', content: 'FootBubr — unikatowe korki piłkarskie' },
      { property: 'og:description', content: 'Dropy korków 1 of 1 oraz akcesoria piłkarskie. Wysyłka InPost lub kurier.' },
    ],
  }),
});
