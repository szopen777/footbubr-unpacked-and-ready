import { createFileRoute, Link } from '@tanstack/react-router';
import { useFavorites } from '@/lib/favorites-context';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import { Heart, Trash2, ArrowLeft, Footprints } from 'lucide-react';

function FavoritesPage() {
  const { favorites, clearFavorites } = useFavorites();

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <Header />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-10">
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white mb-2 transition-colors"
            >
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
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 bg-white/5 border border-neutral-800 px-3 py-2 rounded-xl transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" /> Wyczyść listę
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-10 sm:p-12 text-center max-w-md mx-auto my-12 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-neutral-800 flex items-center justify-center mx-auto mb-4 text-neutral-600">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Twoja lista jest pusta</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Klikaj ikonkę serduszka przy parach korków lub akcesoriach, aby zapisać je na później.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black px-6 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(255,107,0,0.3)] active:scale-95"
            >
              <Footprints className="w-4 h-4" /> Przeglądaj katalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 animate-fade-in">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
