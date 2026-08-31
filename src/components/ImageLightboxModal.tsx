import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightboxModal({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);

  // Synchronizacja początkowego indeksu po otwarciu
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [isOpen, initialIndex]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Blokowanie scrolla strony w tle
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Obsługa klawiatury (ESC, strzałki)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && images.length > 1) prevImage();
      if (e.key === 'ArrowRight' && images.length > 1) nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const nextImage = () => {
    resetZoom();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    resetZoom();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Zoom kółkiem myszy (PC)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.002;
    setScale((prev) => {
      const nextScale = Math.min(Math.max(1, prev + zoomDelta), 4);
      if (nextScale === 1) setPosition({ x: 0, y: 0 });
      return nextScale;
    });
  };

  // Przesuwanie myszą (PC)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Dotyk / Pinch-to-zoom na telefonie
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialDistanceRef.current = dist;
      initialScaleRef.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / initialDistanceRef.current;
      const newScale = Math.min(Math.max(1, initialScaleRef.current * ratio), 4);
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    initialDistanceRef.current = null;
    setIsDragging(false);
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none touch-none animate-fade-in">
      {/* Pasek górny (Nawigacja i Przyciski Zoomu) */}
      <div className="flex items-center justify-between p-3 sm:p-4 z-10">
        <span className="text-xs sm:text-sm font-mono text-neutral-400">
          {currentIndex + 1} / {images.length}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.5, 4))}
            className="p-2 text-neutral-400 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all active:scale-95"
            title="Powiększ"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setScale((s) => {
                const next = Math.max(1, s - 0.5);
                if (next === 1) setPosition({ x: 0, y: 0 });
                return next;
              });
            }}
            className="p-2 text-neutral-400 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all active:scale-95"
            title="Pomniejsz"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {scale > 1 && (
            <button
              onClick={resetZoom}
              className="p-2 text-neutral-400 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all active:scale-95"
              title="Resetuj zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-white bg-[#FF6B00] hover:bg-[#FF7A00] rounded-xl transition-all active:scale-95 shadow-lg ml-2"
            title="Zamknij"
          >
            <X className="w-4 h-4 text-black font-bold" />
          </button>
        </div>
      </div>

      {/* Główny kontener zdjęcia */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={resetZoom}
        className="flex-1 relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <img
          src={images[currentIndex]}
          alt=""
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="max-h-[82vh] max-w-[92vw] object-contain pointer-events-none rounded-lg"
        />

        {/* Strzałki poprzednie / następne */}
        {images.length > 1 && scale === 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all active:scale-90 border border-neutral-800"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all active:scale-90 border border-neutral-800"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dolny pasek z miniaturkami */}
      {images.length > 1 && (
        <div className="p-3 sm:p-4 flex justify-center gap-2 overflow-x-auto z-10">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                resetZoom();
                setCurrentIndex(idx);
              }}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                currentIndex === idx
                  ? 'border-[#FF6B00] scale-105 opacity-100 shadow-[0_0_10px_rgba(255,107,0,0.4)]'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
