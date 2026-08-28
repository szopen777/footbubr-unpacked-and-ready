import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '@/lib/supabase';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  addItemSilent: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        const maxStock = product.stock_quantity ?? 1;
        updated[existingIndex].quantity = Math.min(newQty, maxStock);
        return updated;
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock_quantity ?? 1) }];
    });
    setIsOpen(true);
  }, []);

  const addItemSilent = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        const maxStock = product.stock_quantity ?? 1;
        updated[existingIndex].quantity = Math.min(newQty, maxStock);
        return updated;
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock_quantity ?? 1) }];
    });
    triggerPulse();
  }, [triggerPulse]);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock_quantity ?? 1;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromoCode(null);
  }, []);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
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
        updateQuantity,
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
