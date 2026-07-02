import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { CartDrawer } from "./components/CartDrawer";
import { ProductDetails } from "./components/ProductDetails";
import { UserProfileModal } from "./components/UserProfileModal";
import { LiveTracking } from "./components/LiveTracking";
import { AdminPanel } from "./components/AdminPanel";
import { DeliveryPartner } from "./components/DeliveryPartner";
import { SellerDashboard } from "./components/SellerDashboard";
import { CustomerSupportBubble } from "./components/CustomerSupportBubble";
import { BottomNavigation } from "./components/BottomNavigation";

// Modular Pages
import { Home } from "./pages/Home";
import { Categories } from "./pages/Categories";
import { BuyAgain } from "./pages/BuyAgain";
import { Offers } from "./pages/Offers";
import { Account } from "./pages/Account";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { OrdersPage } from "./pages/OrdersPage";
import { WishlistPage } from "./pages/WishlistPage";
import { WalletPage } from "./pages/WalletPage";
import { SupportPage } from "./pages/SupportPage";

import { 
  Check, ArrowRight, Zap, Apple, Award, Lock, User 
} from "lucide-react";

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, ensureAuthenticated } = useApp() as any;
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      ensureAuthenticated("access this secure page");
      navigate("/home", { replace: true });
    }
  }, [user, navigate, ensureAuthenticated]);

  if (!user) return null;
  return <>{children}</>;
};

