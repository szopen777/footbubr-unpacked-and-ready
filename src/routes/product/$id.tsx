import { useEffect, useState } from 'react';
import { supabase, Product } from '@/lib/supabase';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import LiveViewersCounter from '@/components/LiveViewersCounter';
import ShareButton from '@/components/ShareButton';
import ProductReviews from '@/components/ProductReviews';
import { Skeleton } from '@/components/skeleton';
import { cn, formatPrice, SURFACE_LABELS, CONDITION_COLORS } from '@/lib/utils';
import { 
  ShoppingBag, ArrowLeft, CircleAlert as AlertCircle, Package, 
  ZoomIn, Zap, Ruler, Plus, Minus, Heart, Eye, Check
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
import { useRecentlyViewed } from '@/lib/use-recently-viewed';
import { Link, useNavigate, createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import SizeChartModal from '@/components/SizeChartModal';
import { ImageLightboxModal } from '@/components/ImageLightboxModal';

interface Variant {
  size: string;
  stock: number;
}

interface BundleLiveStocks {
  socksStock: number;
  shinGuardSStock: number;
  shinGuardXSStock: number;
  tapeBlackStock: number;
  tapeWhiteStock: number;
}

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Konfigurator zestawu
  const [bundleShinGuard, setBundleShinGuard] = useState<'S' | 'XS'>('S');
  const [bundleTapeColor, setBundleTapeColor] = useState<'Czarna' | 'Biała'>('Czarna');
  const [bundleStocks, setBundleStocks] = useState<BundleLiveStocks>({
    socksStock: 100,
    shinGuardSStock: 50,
    shinGuardXSStock: 50,
    tapeBlackStock: 50,
    tapeWhiteStock: 50,
  });

  const { addItem, addItemSilent } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { recentProducts } = useRecentlyViewed(product?.id);
  const favorited = product ? isFavorite(product.id) : false;

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const prod = data as Product;
        setProduct(prod);
        
        let variants: Variant[] = [];
        try {
          if (prod.condition_detail && prod.condition_detail.startsWith('[')) {
            variants = JSON.parse(prod.condition_detail);
          }
        } catch {}

        if (variants.length > 0) {
          setSelectedSize(variants[0].size);
        } else {
          setSelectedSize(prod.size_eu);
        }

        const pName = (prod.name || '').toLowerCase();
        const isBndl = prod.accessory_type === 'Zestawy FOOTBUBR' || pName.includes('zestaw');

        if (isBndl) {
          const { data: related } = await supabase
            .from('products')
            .select('*')
            .neq('id', prod.id);

          if (related) {
            let sStock = 100;
            let sgS = 50;
            let sgXS = 50;
            let tpBlack = 50;
            let tpWhite = 50;

            // 1. Skarpety
            const sock = related.find((p) => p.accessory_type === 'Skarpety antypoślizgowe' || p.name.toLowerCase().includes('skarpety'));
            if (sock) sStock = sock.stock_quantity ?? 0;

            // 2. Ochraniacze
            const shin = related.find((p) => p.accessory_type === 'Mini ochraniacze' || p.name.toLowerCase().includes('ochraniacze'));
            if (shin) {
              try {
                if (shin.condition_detail && shin.condition_detail.startsWith('[')) {
                  const sVariants: Variant[] = JSON.parse(shin.condition_detail);
                  const foundS = sVariants.find((v) => v.size.toUpperCase().includes('S') && !v.size.toUpperCase().includes('XS'));
                  const foundXS = sVariants.find((v) => v.size.toUpperCase().includes('XS'));
                  if (foundS) sgS = foundS.stock;
                  if (foundXS) sgXS = foundXS.stock;
                }
              } catch {}
            }

            // 3. Taśmy
            const tapes = related.filter((p) => (p.accessory_type || '').toLowerCase().includes('taśm') || p.name.toLowerCase().includes('taśma') || p.name.toLowerCase().includes('tasma'));
            tapes.forEach((t) => {
              const nameLower = t.name.toLowerCase();
              if (nameLower.includes('czarn')) tpBlack = t.stock_quantity ?? 0;
              if (nameLower.includes('biał')) tpWhite = t.stock_quantity ?? 0;
            });

            setBundleStocks({
              socksStock: sStock,
              shinGuardSStock: sgS,
              shinGuardXSStock: sgXS,
              tapeBlackStock: tpBlack,
              tapeWhiteStock: tpWhite,
            });
          }
        }
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-16">
            <div className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-16 h-16 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-6 pt-2">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-400">Produkt nie znaleziony</p>
        <Link to="/" className="text-[#FF6B00] hover:underline text-sm">Wróć do katalogu</Link>
      </div>
    );
  }

  const isSold = product.status === 'sold';
  const images = product.images.length > 0 ? product.images : [null];
  const validImages = product.images.filter(Boolean);

  const pName = (product.name || '').toLowerCase();
  const pBrand = (product.brand || '').toLowerCase();
  const isAccessory =
    pBrand === 'footbubr' ||
    pName.includes('skarpety') ||
    pName.includes('ochraniacze') ||
    pName.includes('taśma') ||
    pName.includes('tasma') ||
    pName.includes('zestaw') ||
    Boolean(product.accessory_type);

  const isBundle =
    product.accessory_type === 'Zestawy FOOTBUBR' ||
    pName.includes('zestaw');

  let variants: Variant[] = [];
  try {
    if (product.condition_detail && product.condition_detail.startsWith('[')) {
      variants = JSON.parse(product.condition_detail);
    }
  } catch {}

  const currentVariant = variants.find((v) => v.size === selectedSize);

  // Dynamiczne obliczanie realnie dostępnych zestawów w wybranej konfiguracji
  const selectedShinGuardStock = bundleShinGuard === 'S' ? bundleStocks.shinGuardSStock : bundleStocks.shinGuardXSStock;
  const selectedTapeStock = bundleTapeColor === 'Czarna' ? bundleStocks.tapeBlackStock : bundleStocks.tapeWhiteStock;
  
  const realBundleStock = isBundle
    ? Math.min(bundleStocks.socksStock, selectedShinGuardStock, selectedTapeStock, product.stock_quantity ?? 100)
    : 0;

  const maxStock = isBundle
    ? realBundleStock
    : currentVariant ? currentVariant.stock : (product.stock_quantity ?? 1);

  const getProductForCart = () => {
    if (isBundle) {
      const shinGuardLabel = bundleShinGuard === 'S' ? 'S (10x6 cm)' : 'XS (8x5 cm)';
      return {
        ...product,
        size_eu: `Ochraniacze: ${shinGuardLabel} | Taśma: ${bundleTapeColor}`,
      };
    }

    return {
      ...product,
      size_eu: selectedSize || product.size_eu,
    };
  };

  const handleAddToCart = () => {
    const itemToAdd = getProductForCart();
    addItemSilent(itemToAdd, isAccessory ? quantity : 1);
    toast.success('Dodano do koszyka', { description: `${quantity}x ${itemToAdd.name} (${itemToAdd.size_eu})` });
  };

  const handleBuyNow = () => {
    const itemToAdd = getProductForCart();
    addItem(itemToAdd, isAccessory ? quantity : 1);
    navigate({ to: '/checkout' });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <CartDrawer />

      <SizeChartModal 
        isOpen={showSizeChart} 
        onClose={() => setShowSizeChart(false)} 
        initialBrand={product.brand}
      />

      <ImageLightboxModal
        images={validImages}
        initialIndex={activeImage}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-2 mb-6 text-sm text-neutral-500 animate-fade-in overflow-hidden">
          <Link to="/" className="hover:text-white transition-colors flex items-center gap-1 flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Katalog</span>
          </Link>
          <span className="text-neutral-700 flex-shrink-0">/</span>
          <span className="text-neutral-400 flex-shrink-0">{product.brand}</span>
          <span className="text-neutral-700 flex-shrink-0">/</span>
          <span className="text-neutral-300 truncate">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-16">
          <div className="space-y-3 animate-fade-in-up">
            <div
              className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#141414] border border-neutral-800 cursor-zoom-in group"
              onClick={() => {
                if (images[activeImage]) setLightboxOpen(true);
              }}
            >
              {images[activeImage] ? (
                <>
                  <img
                    src={images[activeImage]!}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-700">Brak zdjęcia</div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(product);
                }}
                className="absolute top-3 left-3 z-10 p-3 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 shadow-lg"
              >
                <Heart className={cn('w-5 h-5 transition-colors', favorited ? 'text-red-500 fill-red-500 scale-110' : 'text-neutral-300 hover:text-white')} />
              </button>

              <div className="absolute top-3 right-3 z-10">
                <ShareButton title={product.name} />
              </div>

              {isSold && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none">
                  <span className="text-white font-black text-xl sm:text-2xl tracking-widest rotate-[-12deg] border-2 sm:border-4 border-white/80 px-4 sm:px-6 py-1.5 sm:py-2 rounded backdrop-blur-md bg-black/30">
                    WYPRZEDANE
                  </span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all active:scale-90',
                      activeImage === i ? 'border-[#FF6B00]' : 'border-neutral-800 opacity-60 hover:opacity-100'
                    )}
                  >
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5 sm:gap-6 animate-fade-in-up delay-100">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <span className="text-sm font-bold text-[#FF6B00] uppercase tracking-wider">{product.brand}</span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border backdrop-blur-md', CONDITION_COLORS[product.condition] || 'text-neutral-300 bg-white/5 border-neutral-700')}>
                  {product.condition}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tight">{product.name}</h1>

              {!isSold && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 mb-3">
                  <div className="flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/20 backdrop-blur-md rounded-xl px-4 py-2 flex-1">
                    <AlertCircle className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-[#FF6B00]">
                      {isBundle
                        ? `Dostępne w tej konfiguracji: ${maxStock} kpl.`
                        : isAccessory
                        ? `Dostępne w magazynie: ${maxStock} szt.`
                        : 'Tylko 1 sztuka w magazynie — unikat!'}
                    </span>
                  </div>
                  <LiveViewersCounter productId={product.id} />
                </div>
              )}

              <div className="flex items-baseline gap-2 sm:gap-3 mt-4">
                <span className="text-2xl sm:text-3xl font-black text-white">{formatPrice(product.price)}</span>
                {product.original_price && (
                  <span className="text-base sm:text-lg text-neutral-500 line-through">{formatPrice(product.original_price)}</span>
                )}
              </div>
            </div>

            {/* KONFIGURATOR ZESTAWU FOOTBUBR PRO */}
            {isBundle && !isSold && (
              <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Zawartość Twojego zestawu:
                  </span>
                  <span className="text-[11px] text-[#FF6B00] font-bold">Komplet 3w1</span>
                </div>

                {/* 1. SKARPETY */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-neutral-800/80">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white uppercase">1. Skarpety antypoślizgowe</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Białe z gripem · <span className="text-neutral-400 font-medium">Stan: {bundleStocks.socksStock} par</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-neutral-300 bg-white/5 border border-neutral-700 px-2.5 py-1 rounded-lg">
                    One Size (41-44)
                  </span>
                </div>

                {/* 2. OCHRANIACZE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-bold uppercase">2. Wybierz rozmiar ochraniaczy:</span>
                    <span className="text-[#FF6B00] font-bold text-[11px]">
                      {bundleShinGuard === 'S' ? `S (${bundleStocks.shinGuardSStock} szt.)` : `XS (${bundleStocks.shinGuardXSStock} szt.)`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={bundleStocks.shinGuardSStock === 0}
                      onClick={() => setBundleShinGuard('S')}
                      className={cn(
                        'flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all',
                        bundleShinGuard === 'S'
                          ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-white shadow-[0_0_12px_rgba(255,107,0,0.2)]'
                          : 'border-neutral-800 bg-black/40 text-neutral-400 hover:text-white',
                        bundleStocks.shinGuardSStock === 0 && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm">Rozmiar S</span>
                        <span className="text-[10px] font-bold text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded">
                          {bundleStocks.shinGuardSStock} szt.
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1">10x6 cm (Klasyczny mini)</span>
                    </button>

                    <button
                      type="button"
                      disabled={bundleStocks.shinGuardXSStock === 0}
                      onClick={() => setBundleShinGuard('XS')}
                      className={cn(
                        'flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all',
                        bundleShinGuard === 'XS'
                          ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-white shadow-[0_0_12px_rgba(255,107,0,0.2)]'
                          : 'border-neutral-800 bg-black/40 text-neutral-400 hover:text-white',
                        bundleStocks.shinGuardXSStock === 0 && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm">Rozmiar XS</span>
                        <span className="text-[10px] font-bold text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded">
                          {bundleStocks.shinGuardXSStock} szt.
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1">8x5 cm (Ultra micro)</span>
                    </button>
                  </div>
                </div>

                {/* 3. TAŚMA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-bold uppercase">3. Wybierz kolor taśmy getrowej:</span>
                    <span className="text-white font-bold text-[11px]">
                      {bundleTapeColor === 'Czarna' ? `Czarna (${bundleStocks.tapeBlackStock} szt.)` : `Biała (${bundleStocks.tapeWhiteStock} szt.)`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={bundleStocks.tapeBlackStock === 0}
                      onClick={() => setBundleTapeColor('Czarna')}
                      className={cn(
                        'flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all',
                        bundleTapeColor === 'Czarna'
                          ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-white shadow-[0_0_12px_rgba(255,107,0,0.2)]'
                          : 'border-neutral-800 bg-black/40 text-neutral-400 hover:text-white',
                        bundleStocks.tapeBlackStock === 0 && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-black border border-white/20" />
                        <span className="font-bold text-xs">Czarna</span>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded">
                        {bundleStocks.tapeBlackStock} szt.
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={bundleStocks.tapeWhiteStock === 0}
                      onClick={() => setBundleTapeColor('Biała')}
                      className={cn(
                        'flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all',
                        bundleTapeColor === 'Biała'
                          ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-white shadow-[0_0_12px_rgba(255,107,0,0.2)]'
                          : 'border-neutral-800 bg-black/40 text-neutral-400 hover:text-white',
                        bundleStocks.tapeWhiteStock === 0 && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-white border border-neutral-300" />
                        <span className="font-bold text-xs">Biała</span>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded">
                        {bundleStocks.tapeWhiteStock} szt.
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WYBÓR ROZMIARU DLA POJEDYNCZYCH PRODUKTÓW */}
            {!isBundle && variants.length > 0 && !isSold && (
              <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300 uppercase tracking-wider">Wybierz rozmiar:</span>
                  <span className="text-neutral-500">Wybrany: <strong className="text-[#FF6B00]">{selectedSize}</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {variants.map((v) => {
                    const isSelected = selectedSize === v.size;
                    const isOutOfStock = v.stock === 0;
                    return (
                      <button
                        key={v.size}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          setSelectedSize(v.size);
                          setQuantity(1);
                        }}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                          isSelected
                            ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-white shadow-[0_0_15px_rgba(255,107,0,0.25)]'
                            : 'border-neutral-800 bg-black/40 text-neutral-300 hover:border-neutral-700 hover:text-white',
                          isOutOfStock && 'opacity-30 cursor-not-allowed'
                        )}
                      >
                        <div className="min-w-0">
                          <span className="font-black text-sm block truncate">{v.size}</span>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">
                            {isOutOfStock ? 'Brak w magazynie' : `Stan: ${v.stock} szt.`}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#FF6B00] flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wybór ilości */}
            {isAccessory && !isSold && maxStock > 0 && (
              <div className="flex items-center gap-4 bg-[#141414] border border-neutral-800 rounded-2xl p-4">
                <span className="text-sm text-neutral-400 font-medium">Wybierz ilość:</span>
                <div className="flex items-center bg-black/40 border border-neutral-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-white text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    className="p-2.5 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Specyfikacja */}
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Specyfikacja</h3>
                {!isAccessory && (
                  <div className="flex items-center gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="flex items-center gap-1.5 font-bold text-[#FF6B00] hover:text-[#FF7A00] transition-colors"
                    >
                      <Ruler className="w-3.5 h-3.5" /> Tabela rozmiarów
                    </button>
                  </div>
                )}
              </div>
              <div className="divide-y divide-neutral-800/60">
                {[
                  { 
                    label: isBundle ? 'Wariant zestawu' : 'Rozmiar', 
                    value: isBundle 
                      ? `Ochraniacze: ${bundleShinGuard} • Taśma: ${bundleTapeColor}` 
                      : (selectedSize || product.size_eu) 
                  },
                  ...(!isAccessory && product.insole_length_cm ? [{ label: 'Długość wkładki', value: `${product.insole_length_cm} cm` }] : []),
                  ...(!isAccessory ? [
                    { label: 'Nawierzchnia', value: SURFACE_LABELS[product.surface_type] || product.surface_type },
                    { label: 'Poziom', value: product.level },
                  ] : []),
                  { label: 'Stan', value: product.condition },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-neutral-500">{label}</span>
                    <span className="text-sm font-semibold text-white text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Przyciski zakupu */}
            {isSold || (isAccessory && maxStock === 0) ? (
              <div className="flex items-center justify-center gap-2 bg-white/5 border border-neutral-800 text-neutral-500 font-bold py-4 rounded-2xl">
                <Package className="w-5 h-5" />
                WYPRZEDANE
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2.5 font-bold text-sm sm:text-base py-4 rounded-2xl border border-[#FF6B00]/40 hover:border-[#FF6B00] hover:bg-[#FF6B00]/10 text-neutral-200 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Dodaj do koszyka
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center gap-2.5 font-black text-sm sm:text-base py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#FF7A00] text-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(255,107,0,0.3)]"
                >
                  <Zap className="w-5 h-5" />
                  Kup teraz
                </button>
              </div>
            )}
          </div>
        </div>

        {isAccessory && (
          <ProductReviews productId={product.id} productName={product.name} />
        )}

        {recentProducts.length > 0 && (
          <div className="mt-14 sm:mt-18 pt-10 border-t border-neutral-800/80 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-6">
              <Eye className="w-5 h-5 text-[#FF6B00]" />
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Ostatnio oglądane</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {recentProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/product/$id')({
  component: ProductPage,
});
