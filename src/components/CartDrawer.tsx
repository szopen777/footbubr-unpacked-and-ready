import { useCart } from '@/lib/cart-context';
import { X, ShoppingBag, ArrowRight, Trash2, Truck, Plus, Minus } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import { Link } from '@tanstack/react-router';
import CartCrossSell from '@/components/CartCrossSell';

export default function CartDrawer() {
  const { items = [], removeItem, updateQuantity, isOpen, closeCart, total = 0, discountAmount = 0, discountedTotal, promoCode } = useCart();

  if (!isOpen) return null;

  const currentTotal = Number(discountedTotal ?? total) || 0;
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentTotal / FREE_SHIPPING_THRESHOLD) * 100)));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-backdrop-in"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#141414] border-l border-neutral-800 z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="font-bold text-lg text-white uppercase tracking-tight">Koszyk</h2>
            {items.length > 0 && (
              <span className="text-sm text-neutral-500">
                ({items.reduce((acc, i) => acc + (i.quantity || 1), 0)} szt.)
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-all active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <ShoppingBag className="w-12 h-12 text-neutral-700" />
              <p className="text-neutral-500 text-sm">Twój koszyk jest pusty</p>
              <button onClick={closeCart} className="text-[#FF6B00] text-sm font-medium hover:underline">
                Przeglądaj kolekcję →
              </button>
            </div>
          ) : (
            <>
              {items.map(({ product, quantity = 1, variant }) => {
                if (!product) return null;
                const mainImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                const itemPrice = Number(product.price) || 0;

                return (
                  <div 
                    key={`${product.id}-${variant || ''}`} 
                    className="flex gap-3 bg-white/5 rounded-xl p-3 border border-neutral-800/80 group hover:border-neutral-700 transition-all"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-neutral-800">
                      {mainImage ? (
                        <img src={mainImage} alt={product.name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Brak</div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="font-semibold text-sm text-white leading-tight truncate">{product.name || 'Produkt'}</p>
                        <p className="text-neutral-400 text-xs mt-0.5 truncate">
                          {product.brand || 'FOOTBUBR'} · {variant ? variant : `Rozmiar: ${product.size_eu || 'ONE SIZE'}`}
                        </p>
                        <p className="text-[#FF6B00] font-bold text-sm mt-1">{formatPrice(itemPrice)}</p>
                      </div>

                      {/* Sterowanie ilością */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center bg-black/40 border border-neutral-800 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity && updateQuantity(product.id, quantity - 1, variant)}
                            className="p-1 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-bold text-white text-xs">{quantity}</span>
                          <button
                            onClick={() => updateQuantity && updateQuantity(product.id, quantity + 1, variant)}
                            disabled={Boolean(product.stock_quantity && quantity >= product.stock_quantity)}
                            className="p-1 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] text-neutral-500">
                          Łącznie: {formatPrice(itemPrice * quantity)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem && removeItem(product.id, variant)}
                      className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors self-start active:scale-90"
                      title="Usuń produkt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              <CartCrossSell />
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-neutral-800 space-y-3 bg-[#111]">
            <div className="bg-white/5 border border-neutral-800 rounded-xl px-3 py-2.5">
              {missingForFreeShipping === 0 ? (
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  Masz DARMOWĄ dostawę!
                </p>
              ) : (
                <p className="text-xs text-neutral-400">
                  Do darmowej dostawy brakuje{' '}
                  <span className="text-[#FF6B00] font-bold">
                    {formatPrice(missingForFreeShipping)}
                  </span>
                </p>
              )}
              <div className="mt-2 h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF6B00] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {discountAmount > 0 && promoCode && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-400">Rabat ({promoCode})</span>
                <span className="text-emerald-400 font-medium">-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-sm">Suma</span>
              <div className="text-right">
                {discountAmount > 0 && (
                  <span className="text-xs text-neutral-600 line-through block">{formatPrice(total)}</span>
                )}
                <span className="font-bold text-lg text-white">{formatPrice(currentTotal)}</span>
              </div>
            </div>

            <p className="text-neutral-600 text-xs">Kod rabatowy możesz zastosować przy kasie</p>

            <Link
              to="/checkout"
              onClick={closeCart}
              className="flex items-center justify-center gap-2 w-full bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_15px_rgba(255,107,0,0.25)] text-sm uppercase tracking-wider"
            >
              Przejdź do kasy
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
