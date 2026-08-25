
import { Link } from '@tanstack/react-router';
import { ShoppingBag, Search, Menu, X, Footprints, Archive } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({ searchValue = '', onSearchChange }: HeaderProps) {
  const { items, openCart, cartPulse } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-9 h-9 bg-[#FF6B00] rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300 shadow-[0_4px_15px_rgba(255,107,0,0.3)]">
              <Footprints className="w-4 h-4 text-black" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-white uppercase">
              Foot<span className="text-[#FF6B00]">Bubr</span>
            </span>
          </Link>

          {/* Search bar — desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-[#FF6B00] transition-colors" />
              <input
                type="text"
                placeholder="Szukaj korków..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-white/5 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 focus:bg-white/8 transition-all"
              />
            </div>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/archive"
              className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-[#FF6B00] transition-colors px-3 py-2 font-bold tracking-wide uppercase text-xs sm:text-sm"
            >
              <Archive className="w-4 h-4 text-[#FF6B00]" />
              Archiwum
            </Link>

            <Link
              href="/admin"
              className="hidden md:block text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2 font-medium"
            >
              Panel
            </Link>

            <button
              onClick={openCart}
              className={cn(
                'relative flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7A00] text-black font-semibold text-sm px-3 sm:px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(255,107,0,0.25)]',
                cartPulse && 'animate-cart-pulse'
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:block">Koszyk</span>
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-[#FF6B00] text-xs font-black rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>

            <button
              className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
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
                placeholder="Szukaj korków..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-white/5 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00]/60 transition-all"
              />
            </div>
            <div className="flex flex-col pt-1">
              <Link
                href="/archive"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-neutral-200 hover:text-[#FF6B00] py-2 font-bold uppercase transition-colors"
              >
                <Archive className="w-4 h-4 text-[#FF6B00]" />
                Archiwum Dropów
              </Link>
              <Link
                href="/admin"
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