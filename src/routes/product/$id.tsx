import { useEffect, useState } from 'react';
import { supabase, Product } from '@/lib/supabase';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { cn, formatPrice, SURFACE_LABELS, CONDITION_COLORS } from '@/lib/utils';
import { ShoppingBag, ArrowLeft, CircleAlert as AlertCircle, Package, CircleCheck as CheckCircle2, Circle as XCircle, ChevronLeft, ChevronRight, Loader as Loader2, ZoomIn, Zap, Ruler, ShieldCheck, Truck, Lock, Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { Link, useNavigate, createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import SizeChartModal from '@/components/SizeChartModal';

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem, addItemSilent, items } = useCart();

  const cartItem = product ? items.find((i) => i.product.id === product.id) : null;
  const inCart = Boolean(cartItem);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) setProduct(data as Product);
      setLoading(false);
    };
    fetch();
  }, [id]);

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
        <Link to="/" className="text-[#FF6B00] hover:underline text-sm">Wróć do katalogu</Link>
      </div>
    );
  }

  const isSold = product.status === 'sold';
  const images = product.images.length > 0 ? product.images : [null];

  const pName = (product.name || '').toLowerCase();
  const pBrand = (product.brand || '').toLowerCase();
  const pModel = (product.model || '').toLowerCase();
  const isAccessory =
    pBrand === 'footbubr' ||
    pName.includes('skarpety') ||
    pName.includes('ochraniacze') ||
    pName.includes('taśma') ||
    pName.includes('tasma') ||
    pName.includes('zestaw') ||
    pModel.includes('skarpety') ||
    pModel.includes('ochraniacze') ||
    Boolean(product.accessory_type);

  const maxStock = product.stock_quantity ?? 1;

  const handleAddToCart = () => {
    addItemSilent(product, isAccessory ? quantity : 1);
    toast.success('Dodano do koszyka', { description: `${quantity}x ${product.name}` });
  };

  const handleBuyNow = () => {
    addItem(product, isAccessory ? quantity : 1);
    navigate({ to: '/checkout' });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <CartDrawer />

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
                <div className="flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/20 backdrop-blur-md rounded-xl px-4 py-2.5 mt-4 mb-4 animate-fade-in-up delay-200">
                  <AlertCircle className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                  <span className="text-sm font-semibold text-[#FF6B00]">
                    {isAccessory
                      ? `Dostępne w magazynie: ${maxStock} szt.`
                      : 'Tylko 1 sztuka w magazynie — unikat!'}
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-2 sm:gap-3 mt-4">
                <span className="text-2xl sm:text-3xl font-black text-white">{formatPrice(product.price)}</span>
                {product.original_price && (
                  <span className="text-base sm:text-lg text-neutral-500 line-through">{formatPrice(product.original_price)}</span>
                )}
              </div>
            </div>

            {/* Wybór ilości (Tylko dla akcesoriów) */}
            {isAccessory && !isSold && (
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

            {/* Tabela specyfikacji */}
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Specyfikacja</h3>
              </div>
              <div className="divide-y divide-neutral-800/60">
                {[
                  { label: isAccessory ? 'Rozmiar' : 'Rozmiar EU', value: isAccessory ? product.size_eu : `EU ${product.size_eu}` },
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
            {isSold ? (
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
      </div>
    </div>
  );
}

export const Route = createFileRoute('/product/$id')({
  component: ProductPage,
});
