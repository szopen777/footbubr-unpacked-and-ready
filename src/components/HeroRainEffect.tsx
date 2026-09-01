import { useMemo } from 'react';

interface Particle {
  id: number;
  emoji: string;
  left: number;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
}

const ICONS = ['🦫', '⚽', '🦫', '⚡', '🦫', '👟'];

export default function HeroRainEffect() {
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      emoji: ICONS[i % ICONS.length],
      left: Math.random() * 96 + 2, // 2% - 98% szerokości
      duration: Math.random() * 6 + 6, // 6s - 12s (płynny, spokojny opad)
      delay: Math.random() * 7,
      size: Math.random() * 10 + 16, // 16px - 26px
      opacity: Math.random() * 0.25 + 0.1, // Dyskretna przezroczystość, by nie zasłaniać tekstu
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute will-change-transform animate-hero-rain"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
          }}
        >
          {p.emoji}
        </span>
      ))}

      <style>{`
        @keyframes hero-rain {
          0% {
            transform: translateY(-60px) rotate(0deg);
          }
          100% {
            transform: translateY(650px) rotate(360deg);
          }
        }
        .animate-hero-rain {
          animation-name: hero-rain;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }
      `}</style>
    </div>
  );
}
