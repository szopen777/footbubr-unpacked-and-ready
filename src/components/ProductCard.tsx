'use client';

import { Product } from '@/lib/supabase';
import { cn, formatPrice, CONDITION_COLORS } from '@/lib/utils';
import { ShoppingBag, Eye, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, addItemSilent, items } = useCart();
  const router = useRouter();
  const inCart = items.some((i) => i.product.id === product.id);
  const isSold = product.status === 'sold';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) return;
    addItemSilent(product);
    toast.success('Dodano do koszyka', {
      description: product.name,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) addItem(product);
    router.push('/checkout');
  };

  return (
    <div
      className={cn(
        'group relative bg-[#141414] rounded-2xl border border-neutral-800/80 overflow-hidden transition-all duration-300',
        !isSold && 'hover:-translate-y-1.5 hover:border-[#FF6B00]/40 hover:shadow-[0_10px_30px_rgba(255,107,0,0.15)]',
        isSold && 'opacity-70'
      )}
    >
      {/* Image */}
      <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#1a1a1a]">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              !isSold && 'group-hover:scale-105'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-700 text-sm">Brak zdjęcia</div>
        )}

        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-black text-base sm:text-xl tracking-widest rotate-[-12deg] border-2 sm:border-4 border-white/80 px-3 sm:px-4 py-1 sm:py-1.5 rounded backdrop-blur-md bg-black/30">
              WYPRZEDANE
            </span>
          </div>
        )}

        {/* Surface badge — glassmorphism */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
          <span className="text-[10px] sm:text-xs font-bold backdrop-blur-md bg-white/5 border border-white/10 text-neutral-200 px-1.5 sm:px-2 py-0.5 rounded-md">
            {product.surface_type}
          </span>
        </div>

        {/* Size badge — prominent orange */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5">
          <span className="text-xs sm:text-sm font-black bg-[#FF6B00] text-black px-2 sm:px-2.5 py-0.5 rounded-md shadow-[0_2px_10px_rgba(255,107,0,0.3)]">
            EU {product.size_eu}
          </span>
        </div>

        {/* Quick view overlay */}
        {!isSold && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center">
            <span className="flex items-center gap-2 bg-white text-black font-semibold text-sm px-4 py-2 rounded-xl transition-all transform translate-y-2 group-hover:translate-y-0 duration-300">
              <Eye className="w-4 h-4" />
              Podgląd
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <div className="mb-1">
          <span className="text-[10px] sm:text-xs font-bold text-[#FF6B00] uppercase tracking-wider">{product.brand}</span>
        </div>
        <h3 className="font-bold text-white text-xs sm:text-sm leading-tight line-clamp-2 mb-2">{product.name}</h3>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span
            className={cn(
              'text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full border backdrop-blur-md',
              CONDITION_COLORS[product.condition] || 'text-neutral-300 bg-white/5 border-neutral-700'
            )}
          >
            {product.condition}
          </span>
          <span className="text-[10px] sm:text-xs text-neutral-500 hidden sm:inline">{product.level}</span>
        </div>

        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="font-black text-base sm:text-lg text-white">{formatPrice(product.price)}</span>
          {product.original_price && (
            <span className="text-[10px] sm:text-xs text-neutral-500 line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>

        {/* Dual buttons */}
        {!isSold ? (
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              disabled={inCart}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-2 sm:px-3 py-2 rounded-xl border transition-all active:scale-95',
                inCart
                  ? 'bg-white/5 text-neutral-500 border-neutral-800 cursor-default'
                  : 'bg-transparent text-neutral-200 border-[#FF6B00]/40 hover:border-[#FF6B00] hover:bg-[#FF6B00]/10'
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{inCart ? 'W koszyku' : 'Koszyk'}</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-2 sm:px-3 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A00] text-black hover:scale-105 active:scale-95 transition-all shadow-[0_2px_10px_rgba(255,107,0,0.2)]"
            >
              <Zap className="w-3.5 h-3.5" />
              Kup teraz
            </button>
          </div>
        ) : (
          <span className="text-xs text-neutral-600 font-medium">Niedostępne</span>
        )}
      </div>
    </div>
  );
}
