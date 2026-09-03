import { useEffect, useState } from 'react';
import { supabase, Drop } from '@/lib/supabase';

const STATIC_ITEMS = [
  'DARMOWA WYSYŁKA OD 500 ZŁ',
  'WSZYSTKIE PARY 100% ORYGINALNE',
  'WYSYŁKA INPOST / KURIER',
  'KORKI 1 OF 1 — KAŻDA PARA UNIKAT',
];

function buildItems(dropText: string): string[] {
  return [...STATIC_ITEMS, dropText];
}

export default function TopAnnouncementBar() {
  const [dropText, setDropText] = useState('KOLEJNY DROP: JUŻ WKRÓTCE');

  useEffect(() => {
    let cancelled = false;

    const fetchDrop = async () => {
      const { data } = await supabase
        .from('drops')
        .select('*')
        .eq('status', 'scheduled')
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        const drop = data as Drop;
        const date = new Date(drop.scheduled_at);
        const formatted = date.toLocaleDateString('pl-PL', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });
        setDropText(`KOLEJNY DROP: ${formatted.toUpperCase()}`);
        return;
      }

      const { data: prodData } = await supabase
        .from('products')
        .select('drop_scheduled_at')
        .eq('status', 'draft')
        .not('drop_scheduled_at', 'is', null)
        .order('drop_scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (prodData?.drop_scheduled_at) {
        const date = new Date(prodData.drop_scheduled_at);
        const formatted = date.toLocaleDateString('pl-PL', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });
        setDropText(`KOLEJNY DROP: ${formatted.toUpperCase()}`);
      } else {
        setDropText('KOLEJNY DROP: JUŻ WKRÓTCE');
      }
    };

    fetchDrop();
    const interval = setInterval(fetchDrop, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const items = buildItems(dropText);
  const allItems = [...items, ...items];

  return (
    <div className="w-full max-w-full overflow-hidden overflow-x-clip bg-[#FF6B00] text-black border-b-2 border-black [contain:paint]">
      <div className="relative flex w-full overflow-hidden">
        <div className="animate-marquee">
          {allItems.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.14em] px-4 py-1.5 shrink-0"
            >
              <span className="inline-block w-1 h-1 rounded-full bg-black/60" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
