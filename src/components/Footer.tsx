import { Link } from '@tanstack/react-router';
import logoPng from '/logoPNG.png';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#090909] border-t border-neutral-800/80 text-neutral-400 py-6 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Lewa strona: Logo & Copyright */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logoPng} 
              alt="FootBubr" 
              className="w-7 h-7 object-contain invert brightness-200" 
            />
            <span className="font-black text-sm text-white tracking-tight">
              FOOT<span className="text-[#FF6B00]">BUBR</span>
            </span>
          </Link>
          <span className="text-neutral-600 hidden sm:inline">|</span>
          <span className="text-neutral-500">© {new Date().getFullYear()} Wszelkie prawa zastrzeżone.</span>
        </div>

        {/* Środek: Linki prawne & Pomoc */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-neutral-400">
          <Link to="/track-order" className="hover:text-[#FF6B00] transition-colors">
            Śledzenie zamówienia
          </Link>
          <Link to="/terms" className="hover:text-[#FF6B00] transition-colors">
            Regulamin
          </Link>
          <Link to="/privacy" className="hover:text-[#FF6B00] transition-colors">
            Polityka prywatności
          </Link>
          <Link to="/returns" className="hover:text-[#FF6B00] transition-colors">
            Zwroty i reklamacje
          </Link>
        </div>

        {/* Prawa strona: Sociale */}
        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors"
            title="Instagram"
          >
            <InstagramIcon className="w-4 h-4" />
          </a>
          <a
            href="mailto:kontakt@footbubr.pl"
            className="text-neutral-400 hover:text-white transition-colors"
            title="Kontakt"
          >
            <MailIcon className="w-4 h-4" />
          </a>
        </div>

      </div>
    </footer>
  );
}
