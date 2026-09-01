import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url || window.location.href;
    const shareData = {
      title: title || 'FootBubr',
      text: text || `${title} w sklepie FootBubr`,
      url: shareUrl,
    };

    // Sprawdzenie, czy przeglądarka obsługuje natywne menu udostępniania (głównie telefony)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        // Jeśli użytkownik po prostu zamknął okienko udostępniania, nie robimy nic
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback dla komputerów (PC): Kopiowanie do schowka
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Skopiowano link do schowka!', {
        description: 'Możesz go teraz wkleić i wysłać znajomym.',
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Nie udało się skopiować linku');
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="p-3 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 shadow-lg"
      title="Udostępnij produkt"
      aria-label="Udostępnij"
    >
      {copied ? (
        <Check className="w-5 h-5 text-emerald-400 animate-scale-in" />
      ) : (
        <Share2 className="w-5 h-5 text-neutral-300 hover:text-white transition-colors" />
      )}
    </button>
  );
}
