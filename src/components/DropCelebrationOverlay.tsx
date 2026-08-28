import { useEffect, useState } from 'react';
import { Flame, Zap } from 'lucide-react';

interface DropCelebrationOverlayProps {
  onComplete?: () => void;
}

export default function DropCelebrationOverlay({ onComplete }: DropCelebrationOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Animacja trwa 4 sekundy, po czym płynnie znika
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden animate-fade-in">
      {/* 1. Ciemne tło z rozbłyskiem */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-pulse" />

      {/* 2. Fala ognia przelatująca przez środek (promień światła i płomienie) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-40 sm:h-56 bg-gradient-to-r from-transparent via-[#FF4500] to-transparent blur-3xl opacity-80 animate-fire-sweep" />
        <div className="w-full h-20 sm:h-32 bg-gradient-to-r from-transparent via-[#FFA500] to-transparent blur-xl opacity-90 animate-fire-sweep delay-100" />
        <div className="w-full h-6 bg-gradient-to-r from-transparent via-white to-transparent blur-sm opacity-100 animate-fire-sweep" />
      </div>

      {/* 3. Iskry i cząsteczki ognia */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => {
          const randomX = (Math.random() - 0.5) * 800;
          const randomY = (Math.random() - 0.5) * 400;
          const delay = Math.random() * 1.5;
          const size = Math.random() * 8 + 4;
          return (
            <div
              key={i}
              className="absolute rounded-full bg-[#FF6B00] blur-[1px] animate-spark"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                transform: `translate(${randomX}px, ${randomY}px)`,
                animationDelay: `${delay}s`,
                boxShadow: '0 0 15px #FF4500, 0 0 30px #FFA500',
              }}
            />
          );
        })}
      </div>

      {/* 4. Główny napis na środku ekranu z ognisty neonem */}
      <div className="relative z-10 text-center px-4 animate-scale-bounce">
        <div className="inline-flex items-center gap-2 bg-[#FF4500]/20 border border-[#FF4500]/50 backdrop-blur-xl rounded-full px-5 py-2 mb-4 shadow-[0_0_30px_rgba(255,69,0,0.5)] animate-bounce">
          <Flame className="w-5 h-5 text-[#FF6B00] animate-pulse" />
          <span className="text-xs sm:text-sm font-black text-[#FFA500] uppercase tracking-widest">
            NOWY DROP WŁAŚNIE WYSTARTOWAŁ
          </span>
          <Zap className="w-5 h-5 text-[#FFA500]" />
        </div>

        <h2 className="text-5xl sm:text-7xl md:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-[0_10px_35px_rgba(255,69,0,0.8)]">
          DROP IS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFA500] via-[#FF4500] to-[#FF0000]">LIVE!</span>
        </h2>

        <p className="text-neutral-300 text-sm sm:text-lg font-bold mt-4 uppercase tracking-wider drop-shadow-md">
          Unikatowe pary 1 of 1 są już dostępne w sklepie
        </p>
      </div>

      <style>{`
        @keyframes fireSweep {
          0% {
            transform: scaleX(0.1) rotate(-5deg);
            opacity: 0;
          }
          50% {
            transform: scaleX(1.4) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scaleX(2) rotate(5deg);
            opacity: 0;
          }
        }
        @keyframes spark {
          0% {
            opacity: 0;
            transform: scale(0.2) translateY(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.5) translateY(-50px);
          }
          100% {
            opacity: 0;
            transform: scale(0) translateY(-120px);
          }
        }
        @keyframes scaleBounce {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }
          60% {
            opacity: 1;
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-fire-sweep {
          animation: fireSweep 2.5s ease-out infinite;
        }
        .animate-spark {
          animation: spark 2s ease-out infinite;
        }
        .animate-scale-bounce {
          animation: scaleBounce 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
