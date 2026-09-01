import { useEffect, useState } from 'react';
import { supabase, Product } from './supabase';

const STORAGE_KEY = 'footbubr_recently_viewed_ids_v1';
const MAX_ITEMS = 6;

export function useRecentlyViewed(currentProductId?: string) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // 1. Zapisz bieżący produkt w historii
  useEffect(() => {
    if (!currentProductId) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existingIds: string[] = raw ? JSON.parse(raw) : [];

      // Usuń obecne ID jeśli było wcześniej i wstaw na początek
      const updatedIds = [
        currentProductId,
        ...existingIds.filter((id) => id !== currentProductId),
      ].slice(0, MAX_ITEMS + 1);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds));
    } catch (e) {
      console.error('Błąd zapisu ostatnio oglądanych:', e);
    }
  }, [currentProductId]);

  // 2. Pobierz produkty z Supabase na podstawie zapisanych ID (z wykluczeniem bieżącego)
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const ids: string[] = JSON.parse(raw);
        const filteredIds = ids.filter((id) => id !== currentProductId).slice(0, 4);

        if (filteredIds.length === 0) {
          setRecentProducts([]);
          return;
        }

        setLoadingRecent(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', filteredIds);

        if (!error && data) {
          // Zachowaj kolejność z tablicy filteredIds
          const sorted = filteredIds
            .map((id) => data.find((p) => p.id === id))
            .filter(Boolean) as Product[];
          setRecentProducts(sorted);
        }
      } catch (e) {
        console.error('Błąd pobierania ostatnio oglądanych:', e);
      } finally {
        setLoadingRecent(false);
      }
    };

    loadRecent();
  }, [currentProductId]);

  return { recentProducts, loadingRecent };
}
