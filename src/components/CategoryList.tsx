import React, { useRef } from "react";
import { useApp } from "../context/AppContext";
import { 
  Apple, Wheat, Egg, Cookie, CupSoda, Sparkles, Home, Layers,
  Baby, Snowflake, HeartPulse, Activity, Laptop, ChevronLeft, ChevronRight, Eye
} from "lucide-react";

interface CategoryListProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const { customCategories } = useApp() as any;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Apple": return <Apple className="w-5 h-5" />;
      case "Wheat": return <Wheat className="w-5 h-5" />;
      case "Egg": return <Egg className="w-5 h-5" />;
      case "Cookie": return <Cookie className="w-5 h-5" />;
      case "CupSoda": return <CupSoda className="w-5 h-5" />;
      case "Sparkles": return <Sparkles className="w-5 h-5" />;
      case "Home": return <Home className="w-5 h-5" />;
      case "Baby": return <Baby className="w-5 h-5" />;
      case "Snowflake": return <Snowflake className="w-5 h-5" />;
      case "HeartPulse": return <HeartPulse className="w-5 h-5" />;
      case "Activity": return <Activity className="w-5 h-5" />;
      case "Laptop": return <Laptop className="w-5 h-5" />;
      default: return <Layers className="w-5 h-5" />;
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Sort categories by order
  const sortedCategories = [...(customCategories || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="relative space-y-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
            Shop by Category
          </h3>
          <p className="text-[10px] sm:text-xs text-zinc-400 font-bold">Incredibly fresh groceries delivered in minutes</p>
        </div>

        {/* Scroll Buttons for Desktop */}
        <div className="hidden md:flex items-center gap-1.5">
          <button 
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 active:scale-90 text-zinc-500 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 active:scale-90 text-zinc-500 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div className="relative group/track">
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {/* 'View All' / 'All Items' category button */}
          <button
            onClick={() => onSelectCategory("")}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border text-center transition-all duration-300 snap-start relative overflow-hidden cursor-pointer select-none ${
              selectedCategory === ""
                ? "bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-102 ring-2 ring-blue-500/20"
                : "bg-white border-zinc-100 text-zinc-700 hover:border-zinc-200 hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {/* Ripple Accent Background */}
            <div className={`absolute -right-3 -bottom-3 w-10 h-10 rounded-full opacity-10 ${selectedCategory === "" ? "bg-white scale-150" : "bg-blue-600"}`} />
            
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110 ${
              selectedCategory === "" ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-800"
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            
            <span className="text-[10px] font-black tracking-tight leading-tight uppercase px-1">
              View All
            </span>
          </button>

          {/* Map through dynamic custom categories */}
          {sortedCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border text-center transition-all duration-300 snap-start relative overflow-hidden cursor-pointer select-none ${
                  isSelected
                    ? "bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-102 ring-2 ring-blue-500/20"
                    : "bg-white border-zinc-100 text-zinc-700 hover:border-zinc-200 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {/* Visual ripple effect background circle */}
                <div className={`absolute -right-3 -bottom-3 w-10 h-10 rounded-full opacity-10 transition-all duration-500 ${
                  isSelected ? "bg-white scale-150" : "bg-blue-600"
                }`} />

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-all duration-300 ${
                  isSelected 
                    ? "bg-white/20 text-white scale-110" 
                    : cat.color || "bg-zinc-50 text-zinc-700"
                }`}>
                  {getIcon(cat.icon)}
                </div>

                <span className="text-[10px] font-black tracking-tight leading-none px-1 text-center truncate max-w-full">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Left and Right Fade Overlays on scroll track */}
        <div className="absolute left-0 top-0 bottom-4 w-6 bg-gradient-to-r from-zinc-50/10 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-4 w-6 bg-gradient-to-l from-zinc-50/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
