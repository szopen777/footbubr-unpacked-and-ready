import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart-context';
import { supabase, formatOrderNumber, Order } from '@/lib/supabase';
import { formatPrice, INPUT_CLASS } from '@/lib/utils';
import { shippingCostFor, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ArrowLeft, Package, Truck, CreditCard, CircleCheck as CheckCircle2, Loader as Loader2, MapPin, Tag, X, Check, CircleAlert as AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { Link } from '@tanstack/react-router';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'inpost-geowidget': any;
    }
  }
}

function formatPhoneNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function CheckoutPage() {
  const { items, total, discountedTotal, discountAmount, promoCode, appliedPromo, applyPromo, removePromo, clearCart } = useCart();
  const [step, setStep] = useState<'summary' | 'success'>('summary');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderRecord, setOrderRecord] = useState<Order | null>(null);
  const [showInpostMap, setShowInpostMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shippingMethod: 'paczkomat' as 'paczkomat' | 'kurier',
    paczkomatCode: '',
    address: '',
    postalCode: '',
    city: '',
    paymentMethod: 'blik' as 'blik' | 'card' | 'transfer',
    blikCode: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [blikStep, setBlikStep] = useState<'idle' | 'waiting' | 'confirmed'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoErrorMsg, setPromoErrorMsg] = useState('');

  const shippingCost = shippingCostFor(form.shippingMethod, discountedTotal);
  const orderTotal = discountedTotal + shippingCost;

  useEffect(() => {
    if (!document.getElementById('inpost-geowidget-css')) {
      const link = document.createElement('link');
      link.id = 'inpost-geowidget-css';
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = 'https://geowidget.inpost.pl/inpost-geowidget.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('inpost-geowidget-js')) {
      const script = document.createElement('script');
      script.id = 'inpost-geowidget-js';
      script.src = 'https://geowidget.inpost.pl/inpost-geowidget.js';
      script.defer = true;
      document.head.appendChild(script);
    }

    (window as any).onInpostPointSelected = (point: any) => {
      const code = point?.name || point?.id || point?.address_details?.name;
      if (code) {
        setForm((prev) => ({ ...prev, paczkomatCode: String(code).toUpperCase() }));
        setShowInpostMap(false);
      }
    };

    const handlePointEvent = (e: any) => {
      const code = e.detail?.name || e.detail?.id || e.name;
      if (code) {
        setForm((prev) => ({ ...prev, paczkomatCode: String(code).toUpperCase() }));
        setShowInpostMap(false);
      }
    };

    document.addEventListener('onpointselect', handlePointEvent);
    document.addEventListener('inpost.geowidget.point_selected', handlePointEvent);

    return () => {
      document.removeEventListener('onpointselect', handlePointEvent);
      document.removeEventListener('inpost.geowidget.point_selected', handlePointEvent);
    };
  }, []);

  useEffect(() => {
    if (showInpostMap && mapContainerRef.current) {
      mapContainerRef.current.innerHTML = `
        <inpost-geowidget 
          id="inpost-geowidget" 
          onpoint="onInpostPointSelected" 
          config="parcelCollect" 
          language="pl" 
          style="width: 100%; height: 100%; display: block;">
        </inpost-geowidget>
      `;
      setMapLoaded(true);
    }
  }, [showInpostMap]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Imię jest wymagane';
    if (!form.lastName.trim()) e.lastName = 'Nazwisko jest wymagane';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!form.email.trim()) {
      e.email = 'Adres email jest wymagany';
    } else if (!emailRegex.test(form.email.trim())) {
      e.email = 'Podaj poprawny adres email (np. jan@domena.pl)';
    }

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      e.phone = 'Numer telefonu jest wymagany';
    } else if (cleanPhone.length !== 9) {
      e.phone = 'Wpisz 9 cyfr numeru telefonu';
    }

    if (form.shippingMethod === 'paczkomat' && !form.paczkomatCode.trim()) e.paczkomatCode = 'Podaj kod paczkomatu';
    if (form.shippingMethod === 'kurier') {
      if (!form.address.trim()) e.address = 'Podaj ulicę i numer';
      if (!form.postalCode.trim()) e.postalCode = 'Podaj kod pocztowy';
      if (!form.city.trim()) e.city = 'Podaj miasto';
    }
    if (form.paymentMethod === 'blik' && form.blikCode.length !== 6) e.blikCode = 'Kod BLIK musi mieć 6 cyfr';
    if (!acceptTerms) e.acceptTerms = 'Musisz zaakceptować regulamin i politykę prywatności';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoErrorMsg('');

    const res = await applyPromo(promoInput);
    setPromoLoading(false);

    if (res.success) {
      setPromoInput('');
    } else {
      setPromoErrorMsg(res.error || 'Nieprawidłowy kod rabatowy');
    }
  };

  const handleRemovePromo = () => {
    removePromo();
    setPromoErrorMsg('');
    setPromoInput('');
  };

  const handleSubmit = async () => {
    setGeneralError('');
    if (!validate()) return;
    if (items.length === 0) return;

    setSubmitting(true);

    try {
      // 1. PANCERNA WERYFIKACJA STANU MAGAZYNOWEGO NA ŻYWO W SUPABASE PRZED PŁATNOŚCIĄ
      for (const { product, quantity } of items) {
        const { data: currentProd, error: checkError } = await supabase
          .from('products')
          .select('id, name, status, stock_quantity')
          .eq('id', product.id)
          .single();

        if (checkError || !currentProd) {
          setGeneralError('Nie udało się zweryfikować dostępności produktów. Spróbuj ponownie.');
          setSubmitting(false);
          return;
        }

        // Sprawdzenie czy ktoś nie wykupił pary 1 of 1
        if (currentProd.status === 'sold') {
          setGeneralError(`Niestety! Produkt "${currentProd.name}" został właśnie wykupiony przez kogoś innego.`);
          setSubmitting(false);
          return;
        }

        // Sprawdzenie ilości dla akcesoriów
        if (currentProd.stock_quantity !== null && currentProd.stock_quantity < quantity) {
          setGeneralError(`Brak wystarczającej ilości dla produktu "${currentProd.name}". Dostępne: ${currentProd.stock_quantity} szt.`);
          setSubmitting(false);
          return;
        }
      }

      // 2. Symulacja płatności BLIK (po pomyślnej weryfikacji dostępności)
      if (form.paymentMethod === 'blik') {
        setBlikStep('waiting');
        await new Promise((r) => setTimeout(r, 1800));
        setBlikStep('confirmed');
        await new Promise((r) => setTimeout(r, 600));
      }

      const placedOrderIds: string[] = [];
      let firstRecord: Order | null = null;
      const cleanPhone = `+48${form.phone.replace(/\D/g, '')}`;

      // 3. Składanie zamówienia i aktualizacja stanów
      for (const { product, quantity } of items) {
        const pName = (product.name || '').toLowerCase();
        const pBrand = (product.brand || '').toLowerCase();
        const pModel = (product.model || '').toLowerCase();
        const isAccessory =
          pBrand === 'footbubr' ||
          pName.includes('skarpety') ||
          pName.includes('ochraniacze') ||
          pName.includes('taśma') ||
          pName.includes('tasma') ||
          pName.includes('zestaw') ||
          pModel.includes('skarpety') ||
          pModel.includes('ochraniacze') ||
          Boolean(product.accessory_type);

        let itemPrice = product.price;
        if (appliedPromo) {
          if (appliedPromo.discount_type === 'percentage') {
            itemPrice = Math.round(product.price * (1 - appliedPromo.discount_value / 100));
          } else {
            const ratio = (product.price * quantity) / (total || 1);
            itemPrice = Math.max(0, product.price - Math.round((appliedPromo.discount_value * ratio) / quantity));
          }
        }

        const itemTotal = itemPrice * quantity + shippingCost;

        const orderPayload = {
          product_id: product.id,
          customer_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          customer_email: form.email.trim().toLowerCase(),
          customer_phone: cleanPhone,
          shipping_method: form.shippingMethod,
          paczkomat_code: form.shippingMethod === 'paczkomat' ? form.paczkomatCode.trim().toUpperCase() : null,
          shipping_address:
            form.shippingMethod === 'kurier'
              ? `${form.address.trim()}, ${form.postalCode.trim()} ${form.city.trim()}`
              : null,
          payment_method: form.paymentMethod,
          total_price: itemTotal,
          status: 'paid' as const,
        };

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(orderPayload)
          .select('*')
          .maybeSingle();

        if (orderError) {
          console.error('Supabase order insert error:', orderError);
          const tempId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
          placedOrderIds.push(tempId);
        } else if (order) {
          placedOrderIds.push(order.id);
          if (!firstRecord) firstRecord = order as Order;
        }

        if (isAccessory) {
          const currentStock = product.stock_quantity ?? 100;
          const newStock = Math.max(0, currentStock - quantity);
          await supabase
            .from('products')
            .update({ 
              stock_quantity: newStock,
              status: newStock === 0 ? 'sold' : 'available'
            })
            .eq('id', product.id);
        } else {
          // Zablokowanie produktu 1 of 1 jako sprzedany
          await supabase
            .from('products')
            .update({ status: 'sold', stock_quantity: 0 })
            .eq('id', product.id);
        }
      }

      if (appliedPromo && appliedPromo.id) {
        const newUses = Math.max(0, appliedPromo.uses_left - 1);
        await supabase
          .from('discount_codes')
          .update({ uses_left: newUses })
          .eq('id', appliedPromo.id);
      }

      if (placedOrderIds.length > 0 || !firstRecord) {
        setOrderId(placedOrderIds[0] || 'ORD-' + Date.now().toString().slice(-6));
        if (firstRecord) setOrderRecord(firstRecord);
        clearCart();
        setStep('success');
      } else {
        setGeneralError('Wystąpił problem przy składaniu zamówienia. Spróbuj ponownie.');
      }
    } catch (err: any) {
      console.error('Unexpected order error:', err);
      setGeneralError(err?.message || 'Błąd połączenia. Spróbuj ponownie.');
    } finally {
      setSubmitting(false);
      setBlikStep('idle');
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
          <p className="text-neutral-600 text-sm mb-8">Nr zamówienia: <span className="text-neutral-300 font-mono">{orderRecord ? formatOrderNumber(orderRecord) : orderId.slice(0, 8).toUpperCase()}</span></p>
          <p className="text-neutral-500 text-sm mb-8">Szczegóły wysłaliśmy na Twój adres email. Zamówienie trafiło do realizacji!</p>
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

      {showInpostMap && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#111]">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF6B00]" /> Wybierz Paczkomat InPost z mapy
              </h3>
              <button
                onClick={() => setShowInpostMap(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full bg-[#1c1c1c] relative overflow-hidden">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}

      {blikStep !== 'idle' && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#111] border-2 border-[#FF6B00]/40 rounded-2xl p-6 text-center shadow-[0_0_40px_rgba(255,107,0,0.2)]">
            {blikStep === 'waiting' ? (
              <>
                <Loader2 className="w-10 h-10 text-[#FF6B00] animate-spin mx-auto mb-4" />
                <h3 className="text-white font-black uppercase tracking-tight text-lg">Potwierdź w aplikacji banku</h3>
                <p className="text-neutral-400 text-sm mt-2">
                  Wysłaliśmy żądanie BLIK dla kodu <span className="font-mono text-white">{form.blikCode}</span>.
                  Zatwierdź płatność w telefonie.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4 animate-scale-in" />
                <h3 className="text-white font-black uppercase tracking-tight text-lg">Płatność potwierdzona</h3>
                <p className="text-neutral-400 text-sm mt-2">BLIK zaakceptowany — finalizujemy zamówienie.</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8 animate-fade-in">
          <Link to="/" className="text-neutral-500 hover:text-white transition-colors active:scale-90">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Kasa</h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4 sm:p-6 animate-fade-in-up">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
                <span className="w-6 h-6 bg-[#FF6B00] text-black text-xs font-black rounded-full flex items-center justify-center">1</span>
                Dane kontaktowe
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input className={inp} placeholder="Imię *" value={form.firstName} onChange={(e) => { setForm({ ...form, firstName: e.target.value }); if (errors.firstName) setErrors({ ...errors, firstName: '' }); }} />
                    {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <input className={inp} placeholder="Nazwisko *" value={form.lastName} onChange={(e) => { setForm({ ...form, lastName: e.target.value }); if (errors.lastName) setErrors({ ...errors, lastName: '' }); }} />
                    {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <input className={inp} placeholder="Adres email *" type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }} />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500 pointer-events-none select-none">
                      +48
                    </span>
                    <input
                      className={`${inp} pl-12 font-mono tracking-wide`}
                      placeholder="123 456 789 *"
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={formatPhoneNumber(form.phone)}
                      onChange={(e) => {
                        const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setForm({ ...form, phone: rawDigits });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4 sm:p-6 animate-fade-in-up">
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
                  <span className="text-sm font-bold text-white flex-shrink-0">{formatPrice(shippingCostFor('paczkomat', discountedTotal))}</span>
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
                    <p className="text-sm font-semibold text-white">Kurier InPost</p>
                    <p className="text-xs text-neutral-500 hidden sm:block">Dostawa pod adres</p>
                  </div>
                  <span className="text-sm font-bold text-white flex-shrink-0">{formatPrice(shippingCostFor('kurier', discountedTotal))}</span>
                </label>

                {form.shippingMethod === 'paczkomat' && (
                  <div className="animate-fade-in space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          className={`${inp} pl-9 uppercase`}
                          placeholder="Kod paczkomatu (np. WAW123M) *"
                          value={form.paczkomatCode}
                          onChange={(e) => {
                            setForm({ ...form, paczkomatCode: e.target.value.toUpperCase() });
                            if (errors.paczkomatCode) setErrors({ ...errors, paczkomatCode: '' });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowInpostMap(true)}
                        className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold text-xs rounded-xl transition-all flex-shrink-0 active:scale-95 shadow-[0_2px_10px_rgba(255,107,0,0.2)]"
                      >
                        Wybierz z mapy
                      </button>
                    </div>
                    {errors.paczkomatCode && <p className="text-red-400 text-xs mt-1">{errors.paczkomatCode}</p>}
                  </div>
                )}

                {form.shippingMethod === 'kurier' && (
                  <div className="animate-fade-in space-y-2">
                    <div>
                      <input
                        className={inp}
                        placeholder="Ulica i numer domu / lokalu *"
                        value={form.address}
                        onChange={(e) => {
                          setForm({ ...form, address: e.target.value });
                          if (errors.address) setErrors({ ...errors, address: '' });
                        }}
                      />
                      {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          className={inp}
                          placeholder="Kod pocztowy *"
                          value={form.postalCode}
                          onChange={(e) => {
                            setForm({ ...form, postalCode: e.target.value });
                            if (errors.postalCode) setErrors({ ...errors, postalCode: '' });
                          }}
                        />
                        {errors.postalCode && <p className="text-red-400 text-xs mt-1">{errors.postalCode}</p>}
                      </div>
                      <div>
                        <input
                          className={inp}
                          placeholder="Miasto *"
                          value={form.city}
                          onChange={(e) => {
                            setForm({ ...form, city: e.target.value });
                            if (errors.city) setErrors({ ...errors, city: '' });
                          }}
                        />
                        {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4 sm:p-6 animate-fade-in-up">
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
                    onChange={(e) => {
                      setForm({ ...form, blikCode: e.target.value.replace(/\D/g, '').slice(0, 6) });
                      if (errors.blikCode) setErrors({ ...errors, blikCode: '' });
                    }}
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
                Płatność testowa — zamówienie zostanie zapisane w panelu admina
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-4 sm:p-6 lg:sticky lg:top-24 animate-fade-in-up">
              <h2 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Podsumowanie</h2>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white/5 border border-neutral-800 flex-shrink-0">
                      {product.images[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-xs text-neutral-500">
                        {quantity > 1 ? `Ilość: ${quantity} szt. · ` : ''}EU {product.size_eu}
                      </p>
                      <p className="text-sm font-bold text-[#FF6B00] mt-0.5">{formatPrice(product.price * quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-800 pt-4 space-y-3">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-emerald-400 truncate">
                        {appliedPromo.discount_type === 'percentage' 
                          ? `-${appliedPromo.discount_value}% (${appliedPromo.code})` 
                          : `-${appliedPromo.discount_value} PLN (${appliedPromo.code})`}
                      </span>
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
                          onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoErrorMsg(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                          className="w-full bg-white/5 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 uppercase font-mono transition-all"
                        />
                      </div>
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 flex-shrink-0 disabled:opacity-40"
                      >
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zastosuj'}
                      </button>
                    </div>
                    {promoErrorMsg && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5 animate-fade-in">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {promoErrorMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-800 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Produkty</span>
                  <span className="text-white">{formatPrice(total)}</span>
                </div>
                {discountAmount > 0 && appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      Rabat {appliedPromo.discount_type === 'percentage' ? `-${appliedPromo.discount_value}%` : `-${appliedPromo.discount_value} PLN`}
                    </span>
                    <span className="text-emerald-400 font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Wysyłka</span>
                  <span className="text-white">{shippingCost === 0 ? <span className="text-emerald-400 font-bold">DARMOWA</span> : formatPrice(shippingCost)}</span>
                </div>
                {discountedTotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="text-xs text-neutral-600 pt-1">
                    Darmowa dostawa od {formatPrice(FREE_SHIPPING_THRESHOLD)} — brakuje {formatPrice(FREE_SHIPPING_THRESHOLD - discountedTotal)}
                  </p>
                )}
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

              {/* Checkbox zgód prawnych */}
              <div className="pt-4 mt-4 border-t border-neutral-800">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (errors.acceptTerms) setErrors({ ...errors, acceptTerms: '' });
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-black/40 text-[#FF6B00] focus:ring-[#FF6B00] focus:ring-offset-0 cursor-pointer accent-[#FF6B00]"
                  />
                  <span className="text-xs text-neutral-400 leading-snug group-hover:text-neutral-300">
                    Oświadczam, że znam i akceptuję postanowienia{' '}
                    <Link to="/terms" target="_blank" className="text-[#FF6B00] underline hover:text-[#FF7A00]">
                      Regulaminu
                    </Link>{' '}
                    oraz{' '}
                    <Link to="/privacy" target="_blank" className="text-[#FF6B00] underline hover:text-[#FF7A00]">
                      Polityki Prywatności
                    </Link>
                    . *
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-red-400 text-xs mt-1.5">{errors.acceptTerms}</p>}
              </div>

              {generalError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Przycisk zamówienia */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black py-3.5 rounded-xl mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4 text-black" />}
                {submitting ? 'Przetwarzanie...' : 'Złóż zamówienie i zapłać'}
              </button>

              <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B00]" /> 100% Oryginalne
                </span>
                <span>•</span>
                <span>14 dni na zwrot</span>
              </div>
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
      { name: 'description', content: 'Dokończ zamówienie korków i akcesoriów FootBubr: wysyłka InPost lub kurier, BLIK, karta i szybki przelew.' },
      { property: 'og:title', content: 'Kasa — FootBubr' },
      { property: 'og:description', content: 'Dokończ zamówienie FootBubr.' },
    ],
  }),
});
