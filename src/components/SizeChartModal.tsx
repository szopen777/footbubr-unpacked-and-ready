import { useState, useEffect } from 'react';
import { X, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BrandKey = 
  | 'nike' 
  | 'adidas' 
  | 'puma' 
  | 'mizuno' 
  | 'new balance' 
  | 'under armour' 
  | 'umbro' 
  | 'lotto';

export interface SizeRow {
  eu: string;
  cm: string;
  us: string;
  uk: string;
}

export const ALL_BRAND_SIZE_TABLES: Record<BrandKey, { label: string; sizes: SizeRow[] }> = {
  nike: {
    label: 'Nike',
    sizes: [
      { eu: '39', cm: '24.5', us: '6.5', uk: '5.5' },
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
      { eu: '48', cm: '31.5', us: '13.5', uk: '12.5' },
      { eu: '48.5', cm: '32.0', us: '14', uk: '13' },
    ],
  },
  adidas: {
    label: 'Adidas',
    sizes: [
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
      { eu: '48 2/3', cm: '31.5', us: '13.5', uk: '13' },
      { eu: '49 1/3', cm: '32.0', us: '14', uk: '13.5' },
    ],
  },
  puma: {
    label: 'Puma',
    sizes: [
      { eu: '39', cm: '25.0', us: '7', uk: '6' },
      { eu: '40', cm: '25.5', us: '7.5', uk: '6.5' },
      { eu: '40.5', cm: '26.0', us: '8', uk: '7' },
      { eu: '41', cm: '26.5', us: '8.5', uk: '7.5' },
      { eu: '42', cm: '27.0', us: '9', uk: '8' },
      { eu: '42.5', cm: '27.5', us: '9.5', uk: '8.5' },
      { eu: '43', cm: '28.0', us: '10', uk: '9' },
      { eu: '44', cm: '28.5', us: '10.5', uk: '9.5' },
      { eu: '44.5', cm: '29.0', us: '11', uk: '10' },
      { eu: '45', cm: '29.5', us: '11.5', uk: '10.5' },
      { eu: '46', cm: '30.0', us: '12', uk: '11' },
      { eu: '47', cm: '31.0', us: '13', uk: '12' },
      { eu: '48', cm: '31.5', us: '13.5', uk: '12.5' },
      { eu: '48.5', cm: '32.0', us: '14', uk: '13' },
    ],
  },
  mizuno: {
    label: 'Mizuno',
    sizes: [
      { eu: '39', cm: '25.0', us: '7', uk: '6' },
      { eu: '40', cm: '25.5', us: '7.5', uk: '6.5' },
      { eu: '40.5', cm: '26.0', us: '8', uk: '7' },
      { eu: '41', cm: '26.5', us: '8.5', uk: '7.5' },
      { eu: '42', cm: '27.0', us: '9', uk: '8' },
      { eu: '42.5', cm: '27.5', us: '9.5', uk: '8.5' },
      { eu: '43', cm: '28.0', us: '10', uk: '9' },
      { eu: '44', cm: '28.5', us: '10.5', uk: '9.5' },
      { eu: '44.5', cm: '29.0', us: '11', uk: '10' },
      { eu: '45', cm: '29.5', us: '11.5', uk: '10.5' },
      { eu: '46', cm: '30.0', us: '12', uk: '11' },
      { eu: '47', cm: '31.0', us: '13', uk: '12' },
      { eu: '48', cm: '32.0', us: '14', uk: '13' },
    ],
  },
  'new balance': {
    label: 'New Balance',
    sizes: [
      { eu: '39.5', cm: '24.5', us: '6.5', uk: '6' },
      { eu: '40', cm: '25.0', us: '7', uk: '6.5' },
      { eu: '40.5', cm: '25.5', us: '7.5', uk: '7' },
      { eu: '41.5', cm: '26.0', us: '8', uk: '7.5' },
      { eu: '42', cm: '26.5', us: '8.5', uk: '8' },
      { eu: '42.5', cm: '27.0', us: '9', uk: '8.5' },
      { eu: '43', cm: '27.5', us: '9.5', uk: '9' },
      { eu: '44', cm: '28.0', us: '10', uk: '9.5' },
      { eu: '44.5', cm: '28.5', us: '10.5', uk: '10' },
      { eu: '45', cm: '29.0', us: '11', uk: '10.5' },
      { eu: '45.5', cm: '29.5', us: '11.5', uk: '11' },
      { eu: '46.5', cm: '30.0', us: '12', uk: '11.5' },
      { eu: '47', cm: '30.5', us: '12.5', uk: '12' },
      { eu: '47.5', cm: '31.0', us: '13', uk: '12.5' },
      { eu: '48.5', cm: '32.0', us: '14', uk: '13.5' },
    ],
  },
  'under armour': {
    label: 'Under Armour',
    sizes: [
      { eu: '39', cm: '24.5', us: '6.5', uk: '5.5' },
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
      { eu: '48', cm: '31.5', us: '13.5', uk: '12.5' },
      { eu: '48.5', cm: '32.0', us: '14', uk: '13' },
    ],
  },
  umbro: {
    label: 'Umbro',
    sizes: [
      { eu: '39', cm: '24.5', us: '6.5', uk: '5.5' },
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
      { eu: '48', cm: '31.5', us: '13.5', uk: '12.5' },
    ],
  },
  lotto: {
    label: 'Lotto',
    sizes: [
      { eu: '39', cm: '24.5', us: '6.5', uk: '5.5' },
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
      { eu: '48', cm: '31.5', us: '13.5', uk: '12.5' },
    ],
  },
};

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBrand?: string;
}

