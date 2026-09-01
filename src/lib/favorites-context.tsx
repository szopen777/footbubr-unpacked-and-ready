import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/lib/supabase';
import { toast } from 'sonner';

interface FavoritesContextType {
  favorites: Product[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
  clearFavorites: () => void;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'footbubr_favorites_v1';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Błąd odczytu ulubionych z localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Błąd zapisu ulubionych do localStorage:', e);
    }
  }, [favorites, isLoaded]);

  const isFavorite = (productId: string) => {
    return favorites.some((item) => item.id === productId);
  };

  const toggleFavorite = (product: Product) => {
    const exists = isFavorite(product.id);
    if (exists) {
      setFavorites((prev) => prev.filter((p) => p.id !== product.id));
      toast.info('Usunięto z ulubionych', {
        description: product.name,
      });
    } else {
      setFavorites((prev) => [product, ...prev]);
      toast.success('Dodano do ulubionych!', {
        description: product.name,
      });
    }
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        clearFavorites,
        favoritesCount: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
