import { createFileRoute, Link } from '@tanstack/react-router';
import Header from '@/components/Header';
import { ArrowLeft, Shield, FileText, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
  head: () => ({
    meta: [{ title: 'Regulamin Sklepu — FootBubr' }],
  }),
});

function TermsPage() {
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase">Regulamin Sklepu</h1>
              <p className="text-xs text-neutral-400">FootBubr • Działalność Nierejestrowana</p>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-neutral-300">
            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#FF6B00]">§ 1.</span> Postanowienia ogólne i Sprzedawca
              </h2>
              <p className="mb-2">
                1. Sklep internetowy <strong>FootBubr</strong> prowadzony jest w ramach <strong>działalności nierejestrowanej</strong> (zgodnie z art. 5 Ustawy z dnia 6 marca 2018 r. – Prawo przedsiębiorców).
              </p>
              <p className="mb-2">
                2. <strong>Dane Sprzedawcy:</strong> Ignacy Chodor, adres do doręczeń: Wrocław, 50-323, Kluczborska 6/10, e-mail kontaktowy: <strong>kontakt@footbubr.pl</strong>.
              </p>
              <p>
                3. Wszystkie ceny w Sklepie podane są w złotych polskich (PLN). Sprzedawca korzysta ze zwolnienia podmiotowego z podatku VAT.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#FF6B00]">§ 2.</span> Specyfika towarów 1 of 1 i Dropów
              </h2>
              <p className="mb-2">
                1. W ofercie Sklepu znajdują się unikatowe korki piłkarskie (resale/vintage/kolekcjonerskie) występujące w pojedynczych egzemplarzach (<strong>1 of 1</strong>) oraz akcesoria marki FootBubr.
              </p>
              <p className="mb-2">
                2. Każda para butów jest w 100% oryginalna i przechodzi rygorystyczną weryfikację autentyczności.
              </p>
              <p>
                3. Stan obuwia (nowe z pudełkiem, nowe bez pudełka) jest zawsze dokładnie opisany i sfotografowany na karcie produktu.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#FF6B00]">§ 3.</span> Zamówienia i Płatności
              </h2>
              <p className="mb-2">
                1. Zamówienia składa się przez formularz zamówienia (Checkout) w Sklepie.
              </p>
              <p className="mb-2">
                2. Dostępne formy płatności: Płatność kodem BLIK, szybki przelew online lub karta płatnicza.
              </p>
              <p>
                3. Ze względu na unikatowy charakter par (1 of 1), dodanie produktu do koszyka nie stanowi rezerwacji do momentu opłacenia zamówienia.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#FF6B00]">§ 4.</span> Dostawa
              </h2>
              <p className="mb-2">
                1. Wysyłka realizowana jest na terytorium Rzeczypospolitej Polskiej za pośrednictwem:
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1 mb-2">
                <li>Paczkomatów InPost 24/7</li>
                <li>Kuriera InPost</li>
              </ul>
              <p>
                2. Czas realizacji wysyłki wynosi zazwyczaj 24-48 godzin roboczych od momentu zaksięgowania płatności.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
