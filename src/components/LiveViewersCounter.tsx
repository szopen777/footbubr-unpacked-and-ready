import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LiveViewersCounterProps {
  productId: string;
}

function formatPolishLiveText(count: number): { subject: string; verb: string } {
  if (count === 1) {
    return { subject: '1 osoba', verb: 'ogląda' };
  }

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  // Nastki: 12, 13, 14, 112-114 itd. -> "12 osób ogląda"
  if (lastTwoDigits >= 12 && lastTwoDigits <= 14) {
    return { subject: `${count} osób`, verb: 'ogląda' };
  }

  // Końcówki 2, 3, 4 (np. 2 osoby, 23 osoby) -> "osoby oglądają"
  if (lastDigit >= 2 && lastDigit <= 4) {
    return { subject: `${count} osoby`, verb: 'oglądają' };
  }

  // Pozostałe (5, 6, 7, 8, 9, 0, 11 itd.) -> "5 osób ogląda"
  return { subject: `${count} osób`, verb: 'ogląda' };
}

export default function LiveViewersCounter({ productId }: LiveViewersCounterProps) {
  const [viewersCount, setViewersCount] = useState<number>(1);

  useEffect(() => {
    if (!productId) return;

    const userSessionId = `visitor_${Math.random().toString(36).substring(2, 9)}`;

    const channel = supabase.channel(`product_presence_${productId}`, {
      config: {
        presence: {
          key: userSessionId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeUsersCount = Object.keys(state).length;
        setViewersCount(Math.max(1, activeUsersCount));
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        setViewersCount(Math.max(1, Object.keys(state).length));
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        setViewersCount(Math.max(1, Object.keys(state).length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [productId]);

  const { subject, verb } = formatPolishLiveText(viewersCount);

  return (
    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold animate-fade-in backdrop-blur-md">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Eye className="w-3.5 h-3.5" />
      <span>
        <strong className="font-bold text-white">{subject}</strong> {verb} teraz na żywo
      </span>
    </div>
  );
}
