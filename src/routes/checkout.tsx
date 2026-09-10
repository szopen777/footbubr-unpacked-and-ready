import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { supabase, formatOrderNumber, Order, Product } from '@/lib/supabase';
import { formatPrice, INPUT_CLASS, cn } from '@/lib/utils';
import { shippingCostFor, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { 
  ArrowLeft, Package, Truck, CreditCard, 
  Loader as Loader2, MapPin, Tag, X, Check, 
  CircleAlert as AlertCircle, Lock, ShieldCheck, 
  PackageOpen, ArrowRight, ExternalLink, Search, Trash2, Plus, Zap
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
  const { items, total, discountedTotal, discountAmount, appliedPromo, applyPromo, removePromo, clearCart, removeItem, addItem } = useCart();
  
  const [step, setStep] = useState<'summary' | 'success'>('summary');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderRecord, setOrderRecord] = useState<Order | null>(null);
  
  const [bundleAccessories, setBundleAccessories] = useState<Product[]>([]);
  const [currentBundleIndex, setCurrentBundleIndex] = useState(0);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [selectedBundleSize, setSelectedBundleSize] = useState<'S' | 'XS'>('S');
  const [bundleAdded, setBundleAdded] = useState(false);
  
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

  useEffect(() => {
    const fetchAccessories = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .or('brand.eq.footbubr,accessory_type.not.is.null')
        .eq('status', 'available')
        .gt('stock_quantity', 0);

      if (data && data.length > 0) {
        setBundleAccessories(data as Product[]);
        setCurrentBundleIndex(Math.floor(Math.random() * data.length));
      }
    };
    fetchAccessories();
  }, []);

  const currentAccessory = bundleAccessories[currentBundleIndex];
  const isShinGuards = currentAccessory ? ((currentAccessory.name || '').toLowerCase().includes('ochraniacze') || currentAccessory.accessory_type === 'Mini ochraniacze') : false;

  const handleAddBundleAccessory = () => {
    if (!currentAccessory) return;
    setBundleLoading(true);
    
    const configVariant = isShinGuards ? `Rozmiar: ${selectedBundleSize}` : undefined;

    addItem(currentAccessory, 1, configVariant);
    setBundleAdded(true);
    setBundleLoading(false);
    setTimeout(() => setBundleAdded(false), 2500);
  };

  const sortPointsByRelevance = (itemsList: InPostPoint[], query: string): InPostPoint[] => {
    if (!Array.isArray(itemsList)) return [];
    const q = (query || '').trim().toLowerCase();
    const cleanNumbers = q.match(/\d+/)?.[0] || '';
    const cleanWords = q.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ' ').trim().split(/\s+/).filter((w) => w.length > 2);

    return [...itemsList].sort((a, b) => {
      const aStreet = (a?.address_details?.street || '').toLowerCase();
      const bStreet = (b?.address_details?.street || '').toLowerCase();
      const aBuilding = (a?.address_details?.building_number || '').toLowerCase();
      const bBuilding = (b?.address_details?.building_number || '').toLowerCase();

      const aMatchesStreet = cleanWords.some((w) => aStreet.includes(w));
      const bMatchesStreet = cleanWords.some((w) => bStreet.includes(w));
      const aMatchesNumber = cleanNumbers ? aBuilding.includes(cleanNumbers) : false;
      const bMatchesNumber = cleanNumbers ? bBuilding.includes(cleanNumbers) : false;

      if (aMatchesStreet && aMatchesNumber && !(bMatchesStreet && bMatchesNumber)) return -1;
      if (!(aMatchesStreet && aMatchesNumber) && bMatchesStreet && bMatchesNumber) return 1;
      if (aMatchesStreet && !bMatchesStreet) return -1;
      if (!aMatchesStreet && bMatchesStreet) return 1;

      return 0;
    });
  };

  const handleSearchInpost = async (queryToSearch?: string) => {
    const raw = (queryToSearch ?? searchQuery).trim();
    if (!raw) return;

    setSearchingPoints(true);
    setSearchMessage('');

    try {
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

      const postalMatch = raw.match(/\d{2}-?\d{3}/);
      if (postalMatch) {
        const pCode = postalMatch[0].includes('-') ? postalMatch[0] : `${postalMatch[0].slice(0, 2)}-${postalMatch[0].slice(2)}`;
        const resPost = await fetch(
          `https://api-pl-points.easypack24.net/v1/points?type=parcel_locker&post_code=${encodeURIComponent(pCode)}&limit=30`
        );
        const dataPost = await resPost.json();
        if (dataPost?.items && Array.isArray(dataPost.items) && dataPost.items.length > 0) {
          setPointsList(sortPointsByRelevance(dataPost.items, raw));
          setSearchingPoints(false);
          return;
        }
      }

      const isJustCity = !/\d/.test(raw) && raw.split(/\s+/).length <= 2;
      if (isJustCity) {
        const resCity = await fetch(
          `https://api-pl-points.easypack24.net/v1/points?type=parcel_locker&city=${encodeURIComponent(raw)}&limit=30`
        );
        const dataCity = await resCity.json();
        if (dataCity?.items && Array.isArray(dataCity.items) && dataCity.items.length > 0) {
          setPointsList(dataCity.items);
          setSearchingPoints(false);
          return;
        }
      }

      let coords: { lat: number; lng: number } | null = null;
      try {
        const normalizedQuery = raw.replace(/([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])(\d)/g, '$1 $2');
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pl&limit=1&q=${encodeURIComponent(normalizedQuery)}`
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

      if (coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
        const resNear = await fetch(
          `https://api-pl-points.easypack24.net/v1/points?type=parcel_locker&relative_point=${coords.lat},${coords.lng}&limit=30`
        );
        const dataNear = await resNear.json();
        if (dataNear?.items && Array.isArray(dataNear.items) && dataNear.items.length > 0) {
          setPointsList(sortPointsByRelevance(dataNear.items, raw));
          setSearchingPoints(false);
          return;
        }
      }

      setPointsList([]);
      setSearchMessage('Nie znaleziono paczkomatów.');
    } catch {
      setPointsList([]);
      setSearchMessage('Błąd połączenia.');
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
      e.email = 'Podaj poprawny email';
    }

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      e.phone = 'Numer telefonu jest wymagany';
    } else if (cleanPhone.length !== 9) {
      e.phone = 'Wpisz 9 cyfr';
    }

    if (form.shippingMethod === 'paczkomat' && !form.paczkomatCode.trim()) e.paczkomatCode = 'Podaj kod paczkomatu';
    if (form.shippingMethod === 'kurier') {
      if (!form.address.trim()) e.address = 'Podaj ulicę i numer';
      if (!form.postalCode.trim()) e.postalCode = 'Podaj kod pocztowy';
      if (!form.city.trim()) e.city = 'Podaj miasto';
    }
    if (form.paymentMethod === 'blik' && form.blikCode.length !== 6) e.blikCode = 'Kod BLIK musi mieć 6 cyfr';
    if (!acceptTerms) e.acceptTerms = 'Zaakceptuj regulamin';
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
      setPromoErrorMsg(res.error || 'Nieprawidłowy kod');
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

      for (const { product, quantity, variant } of items) {
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
        const variantNote = variant ? ` [Wariant: ${variant}]` : (product.size_eu ? ` [Wariant: ${product.size_eu}]` : '');

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
      <div className="w-full">
        <Header />
        <CartDrawer />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-neutral-400 mb-4 text-sm">Twój koszyk jest pusty</p>
          <Link to="/" className="text-[#FF6B00] text-sm font-semibold hover:underline">Wróć do katalogu</Link>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        <Header />
        <div className="max-w-md w-full bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center relative z-10 animate-scale-in shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#FF6B00] rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-black stroke-[3]" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            Zamówienie złożone!
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm mb-4">
            Dziękujemy za zakupy w FootBubr.
          </p>
          <div className="inline-block bg-white/5 border border-neutral-800 rounded-xl px-3 py-1.5 mb-5">
            <span className="text-xs text-neutral-500 font-medium">Nr zamówienia: </span>
            <span className="text-xs sm:text-sm font-black text-[#FF6B00] font-mono">
              {orderRecord ? formatOrderNumber(orderRecord) : `#${orderId.slice(0, 8).toUpperCase()}`}
            </span>
          </div>
          <Link
            to="/"
            className="w-full bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black uppercase text-xs sm:text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Wróć do sklepu <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <Header />
      <CartDrawer />

      {/* MODAL PACZKOMATÓW */}
      {showInpostModal && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#111]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF6B00]" />
                <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider">
                  Wyszukaj Paczkomat InPost
                </h3>
              </div>
              <button
                onClick={() => setShowInpostModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 border-b border-neutral-800 space-y-2.5 bg-[#161616]">
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Miasto, ulica lub kod..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchInpost()}
                    className={cn(INPUT_CLASS, 'pl-9 text-xs sm:text-sm py-2')}
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchInpost()}
                  disabled={searchingPoints || !searchQuery.trim()}
                  className="bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black text-xs px-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center shrink-0"
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

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-[50vh]">
              {searchingPoints && (
                <div className="py-10 text-center text-neutral-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 text-[#FF6B00] animate-spin" />
                  <span className="text-xs">Szukam paczkomatów...</span>
                </div>
              )}

              {!searchingPoints && pointsList.length > 0 && (
                <div className="space-y-1.5">
                  {pointsList.map((pt) => (
                    <div
                      key={pt.name}
                      onClick={() => {
                        setForm({ ...form, paczkomatCode: pt.name });
                        setShowInpostModal(false);
                      }}
                      className="p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 bg-black/40 hover:bg-white/5 border border-neutral-800 hover:border-neutral-700"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-xs text-[#FF6B00]">
                            {pt.name}
                          </span>
                          <span className="text-xs text-white font-semibold truncate">
                            {pt.address_details?.street || ''} {pt.address_details?.building_number || ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          {pt.address_details?.post_code || ''} {pt.address_details?.city || ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="bg-white/10 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg shrink-0"
                      >
                        Wybierz
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!searchingPoints && pointsList.length === 0 && (
                <div className="py-10 text-center text-neutral-500 text-xs px-2">
                  {searchMessage || 'Wpisz miasto i ulicę lub kod pocztowy powyżej.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {blikStep !== 'idle' && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xs bg-[#111] border-2 border-[#FF6B00]/40 rounded-2xl p-5 text-center shadow-[0_0_30px_rgba(255,107,0,0.2)]">
            {blikStep === 'waiting' ? (
              <>
                <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin mx-auto mb-3" />
                <h3 className="text-white font-black uppercase text-base">Potwierdź w aplikacji</h3>
                <p className="text-neutral-400 text-xs mt-1.5">
                  Zatwierdź płatność kodem <span className="font-mono text-white">{form.blikCode}</span> w telefonie.
                </p>
              </>
            ) : (
              <>
                <Check className="w-8 h-8 text-emerald-400 mx-auto mb-3 animate-scale-in stroke-[3]" />
                <h3 className="text-white font-black uppercase text-base">Opłacono</h3>
                <p className="text-neutral-400 text-xs mt-1">Finalizujemy zamówienie...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* KONTENER GŁÓWNY KASY */}
      <main className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8">
        <div className="flex items-center gap-2.5 mb-5">
          <Link to="/" className="text-neutral-400 hover:text-white p-1 transition-colors active:scale-90">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Kasa</h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full">
          {/* LEWA KOLUMNA: FORMULARZ */}
          <div className="lg:col-span-7 space-y-3.5 min-w-0 w-full">
            
            {/* Krok 1 */}
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-3.5 sm:p-5 w-full">
              <h2 className="font-bold text-white mb-3 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider">
                <span className="w-5 h-5 bg-[#FF6B00] text-black text-[11px] font-black rounded-full flex items-center justify-center shrink-0">1</span>
                Dane kontaktowe
              </h2>
              <div className="space-y-2.5 w-full">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="min-w-0">
                    <input className={cn(INPUT_CLASS, 'text-xs sm:text-sm py-2')} placeholder="Imię *" value={form.firstName} onChange={(e) => { setForm({ ...form, firstName: e.target.value }); if (errors.firstName) setErrors({ ...errors, firstName: '' }); }} />
                    {errors.firstName && <p className="text-red-400 text-[11px] mt-1 truncate">{errors.firstName}</p>}
                  </div>
                  <div className="min-w-0">
                    <input className={cn(INPUT_CLASS, 'text-xs sm:text-sm py-2')} placeholder="Nazwisko *" value={form.lastName} onChange={(e) => { setForm({ ...form, lastName: e.target.value }); if (errors.lastName) setErrors({ ...errors, lastName: '' }); }} />
                    {errors.lastName && <p className="text-red-400 text-[11px] mt-1 truncate">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <input className={cn(INPUT_CLASS, 'text-xs sm:text-sm py-2')} placeholder="Adres email *" type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }} />
                  {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email}</p>}
                </div>
                <div>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500 pointer-events-none select-none">
                      +48
                    </span>
                    <input
                      className={cn(INPUT_CLASS, 'pl-10 font-mono text-xs sm:text-sm py-2')}
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
                  {errors.phone && <p className="text-red-400 text-[11px] mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Krok 2 */}
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-3.5 sm:p-5 w-full">
              <h2 className="font-bold text-white mb-3 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider">
                <span className="w-5 h-5 bg-[#FF6B00] text-black text-[11px] font-black rounded-full flex items-center justify-center shrink-0">2</span>
                Dostawa
              </h2>
              <div className="space-y-2.5 w-full">
                <label
                  className={`flex items-center justify-between gap-2 p-3 rounded-xl border cursor-pointer transition-all w-full ${form.shippingMethod === 'paczkomat' ? 'border-[#FF6B00]/70 bg-[#FF6B00]/5' : 'border-neutral-800 hover:border-neutral-700'}`}
                  onClick={() => setForm({ ...form, shippingMethod: 'paczkomat' })}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${form.shippingMethod === 'paczkomat' ? 'border-[#FF6B00]' : 'border-neutral-600'}`}>
                      {form.shippingMethod === 'paczkomat' && <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full" />}
                    </div>
                    <Package className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">Paczkomat InPost</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white shrink-0 whitespace-nowrap">
                    {formatPrice(shippingCostFor('paczkomat', discountedTotal))}
                  </span>
                </label>

                <label
                  className={`flex items-center justify-between gap-2 p-3 rounded-xl border cursor-pointer transition-all w-full ${form.shippingMethod === 'kurier' ? 'border-[#FF6B00]/70 bg-[#FF6B00]/5' : 'border-neutral-800 hover:border-neutral-700'}`}
                  onClick={() => setForm({ ...form, shippingMethod: 'kurier' })}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${form.shippingMethod === 'kurier' ? 'border-[#FF6B00]' : 'border-neutral-600'}`}>
                      {form.shippingMethod === 'kurier' && <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full" />}
                    </div>
                    <Truck className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">Kurier InPost</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white shrink-0 whitespace-nowrap">
                    {formatPrice(shippingCostFor('kurier', discountedTotal))}
                  </span>
                </label>

                {form.shippingMethod === 'paczkomat' && (
                  <div className="space-y-2 pt-1 w-full">
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <div className="relative flex-1 min-w-0">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          className={cn(INPUT_CLASS, 'pl-9 uppercase text-xs sm:text-sm py-2')}
                          placeholder="Kod paczkomatu (np. KRA01M) *"
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
                        className="w-full sm:w-auto px-3.5 py-2.5 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Search className="w-3.5 h-3.5" />
                        Znajdź Paczkomat
                      </button>
                    </div>
                    {errors.paczkomatCode && <p className="text-red-400 text-[11px] mt-1">{errors.paczkomatCode}</p>}
                  </div>
                )}

                {form.shippingMethod === 'kurier' && (
                  <div className="space-y-2 pt-1 w-full">
                    <div>
                      <input
                        className={cn(INPUT_CLASS, 'text-xs sm:text-sm py-2')}
                        placeholder="Ulica i numer domu / lokalu *"
                        value={form.address}
                        onChange={(e) => {
                          setForm({ ...form, address: e.target.value });
                          if (errors.address) setErrors({ ...errors, address: '' });
                        }}
                      />
                      {errors.address && <p className="text-red-400 text-[11px] mt-1">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div className="min-w-0">
                        <input
                          className={cn(INPUT_CLASS, 'text-xs sm:text-sm py-2')}
                          placeholder="Kod pocztowy *"
                          value={form.postalCode}
                          onChange={(e) => {
                            setForm({ ...form, postalCode: e.target.value });
                            if (errors.postalCode) setErrors({ ...errors, postalCode: '' });
                          }}
                        />
                        {errors.postalCode && <p className="text-red-400 text-[11px] mt-1 truncate">{errors.postalCode}</p>}
                      </div>
                      <div className="min-w-0">
                        <input
                          className={cn(INPUT_CLASS, 'text-xs sm:text-sm py-2')}
                          placeholder="Miasto *"
                          value={form.city}
                          onChange={(e) => {
                            setForm({ ...form, city: e.target.value });
                            if (errors.city) setErrors({ ...errors, city: '' });
                          }}
                        />
                        {errors.city && <p className="text-red-400 text-[11px] mt-1 truncate">{errors.city}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Krok 3 */}
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-3.5 sm:p-5 w-full">
              <h2 className="font-bold text-white mb-3 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider">
                <span className="w-5 h-5 bg-[#FF6B00] text-black text-[11px] font-black rounded-full flex items-center justify-center shrink-0">3</span>
                Płatność
              </h2>
              <div className="grid grid-cols-3 gap-2 w-full">
                {([
                  { value: 'blik', label: 'BLIK' },
                  { value: 'transfer', label: 'Przelew' },
                  { value: 'card', label: 'Karta' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: value })}
                    className={`py-2.5 px-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-95 truncate ${form.paymentMethod === value ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {form.paymentMethod === 'blik' && (
                <div className="mt-3 border border-[#FF6B00]/30 bg-[#FF6B00]/5 rounded-xl p-3 w-full">
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#FF6B00] mb-1.5">
                    Wpisz kod BLIK
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
                    className="w-full bg-black/60 border border-neutral-800 rounded-xl py-2 px-3 text-center font-mono text-xl tracking-[0.3em] text-white placeholder:text-neutral-700 focus:outline-none focus:border-[#FF6B00]"
                  />
                  {errors.blikCode && <p className="text-red-400 text-[11px] mt-1">{errors.blikCode}</p>}
                </div>
              )}

              <p className="text-[11px] text-neutral-500 mt-2.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                Płatność testowa • Zamówienie trafi do panelu admina
              </p>
            </div>
          </div>

          {/* PRAWA KOLUMNA: PODSUMOWANIE */}
          <div className="lg:col-span-5 min-w-0 w-full">
            <div className="bg-[#141414] rounded-2xl border border-neutral-800/80 p-3.5 sm:p-5 lg:sticky lg:top-24 w-full">
              <h2 className="font-bold text-white mb-3 uppercase tracking-wider text-xs sm:text-sm">Podsumowanie</h2>
              
              <div className="space-y-2 mb-3.5 max-h-52 overflow-y-auto pr-0.5 w-full">
                {items.map(({ product, quantity, variant }) => (
                  <div key={`${product.id}-${variant || ''}`} className="flex items-center gap-2.5 bg-black/40 border border-neutral-800/80 rounded-xl p-2 group w-full">
                    <Link 
                      to="/product/$id" 
                      params={{ id: product.id }}
                      className="w-11 h-11 rounded-lg overflow-hidden bg-white/5 border border-neutral-800 shrink-0 block"
                    >
                      {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                    </Link>
                    <Link 
                      to="/product/$id" 
                      params={{ id: product.id }}
                      className="flex-1 min-w-0 block"
                    >
                      <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF6B00] transition-colors">{product.name}</p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {quantity > 1 ? `${quantity} szt. • ` : ''}{variant || product.size_eu || ''}
                      </p>
                      <p className="text-xs font-bold text-[#FF6B00] mt-0.5">{formatPrice(product.price * quantity)}</p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id, variant)}
                      className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg shrink-0 active:scale-90"
                      title="Usuń"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Dobierz do zestawu */}
              {currentAccessory && (
                <div className="border border-neutral-800 bg-white/[0.02] rounded-xl p-2.5 mb-3.5 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#FF6B00] uppercase tracking-wider">
                      <Zap className="w-3 h-3" />
                      Dobierz do zestawu
                    </div>
                    {bundleAccessories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentBundleIndex((prev) => (prev + 1) % bundleAccessories.length)}
                        className="text-[10px] text-neutral-400 hover:text-white underline"
                      >
                        Inny ({currentBundleIndex + 1}/{bundleAccessories.length})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 border border-neutral-800 shrink-0">
                      {currentAccessory.images?.[0] && (
                        <img src={currentAccessory.images[0]} alt={currentAccessory.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{currentAccessory.name}</p>
                      <p className="text-xs font-bold text-[#FF6B00]">{formatPrice(currentAccessory.price)}</p>
                    </div>
                  </div>

                  {isShinGuards && (
                    <div className="flex items-center justify-between bg-black/40 border border-neutral-800 rounded-lg p-1.5 mb-2">
                      <span className="text-[10px] text-neutral-400 font-medium">Rozmiar:</span>
                      <div className="flex gap-1">
                        {(['S', 'XS'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedBundleSize(sz)}
                            className={cn(
                              'px-2 py-0.5 text-[10px] font-bold rounded transition-all',
                              selectedBundleSize === sz ? 'bg-[#FF6B00] text-black' : 'bg-neutral-800 text-neutral-300'
                            )}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddBundleAccessory}
                    disabled={bundleLoading}
                    className={cn(
                      'w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1',
                      bundleAdded ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-[#FF6B00] hover:text-black text-white'
                    )}
                  >
                    {bundleAdded ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                    {bundleAdded ? 'Dodano do koszyka' : 'Dodaj'}
                  </button>
                </div>
              )}

              {/* Kod rabatowy */}
              <div className="border-t border-neutral-800 pt-3 space-y-2 w-full">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 w-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-400 truncate">
                        {appliedPromo.discount_type === 'percentage' ? `-${appliedPromo.discount_value}%` : `-${appliedPromo.discount_value} PLN`} ({appliedPromo.code})
                      </span>
                    </div>
                    <button type="button" onClick={handleRemovePromo} className="text-neutral-500 hover:text-white shrink-0 p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 w-full">
                    <div className="flex gap-2 w-full">
                      <div className="relative flex-1 min-w-0">
                        <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="Kod rabatowy"
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoErrorMsg(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                          className="w-full bg-white/5 border border-neutral-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00] uppercase font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl shrink-0 disabled:opacity-40"
                      >
                        {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Użyj'}
                      </button>
                    </div>
                    {promoErrorMsg && (
                      <p className="text-red-400 text-[11px] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {promoErrorMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Ceny */}
              <div className="border-t border-neutral-800 mt-3 pt-3 space-y-1.5 text-xs sm:text-sm w-full">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Wartość koszyka</span>
                  <span className="text-white">{formatPrice(total)}</span>
                </div>
                {discountAmount > 0 && appliedPromo && (
                  <div className="flex justify-between text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Rabat
                    </span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-400">Dostawa</span>
                  <span className="text-white font-medium">
                    {shippingCost === 0 ? <span className="text-emerald-400 font-bold">DARMOWA</span> : formatPrice(shippingCost)}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-sm sm:text-base pt-2.5 border-t border-neutral-800 text-white">
                  <span>Do zapłaty</span>
                  <span className="text-[#FF6B00] font-black">{formatPrice(orderTotal)}</span>
                </div>
              </div>

              {/* Zgody */}
              <div className="pt-3 mt-3 border-t border-neutral-800 w-full">
                <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (errors.acceptTerms) setErrors({ ...errors, acceptTerms: '' });
                    }}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-neutral-700 bg-black/40 text-[#FF6B00] accent-[#FF6B00]"
                  />
                  <span className="text-[11px] text-neutral-400 leading-snug">
                    Akceptuję{' '}
                    <Link to="/terms" target="_blank" className="text-[#FF6B00] underline">
                      Regulamin
                    </Link>{' '}
                    i{' '}
                    <Link to="/privacy" target="_blank" className="text-[#FF6B00] underline">
                      Politykę Prywatności
                    </Link>
                    . *
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-red-400 text-[11px] mt-1">{errors.acceptTerms}</p>}
              </div>

              {generalError && (
                <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[11px] flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black uppercase text-xs sm:text-sm py-3 rounded-xl mt-3.5 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(255,107,0,0.25)]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5 text-black" />}
                {submitting ? 'Przetwarzanie...' : 'Złóż zamówienie i zapłać'}
              </button>

              <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#FF6B00]" /> 100% Oryginalne
                </span>
                <span>•</span>
                <span>14 dni na zwrot</span>
              </div>
            </div>
          </div>
        </div>
      </main>
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
