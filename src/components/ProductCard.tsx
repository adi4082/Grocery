import React from "react";
import { Product } from "../data/products";
import { useApp } from "../context/AppContext";
import { Star, Heart, Plus, Minus, AlertCircle } from "lucide-react";

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

  return (
    <div className="group relative bg-white rounded-3xl border border-zinc-100 p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-zinc-100/60 hover:border-zinc-200/50">
      
      {/* Top badges & Heart action */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {product.discount && product.discount > 0 ? (
          <span className="bg-orange-500 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-1 rounded-full shadow-sm">
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
          className={`p-1.5 rounded-full hover:scale-110 transition ${
            isStarred 
              ? "text-rose-500 bg-rose-50" 
              : "text-zinc-300 hover:text-zinc-400"
          }`}
        >
          <Heart className={`w-5 h-5 ${isStarred ? "fill-rose-500" : ""}`} />
        </button>
      </div>

      {/* Main product clickable image area */}
      <div 
        onClick={() => onProductClick(product)}
        className="cursor-pointer space-y-3 flex-1 flex flex-col"
      >
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-50 mb-2">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${
              isOutOfStock ? "opacity-40 grayscale" : ""
            }`}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
              <span className="bg-red-500 text-white font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <AlertCircle className="w-3.5 h-3.5" /> Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Rating & reviews summary */}
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg w-max">
          <Star className="w-3.5 h-3.5 fill-amber-500" />
          <span>{product.rating}</span>
          <span className="text-zinc-400 font-medium">({product.reviews})</span>
        </div>

        {/* Info content */}
        <div className="space-y-1 flex-1 flex flex-col justify-between">
          <h4 className="text-sm font-extrabold text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {product.name}
          </h4>
          <p className="text-[11px] font-bold text-zinc-400 tracking-tight">
            {product.unit}
          </p>
        </div>
      </div>

      {/* Footer cost & Cart controls */}
      <div className="flex items-center justify-between pt-4 mt-3 border-t border-zinc-50">
        <div>
          <p className="text-xs text-zinc-400 line-through font-bold">
            ₹{product.originalPrice}
          </p>
          <p className="text-base sm:text-lg font-black text-zinc-900">
            ₹{product.price}
          </p>
        </div>

        {/* Quantity selectors */}
        <div className="w-24">
          {isOutOfStock ? (
            <button
              disabled
              className="w-full py-2 bg-zinc-100 text-zinc-400 font-bold text-xs rounded-xl cursor-not-allowed border border-zinc-200"
            >
              SOLD OUT
            </button>
          ) : inCart ? (
            <div className="w-full flex items-center justify-between bg-orange-500 text-white font-extrabold text-xs rounded-xl overflow-hidden shadow-md shadow-orange-500/15">
              <button
                onClick={() => updateCartQuantity(product.id, qty - 1)}
                className="px-3 py-2.5 hover:bg-orange-600 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black">{qty}</span>
              <button
                onClick={() => updateCartQuantity(product.id, qty + 1)}
                className="px-3 py-2.5 hover:bg-orange-600 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product)}
              className="w-full py-2.5 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-black text-xs rounded-xl transition-all duration-150 shadow-sm active:scale-95 cursor-pointer"
            >
              ADD
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
