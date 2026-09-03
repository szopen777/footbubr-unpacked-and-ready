import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Heart, ShoppingBag, Zap, Star } from 'lucide-react';
import { Product, supabase } from '@/lib/supabase';
import { formatPrice, cn, CONDITION_COLORS } from '@/lib/utils';
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

  useEffect(() => {
    if (!isAccessory) return;

    const fetchRating = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', product.id);

      if (data && data.length > 0) {
        const total = data.reduce((acc, r) => acc + r.rating, 0);
        setRatingStats({
          avg: (total / data.length).toFixed(1),
          count: data.length,
        });
      }
    };

    fetchRating();
  }, [product.id, isAccessory]);

  const isSold = product.status === 'sold';
  const mainImage = product.images?.[0] || null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItemSilent(product, 1);
    toast.success('Dodano do koszyka', { description: product.name });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    navigate({ to: '/checkout' });
  };

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group relative bg-[#141414] border border-neutral-800/80 hover:border-neutral-700 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
    >
      {/* Zdjęcie i badge */}
      <div className="relative aspect-square w-full bg-[#1c1c1c] overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
            Brak zdjęcia
          </div>
        )}

        {/* Ulubione */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product);
          }}
          className="absolute top-3 left-3 z-10 p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90"
          title={favorited ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              favorited ? 'text-red-500 fill-red-500 scale-110' : 'text-neutral-300 hover:text-white'
            )}
          />
        </button>

        {/* Badge rozmiaru oraz nawierzchni na zdjęciu */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {!isAccessory && product.surface_type && (
            <span className="bg-black/60 backdrop-blur-md text-white border border-white/15 font-black text-[10px] sm:text-xs uppercase px-2 py-1 rounded-xl shadow-lg tracking-wider">
              {product.surface_type}
            </span>
          )}
          <div className="bg-[#FF6B00] text-black font-black text-[10px] sm:text-xs uppercase px-2.5 py-1 rounded-xl shadow-lg">
            {isAccessory ? (product.size_eu || 'ONE SIZE') : `EU ${product.size_eu}`}
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
              {product.brand}
            </span>

            {/* Oceny gwiazdkowe (tylko akcesoria ze zweryfikowanymi opiniami) */}
            {isAccessory && ratingStats && (
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

          {/* Stan obuwia oraz nawierzchnia w dolnej belce opisu */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                CONDITION_COLORS[product.condition] || 'text-neutral-400 bg-white/5 border-neutral-800'
              )}
            >
              {product.condition}
            </span>

            {!isAccessory && product.surface_type && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-neutral-700 bg-white/5 text-neutral-300 uppercase">
                {product.surface_type}
              </span>
            )}
          </div>
        </div>

        {/* Ceny i przyciski akcji */}
        <div className="space-y-3 pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-white">{formatPrice(product.price)}</span>
            {product.original_price && (
              <span className="text-xs text-neutral-500 line-through">
                {formatPrice(product.original_price)}
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
