
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '@/lib/supabase';

interface CartItem {
  product: Product;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product) => void;
  addItemSilent: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  total: number;
  promoCode: string | null;
  discountRate: number;
  discountAmount: number;
  discountedTotal: number;
  applyPromo: (code: string) => boolean;
  removePromo: () => void;
  cartPulse: boolean;
}

const VALID_PROMO_CODES: Record<string, number> = {
  BUBR10: 0.10,
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [cartPulse, setCartPulse] = useState(false);

  const triggerPulse = useCallback(() => {
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 600);
  }, []);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((i) => i.product.id === product.id)) return prev;
      return [...prev, { product }];
    });
    setIsOpen(true);
  }, []);

  const addItemSilent = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((i) => i.product.id === product.id)) return prev;
      return [...prev, { product }];
    });
    triggerPulse();
  }, [triggerPulse]);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromoCode(null);
  }, []);

  const total = items.reduce((sum, i) => sum + i.product.price, 0);
  const discountRate = promoCode ? VALID_PROMO_CODES[promoCode] ?? 0 : 0;
  const discountAmount = Math.round(total * discountRate);
  const discountedTotal = total - discountAmount;

  const applyPromo = useCallback((code: string): boolean => {
    const upper = code.trim().toUpperCase();
    if (VALID_PROMO_CODES[upper] !== undefined) {
      setPromoCode(upper);
      return true;
    }
    return false;
  }, []);

  const removePromo = useCallback(() => setPromoCode(null), []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addItemSilent,
        removeItem,
        clearCart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        total,
        promoCode,
        discountRate,
        discountAmount,
        discountedTotal,
        applyPromo,
        removePromo,
        cartPulse,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
