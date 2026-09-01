import { Star, ShieldCheck, CheckCircle2 } from 'lucide-react';

const REVIEWS_DATA = [
  {
    name: 'Kamil W.',
    role: 'Piłkarz IV ligi',
    rating: 5,
    text: 'Korki 100% oryginalne, paczka w Paczkomacie była po 18 godzinach od zamówienia. Stan butów perfekcyjny.',
  },
  {
    name: 'Jakub S.',
    role: 'Kolekcjoner',
    rating: 5,
    text: 'Upolowałem archiwalny model Nike Vapor, którego szukałem od 3 lat. Zgodność ze zdjęciami 1:1.',
  },
  {
    name: 'Mateusz B.',
    role: 'Trener akademii',
    rating: 5,
    text: 'Skarpety FootBubr to absolutny top jeśli chodzi o przyczepność w bucie. Zamawiam już kolejny trójpak.',
  },
];

export default function ReviewsBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zaufanie społeczności graczy
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Opinie o FootBubr
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <div className="flex text-[#FF6B00]">
            {'★'.repeat(5)}
          </div>
          <span className="font-bold text-white">4.98 / 5.00</span>
          <span>(100+ zweryfikowanych zamówień)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {REVIEWS_DATA.map((rev, idx) => (
          <div
            key={idx}
            className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-all shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#FF6B00]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#FF6B00]" />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Zakup
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                "{rev.text}"
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-800/80">
              <h4 className="font-bold text-white text-xs">{rev.name}</h4>
              <p className="text-[11px] text-neutral-500">{rev.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
