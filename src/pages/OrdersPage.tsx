import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { 
  Clipboard, ArrowLeft, Loader2, Shield, ShoppingBag, Calendar, CheckCircle2, ChevronRight, RefreshCw
} from "lucide-react";

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, orders, setCart, addNotification } = useApp() as any;

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
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  const handleReorder = (order: any) => {
    if (!order || !order.items || order.items.length === 0) return;
    setCart(order.items);
    addNotification("Reordered Successfully", `Basket populated with ${order.items.length} items from past purchase!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-4xl mx-auto pb-24 px-4 pt-4"
      id="orders-page-root"
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
            <Clipboard className="w-5 h-5 text-emerald-600" />
            My Order Logs
          </h1>
          <p className="text-xs text-zinc-400 font-semibold">Track active dispatches, live routing, and historical grocery purchases.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-zinc-400 font-extrabold uppercase tracking-widest">Compiling order logs...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-zinc-150 rounded-[32px] p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-400 border border-zinc-100">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-zinc-800">No Orders Logged Yet</h3>
            <p className="text-xs text-zinc-400 font-medium">Your checkout transactions will be logged here for tracking.</p>
          </div>
          <button
            onClick={() => navigate("/categories")}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white font-black text-xs rounded-xl transition uppercase tracking-wider cursor-pointer"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {[...orders].reverse().map((order: any) => (
            <div key={order.id} className="bg-white border border-zinc-150 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm hover:shadow-md hover:border-zinc-200 transition duration-200">
              {/* Header metadata row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-800 font-black px-2.5 py-1 rounded-lg uppercase font-mono tracking-wider">
                    ID: {order.id}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${
                  order.status === "Delivered" 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                    : order.status === "Pending" 
                    ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse" 
                    : "bg-blue-50 text-blue-800 border-blue-200"
                }`}>
                  {order.status}
                </span>
              </div>

              {/* Items in order list */}
              <div className="divide-y divide-zinc-100 border-y border-zinc-100 py-2.5 space-y-2">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-800 leading-tight">{item.product.name}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{item.product.weight || "1 Unit"}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-zinc-700 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-100">
                      {item.quantity} x ₹{item.product.price}
                    </span>
                  </div>
                ))}
              </div>

              {/* Addresses, Total Paid & Actions */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-1.5 text-xs">
                <div className="space-y-1 max-w-sm">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">DISPATCH DESTINATION</p>
                  <p className="text-xs font-bold text-zinc-600 truncate">{order.address}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">TOTAL AMOUNT ({order.paymentMethod})</p>
                    <p className="font-mono font-black text-lg text-zinc-900 mt-0.5">₹{order.total}</p>
                  </div>
                  
                  <button
                    onClick={() => handleReorder(order)}
                    className="p-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 rounded-xl border border-zinc-200 transition cursor-pointer select-none"
                    title="Populate Basket"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Secure OTP Handoff widget */}
              {order.status !== "Delivered" && order.status !== "Rejected" && (
                <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl flex items-center justify-between gap-4 text-xs animate-pulse">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Shield className="w-4.5 h-4.5 text-amber-500 fill-amber-500/15 flex-shrink-0" />
                    <div>
                      <p className="font-black text-zinc-800 leading-tight">Courier Security Passcode (OTP)</p>
                      <p className="text-[10px] text-zinc-450 mt-0.5 font-semibold">Share this strictly with the rider at your door step.</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-amber-700 bg-amber-100 border border-amber-200 px-3.5 py-1 rounded-xl tracking-widest text-xs">
                    {order.deliveryOTP || "4832"}
                  </span>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
