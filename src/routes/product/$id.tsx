'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, Product } from '@/lib/supabase';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { cn, formatPrice, SURFACE_LABELS, CONDITION_COLORS } from '@/lib/utils';
import { ShoppingBag, ArrowLeft, AlertCircle, Package, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2, ZoomIn, Zap } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const { addItem, addItemSilent, items } = useCart();

  const inCart = product ? items.some((i) => i.product.id === product.id) : false;

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();
      if (!error && data) setProduct(data as Product);
      setLoading(false);
    };
    fetch();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-400">Produkt nie znaleziony</p>
        <Link href="/" className="text-[#FF6B00] hover:underline text-sm">Wróć do katalogu</Link>
      </div>
    );
  }

  const isSold = product.status === 'sold';
  const images = product.images.length > 0 ? product.images : [null];

  const handleAddToCart = () => {
    if (inCart) return;
    addItemSilent(product);
    toast.success('Dodano do koszyka', { description: product.name });
  };

  const handleBuyNow = () => {
    if (!inCart) addItem(product);
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen">
      <Header />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-neutral-500 animate-fade-in overflow-hidden">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1 flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Katalog</span>
          </Link>
          <span className="text-neutral-700 flex-shrink-0">/</span>
          <span className="text-neutral-400 flex-shrink-0">{product.brand}</span>
          <span className="text-neutral-700 flex-shrink-0">/</span>
          <span className="text-neutral-300 truncate">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-16">
          {/* Gallery */}
          <div className="space-y-3 animate-fade-in-up">
            {/* Main image */}
            <div
              className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#141414] border border-neutral-800 cursor-zoom-in group"
              onClick={() => setZoomed(!zoomed)}
            >
              {images[activeImage] ? (
                <img
                  src={images[activeImage]!}
                  alt={product.name}
                  className={cn(
                    'w-full h-full object-cover transition-transform duration-500',
                    zoomed ? 'scale-150' : 'group-hover:scale-105'
                  )}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-700">Brak zdjęcia</div>
              )}
              {isSold && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-white font-black text-xl sm:text-2xl tracking-widest rotate-[-12deg] border-2 sm:border-4 border-white/80 px-4 sm:px-6 py-1.5 sm:py-2 rounded backdrop-blur-md bg-black/30">
                    WYPRZEDANE
                  </span>
                </div>
              )}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-1.5">
                  <ZoomIn className="w-4 h-4 text-white" />
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImage((a) => (a - 1 + images.length) % images.length); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-2 text-white hover:bg-black/80 hover:scale-110 transition-all active:scale-90"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImage((a) => (a + 1) % images.length); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-2 text-white hover:bg-black/80 hover:scale-110 transition-all active:scale-90"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
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
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col gap-5 sm:gap-6 animate-fade-in-up delay-100">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <span className="text-sm font-bold text-[#FF6B00] uppercase tracking-wider">{product.brand}</span>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full border backdrop-blur-md',
                    CONDITION_COLORS[product.condition] || 'text-neutral-300 bg-white/5 border-neutral-700'
                  )}
                >
                  {product.condition}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tight">{product.name}</h1>

              {/* Urgency */}
              {!isSold && (
                <div className="flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/20 backdrop-blur-md rounded-xl px-4 py-2.5 mt-4 mb-4 animate-fade-in-up delay-200">
                  <AlertCircle className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                  <span className="text-sm font-semibold text-[#FF6B00]">Tylko 1 sztuka w magazynie — unikat!</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2 sm:gap-3 mt-4">
                <span className="text-2xl sm:text-3xl font-black text-white">{formatPrice(product.price)}</span>
                {product.original_price && (
                  <span className="text-base sm:text-lg text-neutral-500 line-through">{formatPrice(product.original_price)}</span>
                )}
                {product.original_price && (
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 backdrop-blur-md px-2 py-0.5 rounded-lg">
                    -{Math.round((1 - product.price / product.original_price) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Specs table */}
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Specyfikacja</h3>
              </div>
              <div className="divide-y divide-neutral-800/60">
                {[
                  { label: 'Rozmiar EU', value: `EU ${product.size_eu}` },
                  ...(product.insole_length_cm ? [{ label: 'Długość wkładki', value: `${product.insole_length_cm} cm` }] : []),
                  { label: 'Nawierzchnia', value: SURFACE_LABELS[product.surface_type] || product.surface_type },
                  { label: 'Poziom', value: product.level },
                  { label: 'Stan', value: product.condition },
                  { label: 'Oryginalne pudełko', value: product.box_included ? 'Tak' : 'Nie' },
                  { label: 'Worek/torba', value: product.bag_included ? 'Tak' : 'Nie' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-neutral-500">{label}</span>
                    <span className="text-sm font-semibold text-white text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Condition detail */}
            {product.condition_detail && (
              <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Opis stanu</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">{product.condition_detail}</p>
              </div>
            )}

            {/* Extras */}
            {product.extras_description && (
              <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Dodatki</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">{product.extras_description}</p>
              </div>
            )}

            {/* Extras icons */}
            <div className="flex items-center gap-4 text-sm">
              <div className={cn('flex items-center gap-1.5', product.box_included ? 'text-emerald-400' : 'text-neutral-600')}>
                {product.box_included ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                Pudełko
              </div>
              <div className={cn('flex items-center gap-1.5', product.bag_included ? 'text-emerald-400' : 'text-neutral-600')}>
                {product.bag_included ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                Worek
              </div>
            </div>

            {/* Dual CTA buttons */}
            {isSold ? (
              <div className="flex items-center justify-center gap-2 bg-white/5 border border-neutral-800 text-neutral-500 font-bold py-4 rounded-2xl">
                <Package className="w-5 h-5" />
                WYPRZEDANE
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={inCart}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2.5 font-bold text-sm sm:text-base py-4 rounded-2xl border transition-all active:scale-95',
                    inCart
                      ? 'bg-white/5 text-neutral-500 border-neutral-800 cursor-default'
                      : 'bg-transparent text-neutral-200 border-[#FF6B00]/40 hover:border-[#FF6B00] hover:bg-[#FF6B00]/10'
                  )}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {inCart ? 'W koszyku' : 'Dodaj do koszyka'}
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
      </div>
    </div>
  );
}
