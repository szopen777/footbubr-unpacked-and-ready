import { useState, useEffect } from 'react';
import { Star, CheckCircle2, MessageSquarePlus, Loader2 } from 'lucide-react';
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

  // Stan formularza
  const [authorName, setAuthorName] = useState('');
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
    if (!authorName.trim() || !comment.trim()) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert([
      {
        product_id: productId,
        author_name: authorName.trim(),
        rating,
        comment: comment.trim(),
        is_verified_buyer: true,
      },
    ]);

    if (error) {
      toast.error('Błąd dodawania opinii');
    } else {
      toast.success('Dziękujemy za opinię!');
      setAuthorName('');
      setComment('');
      setShowForm(false);
      fetchReviews();
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mt-12 sm:mt-16 pt-10 border-t border-neutral-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Opinie klientów
            {avgRating && (
              <span className="text-xs bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                ★ {avgRating} ({reviews.length})
              </span>
            )}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">Recenzje zweryfikowanych kupujących produkt {productName}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-neutral-800 text-xs font-bold text-white rounded-xl transition-all active:scale-95 self-start sm:self-auto"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#FF6B00]" />
          {showForm ? 'Anuluj' : 'Dodaj recenzję'}
        </button>
      </div>

      {/* Formularz dodawania recenzji */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 mb-8 space-y-4 animate-fade-in shadow-xl">
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
              <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">Ocena *</label>
              <div className="flex items-center gap-2 pt-1">
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
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">Twoja opinia *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Jak oceniasz dopasowanie, jakość wykonania lub materiał?"
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
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Opublikuj recenzję'}
          </button>
        </form>
      )}

      {/* Lista opinii */}
      {loading ? (
        <div className="py-6 flex justify-center text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 text-center text-xs text-neutral-500">
          Brak recenzji dla tego produktu. Bądź pierwszą osobą, która doda opinię!
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
