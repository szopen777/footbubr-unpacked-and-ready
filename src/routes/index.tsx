import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useCallback } from 'react';
import { supabase, Product, Drop } from '@/lib/supabase';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import FilterSidebar, { FilterState, SortOption } from '@/components/FilterSidebar';
import DropCountdownBanner, { Countdown, calculateCountdown } from '@/components/DropCountdownBanner';
import { Zap, Package2, ShieldCheck, Loader2, ChevronDown } from 'lucide-react';
import { publishDueDrops } from '@/lib/drops';

const DEFAULT_FILTERS: FilterState = {
  sizes: [],
  brands: [],
  levels: [],
  surfaces: [],
  conditions: [],
  priceMin: '',
  priceMax: '',
};

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [nextDrop, setNextDrop] = useState<Drop | null>(null);
  const [nextDropProductCount, setNextDropProductCount] = useState(0);
  const [nextIndividualDrop, setNextIndividualDrop] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  }, []);

  const fetchNextDrop = useCallback(async () => {
    // Check for scheduled drop campaigns first
    const { data: dropData } = await supabase
      .from('drops')
      .select('*')
      .eq('status', 'scheduled')
      .gt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (dropData) {
      const drop = dropData as Drop;
      setNextDrop(drop);
      // Count products assigned to this drop
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('drop_id', drop.id)
        .eq('status', 'draft');
      setNextDropProductCount(count || 0);
      setNextIndividualDrop(null);
      return;
    }

    setNextDrop(null);
    setNextDropProductCount(0);

    // Fall back to individual scheduled products
    const { data: prodData } = await supabase
      .from('products')
      .select('drop_scheduled_at')
      .eq('status', 'draft')
      .not('drop_scheduled_at', 'is', null)
      .order('drop_scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (prodData?.drop_scheduled_at) {
      setNextIndividualDrop(prodData.drop_scheduled_at);
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
        .not('drop_scheduled_at', 'is', null);
      setNextDropProductCount(count || 0);
    } else {
      setNextIndividualDrop(null);
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      await publishDueDrops();
      await fetchProducts();
      await fetchNextDrop();
    };
    boot();
  }, [fetchProducts, fetchNextDrop]);

  const countdownTarget = nextDrop?.scheduled_at || nextIndividualDrop;
  useEffect(() => {
    if (!countdownTarget) {
      setCountdown(null);
      return;
    }
    const update = () => {
      const cd = calculateCountdown(countdownTarget);
      setCountdown(cd);
      if (!cd) {
        publishDueDrops().then((changed) => {
          if (changed) {
            fetchProducts();
            fetchNextDrop();
          }
        });
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [countdownTarget, fetchProducts, fetchNextDrop]);

  const filtered = products
    .filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q) && !p.model.toLowerCase().includes(q)) return false;
      }
      if (filters.sizes.length && !filters.sizes.includes(p.size_eu)) return false;
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.levels.length && !filters.levels.includes(p.level)) return false;
      if (filters.surfaces.length && !filters.surfaces.includes(p.surface_type)) return false;
      if (filters.conditions.length && !filters.conditions.includes(p.condition)) return false;
      if (filters.priceMin && p.price < Number(filters.priceMin)) return false;
      if (filters.priceMax && p.price > Number(filters.priceMax)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const available = filtered.filter((p) => p.status === 'available');
  const sold = filtered.filter((p) => p.status === 'sold');
  const allShown = [...available, ...sold];

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
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/20 backdrop-blur-md rounded-full px-4 py-1.5 mb-4 sm:mb-6 animate-fade-in-up">
              <Zap className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">Dropy 1 of 1</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-3 sm:mb-4 uppercase tracking-tight animate-fade-in-up delay-100">
              Unikatowe korki<br />
              piłkarskie w<br />
              <span className="text-[#FF6B00]">dropach 1 of 1</span>
            </h1>
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-xl animate-fade-in-up delay-200">
              Każda para to unikat. Gdy sprzedana — znika na zawsze. Nie przegap swojego rozmiaru.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-neutral-500 animate-fade-in-up delay-300">
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
                {products.filter((p) => p.status === 'available').length} par dostępnych
              </div>
            </div>
          </div>
        </div>
      </section>

      {countdown && (
        <DropCountdownBanner
          drop={nextDrop}
          pairCount={nextDropProductCount}
          countdown={countdown}
        />
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar — desktop only, mobile uses bottom sheet */}
          <div className="hidden lg:block w-60 flex-shrink-0">
            <FilterSidebar filters={filters} onChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} />
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {/* Sort bar — desktop only */}
            <div className="hidden lg:flex items-center justify-between mb-6 gap-4">
              <p className="text-sm text-neutral-500">
                {loading ? 'Ładowanie...' : `${allShown.length} ${allShown.length === 1 ? 'para' : 'par'}`}
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

            {/* Mobile filter button */}
            <div className="lg:hidden">
              <FilterSidebar filters={filters} onChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} />
            </div>

            {/* Mobile count */}
            <p className="lg:hidden text-sm text-neutral-500 mb-4 mt-3">
              {loading ? 'Ładowanie...' : `${allShown.length} ${allShown.length === 1 ? 'para' : 'par'}`}
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
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => ({
    meta: [
      { title: 'FootBubr — unikatowe korki piłkarskie w dropach 1 of 1' },
      { name: 'description', content: 'Resale korków piłkarskich 1-of-1: Nike, Adidas, Puma. Każda para to unikat — gdy sprzedana, znika na zawsze.' },
      { property: 'og:title', content: 'FootBubr — unikatowe korki piłkarskie' },
      { property: 'og:description', content: 'Dropy korków 1 of 1. Nike, Adidas, Puma i więcej. Wysyłka InPost lub kurier.' },
    ],
  }),
});
