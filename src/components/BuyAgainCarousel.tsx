import React, { useRef, useState } from "react";
import { Product } from "../data/products";
import { useApp } from "../context/AppContext";
import { ChevronLeft, ChevronRight, ShoppingBag, Plus, Minus, RefreshCw, Calendar } from "lucide-react";

interface BuyAgainCarouselProps {
  onProductClick: (product: Product) => void;
}

export const BuyAgainCarousel: React.FC<BuyAgainCarouselProps> = ({ onProductClick }) => {
  const { orders, user, cart, addToCart, updateCartQuantity } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // If no user or user is not customer, don't show customer reorders
  if (!user || user.role !== "customer") return null;

  // 1. Calculate past 30 days orders
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Filter orders for the current user in past 30 days, excluding Rejected ones
  const userOrdersIn30Days = orders
    .filter((o) => {
      if (o.customerId !== user.uid) return false;
      if (o.status === "Rejected") return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= thirtyDaysAgo;
    })
    // Sort orders by date descending (most recent first)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (userOrdersIn30Days.length === 0) {
    // If no purchases, we can return null or hide gracefully
    return null;
  }

  // 2. Gather unique products, track last purchased date and purchase count
  interface PurchaseStats {
    product: Product;
    lastPurchased: string;
    totalQuantity: number;
    orderCount: number;
  }

  const productStatsMap = new Map<string, PurchaseStats>();

  userOrdersIn30Days.forEach((order) => {
    order.items.forEach((item) => {
      const existing = productStatsMap.get(item.product.id);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.orderCount += 1;
        // Keep the latest date
        if (new Date(order.createdAt).getTime() > new Date(existing.lastPurchased).getTime()) {
          existing.lastPurchased = order.createdAt;
        }
      } else {
        productStatsMap.set(item.product.id, {
          product: item.product,
          lastPurchased: order.createdAt,
          totalQuantity: item.quantity,
          orderCount: 1,
        });
      }
    });
  });

  const purchasedProductsStats = Array.from(productStatsMap.values())
    // Sort by last purchased date descending (most recent first)
    .sort((a, b) => new Date(b.lastPurchased).getTime() - new Date(a.lastPurchased).getTime());

  if (purchasedProductsStats.length === 0) {
    return null;
  }

  // Helper to format "Ordered X days ago" or "Yesterday" or "Today"
  const getRelativeTimeString = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      // Check if it is literally today or yesterday
      if (date.getDate() === today.getDate()) {
        return "Bought today";
      }
      return "Bought yesterday";
    }
    return `Bought ${diffDays} days ago`;
  };

  // Slider navigation helpers
  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="space-y-4 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-1.5">
            <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
            <span>Buy Again</span>
            <span className="text-[11px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full ml-1 animate-pulse">
              Past 30 Days Reorder
            </span>
          </h3>
          <p className="text-[11px] text-zinc-400 font-bold mt-0.5">
            One-click repeat ordering for your recently purchased favorites
          </p>
        </div>

        {/* Carousel controls */}
        {purchasedProductsStats.length > 3 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScroll("left")}
              className="p-1.5 rounded-full bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-600 shadow-sm hover:bg-zinc-50 transition cursor-pointer"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="p-1.5 rounded-full bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-600 shadow-sm hover:bg-zinc-50 transition cursor-pointer"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal List Wrapper */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-3 snap-x scroll-smooth scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {purchasedProductsStats.map(({ product, lastPurchased, totalQuantity }) => {
          const cartItem = cart.find((item) => item.product.id === product.id);
          const inCart = !!cartItem;
          const qty = cartItem ? cartItem.quantity : 0;
          const isOutOfStock = product.stock <= 0;

          return (
            <div
              key={product.id}
              className="snap-start flex-none w-[180px] sm:w-[210px] bg-white rounded-2xl border border-zinc-150 p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-zinc-250 hover:-translate-y-0.5"
              onMouseEnter={() => setHoveredId(product.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Image & Click Area */}
              <div
                onClick={() => onProductClick(product)}
                className="cursor-pointer space-y-2 flex-1 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-50 mb-1">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      hoveredId === product.id ? "scale-105" : ""
                    } ${isOutOfStock ? "opacity-40 grayscale" : ""}`}
                  />
                  
                  {/* Recency Pill */}
                  <div className="absolute top-1.5 left-1.5 bg-zinc-900/80 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-blue-400" />
                    <span>{getRelativeTimeString(lastPurchased)}</span>
                  </div>

                  {/* Quantity bought helper badge */}
                  {totalQuantity > 1 && (
                    <div className="absolute bottom-1.5 left-1.5 bg-blue-550/90 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                      Bought {totalQuantity}x
                    </div>
                  )}
                </div>

                {/* Name & unit */}
                <div className="space-y-0.5 flex-1 flex flex-col justify-between">
                  <h4 className="text-xs font-extrabold text-zinc-900 line-clamp-2 leading-tight min-h-[32px]">
                    {product.name}
                  </h4>
                  <p className="text-[10px] font-bold text-zinc-400">
                    {product.unit}
                  </p>
                </div>
              </div>

              {/* Price & Action Row */}
              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-100">
                <div>
                  {product.discount && product.discount > 0 && (
                    <span className="text-[10px] text-zinc-400 line-through font-bold block leading-none">
                      ₹{product.originalPrice}
                    </span>
                  )}
                  <span className="text-sm font-black text-zinc-900">
                    ₹{product.price}
                  </span>
                </div>

                {/* Direct quick action repeating order button */}
                <div className="w-20">
                  {isOutOfStock ? (
                    <button
                      disabled
                      className="w-full py-1.5 bg-zinc-100 text-zinc-400 font-bold text-[10px] rounded-lg cursor-not-allowed border border-zinc-200"
                    >
                      OUT
                    </button>
                  ) : inCart ? (
                    <div className="w-full flex items-center justify-between bg-blue-600 text-white font-extrabold text-[11px] rounded-lg overflow-hidden shadow-sm shadow-blue-500/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartQuantity(product.id, qty - 1);
                        }}
                        className="px-2 py-1.5 hover:bg-blue-700 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black">{qty}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartQuantity(product.id, qty + 1);
                        }}
                        className="px-2 py-1.5 hover:bg-blue-700 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-black text-[10px] rounded-lg transition-all duration-150 flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>REORDER</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
