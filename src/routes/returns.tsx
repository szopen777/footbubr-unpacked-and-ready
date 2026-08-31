import { createFileRoute, Link } from '@tanstack/react-router';
import Header from '@/components/Header';
import { ArrowLeft, RotateCcw, AlertCircle, ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/returns')({
  component: ReturnsPage,
  head: () => ({
    meta: [{ title: 'Zwroty i Reklamacje — FootBubr' }],
  }),
});

function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-[#FF6B00] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Wróć do sklepu
        </Link>

        <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase">Zwroty i Reklamacje</h1>
              <p className="text-xs text-neutral-400">14 dni na odstąpienie od umowy</p>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-neutral-300">
            {/* Box wyróżniający */}
            <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl p-4 flex gap-3 text-neutral-200">
              <ShieldCheck className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm">
                Jako konsument masz prawo odstąpić od umowy zawartej na odległość w terminie <strong>14 dni kalendarzowych</strong> od momentu odebrania przesyłki, bez podawania przyczyny.
              </p>
            </div>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
                1. Jak dokonać zwrotu?
              </h2>
              <ol className="list-decimal list-inside space-y-2 ml-1">
                <li>
                  Napisz do nas wiadomość e-mail na adres: <strong>kontakt@footbubr.pl</strong> z numerem zamówienia i oświadczeniem o odstąpieniu od umowy.
                </li>
                <li>
                  Zabezpiecz produkt i odeślij go w oryginalnym stanie (wraz z ewentualnym pudełkiem i metkami, jeśli były dołączone) na wskazany w odpowiedzi adres.
                </li>
                <li>
                  Pieniądze zwracamy niezwłocznie, maksymalnie w ciągu <strong>14 dni</strong> od otrzymania przesyłki zwrotnej, tą samą metodą płatności.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
                2. Stan zwracanego obuwia
              </h2>
              <p>
                Zwracany towar nie może nosić śladów użytkowania przekraczających zwykły zarząd (mierzenie w warunkach domowych). Buty nie mogą być używane na boisku, myte ani modyfikowane.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
                3. Reklamacje i autentyczność
              </h2>
              <p className="mb-2">
                Gwarantujemy 100% oryginalności każdej oferowanej pary. Jeśli masz jakiekolwiek wątpliwości lub produkt posiadał wadę ukrytą niewymienioną w opisie, skontaktuj się z nami pod adresem <strong>kontakt@footbubr.pl</strong>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
