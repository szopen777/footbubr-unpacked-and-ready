import { useMemo } from 'react';

interface Particle {
  id: number;
  emoji: string;
  left: number;
  duration: number;
  negativeDelay: number;
  size: number;
  opacity: number;
}

const ICONS = ['🦫', '⚽', '🦫', '⚡', '🦫', '👟'];

export default function HeroRainEffect() {
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const duration = Math.random() * 6 + 6; // 6s - 12s
      return {
        id: i,
        emoji: ICONS[i % ICONS.length],
        left: Math.random() * 94 + 3, // 3% - 97% szerokości
        duration,
        // Ujemny delay sprawia, że animacja jest w toku od razu po załadowaniu
        negativeDelay: Math.random() * duration,
        size: Math.random() * 10 + 16, // 16px - 26px
        opacity: Math.random() * 0.25 + 0.12,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 will-change-transform animate-hero-rain"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `-${p.negativeDelay}s`,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
          }}
        >
          {p.emoji}
        </span>
      ))}

      <style>{`
        @keyframes hero-rain {
          0% {
            transform: translateY(-50px) rotate(0deg);
          }
          100% {
            transform: translateY(700px) rotate(360deg);
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
