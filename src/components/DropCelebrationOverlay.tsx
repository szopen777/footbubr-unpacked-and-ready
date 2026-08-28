import { useEffect, useState, useRef } from 'react';
import { Flame, Zap, X } from 'lucide-react';

interface DropCelebrationOverlayProps {
  onComplete: () => void;
}

export default function DropCelebrationOverlay({ onComplete }: DropCelebrationOverlayProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onCompleteRef.current();
    }, 300);
  };

  useEffect(() => {
    // Po 3.5s rozpoczynamy płynne zanikanie
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3500);

    // Po 4s całkowicie zamykamy overlay
    const removeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-[9999] cursor-pointer flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Stałe, mocno zablurowane tło (bez migania) */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

      {/* Przycisk zamknięcia */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 z-20 text-neutral-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
        aria-label="Zamknij"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Fala ognia przelatująca przez środek */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-full h-44 sm:h-64 bg-gradient-to-r from-transparent via-[#FF4500] to-transparent blur-3xl opacity-80"
          style={{ transform: 'scaleY(1.5)' }}
        />
        <div 
          className="w-full h-24 sm:h-36 bg-gradient-to-r from-transparent via-[#FFA500] to-transparent blur-xl opacity-90" 
        />
        <div className="w-full h-8 bg-gradient-to-r from-transparent via-white to-transparent blur-sm opacity-100" />
      </div>

      {/* Cząsteczki ognia */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => {
          const randomX = (Math.random() - 0.5) * 600;
          const randomY = (Math.random() - 0.5) * 300;
          const size = Math.random() * 8 + 4;
          return (
            <div
              key={i}
              className="absolute rounded-full bg-[#FF6B00] animate-bounce"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                transform: `translate(${randomX}px, ${randomY}px)`,
                boxShadow: '0 0 15px #FF4500, 0 0 25px #FFA500',
              }}
            />
          );
        })}
      </div>

      {/* Główny napis */}
      <div className="relative z-10 text-center px-4 animate-scale-in pointer-events-none">
        <div className="inline-flex items-center gap-2 bg-[#FF4500]/25 border border-[#FF4500] backdrop-blur-xl rounded-full px-5 py-2 mb-4 shadow-[0_0_30px_rgba(255,69,0,0.6)]">
          <Flame className="w-5 h-5 text-[#FF6B00]" />
          <span className="text-xs sm:text-sm font-black text-[#FFA500] uppercase tracking-widest">
            NOWY DROP WŁAŚNIE WYSTARTOWAŁ
          </span>
          <Zap className="w-5 h-5 text-[#FFA500]" />
        </div>

        <h2 className="text-5xl sm:text-7xl md:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-[0_10px_35px_rgba(255,69,0,0.9)]">
          DROP IS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFA500] via-[#FF4500] to-[#FF0000]">LIVE!</span>
        </h2>

        <p className="text-neutral-200 text-sm sm:text-lg font-bold mt-4 uppercase tracking-wider drop-shadow-md">
          Unikatowe pary 1 of 1 są już dostępne w sklepie
        </p>

        <p className="text-neutral-500 text-xs mt-6 uppercase tracking-widest">
          Kliknij w dowolne miejsce, aby zamknąć
        </p>
      </div>
    </div>
  );
}
