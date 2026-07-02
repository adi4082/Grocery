import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { ProductCard } from "../components/ProductCard";
import { 
  Heart, ArrowLeft, Loader2, Sparkles, AlertCircle
} from "lucide-react";

export const WishlistPage: React.FC<{ onProductClick: (product: any) => void }> = ({ onProductClick }) => {
  const navigate = useNavigate();
  const { user, wishlist, products } = useApp() as any;

  // Redirection guard - if not logged in, go to /login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(true);

  // Loading animation simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  const wishlistProducts = products.filter((p: any) => wishlist.includes(p.id));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-4xl mx-auto pb-24 px-4 pt-4"
      id="wishlist-page-root"
    >
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/account")}
          className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-full border border-zinc-200 transition select-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-700" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500/10" />
            Wishlist Favorites
          </h1>
          <p className="text-xs text-zinc-400 font-semibold">Replenish your staple items and fast groceries with one tap.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-xs text-zinc-400 font-extrabold uppercase tracking-widest">Unlocking bookmarks...</p>
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="bg-white border border-zinc-150 rounded-[32px] p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-100">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-zinc-800">Your Wishlist is Empty</h3>
            <p className="text-xs text-zinc-400 font-medium">Click the heart button on any product tile to save items here.</p>
          </div>
          <button
            onClick={() => navigate("/categories")}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white font-black text-xs rounded-xl transition uppercase tracking-wider cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-350">
          {wishlistProducts.map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
