import { useState } from 'react';
import { X, Ruler, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBrand?: string;
}

const NIKE_SIZES = [
  { eu: '39', cm: '24.5', us: '6.5', uk: '6' },
  { eu: '40', cm: '25.0', us: '7', uk: '6' },
  { eu: '40.5', cm: '25.5', us: '7.5', uk: '6.5' },
  { eu: '41', cm: '26.0', us: '8', uk: '7' },
  { eu: '42', cm: '26.5', us: '8.5', uk: '7.5' },
  { eu: '42.5', cm: '27.0', us: '9', uk: '8' },
  { eu: '43', cm: '27.5', us: '9.5', uk: '8.5' },
  { eu: '44', cm: '28.0', us: '10', uk: '9' },
  { eu: '44.5', cm: '28.5', us: '10.5', uk: '9.5' },
  { eu: '45', cm: '29.0', us: '11', uk: '10' },
  { eu: '45.5', cm: '29.5', us: '11.5', uk: '10.5' },
  { eu: '46', cm: '30.0', us: '12', uk: '11' },
  { eu: '47', cm: '30.5', us: '12.5', uk: '11.5' },
  { eu: '47.5', cm: '31.0', us: '13', uk: '12' },
];

const ADIDAS_SIZES = [
  { eu: '39 1/3', cm: '24.5', us: '6.5', uk: '6' },
  { eu: '40', cm: '25.0', us: '7', uk: '6.5' },
  { eu: '40 2/3', cm: '25.5', us: '7.5', uk: '7' },
  { eu: '41 1/3', cm: '26.0', us: '8', uk: '7.5' },
  { eu: '42', cm: '26.5', us: '8.5', uk: '8' },
  { eu: '42 2/3', cm: '27.0', us: '9', uk: '8.5' },
  { eu: '43 1/3', cm: '27.5', us: '9.5', uk: '9' },
  { eu: '44', cm: '28.0', us: '10', uk: '9.5' },
  { eu: '44 2/3', cm: '28.5', us: '10.5', uk: '10' },
  { eu: '45 1/3', cm: '29.0', us: '11', uk: '10.5' },
  { eu: '46', cm: '29.5', us: '11.5', uk: '11' },
  { eu: '46 2/3', cm: '30.0', us: '12', uk: '11.5' },
  { eu: '47 1/3', cm: '30.5', us: '12.5', uk: '12' },
  { eu: '48', cm: '31.0', us: '13', uk: '12.5' },
];

export default function SizeChartModal({ isOpen, onClose, initialBrand = 'Nike' }: SizeChartModalProps) {
  const isAdidasInitial = initialBrand?.toLowerCase().includes('adidas');
  const [selectedBrand, setSelectedBrand] = useState<'nike' | 'adidas'>(isAdidasInitial ? 'adidas' : 'nike');

  if (!isOpen) return null;

  const currentSizes = selectedBrand === 'nike' ? NIKE_SIZES : ADIDAS_SIZES;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Tło backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose} 
      />

      {/* Okno modala */}
      <div className="bg-[#111] border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative z-10 overflow-hidden animate-scale-in">
        {/* Nagłówek */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Tabela rozmiarów</h2>
              <p className="text-xs text-neutral-500">Korki i obuwie piłkarskie</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zakładki Nike / Adidas */}
        <div className="p-4 sm:p-6 border-b border-neutral-800/80 bg-[#121212]">
          <div className="grid grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-2xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setSelectedBrand('nike')}
              className={cn(
                'py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 active:scale-95',
                selectedBrand === 'nike'
                  ? 'bg-[#FF6B00] text-black shadow-[0_4px_15px_rgba(255,107,0,0.3)]'
                  : 'text-neutral-400 hover:text-white'
              )}
            >
              <Footprints className="w-4 h-4" /> Nike
            </button>
            <button
              type="button"
              onClick={() => setSelectedBrand('adidas')}
              className={cn(
                'py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 active:scale-95',
                selectedBrand === 'adidas'
                  ? 'bg-[#FF6B00] text-black shadow-[0_4px_15px_rgba(255,107,0,0.3)]'
                  : 'text-neutral-400 hover:text-white'
              )}
            >
              <Footprints className="w-4 h-4" /> Adidas
            </button>
          </div>
        </div>

        {/* Tabela rozmiarów */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-black/40">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#181818] text-neutral-400 font-bold uppercase tracking-wider text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="p-3 sm:p-4 text-[#FF6B00]">Rozmiar EU</th>
                  <th className="p-3 sm:p-4 text-white">Wkładka (CM)</th>
                  <th className="p-3 sm:p-4">US</th>
                  <th className="p-3 sm:p-4 text-right">UK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {currentSizes.map((row) => (
                  <tr key={row.eu} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 sm:p-4 font-bold text-white text-xs sm:text-sm">{row.eu}</td>
                    <td className="p-3 sm:p-4 text-neutral-200 font-bold">{row.cm} cm</td>
                    <td className="p-3 sm:p-4 text-neutral-400">{row.us}</td>
                    <td className="p-3 sm:p-4 text-neutral-400 text-right">{row.uk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-white/5 border border-neutral-800 rounded-2xl space-y-1">
            <p className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">💡 Wskazówka dopasowania:</p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Korki piłkarskie powinny leżeć ściśle przy stopie. Rekomendujemy dobór buta z wkładką dłuższą o ok. <strong className="text-white">0.5 cm</strong> od rzeczywistej długości Twojej stopy mierzonej w skarpecie meczowej.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
