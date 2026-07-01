import React from "react";
import { useApp } from "../context/AppContext";
import { CATEGORIES } from "../data/products";
import { 
  Apple, Wheat, Egg, Cookie, CupSoda, Sparkles, Home, Layers 
} from "lucide-react";

interface CategoryListProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const { language } = useApp();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Apple": return <Apple className="w-6 h-6" />;
      case "Wheat": return <Wheat className="w-6 h-6" />;
      case "Egg": return <Egg className="w-6 h-6" />;
      case "Cookie": return <Cookie className="w-6 h-6" />;
      case "CupSoda": return <CupSoda className="w-6 h-6" />;
      case "Sparkles": return <Sparkles className="w-6 h-6" />;
      case "Home": return <Home className="w-6 h-6" />;
      default: return <Layers className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
        Shop by Category
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* 'All' category button */}
        <button
          onClick={() => onSelectCategory("")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-black transition-all duration-150 snap-start ${
            selectedCategory === ""
              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10"
              : "bg-white border-zinc-100 text-zinc-700 hover:border-zinc-200"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>All Items</span>
        </button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-black transition-all duration-150 snap-start ${
              selectedCategory === cat.id
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10 scale-102"
                : `${cat.color} border-zinc-100 hover:scale-101 hover:shadow-sm`
            }`}
          >
            {getIcon(cat.icon)}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