const MainAppContent: React.FC = () => {
  const { cart, user, ensureAuthenticated, showLoginPrompt, setShowLoginPrompt, loginPromptReason } = useApp() as any;
  const navigate = useNavigate();
  const location = useLocation();

  const [viewRole, setViewRole] = useState<"customer" | "admin" | "delivery" | "seller">("customer");
  
  // Modal visibility states
  const [profileOpen, setProfileOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<"home" | "categories" | "buy-again" | "offers" | "account">("home");

  // Keep bottom tab active highlight state in sync with page interactions & url routes
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/categories")) {
      setBottomTab("categories");
    } else if (path.startsWith("/buy-again")) {
      setBottomTab("buy-again");
    } else if (path.startsWith("/offers")) {
      setBottomTab("offers");
    } else if (
      path.startsWith("/account") || 
      path.startsWith("/profile") || 
      path.startsWith("/orders") || 
      path.startsWith("/wishlist") || 
      path.startsWith("/wallet") || 
      path.startsWith("/support") || 
      path.startsWith("/login")
    ) {
      setBottomTab("account");
    } else {
      setBottomTab("home");
    }
  }, [location.pathname]);

  const handleBottomTabChange = (tab: "home" | "categories" | "buy-again" | "offers" | "account") => {
    if (tab === "home") {
      navigate("/home");
    } else {
      navigate(`/${tab}`);
    }
  };

  // Premium splash and onboarding state
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("quicknow_onboarding_completed") !== "true";
  });
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Modal visibility states
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [activeProductDetail, setActiveProductDetail] = useState<any | null>(null);
  const [activeTrackOrderId, setActiveTrackOrderId] = useState<string | null>(null);

  // Global search trigger from Header
  const handleGlobalSearch = React.useCallback((term: string) => {
    const currentParams = new URLSearchParams(location.search);
    const existingSearch = currentParams.get("search") || "";
    
    if (term.trim()) {
      if (existingSearch !== term.trim()) {
        navigate(`/categories?search=${encodeURIComponent(term.trim())}`);
      }
    } else if (location.pathname === "/categories") {
      // If cleared and on categories page, remove search query
      if (existingSearch !== "") {
        const currentCategory = currentParams.get("category") || "";
        navigate(`/categories${currentCategory ? `?category=${currentCategory}` : ""}`);
      }
    }
  }, [navigate, location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans transition-colors duration-200">
      
      {/* 🌟 PREMIUM BRAND SPLASH SCREEN OVERLAY */}
      {showSplash && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="text-center space-y-6 max-w-sm px-6">
            <div className="relative inline-flex items-center justify-center">
              {/* Outer glowing ring */}
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 to-emerald-500 rounded-full blur-2xl opacity-40 animate-pulse" />
              <div className="relative w-28 h-28 bg-gradient-to-tr from-yellow-400 to-emerald-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-emerald-500/10 border-4 border-white transform rotate-6 animate-bounce">
                <span className="font-sans text-5xl font-black text-white select-none tracking-tighter">Q!</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
                Quick<span className="text-emerald-600">Now</span>
              </h1>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Instant 10-Minute Grocery Delivery</p>
            </div>

            <div className="pt-4 flex flex-col items-center gap-2">
              <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full animate-infinite-loading w-1/2" />
              </div>
              <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest animate-pulse">Initializing Dark Stores...</span>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 WORLD-CLASS PREMIUM ONBOARDING SLIDERS */}
      {!showSplash && showOnboarding && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md z-[9998] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-zinc-100 overflow-hidden flex flex-col relative transform animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Skip Button */}
            <button
              onClick={() => {
                localStorage.setItem("quicknow_onboarding_completed", "true");
                setShowOnboarding(false);
              }}
              className="absolute top-5 right-5 text-xs font-bold text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 rounded-full transition cursor-pointer z-10 animate-pulse"
            >
              Skip
            </button>

            {/* Content Body */}
            <div className="p-8 sm:p-10 flex-1 flex flex-col items-center text-center space-y-6">
              
              {/* Illustration Ring */}
              <div className="relative pt-4">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl opacity-55 animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-tr from-yellow-400/20 to-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-500/10">
                  {onboardingStep === 0 && <Zap className="w-12 h-12 text-amber-500 animate-bounce" />}
                  {onboardingStep === 1 && <Apple className="w-12 h-12 text-emerald-600 animate-pulse" />}
                  {onboardingStep === 2 && <Award className="w-12 h-12 text-emerald-600 animate-spin" />}
                </div>
              </div>

              {/* Title and Descriptions */}
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                  {onboardingStep === 0 && "Instant 10-Min Groceries"}
                  {onboardingStep === 1 && "Pure Certified Organic"}
                  {onboardingStep === 2 && "Daily Cashback & Savings"}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium px-2">
                  {onboardingStep === 0 && "Your daily staples, organic veggies, and fresh dairy delivered in 10 minutes flat from certified local dark stores."}
                  {onboardingStep === 1 && "Direct partnership with certified farmers guarantees handpicked premium quality, pesticide-free apples, greens, and fresh milk."}
                  {onboardingStep === 2 && "Unlock guaranteed cashbacks, win daily brand discount coupons, and enjoy zero delivery charges on your first three orders!"}
                </p>
              </div>

              {/* Step indicator dots */}
              <div className="flex gap-2 justify-center pt-2">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setOnboardingStep(idx)}
                    className={`h-2 rounded-full transition-all duration-350 cursor-pointer ${
                      onboardingStep === idx ? "w-8 bg-emerald-600" : "w-2 bg-zinc-200"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Action */}
              <div className="w-full pt-4">
                {onboardingStep < 2 ? (
                  <button
                    onClick={() => setOnboardingStep(onboardingStep + 1)}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      localStorage.setItem("quicknow_onboarding_completed", "true");
                      setShowOnboarding(false);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <span>Enter QuickNow Hub</span>
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

            {/* Bottom Accent strip */}
            <div className="h-2 bg-gradient-to-r from-yellow-400 via-emerald-500 to-teal-500" />
          </div>
        </div>
      )}

      {/* Dynamic Floating Tracking Bar if any order is active */}
      {viewRole === "customer" && (
        <div className="bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span>Premium Quick-Commerce active in Kolkata & NCR. Average dispatch time: 10 mins.</span>
          </div>
          <button 
            onClick={() => navigate("/account")}
            className="underline hover:text-emerald-100 font-black tracking-tight cursor-pointer"
          >
            Track Past Orders
          </button>
        </div>
      )}

      {/* Main header block */}
      <Header
        onCartOpen={() => {
          if (ensureAuthenticated("view your cart")) {
            setCartDrawerOpen(true);
          }
        }}
        onWishlistOpen={() => {
          if (ensureAuthenticated("view your wishlist")) {
            navigate("/wishlist");
          }
        }}
        onProfileOpen={() => {
          if (ensureAuthenticated("view your profile")) {
            navigate("/profile");
          }
        }}
        setViewRole={(role) => {
          setViewRole(role);
          if (role === "customer") {
            navigate("/home");
          }
        }}
        currentViewRole={viewRole}
        onSearch={handleGlobalSearch}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW: Admin Portal */}
        {viewRole === "admin" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            <AdminPanel />
          </div>
        )}

        {/* VIEW: Rider Portal */}
        {viewRole === "delivery" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            <DeliveryPartner />
          </div>
        )}

        {/* VIEW: Seller Portal */}
        {viewRole === "seller" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            <SellerDashboard />
          </div>
        )}

        {/* VIEW: Customer Landing (Proper Routes) */}
        {viewRole === "customer" && (
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="min-h-[60vh]"
          >
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home onProductClick={setActiveProductDetail} />} />
              <Route path="/categories" element={<Categories onProductClick={setActiveProductDetail} />} />
              <Route path="/buy-again" element={
                <ProtectedRoute>
                  <BuyAgain onProductClick={setActiveProductDetail} />
                </ProtectedRoute>
              } />
              <Route path="/offers" element={<Offers onProductClick={setActiveProductDetail} />} />
              <Route path="/account" element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/wishlist" element={
                <ProtectedRoute>
                  <WishlistPage onProductClick={setActiveProductDetail} />
                </ProtectedRoute>
              } />
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <WalletPage />
                </ProtectedRoute>
              } />
              <Route path="/support" element={
                <ProtectedRoute>
                  <SupportPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </motion.div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 border-t border-zinc-800 py-12 mt-16 text-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xl italic">Q</span>
              </div>
              <div>
                <span className="text-lg font-extrabold text-white tracking-tight">
                  Quick<span className="text-emerald-500">Now</span>
                </span>
                <span className="block text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                  10 MINS COURIERS
                </span>
              </div>
            </div>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              QuickNow is a premium hyper-local grocery delivery platform. Fresh organic fruits, dairy bakeries, staples & household cleansers delivered at your door step in 10 minutes.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-white font-black text-xs uppercase tracking-wider">Useful Links</p>
            <ul className="space-y-1.5">
              <li><button onClick={() => navigate("/categories")} className="hover:text-emerald-400 cursor-pointer">All Products</button></li>
              <li><button onClick={() => { setViewRole("admin"); }} className="hover:text-emerald-400 cursor-pointer">Admin Control Desk</button></li>
              <li><button onClick={() => { setViewRole("delivery"); }} className="hover:text-emerald-400 cursor-pointer">Rider Captain Hub</button></li>
              <li><button onClick={() => navigate("/account")} className="hover:text-emerald-400 cursor-pointer">Order Tracking Dashboard</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-white font-black text-xs uppercase tracking-wider">Hyper-local Sectors</p>
            <ul className="space-y-1.5 text-zinc-500 text-[11px]">
              <li>Sector 5, Salt Lake, Kolkata</li>
              <li>New Town, Action Area 1 & 2</li>
              <li>Cyber City, Gurugram Phase 2</li>
              <li>Chanakyapuri, New Delhi</li>
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-white font-black text-xs uppercase tracking-wider">Subscribe to newsletter</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email..."
                className="flex-1 bg-zinc-800 border border-zinc-700 px-3.5 py-2 text-xs rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
              <button 
                onClick={() => alert("Subscribed successfully!")}
                className="bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Join
              </button>
            </div>
            <p className="text-[10px] text-zinc-600">© 2026 QuickNow Technologies Limited. All Rights Reserved.</p>
          </div>

        </div>
      </footer>

      {/* Floating cart drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onOrderPlaced={(id) => {
          setCartDrawerOpen(false);
          setActiveTrackOrderId(id);
          navigate("/account"); // Automatically focus order history tab to watch real-time flow!
        }}
      />

      {/* Floating Product Details */}
      {activeProductDetail && (
        <ProductDetails
          product={activeProductDetail}
          onClose={() => setActiveProductDetail(null)}
        />
      )}

      {/* Floating Profile/Rewards */}
      <UserProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onTrackOrder={(id) => {
          setActiveTrackOrderId(id);
        }}
        onReplayOnboarding={() => {
          setShowOnboarding(true);
          setOnboardingStep(0);
        }}
      />

      {/* Floating Live order tracking timeline */}
      {activeTrackOrderId && (
        <LiveTracking
          orderId={activeTrackOrderId}
          onClose={() => setActiveTrackOrderId(null)}
        />
      )}

      {/* Floating Customer Support Live Chat & Tickets Widget */}
      {viewRole === "customer" && (
        <CustomerSupportBubble />
      )}

      {/* Persistent fixed bottom tab bar on mobile */}
      {viewRole === "customer" && (
        <BottomNavigation 
          activeTab={bottomTab} 
          onChangeTab={handleBottomTabChange} 
          cartCount={cart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)} 
        />
      )}

      {/* 🔒 LOGIN REQUIRED POPUP MODAL */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-6 max-w-sm w-full text-center space-y-6 border border-zinc-100 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Login Required</h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                To {loginPromptReason || "access this secure feature"}, you must be signed in. Please log in to complete your purchase!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black text-xs rounded-xl transition cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate("/login");
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition cursor-pointer select-none shadow-lg shadow-blue-500/20"
              >
                Sign In Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <MainAppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
