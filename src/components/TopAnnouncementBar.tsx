export default function TopAnnouncementBar() {
  const message =
    '📦 DARMOWA WYSYŁKA OD 500 ZŁ • ⚡ WSZYSTKIE PARY 100% ORYGINALNE • ⏱️ KOLEJNY DROP: NIEDZIELA 18:00';

  return (
    <div className="w-full bg-[#FF6B00] text-black border-b-2 border-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-1.5">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.14em] text-center truncate">
          {message}
        </p>
      </div>
    </div>
  );
}
