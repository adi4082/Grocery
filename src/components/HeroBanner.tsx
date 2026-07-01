import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Sparkles, Gift, Flame, Percent, Smartphone, ArrowRight, Share2, Copy, Check } from "lucide-react";

export const HeroBanner: React.FC = () => {
  const { language, addNotification } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 44, seconds: 12 });
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Countdown timer simulation for Flash Sale
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 2, minutes: 59, seconds: 59 }; // reset
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const banners = [
    {
      title: "Super Saver Grocery Deals",
      tagline: "UP TO 50% OFF",
      desc: "Farm fresh organic apples, avocados & daily essentials delivered in 10 minutes flat.",
      bg: "from-blue-600 to-indigo-700",
      accent: "text-amber-300",
      btnText: "Shop Fresh Fruits",
      badge: "Organic Freshness"
    },
    {
      title: "Gourmet Dairy & Artisanal Bakeries",
      tagline: "FRESH EVERY MORNING",
      desc: "Whole milk, creamier local paneer, premium butter, and authentic sourdough loaves.",
      bg: "from-amber-400 to-orange-500",
      accent: "text-white",
      btnText: "Explore Dairy",
      badge: "Artisanal Bakeries"
    },
    {
      title: "Summer Chills & Hydration Station",
      tagline: "FLAT 20% OFF",
      desc: "Cold-pressed juices, premium Japanese matcha green tea & imported sparkling water.",
      bg: "from-sky-500 to-indigo-600",
      accent: "text-yellow-300",
      btnText: "Order Drinks",
      badge: "Summer Specials"
    }
  ];

  const handleCopyCode = () => {
    setCopiedReferral(true);
    navigator.clipboard.writeText("QUICK_SUBH_77");
    addNotification("Referral Code Copied", "Share QUICK_SUBH_77 to invite friends and earn rewards!");
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* PWA banner prompt */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-between shadow-lg shadow-blue-500/10 gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4.5 h-4.5 animate-bounce" />
          <span>Install QuickNow PWA on your home screen for 1-click lightning checkout!</span>
        </div>
        <button 
          onClick={() => addNotification("PWA Installed", "QuickNow progressive application added successfully.")}
          className="bg-white text-blue-750 px-3 py-1 rounded-lg font-black tracking-tight hover:bg-blue-50 transition cursor-pointer"
        >
          INSTALL NOW
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Banner Slider */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-r transition-all duration-500 shadow-xl shadow-zinc-100">
          {/* Slides */}
          <div className={`p-8 sm:p-10 h-64 sm:h-80 bg-gradient-to-br ${banners[currentSlide].bg} text-white flex flex-col justify-between relative`}>
            {/* Decors */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
              <Sparkles className="w-32 h-32" />
            </div>

            <div className="space-y-3 max-w-md">
              <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                {banners[currentSlide].badge}
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {banners[currentSlide].title}
              </h2>
              <p className="text-zinc-100 text-xs sm:text-sm font-medium leading-relaxed">
                {banners[currentSlide].desc}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className={`text-xl sm:text-2xl font-black ${banners[currentSlide].accent}`}>
                {banners[currentSlide].tagline}
              </span>
              <button className="flex items-center gap-1 bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold text-xs px-4 py-2.5 rounded-full transition shadow-md cursor-pointer">
                {banners[currentSlide].btnText}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="absolute right-6 bottom-6 flex items-center gap-1.5 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  currentSlide === idx ? "bg-white scale-125" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Referral Card & Flash counter */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Flash Sale Banner */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col justify-between h-[48%] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-600">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />
                <span className="font-extrabold text-sm uppercase tracking-wide">FLASH SALE</span>
              </div>
              <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">LIVE</span>
            </div>
            
            <p className="text-xs font-medium text-zinc-600 mt-2">
              Limited-edition deals ending in:
            </p>

            <div className="flex items-center gap-2 mt-2">
              <div className="bg-amber-500/10 text-amber-700 font-black text-lg px-2.5 py-1.5 rounded-xl border border-amber-200 min-w-[42px] text-center">
                {String(countdown.hours).padStart(2, "0")}h
              </div>
              <span className="font-black text-amber-500">:</span>
              <div className="bg-amber-500/10 text-amber-700 font-black text-lg px-2.5 py-1.5 rounded-xl border border-amber-200 min-w-[42px] text-center">
                {String(countdown.minutes).padStart(2, "0")}m
              </div>
              <span className="font-black text-amber-500">:</span>
              <div className="bg-amber-500/10 text-amber-700 font-black text-lg px-2.5 py-1.5 rounded-xl border border-amber-200 min-w-[42px] text-center">
                {String(countdown.seconds).padStart(2, "0")}s
              </div>
            </div>

            <p className="text-[10px] text-amber-600 font-semibold mt-1">
              *Hurry! Maximum 1 per customer on all flash products.
            </p>
          </div>

          {/* Referral Card */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between h-[48%] shadow-sm">
            <div className="flex items-center gap-1.5 text-blue-600">
              <Gift className="w-5 h-5 text-orange-500 fill-orange-500/10" />
              <span className="font-extrabold text-sm uppercase tracking-wide">Invite & Earn ₹50</span>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed mt-1.5">
              Share your premium code to gift <strong>₹50</strong> discount and earn <strong>100 points</strong> once they place their first order.
            </p>

            <div className="flex items-center justify-between bg-white border border-blue-200 rounded-xl p-2 mt-2 gap-2">
              <span className="font-mono text-xs font-extrabold text-blue-700 uppercase tracking-widest pl-1.5">
                QUICK_SUBH_77
              </span>
              <button
                onClick={handleCopyCode}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition cursor-pointer"
              >
                {copiedReferral ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
