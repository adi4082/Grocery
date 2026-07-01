import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { CategoryList } from "./components/CategoryList";
import { ProductCard } from "./components/ProductCard";
import { CartDrawer } from "./components/CartDrawer";
import { ProductDetails } from "./components/ProductDetails";
import { UserProfileModal } from "./components/UserProfileModal";
import { LiveTracking } from "./components/LiveTracking";
import { AdminPanel } from "./components/AdminPanel";
import { DeliveryPartner } from "./components/DeliveryPartner";
import { SellerDashboard } from "./components/SellerDashboard";
import { CustomerSupportBubble } from "./components/CustomerSupportBubble";
import { BuyAgainCarousel } from "./components/BuyAgainCarousel";
import { 
  Check, ArrowRight, ShieldCheck, HelpCircle, Phone, Mail, 
  MapPin, Sparkles, Star, ChevronDown, ChevronUp, Layers, AlertCircle, ShoppingCart,
  Smartphone, Award, Percent, Zap, Apple, Store
} from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How does QuickNow deliver in 10 minutes flat?",
    a: "We utilize hyper-local fulfillment branches (dark stores) strategically mapped across city sectors. Our inventories are fully integrated with AI, enabling our riders to pick, pack, and dispatch your groceries in less than 2 minutes."
  },
  {
    q: "Is there a minimum order threshold?",
    a: "No! There is no minimum cart value. You can order as little as a single lime. However, flat delivery fee of ₹25 is waived entirely for orders exceeding ₹499."
  },
  {
    q: "Are the fresh fruits and vegetables truly organic?",
    a: "Yes! All fruits and green vegetables are farm-sourced from certified organic partners, thoroughly washed in ozone-purified water, chilled, and packed immediately in biodegradable crates."
  },
  {
    q: "What payment gateways are supported?",
    a: "We support cash on delivery (COD) and instantaneous UPI scans (GPay, PhonePe, Paytm) via our secure sandbox transaction screens."
  }
];

const CUSTOMER_REVIEWS = [
  {
    name: "Shreya Mukherjee",
    role: "Premium Home Cook",
    rating: 5,
    comment: "The organic Hass avocado arrived perfectly chilled and ready to slice! Sourdough bread is crisp and fresh. QuickNow has completely replaced my weekly market visits."
  },
  {
    name: "Dr. Anirban Roy",
    role: "Health & Fitness Coach",
    rating: 5,
    comment: "I got fresh spinach and cold-pressed orange juice in literally 8 minutes flat! Incredible hygiene standards and very polite delivery captain. Simply unmatched."
  },
  {
    name: "Meera Nair",
    role: "Busy Tech Professional",
    rating: 4.8,
    comment: "The smart search and AI recommended items saved me so much time. It bundled pasta sauces with organic cherry tomatoes automatically. Fantastic interface!"
  }
];

const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 120, 
      damping: 18 
    } 
  }
};

