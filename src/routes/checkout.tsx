import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { supabase, formatOrderNumber, Order } from '@/lib/supabase';
import { formatPrice, INPUT_CLASS, cn } from '@/lib/utils';
import { shippingCostFor, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { 
  ArrowLeft, Package, Truck, CreditCard, 
  Loader as Loader2, MapPin, Tag, X, Check, 
  CircleAlert as AlertCircle, Lock, ShieldCheck, 
  PackageOpen, ArrowRight, ExternalLink, Search
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface InPostPoint {
  name: string;
  address_details?: {
    city?: string;
    street?: string;
    building_number?: string;
    post_code?: string;
  };
  location_description?: string;
}

function formatPhoneNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function isMatchingShinGuardSize(variantSizeName: string, chosenSize: 'S' | 'XS'): boolean {
  const clean = (variantSizeName || '').toUpperCase().trim();
  if (chosenSize === 'XS') {
    return clean.startsWith('XS') || clean.includes(' XS') || clean.includes('XS ');
  }
  const isXS = clean.startsWith('XS') || clean.includes(' XS') || clean.includes('XS ');
  if (isXS) return false;
  return clean.startsWith('S') || clean.includes(' S') || clean.includes('S ') || clean.includes('S-') || clean.includes('S -') || clean.includes('S×') || clean.includes('S ×');
}

function CheckoutPage() {
  const { items, total, discountedTotal, discountAmount, appliedPromo, applyPromo, removePromo, clearCart } = useCart();
  const [step, setStep] = useState<'summary' | 'success'>('summary');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderRecord, setOrderRecord] = useState<Order | null>(null);
  
  // Wyszukiwarka Paczkomatów
  const [showInpostModal, setShowInpostModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingPoints, setSearchingPoints] = useState(false);
  const [pointsList, setPointsList] = useState<InPostPoint[]>([]);
  const [searchMessage, setSearchMessage] = useState('');

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

  // Bezpieczne sortowanie wyników wyszukiwania (zabezpieczone przed null/undefined)
  const sortPointsByRelevance = (itemsList: InPostPoint[], query: string): InPostPoint[] => {
    if (!Array.isArray(itemsList)) return [];
    const q = (query || '').trim().toLowerCase();
    const cleanPostal = q.replace(/[^\d]/g, '');

    return [...itemsList].sort((a, b) => {
      const aPost = (a?.address_details?.post_code || '').replace(/[^\d]/g, '');
      const bPost = (b?.address_details?.post_code || '').replace(/[^\d]/g, '');
      const aStreet = (a?.address_details?.street || '').toLowerCase();
      const bStreet = (b?.address_details?.street || '').toLowerCase();

      // Priorytet kodu pocztowego
      const aExactPostal = cleanPostal.length === 5 && aPost === cleanPostal;
      const bExactPostal = cleanPostal.length === 5 && bPost === cleanPostal;
      if (aExactPostal && !bExactPostal) return -1;
      if (!aExactPostal && bExactPostal) return 1;

      // Priorytet ulicy
      const aHasStreet = aStreet && q && aStreet.includes(q);
      const bHasStreet = bStreet && q && bStreet.includes(q);
      if (aHasStreet && !bHasStreet) return -1;
      if (!aHasStreet && bHasStreet) return 1;

      return 0;
    });
  };

  const handleSearchInpost = async (queryToSearch?: string) => {
    const raw = (queryToSearch ?? searchQuery).trim();
    if (!raw) return;

    setSearchingPoints(true);
    setSearchMessage('');

    try {
      // 1. Sprawdzenie czy wpisano bezpośredni kod paczkomatu (np. KRA01M)
      const cleanCode = raw.toUpperCase().replace(/\s+/g, '');
      if (/^[A-Z]{3}[0-9]{2,}[A-Z0-9]*$/.test(cleanCode)) {
        const resCode = await fetch(`https://api-pl-points.easypack24.net/v1/points/${cleanCode}`);
        if (resCode.ok) {
          const singlePoint = await resCode.json();
          if (singlePoint?.name) {
            setPointsList([singlePoint]);
            setSearchingPoints(false);
            return;
          }
        }
      }

      // 2. Jeśli wpisano kod pocztowy (np. 50-323 lub 50323)
      const postalMatch = raw.match(/\d{2}-?\d{3}/);
      if (postalMatch) {
        const pCode = postalMatch[0].includes('-') ? postalMatch[0] : `${postalMatch[0].slice(0, 2)}-${postalMatch[0].slice(2)}`;
        const resPost = await fetch(
          `https://api-pl-points.easypack24.net/v1/points?type=parcel_locker&post_code=${encodeURIComponent(pCode)}&limit=25`
        );
        const dataPost = await resPost.json();
        if (dataPost && Array.isArray(dataPost.items) && dataPost.items.length > 0) {
          setPointsList(sortPointsByRelevance(dataPost.items, raw));
          setSearchingPoints(false);
          return;
        }
      }

      // 3. Geokodowanie adresu
      let coords: { lat: number; lng: number } | null = null;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pl&limit=1&q=${encodeURIComponent(raw)}`
        );
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0 && geoData[0]?.lat && geoData[0]?.lon) {
          coords = {
            lat: parseFloat(geoData[0].lat),
            lng: parseFloat(geoData[0].lon),
          };
        }
      } catch (err) {
        console.warn('Geocoding fallback', err);
      }

      // 4. Wyszukiwanie w InPost po koordynatach
      if (coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
        const resNear = await fetch(
          `https://api-pl-points.easypack24.net/v1/points?type=parcel_locker&relative_point=${coords.lat},${coords.lng}&limit=25`
        );
        const dataNear = await resNear.json();
        if (dataNear && Array.isArray(dataNear.items) && dataNear.items.length > 0) {
          setPointsList(sortPointsByRelevance(dataNear.items, raw));
          setSearchingPoints(false);
          return;
        }
      }

      // 5. Fallback: wyszukiwanie tekstowe
      const cleanStreet = raw.replace(/[0-9]/g, '').trim();
      const resFallback = await fetch(
        `https://api-pl-points.easypack24.net/v1/points?type=parcel_locker&query=${encodeURIComponent(cleanStreet || raw)}&limit=25`
      );
      const dataFallback = await resFallback.json();

      if (dataFallback && Array.isArray(dataFallback.items) && dataFallback.items.length > 0) {
        setPointsList(sortPointsByRelevance(dataFallback.items, raw));
      } else {
        setPointsList([]);
        setSearchMessage('Nie znaleziono paczkomatów. Spróbuj dopisać miasto lub podać kod pocztowy.');
      }
    } catch (err) {
      setPointsList([]);
      setSearchMessage('Błąd połączenia. Możesz wpisać kod paczkomatu ręcznie w formularzu.');
    } finally {
      setSearchingPoints(false);
    }
  };

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
    const rollbacks: (() => Promise<any>)[] = [];

    try {
      for (const { product, quantity } of items) {
        const pName = (product.name || '').toLowerCase();
        const pBrand = (product.brand || '').toLowerCase();
        const isAccessory =
          pBrand === 'footbubr' ||
          pName.includes('skarpety') ||
          pName.includes('ochraniacze') ||
          pName.includes('taśma') ||
          pName.includes('tasma') ||
          pName.includes('zestaw') ||
          Boolean(product.accessory_type);

        const isBundle =
          product.accessory_type === 'Zestawy FOOTBUBR' ||
          pName.includes('zestaw');

        if (!isAccessory) {
          const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update({ status: 'sold', stock_quantity: 0 })
            .eq('id', product.id)
            .eq('status', 'available')
            .select('id')
            .maybeSingle();

          if (updateError || !updatedProduct) {
            setGeneralError(`Niestety! Produkt "${product.name}" został wykupiony przed chwilą.`);
            setSubmitting(false);
            return;
          }

          rollbacks.push(async () => {
            await supabase.from('products').update({ status: 'available', stock_quantity: 1 }).eq('id', product.id);
          });
        } else if (isBundle) {
          const { data: currentBox } = await supabase.from('products').select('*').eq('id', product.id).single();
          if (!currentBox || (currentBox.stock_quantity ?? 0) < quantity) {
            setGeneralError('Brak wystarczającej ilości zestawów w magazynie.');
            setSubmitting(false);
            return;
          }

          const newBoxStock = Math.max(0, (currentBox.stock_quantity ?? 100) - quantity);
          await supabase.from('products').update({ 
            stock_quantity: newBoxStock,
            status: newBoxStock === 0 ? 'sold' : 'available'
          }).eq('id', product.id);

          rollbacks.push(async () => {
            await supabase.from('products').update({ stock_quantity: currentBox.stock_quantity, status: currentBox.status }).eq('id', product.id);
          });

          const configStr = product.size_eu || '';
          const chosenShinGuardSize: 'S' | 'XS' = configStr.toUpperCase().includes('XS') ? 'XS' : 'S';
          const chosenTapeColorKey = configStr.toLowerCase().includes('biał') ? 'biał' : 'czarn';

          // 1. Skarpety
          const { data: sockProd } = await supabase
            .from('products')
            .select('*')
            .or('accessory_type.eq.Skarpety antypoślizgowe,name.ilike.%skarpety%')
            .neq('id', product.id)
            .limit(1)
            .maybeSingle();

          if (sockProd) {
            const oldSockStock = sockProd.stock_quantity ?? 100;
            const newSockStock = Math.max(0, oldSockStock - quantity);
            await supabase.from('products').update({
              stock_quantity: newSockStock,
              status: newSockStock === 0 ? 'sold' : 'available'
            }).eq('id', sockProd.id);

            rollbacks.push(async () => {
              await supabase.from('products').update({ stock_quantity: oldSockStock, status: sockProd.status }).eq('id', sockProd.id);
            });
          }

          // 2. Ochraniacze
          const { data: shinProd } = await supabase
            .from('products')
            .select('*')
            .or('accessory_type.eq.Mini ochraniacze,name.ilike.%ochraniacze%')
            .neq('id', product.id)
            .limit(1)
            .maybeSingle();

          if (shinProd) {
            let shinVariants: { size: string; stock: number }[] = [];
            try {
              if (shinProd.condition_detail && shinProd.condition_detail.startsWith('[')) {
                shinVariants = JSON.parse(shinProd.condition_detail);
              }
            } catch {}

            if (shinVariants.length > 0) {
              const updatedVariants = shinVariants.map((v) => {
                if (isMatchingShinGuardSize(v.size, chosenShinGuardSize)) {
                  return { ...v, stock: Math.max(0, (v.stock || 0) - quantity) };
                }
                return v;
              });

              const totalShinStock = updatedVariants.reduce((s, v) => s + (v.stock || 0), 0);
              await supabase.from('products').update({
                condition_detail: JSON.stringify(updatedVariants),
                stock_quantity: totalShinStock,
                status: totalShinStock === 0 ? 'sold' : 'available'
              }).eq('id', shinProd.id);

              rollbacks.push(async () => {
                await supabase.from('products').update({
                  condition_detail: shinProd.condition_detail,
                  stock_quantity: shinProd.stock_quantity,
                  status: shinProd.status
                }).eq('id', shinProd.id);
              });
            } else {
              const oldShinStock = shinProd.stock_quantity ?? 100;
              const newShinStock = Math.max(0, oldShinStock - quantity);
              await supabase.from('products').update({
                stock_quantity: newShinStock,
                status: newShinStock === 0 ? 'sold' : 'available'
              }).eq('id', shinProd.id);

              rollbacks.push(async () => {
                await supabase.from('products').update({ stock_quantity: oldShinStock, status: shinProd.status }).eq('id', shinProd.id);
              });
            }
          }

          // 3. Taśma
          const { data: tapeProds } = await supabase
            .from('products')
            .select('*')
            .or('accessory_type.ilike.%taśm%,accessory_type.ilike.%tape%,name.ilike.%taśma%,name.ilike.%tasma%')
            .neq('id', product.id);

          if (tapeProds && tapeProds.length > 0) {
            const targetTape = tapeProds.find((t) => (t.name || '').toLowerCase().includes(chosenTapeColorKey)) || tapeProds[0];
            if (targetTape) {
              const oldTapeStock = targetTape.stock_quantity ?? 50;
              const newTapeStock = Math.max(0, oldTapeStock - quantity);
              await supabase.from('products').update({
                stock_quantity: newTapeStock,
                status: newTapeStock === 0 ? 'sold' : 'available'
              }).eq('id', targetTape.id);

              rollbacks.push(async () => {
                await supabase.from('products').update({ stock_quantity: oldTapeStock, status: targetTape.status }).eq('id', targetTape.id);
              });
            }
          }
        } else {
          const { data: currentProd } = await supabase.from('products').select('*').eq('id', product.id).single();
          if (!currentProd || (currentProd.stock_quantity ?? 0) < quantity) {
            setGeneralError(`Niestety! Brak wystarczającej ilości produktu "${product.name}".`);
            setSubmitting(false);
            return;
          }

          let prodVariants: { size: string; stock: number }[] = [];
          try {
            if (currentProd.condition_detail && currentProd.condition_detail.startsWith('[')) {
              prodVariants = JSON.parse(currentProd.condition_detail);
            }
          } catch {}

          if (prodVariants.length > 0) {
            const updatedVariants = prodVariants.map((v) => {
              if (v.size === product.size_eu) {
                return { ...v, stock: Math.max(0, (v.stock || 0) - quantity) };
              }
              return v;
            });

            const newTotal = updatedVariants.reduce((s, v) => s + (v.stock || 0), 0);
            await supabase.from('products').update({
              condition_detail: JSON.stringify(updatedVariants),
              stock_quantity: newTotal,
              status: newTotal === 0 ? 'sold' : 'available'
            }).eq('id', product.id);
          } else {
            const newStock = Math.max(0, (currentProd.stock_quantity ?? 100) - quantity);
            await supabase.from('products').update({
              stock_quantity: newStock,
              status: newStock === 0 ? 'sold' : 'available'
            }).eq('id', product.id);
          }

          rollbacks.push(async () => {
            await supabase.from('products').update({
              condition_detail: currentProd.condition_detail,
              stock_quantity: currentProd.stock_quantity,
              status: currentProd.status
            }).eq('id', product.id);
          });
        }
      }

      if (form.paymentMethod === 'blik') {
        setBlikStep('waiting');
        await new Promise((r) => setTimeout(r, 1800));

        if (form.blikCode === '222222') {
          for (const rollback of rollbacks) {
            await rollback();
          }

          setBlikStep('idle');
          setSubmitting(false);
          setGeneralError('Płatność BLIK została odrzucona przez bank. Przedmioty wróciły do oferty.');
          return;
        }

        setBlikStep('confirmed');
        await new Promise((r) => setTimeout(r, 600));
      }

      const placedOrderIds: string[] = [];
      let firstRecord: Order | null = null;
      const cleanPhone = `+48${form.phone.replace(/\D/g, '')}`;

      for (const { product, quantity } of items) {
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
        const variantNote = product.size_eu ? ` [Wariant: ${product.size_eu}]` : '';

        const orderPayload = {
          product_id: product.id,
          customer_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          customer_email: form.email.trim().toLowerCase(),
          customer_phone: cleanPhone,
          shipping_method: form.shippingMethod,
          paczkomat_code: form.shippingMethod === 'paczkomat' ? `${form.paczkomatCode.trim().toUpperCase()}${variantNote}` : null,
          shipping_address:
            form.shippingMethod === 'kurier'
              ? `${form.address.trim()}, ${form.postalCode.trim()} ${form.city.trim()}${variantNote}`
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
        } else if (order) {
          placedOrderIds.push(order.id);
          if (!firstRecord) firstRecord = order as Order;
        }
      }

      if (appliedPromo && appliedPromo.id) {
        const newUses = Math.max(0, appliedPromo.uses_left - 1);
        await supabase
          .from('discount_codes')
          .update({ uses_left: newUses })
          .eq('id', appliedPromo.id);
      }

      if (placedOrderIds.length > 0 || firstRecord) {
        setOrderId(placedOrderIds[0] || 'ORD-' + Date.now().toString().slice(-6));
        if (firstRecord) setOrderRecord(firstRecord);
        clearCart();
        setStep('success');
      } else {
        setGeneralError('Wystąpił problem przy składaniu zamówienia. Spróbuj ponownie.');
      }
    } catch (err: any) {
      console.error('Unexpected order error:', err);
      for (const rollback of rollbacks) {
        await rollback();
      }
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
      <div className="min-h-screen flex flex-col bg-[#090909] overflow-hidden relative">
        <Header />
        
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti-fall rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 16 + 8}px`,
                backgroundColor: ['#FF6B00', '#FFFFFF', '#4ADE80'][Math.floor(Math.random() * 3)],
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 1.5}s`,
                opacity: Math.random() * 0.5 + 0.5,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>

        <main className="flex-1 flex items-center justify-center relative px-4 py-12">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF6B00]/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-md w-full bg-[#141414] border border-neutral-800 rounded-3xl p-8 sm:p-10 text-center relative z-10 animate-scale-in shadow-2xl">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div 
                className="absolute inset-0 bg-[#FF6B00]/20 rounded-full animate-ping" 
                style={{ animationDuration: '2s' }} 
              />
              <div className="relative w-full h-full bg-[#FF6B00] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,107,0,0.4)]">
                <Check className="w-10 h-10 text-black stroke-[3]" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-2">
              Zamówienie złożone!
            </h1>

            <p className="text-neutral-400 text-xs sm:text-sm mb-3">
              Dziękujemy za zakupy w FootBubr.
            </p>

            <div className="inline-block bg-white/5 border border-neutral-800 rounded-xl px-4 py-1.5 mb-6">
              <span className="text-xs text-neutral-500 font-medium">Nr zamówienia: </span>
              <span className="text-sm font-black text-[#FF6B00] font-mono">
                {orderRecord ? formatOrderNumber(orderRecord) : `#${orderId.slice(0, 8).toUpperCase()}`}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              Szczegóły wysłaliśmy na Twój adres e-mail. Zamówienie trafiło do realizacji!
            </p>

            <div className="bg-black/40 border border-neutral-800 rounded-2xl p-4 mb-6 flex items-center gap-3.5 text-left">
              <PackageOpen className="w-8 h-8 text-[#FF6B00] flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white uppercase">Szykujemy paczkę</p>
                <p className="text-[11px] text-neutral-500">Wkrótce otrzymasz powiadomienie z numerem nadania.</p>
              </div>
            </div>

            <Link
              to="/"
              className="w-full bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black uppercase text-xs sm:text-sm tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
            >
              Wróć do sklepu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>

        <style>{`
          @keyframes confetti-fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti-fall {
            animation-name: confetti-fall;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
          }
        `}</style>
      </div>
    );
  }

  const inp = INPUT_CLASS;

  return (
    <div className="min-h-screen">
      <Header />
      <CartDrawer />

      {/* MODAL WYSZUKIWARKI PACZKOMATÓW */}
      {showInpostModal && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 bg-[#111]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF6B00]" />
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                  Wyszukaj Paczkomat InPost
                </h3>
              </div>
              <button
                onClick={() => setShowInpostModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-neutral-800 space-y-3 bg-[#161616]">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Wpisz miasto, ulicę lub kod pocztowy..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchInpost()}
                    className={`${inp} pl-9 text-xs sm:text-sm`}
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchInpost()}
                  disabled={searchingPoints || !searchQuery.trim()}
                  className="bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black text-xs px-4 rounded-xl transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                >
                  {searchingPoints ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Szukaj'}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Wolisz oficjalną mapę?</span>
                <a
                  href="https://inpost.pl/znajdz-paczkomat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF6B00] hover:underline flex items-center gap-1 font-semibold"
                >
                  Otwórz w nowej karcie <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[50vh]">
              {searchingPoints && (
                <div className="py-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
                  <span className="text-xs">Wyszukiwanie paczkomatów w okolicy...</span>
                </div>
              )}

              {!searchingPoints && pointsList.length > 0 && (
                <div className="space-y-2">
                  {pointsList.map((pt) => {
                    const qClean = searchQuery.trim().toLowerCase();
                    const qPostalClean = qClean.replace(/[^\d]/g, '');
                    const ptPostal = (pt?.address_details?.post_code || '').replace(/[^\d]/g, '');
                    const ptStreet = (pt?.address_details?.street || '').toLowerCase();

                    const isExactPostal = qPostalClean.length === 5 && ptPostal === qPostalClean;
                    const isExactStreet = qClean.length > 2 && ptStreet.includes(qClean);

                    return (
                      <div
                        key={pt.name}
                        onClick={() => {
                          setForm({ ...form, paczkomatCode: pt.name });
                          setShowInpostModal(false);
                        }}
                        className={cn(
                          'p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group border',
                          isExactPostal || isExactStreet
                            ? 'bg-[#FF6B00]/10 border-[#FF6B00]/50 hover:bg-[#FF6B00]/15'
                            : 'bg-black/40 hover:bg-white/5 border-neutral-800 hover:border-neutral-700'
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-sm text-[#FF6B00] group-hover:scale-105 transition-transform">
                              {pt.name}
                            </span>
                            <span className="text-xs text-white font-semibold truncate">
                              {pt.address_details?.street || ''} {pt.address_details?.building_number || ''}
                            </span>
                            {(isExactPostal || isExactStreet) && (
                              <span className="text-[10px] bg-[#FF6B00] text-black font-black px-1.5 py-0.2 rounded font-mono">
                                NAJBLIŻSZY
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {pt.address_details?.post_code || ''} {pt.address_details?.city || ''}
                            {pt.location_description ? ` · ${pt.location_description}` : ''}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="bg-white/10 group-hover:bg-[#FF6B00] group-hover:text-black text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
                        >
                          Wybierz
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!searchingPoints && pointsList.length === 0 && (
                <div className="py-12 text-center text-neutral-500">
                  {searchMessage ? (
                    <p className="text-xs text-amber-400/90">{searchMessage}</p>
                  ) : (
                    <p className="text-xs">Wpisz miasto, ulicę lub kod pocztowy powyżej, aby znaleźć paczkomaty.</p>
                  )}
                </div>
              )}
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
                <Check className="w-10 h-10 text-emerald-400 mx-auto mb-4 animate-scale-in stroke-[3]" />
                <h3 className="text-white font-black uppercase tracking-tight text-lg">Płatność potwierdzona</h3>
                <p className="text-neutral-400 text-sm mt-2">BLIK zaakceptowany - finalizujemy zamówienie.</p>
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
                        onClick={() => {
                          setShowInpostModal(true);
                          const initialQuery = form.postalCode || form.city || '';
                          if (initialQuery) {
                            setSearchQuery(initialQuery);
                            handleSearchInpost(initialQuery);
                          }
                        }}
                        className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-bold text-xs rounded-xl transition-all flex-shrink-0 active:scale-95 shadow-[0_2px_10px_rgba(255,107,0,0.2)] flex items-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" />
                        Znajdź Paczkomat
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
                    Kod BLIK (Test: 111111 = Sukces, 222222 = Błąd)
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
                Płatność testowa - zamówienie zostanie zapisane w panelu admina
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
                      {product.images && product.images[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {quantity > 1 ? `Ilość: ${quantity} szt. · ` : ''}{product.size_eu}
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
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
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
                    Darmowa dostawa od {formatPrice(FREE_SHIPPING_THRESHOLD)} - brakuje {formatPrice(FREE_SHIPPING_THRESHOLD - discountedTotal)}
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
      { title: 'Kasa - FootBubr' },
      { name: 'description', content: 'Dokończ zamówienie korków i akcesoriów FootBubr: wysyłka InPost lub kurier, BLIK, karta i szybki przelew.' },
      { property: 'og:title', content: 'Kasa - FootBubr' },
      { property: 'og:description', content: 'Dokończ zamówienie FootBubr.' },
    ],
  }),
});
