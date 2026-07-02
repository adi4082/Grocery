import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { 
  Sparkles, Smartphone, ArrowRight, Check, Zap, Calendar, ChevronLeft, ChevronRight
} from "lucide-react";

interface HeroBannerProps {
  onSelectCategory?: (id: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onSelectCategory }) => {
  const { banners, addNotification } = useApp() as any;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Touch Swiping variables
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter only enabled banners
  const activeBanners = (banners || []).filter((b: any) => b.isEnabled !== false);

  // Auto-slide every 4 seconds unless paused
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused]);

  const handleNextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeBanners.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeBanners.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  // Swipe handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const difference = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50; // minimum distance to trigger a swipe

    if (difference > swipeThreshold) {
      handleNextSlide(); // Swipe Left -> Go to Next Slide
    } else if (difference < -swipeThreshold) {
      handlePrevSlide(); // Swipe Right -> Go to Prev Slide
    }

    // Reset touch variables
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleBannerClick = (banner: any) => {
    if (banner.categoryId && onSelectCategory) {
      onSelectCategory(banner.categoryId);
      addNotification("Category Selected", `Browsing deals in ${banner.title || "Category"}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ⚡ PWA install promotional banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white px-4 sm:px-6 py-3 text-xs font-bold rounded-2xl flex flex-col sm:flex-row items-center justify-between shadow-xl shadow-blue-500/15 gap-3 border border-white/10 relative overflow-hidden select-none">
        {/* Glow circle background */}
        <div className="absolute top-0 right-12 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center animate-bounce">
            <Smartphone className="w-4.5 h-4.5 text-amber-300" />
          </div>
          <div className="text-center sm:text-left">
            <span className="block sm:inline font-black tracking-tight text-white text-xs sm:text-sm">Lightning-Fast 1-Click Ordering</span>
            <span className="block sm:inline text-zinc-200 font-medium sm:ml-2">Install our QuickNow PWA app on your phone's home screen!</span>
          </div>
        </div>
        <button 
          onClick={() => addNotification("PWA Setup", "PWA is ready. Click the browser install prompt to confirm.")}
          className="bg-amber-400 text-zinc-950 px-4 py-1.5 rounded-xl font-black text-[10px] sm:text-xs tracking-tight hover:bg-amber-300 active:scale-95 transition shadow-md shadow-amber-400/20 cursor-pointer w-full sm:w-auto"
        >
          INSTALL APP
        </button>
      </div>

      <div className="w-full">
        
        {/* Banner Carousel Slider */}
        <div 
          className="w-full relative overflow-hidden rounded-[32px] shadow-xl shadow-zinc-100 group border border-zinc-100 select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {activeBanners.length === 0 ? (
            <div className="p-8 h-64 sm:h-80 bg-gradient-to-br from-zinc-800 to-zinc-950 text-white flex flex-col justify-center items-center text-center">
              <Sparkles className="w-12 h-12 text-zinc-500 mb-2 animate-pulse" />
              <p className="font-bold text-sm">No Active Promotional Banners</p>
              <p className="text-xs text-zinc-400">Configure banners in the Admin Panel to display promotions here.</p>
            </div>
          ) : (
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              {activeBanners.map((banner: any, idx: number) => {
                const isSelected = currentSlide === idx;
                return (
                  <div
                    key={banner.id || idx}
                    onClick={() => handleBannerClick(banner)}
                    className={`absolute inset-0 p-6 sm:p-10 text-white flex flex-col justify-between transition-all duration-700 ease-in-out cursor-pointer ${
                      isSelected ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-full scale-95 pointer-events-none"
                    } bg-gradient-to-br ${banner.bg || "from-blue-600 to-indigo-700"}`}
                  >
                    {/* Visual Decor Elements */}
                    <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-10 pointer-events-none flex items-center justify-center">
                      <Sparkles className="w-48 h-48 animate-pulse" />
                    </div>

                    <div className="space-y-3.5 max-w-lg z-10">
                      <div className="flex items-center gap-2">
                        <span className="inline-block bg-white/25 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border border-white/10">
                          {banner.badge || "Deal of the Day"}
                        </span>
                        {banner.startDate && (
                          <span className="text-[9px] text-white/70 font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Scheduled Promo
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-none drop-shadow-sm">
                        {banner.title}
                      </h2>
                      <p className="text-zinc-100 text-xs sm:text-sm font-semibold leading-relaxed line-clamp-2 max-w-md opacity-90">
                        {banner.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-4">
                        <span className="text-lg sm:text-2xl font-black tracking-tight uppercase bg-yellow-400 text-zinc-950 px-3 py-1 rounded-xl shadow-sm rotate-[-1deg]">
                          {banner.tagline || "FLAT OFF"}
                        </span>
                        <button className="flex items-center gap-1.5 bg-white hover:bg-zinc-100 active:scale-95 text-zinc-950 font-black text-xs px-4 py-3 rounded-full transition shadow-lg cursor-pointer">
                          <span>{banner.btnText || "Shop Now"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Slider Left & Right Arrows (Hidden on Mobile) */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    onClick={handlePrevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/40 active:scale-90 transition opacity-0 group-hover:opacity-100 cursor-pointer z-20"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/40 active:scale-90 transition opacity-0 group-hover:opacity-100 cursor-pointer z-20"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Slider Dots Indicator */}
              {activeBanners.length > 1 && (
                <div className="absolute right-8 bottom-8 flex items-center gap-2 z-20">
                  {activeBanners.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSlide(idx);
                      }}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        currentSlide === idx ? "w-6 bg-white" : "w-2.5 bg-white/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
