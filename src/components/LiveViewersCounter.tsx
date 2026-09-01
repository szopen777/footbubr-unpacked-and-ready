import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LiveViewersCounterProps {
  productId: string;
}

function formatPolishViewers(count: number): string {
  if (count === 1) return '1 osoba';
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 12 && lastTwoDigits <= 14) {
    return `${count} osób`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} osoby`;
  }

  return `${count} osób`;
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

  return (
    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold animate-fade-in backdrop-blur-md">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Eye className="w-3.5 h-3.5" />
      <span>
        <strong className="font-bold text-white">{formatPolishViewers(viewersCount)}</strong> ogląda teraz na żywo
      </span>
    </div>
  );
}