export default function SizeChartModal({ isOpen, onClose, initialBrand }: SizeChartModalProps) {
  const detectBrand = (b?: string): BrandKey => {
    const clean = (b || '').toLowerCase().trim();
    if (clean.includes('adidas')) return 'adidas';
    if (clean.includes('puma')) return 'puma';
    if (clean.includes('mizuno')) return 'mizuno';
    if (clean.includes('new balance') || clean.includes('balance')) return 'new balance';
    if (clean.includes('armour')) return 'under armour';
    if (clean.includes('umbro')) return 'umbro';
    if (clean.includes('lotto')) return 'lotto';
    return 'nike';
  };

  const [selectedBrand, setSelectedBrand] = useState<BrandKey>(detectBrand(initialBrand));

  useEffect(() => {
    if (isOpen) {
      setSelectedBrand(detectBrand(initialBrand));
    }
  }, [isOpen, initialBrand]);

  if (!isOpen) return null;

  const currentBrandData = ALL_BRAND_SIZE_TABLES[selectedBrand] || ALL_BRAND_SIZE_TABLES.nike;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#141414] border border-neutral-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-black text-white uppercase tracking-tight text-base sm:text-lg">
              Tabela rozmiarów
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Przewijany poziomo pasek 8 marek */}
        <div className="p-3 bg-black/40 border-b border-neutral-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {(Object.keys(ALL_BRAND_SIZE_TABLES) as BrandKey[]).map((key) => {
              const brandInfo = ALL_BRAND_SIZE_TABLES[key];
              const isActive = selectedBrand === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedBrand(key)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all flex-shrink-0',
                    isActive
                      ? 'bg-[#FF6B00] text-black shadow-md'
                      : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  )}
                >
                  {brandInfo.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabela rozmiarów */}
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-white/5 text-neutral-400 uppercase text-[11px] font-bold sticky top-0 backdrop-blur-md border-b border-neutral-800">
              <tr>
                <th className="px-5 py-2.5">EU</th>
                <th className="px-5 py-2.5 text-[#FF6B00]">Wkładka (CM)</th>
                <th className="px-5 py-2.5">US</th>
                <th className="px-5 py-2.5">UK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {currentBrandData.sizes.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-2.5 font-bold text-white">{row.eu}</td>
                  <td className="px-5 py-2.5 font-bold text-[#FF6B00]">{row.cm} cm</td>
                  <td className="px-5 py-2.5 text-neutral-400">{row.us}</td>
                  <td className="px-5 py-2.5 text-neutral-400">{row.uk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-black/40 border-t border-neutral-800 text-[11px] text-neutral-400 text-center">
          Wskazówka: Zawsze sugeruj się długością wkładki <strong className="text-white">CM</strong> podaną przy produkcie.
        </div>
      </div>
    </div>
  );
}
