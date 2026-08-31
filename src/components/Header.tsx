import { Link } from '@tanstack/react-router';
import { ShoppingBag, Search, Menu, X, Archive } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import logoPng from '/logoPNG.png';

interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({ searchValue = '', onSearchChange }: HeaderProps) {
  const { items, openCart, cartPulse } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24 gap-2 sm:gap-4 lg:gap-6">
          {/* Logo FootBubr */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
            <div className="w-11 h-11 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 flex-shrink-0">
              <img 
                src={logoPng} 
                alt="FootBubr Logo" 
                className="w-full h-full object-contain invert brightness-200 scale-110 sm:scale-125"
              />
            </div>
            <span className="font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight text-white uppercase leading-none">
              Foot<span className="text-[#FF6B00]">Bubr</span>
            </span>
          </Link>

          {/* Search bar — desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-[#FF6B00] transition-colors" />
              <input
                type="text"
                placeholder="Szukaj korków i akcesoriów..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-white/5 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 focus:bg-white/8 transition-all"
              />
            </div>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Link
              to="/archive"
              className="hidden sm:flex items-center gap-1.5 text-neutral-300 hover:text-[#FF6B00] transition-colors px-3 py-2 font-bold tracking-wide uppercase text-xs sm:text-sm"
            >
              <Archive className="w-4 h-4 text-[#FF6B00]" />
              Archiwum
            </Link>

            <Link
              to="/admin"
              className="hidden md:block text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2 font-medium"
            >
              Panel
            </Link>

            {/* Przycisk koszyka */}
            <button
              onClick={openCart}
              className={cn(
                'relative flex items-center justify-center gap-1.5 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-black text-xs sm:text-sm p-2 sm:px-4 sm:py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(255,107,0,0.25)]',
                cartPulse && 'animate-cart-pulse'
              )}
              aria-label="Otwórz koszyk"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Koszyk</span>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-black text-[#FF6B00] text-[10px] sm:text-xs font-black rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>

            {/* Przycisk menu mobilnego */}
            <button
              className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors rounded-xl bg-white/5 border border-neutral-800"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search & menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-neutral-800 animate-fade-in flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Szukaj korków i akcesoriów..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-white/5 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 transition-all"
              />
            </div>
            <div className="flex flex-col pt-1">
              <Link
                to="/archive"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-neutral-200 hover:text-[#FF6B00] py-2 font-bold uppercase transition-colors"
              >
                <Archive className="w-4 h-4 text-[#FF6B00]" />
                Archiwum Dropów
              </Link>
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-neutral-400 hover:text-white py-2 transition-colors"
              >
                Panel admina
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
