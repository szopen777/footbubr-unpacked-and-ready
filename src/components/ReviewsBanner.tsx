import { useState, useEffect } from 'react';
import { Star, ShieldCheck, CheckCircle2, MessageSquarePlus, Loader2, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PurchasedItemOption {
  id: string;
  name: string;
}

interface ReviewItem {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  is_verified_buyer: boolean;
  created_at: string;
  products?: {
    name: string;
    brand: string;
  } | null;
}

export default function ReviewsBanner() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formularz opinii
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Stan weryfikacji produktów powiązanych z mailem
  const [checkingOrders, setCheckingOrders] = useState(false);
  const [userPurchases, setUserPurchases] = useState<PurchasedItemOption[]>([]);
  const [emailVerified, setEmailVerified] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select(`
        id,
        author_name,
        rating,
        comment,
        is_verified_buyer,
        created_at,
        products (
          name,
          brand
        )
      `)
      .order('created_at', { ascending: false })
      .limit(6);

    if (data) setReviews(data as unknown as ReviewItem[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Weryfikacja zamówień i pobranie listy produktów po wpisaniu e-maila
  const handleVerifyEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Wpisz poprawny adres e-mail');
      return;
    }

    setCheckingOrders(true);

    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, status, product_id, items, products(id, name)')
        .ilike('customer_email', cleanEmail);

      if (error) throw error;

      const validOrders = (orders || []).filter((o: any) => {
        const s = (o.status || '').toLowerCase();
        return !s.includes('anulow') && !s.includes('cancel');
      });

      if (validOrders.length === 0) {
        toast.error('Nie znaleziono zamówień', {
          description: 'Nie znaleźliśmy zrealizowanych zamówień przypisanych do tego adresu e-mail.',
        });
        setEmailVerified(false);
        setUserPurchases([]);
        return;
      }

      // Wyciągamy unikalne zakupione produkty
      const itemsMap = new Map<string, string>();

      validOrders.forEach((o: any) => {
        if (o.product_id && o.products?.name) {
          itemsMap.set(o.product_id, o.products.name);
        }
        if (Array.isArray(o.items)) {
          o.items.forEach((it: any) => {
            const pId = it.product?.id || it.id;
            const pName = it.product?.name || it.name;
            if (pId && pName) itemsMap.set(pId, pName);
          });
        }
      });

      const options: PurchasedItemOption[] = Array.from(itemsMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));

      setUserPurchases(options);
      setEmailVerified(true);
      if (options.length > 0) {
        setSelectedProductId(options[0].id);
      }
      toast.success('Zweryfikowano zamówienie!');
    } catch {
      toast.error('Błąd weryfikacji adresu e-mail');
    } finally {
      setCheckingOrders(false);
    }
  };

  const handleAddStoreReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanComment = comment.trim();

    if (!cleanEmail || !cleanName || !cleanComment) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    if (!emailVerified) {
      toast.error('Najpierw zweryfikuj adres e-mail');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert([
        {
          product_id: selectedProductId ? selectedProductId : null,
          author_name: cleanName,
          customer_email: cleanEmail,
          rating,
          comment: cleanComment,
          is_verified_buyer: true,
        },
      ]);

      if (error) throw error;

      toast.success('Dziękujemy za opinię!', {
        description: 'Twoja ocena została opublikowana.',
      });

      setName('');
      setEmail('');
      setComment('');
      setSelectedProductId('');
      setEmailVerified(false);
      setUserPurchases([]);
      setShowModal(false);
      fetchReviews();
    } catch {
      toast.error('Błąd podczas zapisywania opinii.');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

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

        <div className="flex items-center gap-3 flex-wrap">
          {avgRating && (
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <div className="flex text-[#FF6B00]">{'★'.repeat(Math.round(Number(avgRating)))}</div>
              <span className="font-bold text-white">{avgRating} / 5.00</span>
              <span>({reviews.length} opinii)</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-neutral-800 text-xs font-bold text-white rounded-xl transition-all active:scale-95"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-[#FF6B00]" />
            Oceń zakupy
          </button>
        </div>
      </div>

      {/* Modal dodawania opinii */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-black text-white uppercase text-base">Dodaj opinię o zakupach</h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEmailVerified(false);
                }} 
                className="text-xs text-neutral-500 hover:text-white"
              >
                Zamknij
              </button>
            </div>

            <form onSubmit={handleAddStoreReview} className="space-y-4 text-xs">
              
              {/* Krok weryfikacji e-mail */}
              <div>
                <label className="block font-bold uppercase text-neutral-400 mb-1">E-mail z zamówienia *</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailVerified(false);
                    }}
                    placeholder="twoj@email.pl"
                    className="flex-1 bg-black/40 border border-neutral-800 focus:border-[#FF6B00] rounded-xl px-3 py-2.5 text-white outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={checkingOrders || !email}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    {checkingOrders ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sprawdź'}
                  </button>
                </div>
                {emailVerified && (
                  <p className="text-emerald-400 text-[11px] mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Adres e-mail zweryfikowany pomyślnie.
                  </p>
                )}
              </div>

              {/* Wybór zakupionego produktu */}
              {emailVerified && userPurchases.length > 0 && (
                <div>
                  <label className="block font-bold uppercase text-neutral-400 mb-1">Wybierz oceniany produkt *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-black/40 border border-neutral-800 focus:border-[#FF6B00] rounded-xl px-3 py-2.5 text-white outline-none cursor-pointer"
                  >
                    <option value="">Ogólna opinia o sklepie i obsłudze</option>
                    {userPurchases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold uppercase text-neutral-400 mb-1">Twoje imię / Nick *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Ignacy"
                  className="w-full bg-black/40 border border-neutral-800 focus:border-[#FF6B00] rounded-xl px-3 py-2.5 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-400 mb-1">Ocena *</label>
                <div className="flex items-center gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-0.5 text-neutral-600 hover:text-[#FF6B00]"
                    >
                      <Star
                        className={cn(
                          'w-5 h-5 transition-all',
                          s <= rating ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-neutral-700'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-400 mb-1">Twoja opinia *</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Napisz kilka słów o jakości produktu, wysyłce lub obsłudze..."
                  rows={3}
                  className="w-full bg-black/40 border border-neutral-800 focus:border-[#FF6B00] rounded-xl px-3 py-2.5 text-white outline-none resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !emailVerified}
                className="w-full bg-[#FF6B00] hover:bg-[#FF7A00] disabled:opacity-40 text-black font-black uppercase py-3 rounded-xl transition-all shadow-[0_2px_12px_rgba(255,107,0,0.25)] flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Opublikuj recenzję'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Siatka opinii */}
      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-8 text-center text-xs text-neutral-500">
          Brak opinii. Kupiłeś coś u nas? Kliknij „Oceń zakupy”!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-all shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#FF6B00]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#FF6B00]" />
                    ))}
                  </div>
                  {rev.is_verified_buyer && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Zakup
                    </span>
                  )}
                </div>

                {/* Badge ocenionego produktu */}
                {rev.products?.name && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-neutral-800 text-[11px] text-neutral-300 max-w-full truncate">
                    <Package className="w-3.5 h-3.5 text-[#FF6B00] flex-shrink-0" />
                    <span className="truncate">{rev.products.name}</span>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                  "{rev.comment}"
                </p>
              </div>

              {/* Dolny pasek: Autor oraz data */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
                <h4 className="font-bold text-white">{rev.author_name}</h4>
                <span className="font-mono text-[11px]">
                  {new Date(rev.created_at).toLocaleDateString('pl-PL')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
