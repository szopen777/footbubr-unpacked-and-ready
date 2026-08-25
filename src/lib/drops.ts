import { supabase } from '@/lib/supabase';

/** Publish all due drop campaigns and individually scheduled drafts. Returns true if anything changed. */
export async function publishDueDrops(): Promise<boolean> {
  const { data: rpcCount, error: rpcError } = await supabase.rpc('publish_due_drops');
  if (!rpcError && typeof rpcCount === 'number') {
    return rpcCount > 0;
  }

  const now = new Date().toISOString();
  let changed = false;

  const { data: dueDrops } = await supabase
    .from('drops')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now);

  if (dueDrops && dueDrops.length > 0) {
    const dropIds = dueDrops.map((d) => d.id);
    await supabase
      .from('products')
      .update({ status: 'available', drop_scheduled_at: null })
      .in('drop_id', dropIds)
      .eq('status', 'draft');
    await supabase.from('drops').update({ status: 'published' }).in('id', dropIds);
    changed = true;
  }

  const { data: due } = await supabase
    .from('products')
    .select('id')
    .eq('status', 'draft')
    .not('drop_scheduled_at', 'is', null)
    .lte('drop_scheduled_at', now);

  if (due && due.length > 0) {
    await supabase
      .from('products')
      .update({ status: 'available', drop_scheduled_at: null })
      .in('id', due.map((d) => d.id));
    changed = true;
  }

  return changed;
}
