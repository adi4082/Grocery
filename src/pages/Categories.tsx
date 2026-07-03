import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { ProductCard } from "../components/ProductCard";
import { 
  Search, Layers, AlertCircle, Sparkles, Filter, Percent, ArrowUpDown, ChevronRight, X 
} from "lucide-react";

export const Categories: React.FC<{ onProductClick: (product: any) => void }> = ({ onProductClick }) => {
  const { products, customCategories = [] } = useApp() as any;
  const [searchParams, setSearchParams] = useSearchParams();
  
  const categoryParam = searchParams.get("category") || "";
  const searchParam = searchParams.get("search") || "";

  // Filter States
  const [localSearch, setLocalSearch] = useState(searchParam);
  const [filterOrganic, setFilterOrganic] = useState(false);
  const [filterFlash, setFilterFlash] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sortBy, setSortBy] = useState<"none" | "low-to-high" | "high-to-low" | "rating">("none");
  const [selectedSubTag, setSelectedSubTag] = useState<string>("All");

  // Keep local search input synced with global searchParam URL query
  useEffect(() => {
    setLocalSearch(searchParam);
  }, [searchParam]);

  const categoryIconMap: Record<string, string> = {
    'fruits-veg': '🥦',
    'rice-grains': '🌾',
    'pulses': '🫘',
    'oil-ghee': '🛢️',
    'spices': '🧂',
    'dairy-eggs': '🥛',
    'snacks-biscuits': '🍪',
    'instant-food': '🍜',
    'beverages': '🥤',
    'sugar-bakery': '🍬',
    'personal-care': '🧴',
    'household': '🧼'
  };

  const categories = [
    { id: "all", name: "All Products", icon: "🛒", color: "bg-zinc-100 text-zinc-800" },
    ...customCategories.map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: categoryIconMap[c.id] || "📦",
      color: c.color || "bg-zinc-50 text-zinc-700"
    }))
  ];

  const subTags = ["All", "Organic", "Flash Sale", "Under ₹100", "Under ₹250", "Premium Sourced"];

  // Category change helper
  const handleCategorySelect = (id: string) => {
    const params: Record<string, string> = {};
    if (id && id !== "all") {
      params.category = id;
    }
    if (searchParam) {
      params.search = searchParam;
    }
    setSearchParams(params);
    setSelectedSubTag("All");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (categoryParam) {
      params.category = categoryParam;
    }
    if (localSearch.trim()) {
      params.search = localSearch.trim();
    }
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setLocalSearch("");
    setFilterOrganic(false);
    setFilterFlash(false);
    setMaxPrice(1000);
    setSortBy("none");
    setSelectedSubTag("All");
  };

  // 1. Filter products by category, search term, and specific custom tags
  let filtered = products.filter((p: any) => {
    const matchesCategory = categoryParam ? p.category === categoryParam : true;
    
    const term = searchParam.toLowerCase().trim();
    const matchesSearch = term 
      ? p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      : true;

    const matchesOrganic = filterOrganic ? p.name.toLowerCase().includes("organic") || p.description.toLowerCase().includes("organic") : true;
    const matchesFlash = filterFlash ? p.isFlashSale : true;
    const matchesPrice = p.price <= maxPrice;

    // SubTag Filters
    let matchesSubTag = true;
    if (selectedSubTag === "Organic") {
      matchesSubTag = p.name.toLowerCase().includes("organic") || p.description.toLowerCase().includes("organic");
    } else if (selectedSubTag === "Flash Sale") {
      matchesSubTag = p.isFlashSale;
    } else if (selectedSubTag === "Under ₹100") {
      matchesSubTag = p.price < 100;
    } else if (selectedSubTag === "Under ₹250") {
      matchesSubTag = p.price < 250;
    } else if (selectedSubTag === "Premium Sourced") {
      matchesSubTag = p.price >= 200 || p.name.toLowerCase().includes("gourmet") || p.name.toLowerCase().includes("artisanal");
    }

    return matchesCategory && matchesSearch && matchesOrganic && matchesFlash && matchesPrice && matchesSubTag;
  });

  // 2. Sorting
  if (sortBy === "low-to-high") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sortBy === "high-to-low") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating") {
    filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const currentCategoryName = categories.find(c => c.id === (categoryParam || "all"))?.name || "All Products";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pb-24 grid grid-cols-1 lg:grid-cols-4 gap-8"
    >
      {/* LEFT COLUMN: Categories sidebar on desktop, horizontal buttons on mobile */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="font-extrabold text-xs text-zinc-900 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Categories Map
            </h3>
            <span className="text-[10px] bg-zinc-100 text-zinc-500 font-bold px-2 py-0.5 rounded-full">
              {categories.length - 1} Departments
            </span>
          </div>

          {/* Desktop Categories List */}
          <div className="hidden lg:flex flex-col gap-1.5">
            {categories.map((c) => {
              const isSelected = (categoryParam === c.id) || (!categoryParam && c.id === "all");
              return (
                <button
                  key={c.id}
                  onClick={() => handleCategorySelect(c.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
                    isSelected 
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-800 shadow-sm shadow-emerald-600/5 font-black translate-x-1" 
                      : "border-transparent text-zinc-650 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{c.icon}</span>
                    <span>{c.name}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform ${isSelected ? "rotate-90 text-emerald-600" : ""}`} />
                </button>
              );
            })}
          </div>

          {/* Mobile Categories horizontal slider */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x scroll-smooth -mx-4 px-4">
            {categories.map((c) => {
              const isSelected = (categoryParam === c.id) || (!categoryParam && c.id === "all");
              return (
                <button
                  key={c.id}
                  onClick={() => handleCategorySelect(c.id)}
                  className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all select-none border ${
                    isSelected 
                      ? "bg-emerald-600 text-white border-emerald-600 font-black" 
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Filter Controls Section */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h4 className="font-extrabold text-xs text-zinc-900 uppercase tracking-widest flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-600" />
              Advanced Filters
            </h4>
            <button 
              onClick={clearAllFilters}
              className="text-[10px] text-emerald-600 font-extrabold hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Sort By Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400">Sort By</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full text-xs font-bold border border-zinc-200 rounded-xl p-2.5 bg-zinc-50 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="none">Relevance (Default)</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
                <option value="rating">Rating: High to Low</option>
              </select>
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-zinc-400">Max Price Limit</label>
              <span className="text-xs font-mono font-black text-emerald-700">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="30"
              max="1000"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
              <span>₹30</span>
              <span>₹1,000</span>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3.5 pt-1.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOrganic}
                onChange={(e) => setFilterOrganic(e.target.checked)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300 rounded"
              />
              <span className="text-xs font-bold text-zinc-700 select-none">100% Certified Organic</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterFlash}
                onChange={(e) => setFilterFlash(e.target.checked)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300 rounded"
              />
              <span className="text-xs font-bold text-zinc-700 select-none">Flash Sale Active Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Results Section */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Results Toolbar: Current Route Info, Inline search bar, SubTag quick buttons */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
                <span>{currentCategoryName}</span>
                {categoryParam && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    Department
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500 font-semibold">
                Found {filtered.length} matching premium products
              </p>
            </div>

            {/* In-category Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search inside department..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-9 pr-12 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Go
                </button>
              </div>
            </form>
          </div>

          {/* Active Filtering badging summary */}
          {(categoryParam || searchParam || filterOrganic || filterFlash || maxPrice < 1000 || selectedSubTag !== "All") && (
            <div className="flex items-center gap-2 flex-wrap bg-zinc-50 p-2.5 rounded-xl border border-zinc-150">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Active:</span>
              {categoryParam && (
                <span className="text-[10px] bg-white border border-zinc-200 text-zinc-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                  Cat: {categoryParam}
                  <button onClick={() => handleCategorySelect("")}><X className="w-3 h-3 text-red-500" /></button>
                </span>
              )}
              {searchParam && (
                <span className="text-[10px] bg-white border border-zinc-200 text-zinc-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                  Query: "{searchParam}"
                  <button onClick={() => { setLocalSearch(""); setSearchParams(categoryParam ? { category: categoryParam } : {}); }}><X className="w-3 h-3 text-red-500" /></button>
                </span>
              )}
              {filterOrganic && (
                <span className="text-[10px] bg-white border border-zinc-200 text-zinc-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                  Organic
                  <button onClick={() => setFilterOrganic(false)}><X className="w-3 h-3 text-red-500" /></button>
                </span>
              )}
              {filterFlash && (
                <span className="text-[10px] bg-white border border-zinc-200 text-zinc-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                  Flash Deal
                  <button onClick={() => setFilterFlash(false)}><X className="w-3 h-3 text-red-500" /></button>
                </span>
              )}
              {maxPrice < 1000 && (
                <span className="text-[10px] bg-white border border-zinc-200 text-zinc-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                  &lt; ₹{maxPrice}
                  <button onClick={() => setMaxPrice(1000)}><X className="w-3 h-3 text-red-500" /></button>
                </span>
              )}
              {selectedSubTag !== "All" && (
                <span className="text-[10px] bg-white border border-zinc-200 text-zinc-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                  Tag: {selectedSubTag}
                  <button onClick={() => setSelectedSubTag("All")}><X className="w-3 h-3 text-red-500" /></button>
                </span>
              )}
              <button 
                onClick={clearAllFilters}
                className="text-[10px] font-black text-red-600 hover:underline ml-auto pl-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* SubCategories tag rail selection */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
            {subTags.map((tag) => {
              const isSelected = selectedSubTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedSubTag(tag)}
                  className={`flex-shrink-0 text-[11px] font-extrabold px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-zinc-950 text-white border-zinc-950 font-black scale-105" 
                      : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-650"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic product card results list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-zinc-200 rounded-[32px] space-y-4">
            <AlertCircle className="w-12 h-12 text-zinc-350 mx-auto animate-bounce" />
            <div className="space-y-1">
              <p className="font-extrabold text-sm text-zinc-900">No matching products found</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-bold leading-normal">
                Try loosening your filters, search terms, or select another category from the sidebar map.
              </p>
            </div>
            <button
              onClick={clearAllFilters}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {filtered.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        )}

      </div>
    </motion.div>
  );
};
