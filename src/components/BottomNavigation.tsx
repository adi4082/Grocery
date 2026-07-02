import React from "react";
import { motion } from "motion/react";
import { Home, Layers, RefreshCw, Percent, User } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "home" | "categories" | "buy-again" | "offers" | "account";
  onChangeTab: (tab: "home" | "categories" | "buy-again" | "offers" | "account") => void;
  cartCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onChangeTab,
  cartCount
}) => {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "categories", label: "Categories", icon: Layers },
    { id: "buy-again", label: "Buy Again", icon: RefreshCw },
    { id: "offers", label: "Offers", icon: Percent },
    { id: "account", label: "Account", icon: User }
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-md border-t border-zinc-100 z-50 py-2 px-4 shadow-lg flex justify-around items-center sm:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className="flex flex-col items-center justify-center relative py-1 px-3 rounded-xl transition-all duration-300 cursor-pointer select-none active:scale-95"
            id={`nav-tab-${tab.id}`}
          >
            {/* Animated Background Pill */}
            {isActive && (
              <motion.div
                layoutId="activeBottomTab"
                className="absolute inset-0 bg-emerald-50 rounded-2xl -z-10 border border-emerald-100/50"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}

            {/* Icon Wrapper */}
            <div className="relative">
              <Icon 
                className={`w-5 h-5 transition-all duration-300 ${
                  isActive ? "text-emerald-600 scale-110" : "text-zinc-400 hover:text-zinc-600"
                }`} 
              />
              
              {/* Specialized notification dot for Buy Again or Cart */}
              {tab.id === "buy-again" && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </div>

            {/* Label */}
            <span 
              className={`text-[9px] font-black mt-1 transition-colors duration-300 ${
                isActive ? "text-emerald-700" : "text-zinc-400"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
