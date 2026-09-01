import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ArrowLeft, Ruler, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_BRAND_SIZE_TABLES, BrandKey } from '@/components/SizeChartModal';

function SizeGuidePage() {
  const [selectedBrand, setSelectedBrand] = useState<BrandKey>('nike');
  const currentBrand = ALL_BRAND_SIZE_TABLES[selectedBrand] || ALL_BRAND_SIZE_TABLES.nike;

  return (
    <div className="w-full text-neutral-200">
      <Header />
      <CartDrawer />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in space-y-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-neutral-400 hover:text-[#FF6B00] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Wróć do sklepu
        </Link>

        {/* Tytuł */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Ruler className="w-3.5 h-3.5" />
            Poradnik doboru rozmiaru
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Jak idealnie dobrać rozmiar korków?
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
            Każdy producent stosuje nieco inny profil kopyta szewskiego. Rozmiarówka EU może różnić się nawet o 0.5–1 cm między markami. Najpewniejszym wyznacznikiem jest <strong className="text-white">długość wkładki w centymetrach (CM)</strong> podana w opisie każdej pary.
          </p>
        </div>

        {/* 3 Kroki Pomiaru */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
            3 proste kroki: pomiar stopy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-[#FF6B00] text-black font-black text-xs flex items-center justify-center">
                01
              </span>
              <h3 className="font-bold text-white text-sm">Przygotuj kartkę A4</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Połóż kartkę na twardej podłodze przy samej ścianie. Załóż skarpety piłkarskie, w których grasz mecze.
              </p>
            </div>

            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-[#FF6B00] text-black font-black text-xs flex items-center justify-center">
                02
              </span>
              <h3 className="font-bold text-white text-sm">Zaznacz najdłuższy punkt</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Postaw stopę dociskając piętę do ściany. Zaznacz ołówkiem trzymanym prosto czubek najdłuższego palca.
              </p>
            </div>

            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-[#FF6B00] text-black font-black text-xs flex items-center justify-center">
                03
              </span>
              <h3 className="font-bold text-white text-sm">Zmierz odcinek</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Zmierz odległość linijką i dodaj <strong className="text-white">0.5 cm luzu</strong> na pracę stopy w bucie.
              </p>
            </div>
          </div>
        </div>

        {/* Wskazówka */}
        <div className="bg-[#141414] border border-[#FF6B00]/30 rounded-2xl p-5 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h4 className="font-bold text-white uppercase tracking-wide">Wskazówka FootBubr</h4>
            <p className="text-neutral-400 leading-relaxed">
              Mierz stopę po południu lub po treningu, gdy stopa jest lekko zmęczona i ma swoją docelową objętość meczową. Jeśli jedna stopa jest minimalnie większa, zawsze wybieraj rozmiar pod dłuższą stopę.
            </p>
          </div>
        </div>

        {/* Tabela rozmiarów dla wszystkich marek */}
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-neutral-800 space-y-4">
            <div>
              <h3 className="font-black text-white uppercase text-base tracking-tight">
                Oficjalne tabele rozmiarów (od 39 do 48.5)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Wybierz markę, aby sprawdzić dokładne przeliczniki CM, US i UK</p>
            </div>

            {/* Przełącznik 8 marek */}
            <div className="flex flex-wrap gap-1.5 bg-black/50 p-1.5 rounded-2xl border border-neutral-800">
              {(Object.keys(ALL_BRAND_SIZE_TABLES) as BrandKey[]).map((key) => {
                const brand = ALL_BRAND_SIZE_TABLES[key];
                const isActive = selectedBrand === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedBrand(key)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all',
                      isActive
                        ? 'bg-[#FF6B00] text-black shadow-md'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {brand.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/5 text-neutral-400 uppercase text-[11px] font-bold border-b border-neutral-800">
                <tr>
                  <th className="px-5 py-3">EU</th>
                  <th className="px-5 py-3 text-[#FF6B00]">Wkładka (CM)</th>
                  <th className="px-5 py-3">US</th>
                  <th className="px-5 py-3">UK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {currentBrand.sizes.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-bold text-white">{row.eu}</td>
                    <td className="px-5 py-3 font-bold text-[#FF6B00]">{row.cm} cm</td>
                    <td className="px-5 py-3 text-neutral-400">{row.us}</td>
                    <td className="px-5 py-3 text-neutral-400">{row.uk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

export const Route = createFileRoute('/size-guide')({
  component: SizeGuidePage,
  head: () => ({
    meta: [
      { title: 'Tabela rozmiarów korków — FootBubr' },
      { name: 'description', content: 'Oficjalne tabele rozmiarów korków piłkarskich Nike, Adidas, Puma, Mizuno, New Balance, Under Armour, Umbro i Lotto.' }
    ],
  }),
});
