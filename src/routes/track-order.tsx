import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase, formatOrderNumber, Order, Product } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  MapPin,
  ArrowLeft
} from 'lucide-react';

export const Route = createFileRoute('/track-order')({
  component: TrackOrderPage,
  head: () => ({
    meta: [
      { title: 'Śledź Zamówienie — FootBubr' },
      { name: 'description', content: 'Sprawdź status swojego zamówienia i przesyłki w FootBubr.' }
    ],
  }),
});

const STATUS_MAP: Record<string, { label: string; color: string; step: number; desc: string }> = {
  nowe: { label: 'Nowe', color: 'text-neutral-400 bg-neutral-800', step: 1, desc: 'Zamówienie zarejestrowane w systemie.' },
  oplacone: { label: 'Opłacone', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', step: 2, desc: 'Płatność zaksięgowana. Przygotowujemy paczkę.' },
  paid: { label: 'Opłacone', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', step: 2, desc: 'Płatność zaksięgowana. Przygotowujemy paczkę.' },
  'w realizacji': { label: 'W realizacji', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', step: 3, desc: 'Paczka jest właśnie kompletowana i pakowana.' },
  processing: { label: 'W realizacji', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', step: 3, desc: 'Paczka jest właśnie kompletowana i pakowana.' },
  wyslane: { label: 'Wysłane', color: 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/30', step: 4, desc: 'Przesyłka przekazana kurierowi InPost.' },
  shipped: { label: 'Wysłane', color: 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/30', step: 4, desc: 'Przesyłka przekazana kurierowi InPost.' },
  zakonczone: { label: 'Dostarczone', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40', step: 5, desc: 'Paczka doręczona do odbiorcy.' },
  delivered: { label: 'Dostarczone', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40', step: 5, desc: 'Paczka doręczona do odbiorcy.' },
  anulowane: { label: 'Anulowane', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', step: 0, desc: 'Zamówienie zostało anulowane.' },
};

function TrackOrderPage() {
  const [orderQuery, setOrderQuery] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<(Order & { product?: Product }) | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrderData(null);

    const cleanOrder = orderQuery.trim().replace(/^#/, '');
    const cleanEmail = emailQuery.trim().toLowerCase();

    if (!cleanOrder || !cleanEmail) {
      setError('Wpisz numer zamówienia oraz adres e-mail.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: dbError } = await supabase
        .from('orders')
        .select('*, product:products(*)')
        .ilike('customer_email', cleanEmail)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      const matched = data?.find((o: Order) => {
        const num = formatOrderNumber(o).replace(/^#/, '').toLowerCase();
        const rawId = o.id.toLowerCase();
        return num.includes(cleanOrder.toLowerCase()) || rawId.includes(cleanOrder.toLowerCase());
      });

      if (!matched) {
        setError('Nie znaleziono zamówienia o podanych danych. Sprawdź poprawność numeru i adresu e-mail.');
      } else {
        setOrderData(matched);
      }
    } catch (err: any) {
      setError(err?.message || 'Wystąpił błąd podczas wyszukiwania.');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = orderData ? STATUS_MAP[orderData.status?.toLowerCase()] || STATUS_MAP.nowe : null;

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 flex flex-col justify-between">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase text-neutral-400 hover:text-[#FF6B00] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Wróć do sklepu
        </Link>

        <div className="text-center max-w-lg mx-auto mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-2">
            Śledzenie Zamówienia
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Wpisz numer zamówienia (np. <span className="text-neutral-300 font-mono font-bold">#FB-0008</span>) oraz e-mail podany przy zakupie.
          </p>
        </div>

        {/* Formularz wyszukiwania */}
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 sm:p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">Numer zamówienia *</label>
                <input
                  type="text"
                  placeholder="#FB-0008"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  className="w-full bg-white/5 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-[#FF6B00]/70"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">Adres e-mail *</label>
                <input
                  type="email"
                  placeholder="twoj@email.pl"
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                  className="w-full bg-white/5 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00]/70"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B00] hover:bg-[#FF7A00] disabled:opacity-50 text-black font-black uppercase text-xs tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_2px_15px_rgba(255,107,0,0.2)] active:scale-[0.99]"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Wyszukiwanie...' : 'Sprawdź status'}
            </button>
          </form>
        </div>

        {/* Wynik statusu zamówienia */}
        {orderData && statusInfo && (
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-6 animate-fade-in">
            {/* Header karty statusu */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-800">
              <div>
                <span className="text-xs text-neutral-500 font-bold uppercase">Zamówienie</span>
                <p className="text-lg font-black text-white font-mono">{formatOrderNumber(orderData)}</p>
              </div>
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase ${statusInfo.color}`}>
                {statusInfo.label}
              </div>
            </div>

            {/* Wizualny pasek postępu */}
            {statusInfo.step > 0 && (
              <div className="py-2">
                <div className="grid grid-cols-4 gap-2 mb-2 text-center text-[10px] sm:text-xs font-bold uppercase">
                  <span className={statusInfo.step >= 2 ? 'text-white' : 'text-neutral-600'}>1. Opłacone</span>
                  <span className={statusInfo.step >= 3 ? 'text-white' : 'text-neutral-600'}>2. Pakowanie</span>
                  <span className={statusInfo.step >= 4 ? 'text-white' : 'text-neutral-600'}>3. Wysłane</span>
                  <span className={statusInfo.step >= 5 ? 'text-emerald-400' : 'text-neutral-600'}>4. Doręczone</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#FF6B00] h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, ((statusInfo.step - 1) / 3) * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-400 text-center mt-3">{statusInfo.desc}</p>
              </div>
            )}

            {/* Numer przesyłki InPost */}
            {(orderData as any).tracking_number && (
              <div className="p-4 bg-white/5 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Truck className="w-5 h-5 text-[#FF6B00] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-400 uppercase font-bold">Numer nadania InPost</p>
                    <p className="text-sm font-mono text-white font-bold truncate">{(orderData as any).tracking_number}</p>
                  </div>
                </div>
                <a
                  href={`https://inpost.pl/sledzenie-przesylek?number=${(orderData as any).tracking_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/30 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black rounded-lg text-xs font-bold transition-all flex-shrink-0"
                >
                  Śledź na InPost <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Szczegóły dostawy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
              <div>
                <span className="font-bold text-neutral-300 uppercase block mb-1">Dostawa:</span>
                <p>{orderData.shipping_method === 'paczkomat' ? 'Paczkomat InPost' : 'Kurier InPost'}</p>
                {orderData.paczkomat_code && <p className="font-mono text-white font-bold">{orderData.paczkomat_code}</p>}
                {orderData.shipping_address && <p className="text-neutral-300">{orderData.shipping_address}</p>}
              </div>
              <div className="sm:text-right">
                <span className="font-bold text-neutral-300 uppercase block mb-1">Kwota zamówienia:</span>
                <p className="text-base font-black text-white">{formatPrice(orderData.total_price)}</p>
                <p className="text-[11px] text-neutral-500">Płatność: {orderData.payment_method?.toUpperCase()}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
