import { createFileRoute, Link } from '@tanstack/react-router';
import Header from '@/components/Header';
import { ArrowLeft, Shield, FileText, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
  head: () => ({
    meta: [{ title: 'Regulamin Sklepu - FootBubr' }],
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
                1. Sklep internetowy <strong>FootBubr</strong> dostępny pod adresem domeny prowadzony jest w ramach <strong>działalności nierejestrowanej</strong> (zgodnie z art. 5 Ustawy z dnia 6 marca 2018 r. – Prawo przedsiębiorców).
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
                <span className="text-[#FF6B00]">§ 2.</span> Produkty i Asortyment
              </h2>
              <p className="mb-2">
                1. W ofercie Sklepu znajdują się autorskie produkty i akcesoria piłkarskie marki <strong>FootBubr</strong> (m.in. ochraniacze piłkarskie / mini deski, skarpety antypoślizgowe, taśmy oraz dedykowane akcesoria meczowe i treningowe).
              </p>
              <p className="mb-2">
                2. Wszystkie towary oferowane w Sklepie są fabrycznie nowe, wolne od wad fizycznych i prawnych oraz zgodne z opisem i parametrami przedstawionymi na karcie produktu.
              </p>
              <p>
                3. Sprzedaż produktów może być organizowana w ramach cyklicznych partii premierowych (dropów) o ograniczonej puli ilościowej.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#FF6B00]">§ 3.</span> Zamówienia i Płatności
              </h2>
              <p className="mb-2">
                1. Zamówienia składa się za pośrednictwem formularza elektronicznego (Checkout) dostępnego w Sklepie internetowym.
              </p>
              <p className="mb-2">
                2. Dostępne formy płatności obejmują: szybkie przelewy elektroniczne, płatność kodem BLIK oraz karty płatnicze realizowane przez zintegrowanego operatora płatności.
              </p>
              <p>
                3. Umowa sprzedaży zostaje zawarta z chwilą pomyślnego dokonania płatności i otrzymania przez Klienta mailowego potwierdzenia przyjęcia zamówienia do realizacji.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#FF6B00]">§ 4.</span> Dostawa i Realizacja
              </h2>
              <p className="mb-2">
                1. Wysyłka realizowana jest na terytorium Rzeczypospolitej Polskiej za pośrednictwem:
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1 mb-2">
                <li>Paczkomatów InPost 24/7</li>
                <li>Przesyłek kurierskich InPost</li>
              </ul>
              <p className="mb-2">
                2. Czas przygotowania i nadania przesyłki wynosi standardowo 24-48 godzin roboczych od momentu zaksięgowania wpłaty.
              </p>
              <p>
                3. Po nadaniu paczki Klient otrzymuje numer śledzenia przesyłki drogą mailową.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#FF6B00]">§ 5.</span> Prawo odstąpienia od umowy (Zwroty)
              </h2>
              <p className="mb-2">
                1. Konsument ma prawo odstąpić od umowy zawartej na odległość w terminie <strong>14 dni</strong> od dnia odebrania przesyłki bez podawania przyczyny.
              </p>
              <p className="mb-2">
                2. Zwracany towar nie może nosić śladów użytkowania (np. śladów z boiska, uszkodzeń mechanicznych) i powinien zostać odesłany w stanie kompletnym wraz z oryginalnym opakowaniem.
              </p>
              <p>
                3. Zwrot płatności następuje niezwłocznie, nie później niż w ciągu 14 dni od momentu otrzymania przez Sprzedawcę zwracanego towaru.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#FF6B00]">§ 6.</span> Reklamacje i Rękojmia
              </h2>
              <p className="mb-2">
                1. Sprzedawca odpowiada wobec Konsumenta za brak zgodności towaru z umową zgodnie z przepisami Ustawy o prawach konsumenta.
              </p>
              <p>
                2. Reklamacje dotyczące wad fizycznych towaru lub uszkodzeń w transporcie można zgłaszać drogą elektroniczną na adres: <strong>kontakt@footbubr.pl</strong>. Zgłoszenie zostanie rozpatrzone w terminie 14 dni kalendarzowych.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
