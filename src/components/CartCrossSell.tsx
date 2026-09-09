import { useEffect, useState } from 'react';
import { supabase, Product } from '@/lib/supabase';
import { useCart } from '@/lib/cart-context';
import { formatPrice, cn } from '@/lib/utils';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CartCrossSell() {
  const [accessories, setAccessories] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, 'S' | 'XS'>>({});
  const { items, addItemSilent } = useCart();

  useEffect(() => {
    const loadAccessories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .or('brand.ilike.footbubr,accessory_type.not.is.null')
        .limit(6);

      if (!error && data) {
        setAccessories(data as Product[]);
      }
      setLoading(false);
    };

    loadAccessories();
  }, []);

  const availableCrossSells = accessories.filter(
    (acc) => !items.some((item) => item.product.id === acc.id)
  );

  if (loading) {
    return (
      <div className="py-4 flex justify-center">
        <Loader2 className="w-4 h-4 text-[#FF6B00] animate-spin" />
      </div>
    );
  }

  if (availableCrossSells.length === 0) return null;

  const handleSizeSelect = (productId: string, size: 'S' | 'XS') => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleAdd = (product: Product) => {
    const isShinGuards = (product.name || '').toLowerCase().includes('ochraniacze') || product.accessory_type === 'Mini ochraniacze';
    const chosenSize = selectedSizes[product.id] || 'S';
    const variantStr = isShinGuards ? `Rozmiar: ${chosenSize}` : (product.size_eu ? `Rozmiar: ${product.size_eu}` : undefined);

    addItemSilent(product, 1, variantStr);
    toast.success('Dodano do koszyka!', {
      description: `${product.name} ${isShinGuards ? `(${chosenSize})` : ''}`,
    });
  };

  return (
    <div className="bg-[#141414] border border-neutral-800/80 rounded-2xl p-3.5 space-y-2.5 my-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
        <span>Dobierz do zestawu</span>
      </div>

      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {availableCrossSells.map((item) => {
          const isShinGuards = (item.name || '').toLowerCase().includes('ochraniacze') || item.accessory_type === 'Mini ochraniacze';
          const currentSize = selectedSizes[item.id] || 'S';

          return (
            <div
              key={item.id}
              className="flex flex-col gap-2 p-2.5 bg-black/40 border border-neutral-800/60 rounded-xl hover:border-neutral-700 transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 flex-shrink-0">
                    {item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                    <p className="text-xs font-bold text-[#FF6B00]">{formatPrice(item.price)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  className="flex items-center gap-1 bg-white/10 hover:bg-[#FF6B00] text-neutral-200 hover:text-black font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex-shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Dodaj</span>
                </button>
              </div>

              {/* Wybór rozmiaru S / XS dla ochraniaczy w koszyku */}
              {isShinGuards && (
                <div className="flex items-center justify-between bg-white/[0.03] border border-neutral-800 rounded-lg px-2.5 py-1.5 mt-0.5">
                  <span className="text-[10px] text-neutral-400 font-medium uppercase">Wybierz rozmiar:</span>
                  <div className="flex gap-1">
                    {(['S', 'XS'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSizeSelect(item.id, sz)}
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded transition-all',
                          currentSize === sz
                            ? 'bg-[#FF6B00] text-black'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
