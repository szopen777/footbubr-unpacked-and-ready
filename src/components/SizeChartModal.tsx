import { X, Ruler } from 'lucide-react';

const SIZES: { eu: string; cm: string }[] = [
  { eu: '38', cm: '24.0' },
  { eu: '38.5', cm: '24.5' },
  { eu: '39.5', cm: '25.0' },
  { eu: '40', cm: '25.5' },
  { eu: '40.5', cm: '26.0' },
  { eu: '41.5', cm: '26.5' },
  { eu: '42', cm: '27.0' },
  { eu: '42.5', cm: '27.5' },
  { eu: '43.5', cm: '28.0' },
  { eu: '44', cm: '28.5' },
  { eu: '44.5', cm: '29.0' },
  { eu: '45.5', cm: '29.5' },
  { eu: '46', cm: '30.0' },
  { eu: '47', cm: '30.5' },
];

interface SizeChartModalProps {
  open: boolean;
  onClose: () => void;
  highlightEu?: number;
}

export default function SizeChartModal({ open, onClose, highlightEu }: SizeChartModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-[#111] border-2 border-neutral-800 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-fade-in-up">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-[#FF6B00]" />
              <h3 className="font-black uppercase tracking-tight text-white text-sm">Tabela rozmiarów</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Zamknij tabelę rozmiarów"
              className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-white/5 transition-all active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 px-5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500 border-b border-neutral-800/80 sticky top-0 bg-[#111]">
              <span>Rozmiar EU</span>
              <span className="text-right">Długość wkładki (CM)</span>
            </div>
            {SIZES.map(({ eu, cm }) => {
              const active = highlightEu !== undefined && Number(eu) === Number(highlightEu);
              return (
                <div
                  key={eu}
                  className={`grid grid-cols-2 px-5 py-2.5 text-sm border-b border-neutral-800/50 ${
                    active ? 'bg-[#FF6B00]/10 text-[#FF6B00] font-bold' : 'text-neutral-300'
                  }`}
                >
                  <span className="font-mono">EU {eu}</span>
                  <span className="text-right font-mono">{cm} cm</span>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-4 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">
              Zmierz stopę od pięty do najdłuższego palca i dobierz rozmiar z zapasem ok. 0,5 cm.
              Korki dobiera się ciaśniej niż buty codzienne.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
