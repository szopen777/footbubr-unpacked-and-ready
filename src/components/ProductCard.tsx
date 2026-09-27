import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Heart, ShoppingBag, Zap, Star } from 'lucide-react';
import { Product, supabase } from '@/lib/supabase';
import { formatPrice, cn } from '@/lib/utils';
import { useFavorites } from '@/lib/favorites-context';
import { useCart } from '@/lib/cart-context';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItemSilent, addItem } = useCart();
  const favorited = isFavorite(product.id);

  const [ratingStats, setRatingStats] = useState<{ avg: string; count: number } | null>(null);

  // Bezpieczne parsowanie liczb
  const currentPrice = Number(product.price) || 0;
  const originalPrice = product.original_price ? Number(product.original_price) : 0;

  const discountPercent =
    originalPrice > currentPrice && originalPrice > 0
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  useEffect(() => {
    if (!product?.id) return;

    const fetchRating = async () => {
      try {
        const { data } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', product.id);

        if (data && data.length > 0) {
          const total = data.reduce((acc, r) => acc + (r.rating || 0), 0);
          setRatingStats({
            avg: (total / data.length).toFixed(1),
            count: data.length,
          });
        }
      } catch (e) {
        console.error('Błąd pobierania ocen:', e);
      }
    };

    fetchRating();
  }, [product?.id]);

  const isSold = product.status === 'sold';
  const mainImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isShinGuards = (product.name || '').toLowerCase().includes('ochraniacze') || product.accessory_type === 'Mini ochraniacze';
    if (isShinGuards) {
      navigate({ to: '/product/$id', params: { id: product.id } });
      return;
    }

    const variantLabel = product.size_eu ? `Rozmiar: ${product.size_eu}` : undefined;
    addItemSilent(product, 1, variantLabel);
    toast.success('Dodano do koszyka', { description: product.name });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isShinGuards = (product.name || '').toLowerCase().includes('ochraniacze') || product.accessory_type === 'Mini ochraniacze';
    if (isShinGuards) {
      navigate({ to: '/product/$id', params: { id: product.id } });
      return;
    }

    const variantLabel = product.size_eu ? `Rozmiar: ${product.size_eu}` : undefined;
    addItem(product, 1, variantLabel);
    navigate({ to: '/checkout' });
  };

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group relative bg-[#141414] border border-neutral-800/80 hover:border-neutral-700 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
    >
      {/* Zdjęcie i badge rozmiaru */}
      <div className="relative aspect-square w-full bg-[#1c1c1c] overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name || ''}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
            Brak zdjęcia
          </div>
        )}

        {/* Przycisk ulubione (serduszko) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product);
          }}
          className="absolute top-3 right-3 z-20 p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 shadow-md"
          title={favorited ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              favorited ? 'text-red-500 fill-red-500 scale-110' : 'text-neutral-300 hover:text-white'
            )}
          />
        </button>

        {/* Tylko czysty badge rozmiaru w rogu */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap max-w-[70%]">
          <div className="bg-[#FF6B00] text-black font-black text-[10px] sm:text-xs uppercase px-2.5 py-1 rounded-xl shadow-lg truncate">
            {(product as any).badge_label || product.size_eu || 'ONE SIZE'}
          </div>
        </div>

        {isSold && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-black text-xs sm:text-sm tracking-widest rotate-[-12deg] border-2 border-white/80 px-3 py-1 rounded backdrop-blur-md bg-black/30">
              WYPRZEDANE
            </span>
          </div>
        )}
      </div>

      {/* Szczegóły produktu */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-[#FF6B00] uppercase tracking-wider truncate">
              {product.brand || 'FOOTBUBR'}
            </span>

            {ratingStats && (
              <div className="flex items-center gap-1 bg-white/5 border border-neutral-800 px-2 py-0.5 rounded-lg flex-shrink-0">
                <Star className="w-3 h-3 text-[#FF6B00] fill-[#FF6B00]" />
                <span className="text-[11px] font-bold text-white font-mono">{ratingStats.avg}</span>
                <span className="text-[10px] text-neutral-500">({ratingStats.count})</span>
              </div>
            )}
          </div>

          <h3 className="font-bold text-white text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-[#FF6B00] transition-colors">
            {product.name}
          </h3>

          {/* Zielona plakietka rabatu zamiast "Nowe z metką" */}
          {discountPercent !== null && (
            <div className="pt-0.5 flex items-center">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-md">
                -{discountPercent}% taniej
              </span>
            </div>
          )}
        </div>

        {/* Ceny i przyciski akcji */}
        <div className="space-y-3 pt-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-black text-white">{formatPrice(currentPrice)}</span>
            {originalPrice > currentPrice && (
              <span className="text-xs text-neutral-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {!isSold && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-neutral-800 bg-white/5 hover:bg-white/10 hover:border-neutral-700 text-neutral-200 text-xs font-bold transition-all active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Koszyk
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A00] text-black text-xs font-black uppercase transition-all shadow-[0_2px_10px_rgba(255,107,0,0.25)] active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                Kup teraz
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
