import { createFileRoute, Link } from '@tanstack/react-router';
import { useFavorites } from '@/lib/favorites-context';
import { useCart } from '@/lib/cart-context';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { formatPrice } from '@/lib/utils';
import { Heart, ShoppingBag, Trash2, ArrowLeft, Footprints } from 'lucide-react';
import { toast } from 'sonner';

function FavoritesPage() {
  const { favorites, toggleFavorite, clearFavorites } = useFavorites();
  const { addItemSilent } = useCart();

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItemSilent(product, 1);
    toast.success('Dodano do koszyka', { description: product.name });
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <Header />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white mb-2 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Wróć do sklepu
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              <Heart className="w-7 h-7 text-red-500 fill-red-500" />
              Ulubione ({favorites.length})
            </h1>
          </div>

          {favorites.length > 0 && (
            <button
              onClick={clearFavorites}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 bg-white/5 border border-neutral-800 px-3 py-2 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Wyczyść listę
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-12 text-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-neutral-800 flex items-center justify-center mx-auto mb-4 text-neutral-600">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Twoja lista jest pusta</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Klikaj ikonkę serduszka przy parach korków lub akcesoriach, aby zapisać je na później.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black px-6 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(255,107,0,0.3)]"
            >
              <Footprints className="w-4 h-4" /> Przeglądaj katalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {favorites.map((product) => {
              const isSold = product.status === 'sold';
              return (
                <div
                  key={product.id}
                  className="group relative bg-[#141414] border border-neutral-800/80 hover:border-neutral-700 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col transition-all duration-300"
                >
                  <Link to="/product/$id" params={{ id: product.id }} className="block relative aspect-square bg-black/40 overflow-hidden">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700 text-xs">Brak zdjęcia</div>
                    )}

                    {isSold && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="text-white font-black text-xs sm:text-sm tracking-widest rotate-[-12deg] border border-white/80 px-2 py-0.5 rounded backdrop-blur-md">
                          WYPRZEDANE
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(product);
                      }}
                      className="absolute top-2.5 right-2.5 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-xl text-red-500 transition-all active:scale-90"
                      title="Usuń z ulubionych"
                    >
                      <Heart className="w-4 h-4 fill-red-500" />
                    </button>
                  </Link>

                  <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                        <span className="text-[#FF6B00]">{product.brand}</span>
                        <span>EU {product.size_eu}</span>
                      </div>
                      <Link to="/product/$id" params={{ id: product.id }}>
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate hover:text-[#FF6B00] transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2 pt-2 border-t border-neutral-800/60">
                      <span className="text-sm sm:text-base font-black text-white">{formatPrice(product.price)}</span>
                      {!isSold && (
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="p-2 sm:px-3 sm:py-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_2px_10px_rgba(255,107,0,0.25)]"
                          title="Dodaj do koszyka"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Do koszyka</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/favorites')({
  component: FavoritesPage,
  head: () => ({
    meta: [
      { title: 'Ulubione — FootBubr' },
      { name: 'description', content: 'Twoja lista zapisanych par korków i akcesoriów w sklepie FootBubr.' },
    ],
  }),
});
