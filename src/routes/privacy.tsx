import { createFileRoute, Link } from '@tanstack/react-router';
import Header from '@/components/Header';
import { ArrowLeft, Lock } from 'lucide-react';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: 'Polityka Prywatności — FootBubr' }],
  }),
});

function PrivacyPage() {
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
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase">Polityka Prywatności i RODO</h1>
              <p className="text-xs text-neutral-400">Ochrona danych osobowych</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-neutral-300">
            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide">1. Administrator Danych</h2>
              <p>
                Administratorem danych osobowych jest Ignacy Chodor, prowadzący działalność nierejestrowaną pod marką FootBubr, e-mail: <strong>kontakt@footbubr.pl</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide">2. Cel i podstawa przetwarzania</h2>
              <p>
                Dane osobowe (imię, nazwisko, adres e-mail, numer telefonu, adres do wysyłki / kod Paczkomatu) przetwarzane są wyłącznie w celu:
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
                <li>Realizacji i wysyłki złożonego zamówienia (art. 6 ust. 1 lit. b RODO).</li>
                <li>Wysyłki powiadomień o dropach, jeśli wyrażono na to zgodę (art. 6 ust. 1 lit. a RODO).</li>
                <li>Wypełnienia obowiązków księgowych i podatkowych wynikających z przepisów prawa.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide">3. Odbiorcy danych</h2>
              <p>
                Dane mogą być przekazywane wyłącznie podmiotom niezbędnym do realizacji zamówienia: operatorom pocztowym/kurierskim (InPost) oraz operatorom płatności.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
