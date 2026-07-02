import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { 
  User, Clipboard, Heart, Wallet, HelpCircle, LogOut, ChevronRight, ShieldCheck, Sparkles, Loader2, ArrowRight
} from "lucide-react";

export const Account: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, walletBalance, loyaltyPoints, orders, wishlist, tickets, addNotification } = useApp() as any;
  const [loading, setLoading] = useState(true);

  // Redirection guard - if not logged in, go to /login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Premium loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  const handleSecureLogout = () => {
    logout();
    addNotification("Logged Out", "You have been securely signed out of your session.");
    navigate("/login");
  };

  const menuItems = [
    {
      id: "profile",
      label: "My Profile & Settings",
      description: "Manage addresses, dispatch preferences, and phone credentials",
      icon: User,
      route: "/profile",
      color: "text-blue-600 bg-blue-50 border-blue-100"
    },
    {
      id: "orders",
      label: "Order History & Logs",
      description: "Track live couriers, look up security OTPs, and view past dispatches",
      icon: Clipboard,
      route: "/orders",
      badge: orders.length,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100"
    },
    {
      id: "wishlist",
      label: "Wishlist Favorites",
      description: "Re-add bookmarked fresh groceries and replenishment staples",
      icon: Heart,
      route: "/wishlist",
      badge: wishlist.length,
      color: "text-red-500 bg-red-50 border-red-100"
    },
    {
      id: "wallet",
      label: "Wallet & Reward Points",
      description: "Manage simulated currency, top-up escrow, and redeem SuperPoints",
      icon: Wallet,
      route: "/wallet",
      color: "text-amber-600 bg-amber-50 border-amber-100"
    },
    {
      id: "support",
      label: "Help & Support Center",
      description: "File late delivery claims, item disputes, or query store branch managers",
      icon: HelpCircle,
      route: "/support",
      badge: tickets.filter((t: any) => t.status === "Open").length,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-4xl mx-auto pb-24 px-4 pt-4"
      id="account-dashboard-root"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs text-zinc-450 font-black uppercase tracking-widest">Hydrating Dashboard...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* USER WELCOME HERO CARD */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white rounded-[32px] p-6 sm:p-8 shadow-xl shadow-zinc-900/10 relative overflow-hidden select-none">
            {/* Glowing blur vector decorators */}
            <div className="absolute top-[-20%] right-[-10%] w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-3xl italic tracking-tighter shadow-lg shadow-emerald-500/20">
                  {user.name ? user.name[0] : "Q"}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-xl font-black tracking-tight">{user.name || "Premium Member"}</h2>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {user.role || "CUSTOMER"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">{user.email || "palsubhajit2005tq@gmail.com"}</p>
                  <p className="text-[10px] text-zinc-500 font-semibold tracking-wide">Rider Contact: {user.phone || "+91 98765 43210"}</p>
                </div>
              </div>

              {/* Quick stats panel inside hero */}
              <div className="flex gap-4 sm:gap-6 bg-white/5 border border-white/10 backdrop-blur-md px-5 py-3 rounded-2xl w-full sm:w-auto justify-around sm:justify-start text-center">
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Wallet</p>
                  <p className="font-mono font-black text-sm text-amber-400 mt-0.5">₹{walletBalance}</p>
                </div>
                <div className="w-px bg-white/10 self-stretch" />
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">SuperPoints</p>
                  <p className="font-mono font-black text-sm text-emerald-400 mt-0.5">{loyaltyPoints}</p>
                </div>
                <div className="w-px bg-white/10 self-stretch" />
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Active Orders</p>
                  <p className="font-mono font-black text-sm text-blue-400 mt-0.5">
                    {orders.filter((o: any) => o.status === "Pending" || o.status === "Rider Assigned" || o.status === "Out for Delivery").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DEDICATED MENU LIST */}
          <div className="space-y-4">
            <h3 className="font-black text-xs text-zinc-400 uppercase tracking-widest px-1">Account Operations</h3>
            
            <div className="bg-white border border-zinc-150 rounded-[32px] overflow-hidden shadow-sm divide-y divide-zinc-100">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.route)}
                    className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-zinc-50/70 transition duration-150 cursor-pointer select-none group"
                    id={`menu-item-${item.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 transition duration-300 group-hover:scale-105 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="truncate pr-4">
                        <p className="text-xs sm:text-sm font-black text-zinc-900 flex items-center gap-2">
                          {item.label}
                          {"badge" in item && item.badge !== undefined && item.badge > 0 && (
                            <span className="bg-emerald-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full leading-none">
                              {item.badge}
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] sm:text-xs text-zinc-400 font-semibold mt-0.5 truncate">{item.description}</p>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-zinc-350 group-hover:text-zinc-600 transition-transform group-hover:translate-x-1" />
                  </button>
                );
              })}

              {/* Logout Block */}
              <button
                onClick={handleSecureLogout}
                className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-red-50/40 transition duration-150 cursor-pointer select-none group"
                id="menu-item-logout"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center text-red-600 transition duration-300 group-hover:scale-105">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-red-600">Logout Account Session</p>
                    <p className="text-[10px] sm:text-xs text-red-400 font-semibold mt-0.5">Securely close active keys and dispatch monitors</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-300 group-hover:text-red-500 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
};
