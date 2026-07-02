import React from "react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { ProductCard } from "../components/ProductCard";
import { 
  RefreshCw, ShoppingBag, Check, Heart, Clock, ArrowRight, Zap, Sparkles, Award 
} from "lucide-react";

export const BuyAgain: React.FC<{ onProductClick: (product: any) => void }> = ({ onProductClick }) => {
  const { 
    orders, products, addToCart, addNotification 
  } = useApp() as any;

  // 1. Gather products from actual placed orders
  const actualPurchasedItems: any[] = [];
  const seenIds = new Set<string>();

  orders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      if (!seenIds.has(item.product.id)) {
        seenIds.add(item.product.id);
        actualPurchasedItems.push({
          product: item.product,
          quantity: item.quantity,
          orderedAt: order.createdAt
        });
      }
    });
  });

  // 2. Mock some typical past orders so the dashboard is beautifully populated on first load
  const fallbackMockPurchases = [
    {
      product: products.find((p: any) => p.id === "p1") || products[0],
      orderedAt: "Yesterday, 04:30 PM",
      timesOrdered: 4
    },
    {
      product: products.find((p: any) => p.id === "p2") || products[1],
      orderedAt: "3 days ago",
      timesOrdered: 2
    },
    {
      product: products.find((p: any) => p.id === "p5") || products[4],
      orderedAt: "1 week ago",
      timesOrdered: 5
    },
    {
      product: products.find((p: any) => p.id === "p11") || products[10],
      orderedAt: "2 weeks ago",
      timesOrdered: 3
    }
  ].filter(item => item.product !== undefined);

  const finalPurchasedList = actualPurchasedItems.length > 0 
    ? actualPurchasedItems.map(item => ({
        product: item.product,
        orderedAt: new Date(item.orderedAt).toLocaleDateString() || "Recently",
        timesOrdered: 1
      }))
    : fallbackMockPurchases;

  // Handle adding all items from a past purchase grid at once (One-Click Bulk Reorder)
  const handleReorderAll = () => {
    finalPurchasedList.forEach((item) => {
      addToCart(item.product);
    });
    addNotification("Bulk Reorder Success", `Added ${finalPurchasedList.length} items to your basket!`);
  };

  const handleSingleItemReorder = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    addNotification("Added to Basket", `${product.name} has been added again!`);
  };

  // Recommended products based on history (Organic/Healthy items)
  const recommendations = products
    .filter((p: any) => !seenIds.has(p.id) && (p.name.toLowerCase().includes("organic") || p.price < 150))
    .slice(0, 4);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pb-24 space-y-8"
    >
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[32px] p-6 sm:p-10 text-white shadow-lg relative overflow-hidden select-none">
        {/* Abstract decor circles */}
        <div className="absolute top-[-30px] right-[-30px] w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="max-w-xl space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>Smart Shopping Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Buy Again & Instant Reorders
          </h1>
          <p className="text-zinc-100 text-xs sm:text-sm font-medium leading-relaxed">
            QuickNow tracks your recurring staples, dairy, and fresh favorites. Add previously ordered items back into your basket in just one click.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button 
              onClick={handleReorderAll}
              className="bg-yellow-400 hover:bg-yellow-350 text-zinc-950 font-black text-xs px-5 py-3 rounded-full shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>REORDER ALL ESSENTIALS</span>
            </button>
            <span className="text-[10px] bg-white/20 border border-white/10 rounded-full px-3 py-1.5 flex items-center font-bold">
              ⚡ Save up to 4 minutes checkout time
            </span>
          </div>
        </div>
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Purchased Items List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-emerald-600" />
              Previously Purchased Products ({finalPurchasedList.length})
            </h3>
            {actualPurchasedItems.length > 0 ? (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded-full uppercase">
                From Order Logs
              </span>
            ) : (
              <span className="text-[10px] bg-amber-50 text-amber-700 font-black px-2.5 py-0.5 rounded-full uppercase">
                Frequent Favorites
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {finalPurchasedList.map((item, idx) => (
              <div 
                key={item.product.id || idx}
                onClick={() => onProductClick(item.product)}
                className="group bg-white rounded-3xl p-4 border border-zinc-100 hover:border-emerald-200 transition-all duration-300 flex items-center gap-4 cursor-pointer relative shadow-sm"
              >
                {/* Product Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-50 rounded-2xl flex items-center justify-center p-2.5 flex-shrink-0 relative">
                  <img 
                    src={item.product.image} 
                    alt={item.product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {item.product.isFlashSale && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white font-extrabold text-[8px] px-1 rounded uppercase">
                      Deal
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-zinc-400">Ordered {item.timesOrdered}x</span>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black uppercase">
                      Delivered
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 truncate pr-4">
                    {item.product.name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-semibold">
                    Last ordered: {item.orderedAt}
                  </p>
                  <div className="flex items-center justify-between pt-1.5 gap-2">
                    <span className="text-xs font-mono font-black text-zinc-900">
                      ₹{item.product.price}
                    </span>
                    <button
                      onClick={(e) => handleSingleItemReorder(item.product, e)}
                      className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white p-2 rounded-xl transition cursor-pointer border border-emerald-100 font-extrabold text-[10px] uppercase flex items-center gap-1 active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Buy Again</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Recommendations Carousel Card */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-500" />
              Habit suggestions
            </h3>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-[28px] p-5 space-y-5">
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                Frequently Bought Together
              </h4>
              <p className="text-[10px] text-zinc-400 font-bold leading-normal">
                Other healthy shoppers who bought your recurrent items also frequently added these to their weekly baskets.
              </p>
            </div>

            <div className="space-y-4">
              {recommendations.map((p: any) => (
                <div 
                  key={p.id}
                  onClick={() => onProductClick(p)}
                  className="bg-white rounded-2xl p-3 border border-zinc-100 hover:border-emerald-200 transition cursor-pointer flex items-center gap-3"
                >
                  <div className="w-12 h-12 bg-zinc-50 rounded-xl p-1 flex-shrink-0">
                    <img 
                      src={p.image} 
                      alt={p.name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[11px] font-bold text-zinc-800 truncate">{p.name}</h5>
                    <p className="text-[9px] text-zinc-400 font-bold">{p.weight || "1 Unit"}</p>
                    <span className="text-[11px] font-mono font-black text-zinc-900">₹{p.price}</span>
                  </div>
                  <button
                    onClick={(e) => handleSingleItemReorder(p, e)}
                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white rounded-lg transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
