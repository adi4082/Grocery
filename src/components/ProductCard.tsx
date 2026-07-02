import React from "react";
import { Product } from "../data/products";
import { useApp } from "../context/AppContext";
import { Star, Heart, Plus, Minus, AlertCircle, Sparkles, Timer } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductClick
}) => {
  const { cart, wishlist, addToCart, updateCartQuantity, toggleWishlist } = useApp();

  const cartItem = cart.find((item) => item.product.id === product.id);
  const isStarred = wishlist.includes(product.id);
  const inCart = !!cartItem;
  const qty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;

  // Sourced quick-delivery mock time
  const deliveryTime = (product as any).deliveryTime || "9 Mins";

  return (
    <div className="group relative bg-white rounded-3xl border border-zinc-100 p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-200/50 hover:border-zinc-200/70 hover:-translate-y-1 select-none">
      
      {/* Top Badges (Discount, etc.) & Wishlist Button */}
      <div className="flex items-center justify-between gap-1.5 z-10 mb-2">
        {product.discount && product.discount > 0 ? (
          <span className="bg-rose-600 text-white font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-xl shadow-sm tracking-tight flex items-center gap-0.5 animate-pulse">
            <Sparkles className="w-3 h-3" />
            {product.discount}% OFF
          </span>
        ) : (
          <div />
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`p-2 rounded-full hover:scale-110 active:scale-90 transition shadow-sm border ${
            isStarred 
              ? "bg-rose-50 text-rose-600 border-rose-100" 
              : "bg-white text-zinc-300 hover:text-zinc-500 border-zinc-100"
          } cursor-pointer`}
          id={`wishlist-btn-${product.id}`}
        >
          <Heart className={`w-4 h-4 ${isStarred ? "fill-rose-600" : ""}`} />
        </button>
      </div>

      {/* Main product clickable area */}
      <div 
        onClick={() => onProductClick(product)}
        className="cursor-pointer space-y-2.5 flex-1 flex flex-col"
        id={`product-card-click-${product.id}`}
      >
        {/* Product Image Stage */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center p-1">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`max-w-full max-h-full object-contain group-hover:scale-108 transition duration-500 ease-out ${
              isOutOfStock ? "opacity-30 grayscale" : ""
            }`}
          />
          
          {/* Glassmorphic Quick Delivery Time Overlay */}
          {!isOutOfStock && (
            <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 border border-white/20 shadow-sm">
              <Timer className="w-3 h-3 text-emerald-600 animate-spin-slow" />
              <span className="text-[9px] font-black tracking-tight text-zinc-800 uppercase">
                {deliveryTime}
              </span>
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
              <span className="bg-zinc-800 text-white font-black text-[9px] tracking-widest uppercase px-3 py-1 rounded-xl flex items-center gap-1 shadow-lg">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Rating & unit */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
            <Star className="w-3 h-3 fill-amber-500 stroke-amber-600" />
            <span>{product.rating}</span>
            <span className="text-zinc-400 font-bold ml-0.5">({product.reviews})</span>
          </div>

          <span className="text-[10px] font-black text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded-lg border border-zinc-100">
            {product.unit}
          </span>
        </div>

        {/* Product Name */}
        <div className="flex-1 min-h-[2.5rem]">
          <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
            {product.name}
          </h4>
        </div>
      </div>

      {/* Footer (Pricing + Cart controllers) */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-100/50">
        <div>
          {product.originalPrice && product.originalPrice > product.price ? (
            <p className="text-[10px] text-zinc-400 line-through font-bold">
              ₹{product.originalPrice}
            </p>
          ) : (
            <div className="h-3.5" />
          )}
          <p className="text-sm sm:text-base font-black text-zinc-900 tracking-tight">
            ₹{product.price}
          </p>
        </div>

        {/* Dynamic Quantity Controller / Add Button */}
        <div className="w-24 flex justify-end">
          {isOutOfStock ? (
            <button
              disabled
              className="w-full py-2 bg-zinc-50 text-zinc-400 font-bold text-[10px] rounded-xl cursor-not-allowed border border-zinc-200 text-center"
              id={`outofstock-${product.id}`}
            >
              SOLD OUT
            </button>
          ) : inCart ? (
            <div className="w-full flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs rounded-xl overflow-hidden shadow-lg shadow-emerald-500/10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateCartQuantity(product.id, qty - 1);
                }}
                className="px-2.5 py-2 hover:bg-black/10 active:scale-95 transition cursor-pointer"
                id={`qty-minus-${product.id}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black select-none">{qty}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateCartQuantity(product.id, qty + 1);
                }}
                className="px-2.5 py-2 hover:bg-black/10 active:scale-95 transition cursor-pointer"
                id={`qty-plus-${product.id}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="w-full py-2 bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-black text-xs rounded-xl transition-all duration-300 shadow-sm active:scale-95 hover:shadow-md cursor-pointer text-center"
              id={`add-btn-${product.id}`}
            >
              ADD
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
