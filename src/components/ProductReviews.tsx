import { useState, useEffect } from 'react';
import { Star, CheckCircle2, MessageSquarePlus, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  is_verified_buyer: boolean;
  created_at: string;
}

export default function ProductReviews({ productId, productName }: { productId: string; productName: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pola formularza
  const [authorName, setAuthorName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (data) setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = authorName.trim();
    const cleanComment = comment.trim();

    if (!cleanName || !cleanEmail || !cleanComment) {
      toast.error('Wypełnij wszystkie wymagane pola');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Sprawdzanie czy e-mail kupił ten produkt
      const { data: orders, error: orderErr } = await supabase
        .from('orders')
        .select('id, status, product_id, items')
        .ilike('customer_email', cleanEmail);

      if (orderErr) throw orderErr;

      // Sprawdzamy czy zamówienie zawiera ten produkt i nie jest anulowane
      const hasPurchased = orders?.some((order: any) => {
        const status = (order.status || '').toLowerCase();
        if (status.includes('anulow') || status.includes('cancel')) return false;

        // Bezpośrednie powiązanie product_id lub wewnątrz koszyka items
        if (order.product_id === productId) return true;
        if (Array.isArray(order.items)) {
          return order.items.some((item: any) => item.product?.id === productId || item.id === productId);
        }
        return false;
      });

      if (!hasPurchased) {
        toast.error('Brak zweryfikowanego zakupu', {
          description: 'Opinie mogą dodawać wyłącznie osoby, które zakupiły ten produkt podając ten adres e-mail.',
        });
        setSubmitting(false);
        return;
      }

      // 2. Dodanie zweryfikowanej opinii
      const { error: insertErr } = await supabase.from('reviews').insert([
        {
          product_id: productId,
          author_name: cleanName,
          customer_email: cleanEmail,
          rating,
          comment: cleanComment,
          is_verified_buyer: true,
        },
      ]);

      if (insertErr) throw insertErr;

      toast.success('Opinia została dodana!', {
        description: 'Dziękujemy za podzielenie się opinią o produkcie.',
      });

      setAuthorName('');
      setEmail('');
      setComment('');
      setShowForm(false);
      fetchReviews();
    } catch {
      toast.error('Wystąpił błąd podczas dodawania opinii.');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mt-12 sm:mt-16 pt-10 border-t border-neutral-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Opinie o produkcie
            {avgRating && (
              <span className="text-xs bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                ★ {avgRating} ({reviews.length})
              </span>
            )}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">Zweryfikowane recenzje kupujących produkt {productName}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-neutral-800 text-xs font-bold text-white rounded-xl transition-all active:scale-95 self-start sm:self-auto"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#FF6B00]" />
          {showForm ? 'Anuluj' : 'Napisz opinię'}
        </button>
      </div>

      {/* Formularz weryfikowanego dodawania opinii */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 sm:p-6 mb-8 space-y-4 animate-fade-in shadow-xl">
          <div className="flex items-center gap-2 text-xs text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/20 p-3 rounded-xl">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Wpisz e-mail użyty podczas zakupu w celu automatycznej weryfikacji transakcji.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">Twoje imię / Nick *</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="np. Kamil"
                className="w-full bg-black/40 border border-neutral-800 focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">E-mail z zamówienia *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.pl"
                className="w-full bg-black/40 border border-neutral-800 focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">Ocena *</label>
            <div className="flex items-center gap-2 pt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 text-neutral-600 hover:text-[#FF6B00] transition-colors"
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
            <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">Twoja opinia *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Jak oceniasz jakość wykonania, dopasowanie i użytkowanie?"
              rows={3}
              className="w-full bg-black/40 border border-neutral-800 focus:border-[#FF6B00] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#FF6B00] hover:bg-[#FF7A00] disabled:opacity-50 text-black font-black uppercase text-xs tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-[0_2px_12px_rgba(255,107,0,0.25)] flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Zweryfikuj zakup i opublikuj'}
          </button>
        </form>
      )}

      {/* Lista opinii */}
      {loading ? (
        <div className="py-8 flex justify-center text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 text-center text-xs text-neutral-500">
          Brak opinii dla tego produktu. Jeśli posiadasz ten produkt, dodaj pierwszą recenzję!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-[#141414] border border-neutral-800 rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{rev.author_name}</span>
                  {rev.is_verified_buyer && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Zweryfikowany zakup
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-3.5 h-3.5',
                        i < rev.rating ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-neutral-700'
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">{rev.comment}</p>
              <span className="text-[10px] text-neutral-600 block">
                {new Date(rev.created_at).toLocaleDateString('pl-PL')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
