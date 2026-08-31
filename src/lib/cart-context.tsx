import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase, Product } from '@/lib/supabase';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppliedPromo {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  uses_left: number;
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
  appliedPromo: AppliedPromo | null;
  discountRate: number;
  discountAmount: number;
  discountedTotal: number;
  applyPromo: (code: string) => Promise<{ success: boolean; error?: string }>;
  removePromo: () => void;
  cartPulse: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
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
    setAppliedPromo(null);
  }, []);

  // Odpytanie Supabase o kod rabatowy
  const applyPromo = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    const upper = code.trim().toUpperCase();
    if (!upper) return { success: false, error: 'Wpisz kod rabatowy' };

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', upper)
        .maybeSingle();

      if (error || !data) {
        return { success: false, error: 'Nieprawidłowy kod rabatowy' };
      }

      if (data.uses_left <= 0) {
        return { success: false, error: 'Limit wykorzystania kodu wyczerpany' };
      }

      setAppliedPromo(data as AppliedPromo);
      return { success: true };
    } catch {
      return { success: false, error: 'Błąd sprawdzania kodu' };
    }
  }, []);

  const removePromo = useCallback(() => setAppliedPromo(null), []);

  const total = items.reduce((sum, i) => sum + (i.product.price || 0) * i.quantity, 0);

  let discountAmount = 0;
  let discountRate = 0;

  if (appliedPromo) {
    if (appliedPromo.discount_type === 'percentage') {
      discountRate = appliedPromo.discount_value / 100;
      discountAmount = Math.round(total * discountRate);
    } else {
      discountAmount = Math.min(total, appliedPromo.discount_value);
      discountRate = total > 0 ? discountAmount / total : 0;
    }
  }

  const discountedTotal = Math.max(0, total - discountAmount);

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
        promoCode: appliedPromo ? appliedPromo.code : null,
        appliedPromo,
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
