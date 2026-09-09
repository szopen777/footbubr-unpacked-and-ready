import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/wypisz')({
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');

    if (!email) {
      setStatus('error');
      return;
    }

    const unsubscribe = async () => {
      const { error } = await supabase
        .from('drop_subscribers')
        .delete()
        .eq('email', email.trim().toLowerCase());

      if (error) {
        setStatus('error');
      } else {
        setStatus('success');
      }
    };

    unsubscribe();
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-[#141414] border border-neutral-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
            <p className="text-sm text-neutral-400">Wypisywanie z bazy alertów...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-white uppercase">Wypisano pomyślnie</h1>
            <p className="text-sm text-neutral-400">
              Twój adres został usunięty z powiadomień o dropach FootBubr.
            </p>
            <div className="pt-2">
              <Link to="/" className="inline-block bg-[#FF6B00] text-black font-bold px-6 py-2.5 rounded-xl text-xs uppercase">
                Wróć do sklepu
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-white uppercase">Wystąpił błąd</h1>
            <p className="text-sm text-neutral-400">
              Nie udało się odnaleźć adresu lub link jest nieprawidłowy.
            </p>
            <div className="pt-2">
              <Link to="/" className="inline-block bg-white/10 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase">
                Wróć do sklepu
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
