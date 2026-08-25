import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';
import { formatPrice, INPUT_CLASS } from '@/lib/utils';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ArrowLeft, Package, Truck, CreditCard, CheckCircle2, Loader2, MapPin, Tag, X, Check, AlertCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';

function CheckoutPage() {
  const { items, total, discountedTotal, discountAmount, promoCode, applyPromo, removePromo, clearCart } = useCart();
  const [step, setStep] = useState<'summary' | 'success'>('summary');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    shippingMethod: 'paczkomat' as 'paczkomat' | 'kurier',
    paczkomatCode: '',
    address: '',
    paymentMethod: 'blik' as 'blik' | 'card' | 'apple_pay' | 'google_pay' | 'transfer',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const shippingCost = form.shippingMethod === 'paczkomat' ? 12 : 18;
  const orderTotal = discountedTotal + shippingCost;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Imię i nazwisko jest wymagane';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Podaj prawidłowy email';
    if (form.shippingMethod === 'paczkomat' && !form.paczkomatCode.trim()) e.paczkomatCode = 'Podaj kod paczkomatu';
    if (form.shippingMethod === 'kurier' && !form.address.trim()) e.address = 'Podaj adres dostawy';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const ok = applyPromo(promoInput);
    setPromoStatus(ok ? 'success' : 'error');
    if (ok) setPromoInput('');
  };

  const handleRemovePromo = () => {
    removePromo();
    setPromoStatus('idle');
    setPromoInput('');
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const orderIds: string[] = [];
      for (const { product } of items) {
        const { data: fresh } = await supabase
          .from('products')
          .select('status')
          .eq('id', product.id)
          .maybeSingle();

        if (!fresh || fresh.status !== 'available') continue;

        const itemTotal = promoCode
          ? Math.round(product.price * 0.9) + shippingCost
          : product.price + shippingCost;

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            product_id: product.id,
            customer_name: form.name,
            customer_email: form.email,
            customer_phone: form.phone || null,
            shipping_method: form.shippingMethod,
            paczkomat_code: form.shippingMethod === 'paczkomat' ? form.paczkomatCode : null,
            shipping_address: form.shippingMethod === 'kurier' ? form.address : null,
            payment_method: form.paymentMethod,
            total_price: itemTotal,
          })
          .select('id')
          .maybeSingle();

        if (!orderError && order) {
          orderIds.push(order.id);
          await supabase.from('products').update({ status: 'sold' }).eq('id', product.id);
        }
      }

      if (orderIds.length > 0) {
        setOrderId(orderIds[0]);
        clearCart();
        setStep('success');
      }
    } catch {
      // handle silently
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen">
        <Header />
        <CartDrawer />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <p className="text-neutral-400 mb-4">Twój koszyk jest pusty</p>
          <Link to="/" className="text-[#FF6B00] hover:underline">Wróć do katalogu</Link>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 uppercase tracking-tight">Zamówienie złożone!</h1>
          <p className="text-neutral-400 mb-2">Dziękujemy za zakup w FootBubr.</p>
          <p className="text-neutral-600 text-sm mb-8">Nr zamówienia: <span className="text-neutral-300 font-mono">{orderId.slice(0, 8).toUpperCase()}</span></p>
          <p className="text-neutral-500 text-sm mb-8">Szczegóły wysłaliśmy na adres email. Skontaktujemy się w ciągu 24h.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
          >
            Wróć do sklepu
          </Link>
        </div>
      </div>
    );
  }

  const inp = INPUT_CLASS;

  return (
    <div className="min-h-screen">
      <Header />
      <CartDrawer />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8 animate-fade-in">
          <Link to="/" className="text-neutral-500 hover:text-white transition-colors active:scale-90">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Kasa</h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Personal info */}
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4 sm:p-6 animate-fade-in-up">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
                <span className="w-6 h-6 bg-[#FF6B00] text-black text-xs font-black rounded-full flex items-center justify-center">1</span>
                Dane kontaktowe
              </h2>
              <div className="space-y-3">
                <div>
                  <input className={inp} placeholder="Imię i nazwisko *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input className={inp} placeholder="Adres email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <input className={inp} placeholder="Numer telefonu (opcjonalnie)" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4 sm:p-6 animate-fade-in-up delay-100">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
                <span className="w-6 h-6 bg-[#FF6B00] text-black text-xs font-black rounded-full flex items-center justify-center">2</span>
                Dostawa
              </h2>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.shippingMethod === 'paczkomat' ? 'border-[#FF6B00]/60 bg-[#FF6B00]/5' : 'border-neutral-800 hover:border-neutral-700'}`}
                  onClick={() => setForm({ ...form, shippingMethod: 'paczkomat' })}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.shippingMethod === 'paczkomat' ? 'border-[#FF6B00]' : 'border-neutral-600'}`}>
                    {form.shippingMethod === 'paczkomat' && <div className="w-2 h-2 bg-[#FF6B00] rounded-full" />}
                  </div>
                  <Package className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Paczkomat InPost</p>
                    <p className="text-xs text-neutral-500 hidden sm:block">Dostawa do paczkomatu</p>
                  </div>
                  <span className="text-sm font-bold text-white flex-shrink-0">12 zł</span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.shippingMethod === 'kurier' ? 'border-[#FF6B00]/60 bg-[#FF6B00]/5' : 'border-neutral-800 hover:border-neutral-700'}`}
                  onClick={() => setForm({ ...form, shippingMethod: 'kurier' })}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.shippingMethod === 'kurier' ? 'border-[#FF6B00]' : 'border-neutral-600'}`}>
                    {form.shippingMethod === 'kurier' && <div className="w-2 h-2 bg-[#FF6B00] rounded-full" />}
                  </div>
                  <Truck className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Kurier (DPD / InPost / DHL)</p>
                    <p className="text-xs text-neutral-500 hidden sm:block">Dostawa pod adres</p>
                  </div>
                  <span className="text-sm font-bold text-white flex-shrink-0">18 zł</span>
                </label>

                {form.shippingMethod === 'paczkomat' && (
                  <div className="animate-fade-in">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        className={`${inp} pl-9`}
                        placeholder="Kod paczkomatu (np. WAW123M) *"
                        value={form.paczkomatCode}
                        onChange={(e) => setForm({ ...form, paczkomatCode: e.target.value.toUpperCase() })}
                      />
                    </div>
                    {errors.paczkomatCode && <p className="text-red-400 text-xs mt-1">{errors.paczkomatCode}</p>}
                  </div>
                )}

                {form.shippingMethod === 'kurier' && (
                  <div className="animate-fade-in">
                    <input
                      className={inp}
                      placeholder="Ulica, nr domu, kod pocztowy, miasto *"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                    {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4 sm:p-6 animate-fade-in-up delay-200">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
                <span className="w-6 h-6 bg-[#FF6B00] text-black text-xs font-black rounded-full flex items-center justify-center">3</span>
                Płatność
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {([
                  { value: 'blik', label: 'BLIK' },
                  { value: 'transfer', label: 'Szybki przelew' },
                  { value: 'card', label: 'Karta' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setForm({ ...form, paymentMethod: value })}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${form.paymentMethod === value ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {form.paymentMethod === 'blik' && (
                <div className="mt-4 border border-[#FF6B00]/30 bg-[#FF6B00]/5 rounded-xl p-4 animate-fade-in">
                  <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">
                    Kod BLIK
                  </p>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={form.blikCode}
                    onChange={(e) => setForm({ ...form, blikCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full bg-black/60 border-2 border-neutral-800 rounded-xl px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white placeholder:text-neutral-700 focus:outline-none focus:border-[#FF6B00]/70 transition-all"
                  />
                  {errors.blikCode && <p className="text-red-400 text-xs mt-2">{errors.blikCode}</p>}
                  <p className="text-xs text-neutral-500 mt-2">
                    Wpisz 6-cyfrowy kod z aplikacji bankowej, a następnie potwierdź płatność w telefonie.
                  </p>
                </div>
              )}

              <p className="text-xs text-neutral-600 mt-3 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Płatność w środowisku testowym — symulacja
              </p>

            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4 sm:p-6 lg:sticky lg:top-24 animate-fade-in-up delay-100">
              <h2 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Podsumowanie</h2>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map(({ product }) => (
                  <div key={product.id} className="flex gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white/5 border border-neutral-800 flex-shrink-0">
                      {product.images[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-xs text-neutral-500">EU {product.size_eu} · {product.surface_type}</p>
                      <p className="text-sm font-bold text-[#FF6B00] mt-0.5">{formatPrice(product.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div className="border-t border-neutral-800 pt-4 space-y-3">
                {promoCode ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-emerald-400 truncate">-10% (BUBR10)</span>
                    </div>
                    <button onClick={handleRemovePromo} className="text-neutral-500 hover:text-white transition-colors flex-shrink-0 active:scale-90">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="Kod rabatowy"
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value); setPromoStatus('idle'); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                          className="w-full bg-white/5 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleApplyPromo}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 flex-shrink-0"
                      >
                        Zastosuj
                      </button>
                    </div>
                    {promoStatus === 'error' && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5 animate-fade-in">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Nieprawidłowy kod rabatowy
                      </p>
                    )}
                    <p className="text-neutral-600 text-xs">Podpowiedź: spróbuj kod <span className="text-neutral-400 font-mono">BUBR10</span></p>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-800 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Produkty</span>
                  <span className="text-white">{formatPrice(total)}</span>
                </div>
                {discountAmount > 0 && promoCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      Rabat -10%
                    </span>
                    <span className="text-emerald-400 font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Wysyłka</span>
                  <span className="text-white">{formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold mt-3 pt-3 border-t border-neutral-800">
                  <span className="text-white">Razem</span>
                  <div className="text-right">
                    {discountAmount > 0 && (
                      <span className="text-xs text-neutral-600 line-through block">{formatPrice(total + shippingCost)}</span>
                    )}
                    <span className="text-[#FF6B00] text-lg">{formatPrice(orderTotal)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black py-3.5 rounded-xl mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {submitting ? 'Przetwarzanie...' : 'Złóż zamówienie'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: 'Kasa — FootBubr' },
      { name: 'description', content: 'Dokończ zamówienie korków FootBubr: wysyłka InPost lub kurier, BLIK, karta i Apple Pay.' },
      { property: 'og:title', content: 'Kasa — FootBubr' },
      { property: 'og:description', content: 'Dokończ zamówienie korków FootBubr.' },
    ],
  }),
});