const MainAppContent: React.FC = () => {
  const { 
    products, cart, wishlist, language, aiRecommendations, aiReasoning, user 
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewRole, setViewRole] = useState<"customer" | "admin" | "delivery" | "seller">("customer");
  
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
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeProductDetail, setActiveProductDetail] = useState<any | null>(null);
  const [activeTrackOrderId, setActiveTrackOrderId] = useState<string | null>(null);

  // FAQ Accordion toggles
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: "", email: "", msg: "" });
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactForm({ name: "", email: "", msg: "" });
    setTimeout(() => setContactSuccess(false), 4000);
  };

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = searchTerm 
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const categoriesToRender = [
    { id: "fruits-veg", title: "Fresh Fruits & Vegetables" },
    { id: "grocery-staples", title: "Premium Grocery & Staples" },
    { id: "dairy-bread", title: "Dairy & Morning Bakeries" },
    { id: "snacks-munchies", title: "Snacks & Quick Munchies" },
    { id: "beverages", title: "Hydrating Juices & Beverages" },
    { id: "personal-care", title: "Personal Care Essentials" },
    { id: "household", title: "Household & Cleaners" }
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans transition-colors duration-200">
      
      {/* 🌟 PREMIUM BRAND SPLASH SCREEN OVERLAY */}
      {showSplash && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="text-center space-y-6 max-w-sm px-6">
            <div className="relative inline-flex items-center justify-center">
              {/* Outer double glowing rings */}
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 to-emerald-500 rounded-full blur-2xl opacity-40 animate-pulse" />
              <div className="relative w-28 h-28 bg-gradient-to-tr from-yellow-400 to-emerald-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-emerald-500/10 border-4 border-white transform rotate-6 hover:rotate-0 transition-transform duration-300 animate-bounce">
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
            <span>Premium Quick-Commerce active in Kolkata & NCR. average dispatch time: 10 mins.</span>
          </div>
          <button 
            onClick={() => setProfileOpen(true)}
            className="underline hover:text-emerald-100 font-black tracking-tight"
          >
            Track Past Orders
          </button>
        </div>
      )}

      {/* Main header block */}
      <Header
        onCartOpen={() => setCartDrawerOpen(true)}
        onWishlistOpen={() => {
          setSelectedCategory("");
          setSearchTerm("");
          setProfileOpen(true);
        }}
        onProfileOpen={() => setProfileOpen(true)}
        setViewRole={setViewRole}
        currentViewRole={viewRole}
        onSearch={setSearchTerm}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        
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

        {/* VIEW: Customer Landing */}
        {viewRole === "customer" && (
          <div className="space-y-12 animate-in fade-in duration-200">
            
            {/* Quick Category filter buttons */}
            <CategoryList
              selectedCategory={selectedCategory}
              onSelectCategory={(id) => {
                setSelectedCategory(id);
                setSearchTerm("");
              }}
            />



            {/* Buy Again horizontal carousel */}
            {!selectedCategory && !searchTerm && (
              <BuyAgainCarousel onProductClick={setActiveProductDetail} />
            )}

            {/* AI smart recommendations section based on user's active cart */}
            {aiRecommendations.length > 0 && (
              <section className="bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-teal-500/5 border border-emerald-500/10 p-6 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-emerald-700 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                      🤖 AI Smart Recommendations
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-bold mt-0.5">
                      {aiReasoning}
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-500 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                    Gemini AI Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {aiRecommendations.slice(0, 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onProductClick={setActiveProductDetail}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Flash Sale Grid (If no filtering active) */}
            {!selectedCategory && !searchTerm && (
              <section className="space-y-4">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-1.5">
                  <span className="w-2.5 h-6 bg-amber-500 rounded-full" />
                  ⚡ Quick Flash Sale - Flat Discounts
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {products
                    .filter((p) => p.isFlashSale)
                    .slice(0, 4)
                    .map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onProductClick={setActiveProductDetail}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* Catalog Grid View */}
            {(selectedCategory || searchTerm) ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-500" />
                    <span>Filtered Catalog Results ({filteredProducts.length})</span>
                  </h3>
                  {(selectedCategory || searchTerm) && (
                    <button
                      onClick={() => {
                        setSelectedCategory("");
                        setSearchTerm("");
                      }}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-zinc-200 rounded-3xl bg-white space-y-3">
                    <AlertCircle className="w-10 h-10 text-zinc-300 mx-auto" />
                    <p className="text-xs text-zinc-500 font-bold">No products match your active search terms.</p>
                  </div>
                ) : (
                  <motion.div 
                    variants={gridContainerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                  >
                    {filteredProducts.map((p) => (
                      <motion.div key={p.id} variants={gridItemVariants}>
                        <ProductCard
                          product={p}
                          onProductClick={setActiveProductDetail}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </section>
            ) : (
              // Multi-row category segments (Fruits, Staples, Dairy, etc.)
              <div className="space-y-12">
                {categoriesToRender.map((catSpec) => {
                  const catProducts = products.filter((p) => p.category === catSpec.id);
                  if (catProducts.length === 0) return null;

                  return (
                    <section key={catSpec.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
                          <span className="w-2.5 h-6 bg-emerald-500 rounded-full" />
                          {catSpec.title}
                        </h3>
                        <button
                          onClick={() => setSelectedCategory(catSpec.id)}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                        >
                          <span>See All</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <motion.div 
                        variants={gridContainerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4"
                      >
                        {catProducts.slice(0, 5).map((p) => (
                          <motion.div key={p.id} variants={gridItemVariants}>
                            <ProductCard
                              product={p}
                              onProductClick={setActiveProductDetail}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    </section>
                  );
                })}
              </div>
            )}

            {/* Section: Customer reviews */}
            <section className="bg-zinc-50 rounded-3xl p-6 sm:p-10 border border-zinc-100 space-y-8">
              <div className="text-center space-y-1.5">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-emerald-600">CUSTOMER TRUST</h3>
                <h4 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">What Our Customers Say</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CUSTOMER_REVIEWS.map((rev, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-100 space-y-4 flex flex-col justify-between">
                    <p className="text-xs text-zinc-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {rev.name[0]}
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-zinc-900">{rev.name}</h5>
                        <p className="text-[10px] text-zinc-400 font-bold">{rev.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: FAQ Accordion */}
            <section className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-lg sm:text-xl font-black text-center text-zinc-900">Frequently Asked Questions</h3>
              
              <div className="space-y-3">
                {FAQ_ITEMS.map((faq, idx) => (
                  <div 
                    key={idx} 
                    className="border border-zinc-200 rounded-2xl bg-white overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-zinc-800 hover:bg-zinc-50 transition"
                    >
                      <span>{faq.q}</span>
                      {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </button>
                    
                    {openFaqIndex === idx && (
                      <div className="px-5 pb-4 pt-1 text-xs text-zinc-500 leading-relaxed border-t border-zinc-50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Contact & Support */}
            <section className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 sm:p-10 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8 shadow-xl shadow-emerald-500/10">
              <div className="space-y-4 flex flex-col justify-center">
                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase self-start">
                  SUPPORT ASSISTANCE
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">Need help with an order? Contact Support</h3>
                <p className="text-zinc-100 text-xs sm:text-sm font-medium">
                  Our hyper-local assistance staff is active 24/7. Reach out for replacements, cancellations, or delivery inquiries.
                </p>

                <div className="space-y-2 pt-2 text-xs font-semibold">
                  <p className="flex items-center gap-2"><Phone className="w-4.5 h-4.5 text-amber-300" /> +91 98765 43210</p>
                  <p className="flex items-center gap-2"><Mail className="w-4.5 h-4.5 text-amber-300" /> support@quicknow.com</p>
                  <p className="flex items-center gap-2"><MapPin className="w-4.5 h-4.5 text-amber-300" /> Sector 5, Salt Lake City, West Bengal</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleContactSubmit} className="bg-white rounded-2xl p-5 sm:p-6 text-zinc-900 space-y-4 shadow-xl">
                <p className="font-extrabold text-sm">Send us a direct message</p>
                
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Your Message</label>
                    <textarea
                      required
                      rows={2}
                      value={contactForm.msg}
                      onChange={(e) => setContactForm({ ...contactForm, msg: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                {contactSuccess && (
                  <p className="text-[11px] text-emerald-600 font-extrabold text-center">
                    🎉 Message sent successfully! Support team will email you soon.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl transition uppercase"
                >
                  Send Message
                </button>
              </form>
            </section>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 border-t border-zinc-800 py-12 mt-16 text-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 cursor-pointer">
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
              <li><button onClick={() => setSelectedCategory("")} className="hover:text-emerald-400">All Products</button></li>
              <li><button onClick={() => { setViewRole("admin"); }} className="hover:text-emerald-400">Admin Control Desk</button></li>
              <li><button onClick={() => { setViewRole("delivery"); }} className="hover:text-emerald-400">Rider Captain Hub</button></li>
              <li><button onClick={() => setProfileOpen(true)} className="hover:text-emerald-400">Order Tracking Dashboard</button></li>
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

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
