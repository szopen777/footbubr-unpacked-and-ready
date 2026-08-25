'use client';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { supabase, type Product } from '@/lib/supabase';
import { Archive, Lock, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/archive')({
  component: ArchivePage,
  head: () => ({
    meta: [
      { title: 'Archiwum dropów — FootBubr' },
      {
        name: 'description',
        content: 'Sprzedane korki 1-of-1 z minionych dropów FootBubr. Grail Vault z historycznymi parami.',
      },
      { property: 'og:title', content: 'Archiwum dropów — FootBubr' },
      { property: 'og:description', content: 'Sprzedane korki 1-of-1 z minionych dropów FootBubr.' },
    ],
  }),
});

function ArchivePage() {
  const [soldProducts, setSoldProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSoldProducts() {
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'sold')
            .order('updated_at', { ascending: false });

          if (!error && data) {
            setSoldProducts(data);
          }
        }
      } catch {
        console.error('Błąd pobierania archiwum');
      } finally {
        setLoading(false);
      }
    }
    loadSoldProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#FF6B00] selection:text-black">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Banner Nagłówkowy */}
        <div className="border-4 border-neutral-800 bg-neutral-900/50 p-6 sm:p-10 rounded-2xl mb-12 shadow-[6px_6px_0_0_#262626]">
          <div className="inline-flex items-center gap-2 bg-neutral-800 text-neutral-400 px-3 py-1 rounded-sm uppercase text-xs font-black tracking-widest mb-4">
            <Archive className="w-4 h-4 text-[#FF6B00]" />
            Grail Vault
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-2">
            Archiwum <span className="text-neutral-500">Dropów</span>
          </h1>
          <p className="text-neutral-400 max-w-xl text-sm sm:text-base font-medium">
            Korki 1-of-1, które znalazły już swoich właścicieli. Przeglądaj historyczne sztuki z minionych wydań.
          </p>
        </div>

        {/* Siatka produktów sold out */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-neutral-900 border border-neutral-800 rounded-xl" />
            ))}
          </div>
        ) : soldProducts.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-2xl">
            <Lock className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-black uppercase text-neutral-300">Brak sprzedanych par w archiwum</h3>
            <p className="text-neutral-500 text-sm mt-1">Gdy para zejdzie z dropu, pojawi się tutaj.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {soldProducts.map((boot) => (
              <div
                key={boot.id}
                className="group relative bg-[#121212] border-2 border-neutral-800 rounded-xl overflow-hidden shadow-[4px_4px_0_0_#1c1c1c] hover:border-neutral-700 transition-all"
              >
                {/* Zdjęcie z filtrem Grayscale */}
                <div className="relative aspect-square w-full bg-neutral-950 overflow-hidden">
                  {boot.images && boot.images[0] ? (
                    <Image
                      src={boot.images[0]}
                      alt={boot.name}
                      fill
                      className="object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500 opacity-75"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-700 font-mono text-xs">
                      BRAK ZDJĘCIA
                    </div>
                  )}

                  {/* SOLD OUT Badge */}
                  <div className="absolute top-4 left-4 bg-black/90 border-2 border-red-600 text-red-500 px-3 py-1 text-xs font-black tracking-widest uppercase rotate-[-4deg] shadow-[2px_2px_0_0_#dc2626]">
                    SOLD OUT
                  </div>

                  <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-neutral-700 px-2.5 py-1 rounded text-[11px] font-mono font-bold text-neutral-400">
                    Rozmiar: {boot.size_eu}
                  </div>
                </div>

                {/* Opis */}
                <div className="p-5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
                    {boot.brand}
                  </span>
                  <h3 className="text-lg font-black uppercase text-neutral-300 truncate mt-0.5">
                    {boot.name}
                  </h3>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block">Cena sprzedaży</span>
                      <span className="text-base font-mono font-bold text-neutral-400 line-through">
                        {boot.price} PLN
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 font-mono">
                      <CheckCircle2 className="w-4 h-4 text-neutral-600" />
                      Archiwum
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}