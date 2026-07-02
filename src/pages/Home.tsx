import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryList } from "../components/CategoryList";
import { BuyAgainCarousel } from "../components/BuyAgainCarousel";
import { ProductCard } from "../components/ProductCard";
import { 
  Sparkles, Flame, Percent, ChevronUp, ChevronDown, Phone, Mail, MapPin, ArrowRight,
  Star, Layers, ShieldCheck, HelpCircle, Sparkle, Gift, Copy, Check, Share2
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

interface HomeProps {
  onProductClick: (product: any) => void;
}

export const Home: React.FC<HomeProps> = ({ onProductClick }) => {
  const navigate = useNavigate();
  const { 
    products, aiRecommendations, aiReasoning, homepageSections 
  } = useApp() as any;

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", msg: "" });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const { addNotification } = useApp() as any;

  const handleCopyReferral = () => {
    setCopiedReferral(true);
    navigator.clipboard.writeText("QUICK_SUBH_77");
    if (addNotification) {
      addNotification("Referral Code Copied", "Share QUICK_SUBH_77 with your friends!");
    }
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Hey! Use my referral code QUICK_SUBH_77 to sign up on QuickNow and get flat ₹100 off on your first order! Download here: https://quicknow.com`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactForm({ name: "", email: "", msg: "" });
    setTimeout(() => setContactSuccess(false), 4000);
  };

  // Helper to filter products specifically for each dynamic row
  const getSectionProducts = (section: any) => {
    const cid = section.categoryId;
    const title = section.title.toLowerCase();
    
    let filtered = products.filter((p: any) => p.category === cid);
    if (filtered.length === 0) {
      filtered = products.filter((p: any) => p.category === section.id || p.category.includes(section.id));
    }
    
    if (title.includes("vegetable")) {
      filtered = products.filter((p: any) => p.category === "fruits-veg" && 
        /onion|potato|spinach|tomato|chilli|ginger|garlic|vegetable|mushroom|brocolli/i.test(p.name)
      );
    } else if (title.includes("fruit")) {
      filtered = products.filter((p: any) => p.category === "fruits-veg" && 
        /apple|banana|avocado|orange|mango|kiwi|cherry|berry|grape/i.test(p.name)
      );
    } else if (title.includes("rice")) {
      filtered = products.filter((p: any) => p.category === "grocery-staples" && /rice/i.test(p.name));
    } else if (title.includes("dal") || title.includes("lentil")) {
      filtered = products.filter((p: any) => p.category === "grocery-staples" && /dal|lentil|pulse/i.test(p.name));
    } else if (title.includes("oil") || title.includes("ghee")) {
      filtered = products.filter((p: any) => p.category === "grocery-staples" && /oil|ghee/i.test(p.name));
    } else if (title.includes("dairy") || title.includes("milk")) {
      filtered = products.filter((p: any) => p.category === "dairy-bread" && /milk|butter|cheese|yogurt|paneer|curd/i.test(p.name));
    }
    
    return filtered.length > 0 ? filtered : products.filter((p: any) => p.category === cid).slice(0, 8);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-12 pb-16"
    >
      {/* Featured Categories (Top Category Rail) */}
      <div className="pt-2">
        <CategoryList
          selectedCategory=""
          onSelectCategory={(id) => {
            navigate(`/categories?category=${id}`);
          }}
        />
      </div>

      {/* Hero Interactive Banner Carousel */}
      <HeroBanner onSelectCategory={(id) => {
        navigate(`/categories?category=${id}`);
      }} />

      {/* Buy Again Quick Carousel */}
      <BuyAgainCarousel onProductClick={onProductClick} />

      {/* AI Smart Recommendations Section */}
      {aiRecommendations && aiRecommendations.length > 0 && (
        <section className="bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-teal-500/5 border border-emerald-500/10 p-6 rounded-[28px] space-y-4">
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
            {aiRecommendations.slice(0, 4).map((p: any) => (
              <ProductCard
                key={p.id}
                product={p}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Homepage Rows (Catalog Row Segments) */}
      <div className="space-y-12">
        {(homepageSections && homepageSections.filter((s: any) => s.isVisible !== false).length > 0
          ? [...homepageSections].filter((s: any) => s.isVisible !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          : [
              { id: "fruits-veg", title: "Fresh Vegetables", categoryId: "fruits-veg" },
              { id: "fruits-veg-2", title: "Sweet Fruits", categoryId: "fruits-veg" },
              { id: "grocery-staples", title: "Premium Grocery & Staples", categoryId: "grocery-staples" },
              { id: "dairy-bread", title: "Dairy & Morning Bakeries", categoryId: "dairy-bread" },
              { id: "snacks-munchies", title: "Snacks & Quick Munchies", categoryId: "snacks-munchies" },
              { id: "beverages", title: "Hydrating Juices & Beverages", categoryId: "beverages" },
              { id: "personal-care", title: "Personal Care Essentials", categoryId: "personal-care" },
              { id: "household", title: "Household & Cleaners", categoryId: "household" }
            ]
        ).map((catSpec: any) => {
          const catProducts = getSectionProducts(catSpec);
          if (catProducts.length === 0) return null;

          return (
            <section key={catSpec.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                  {catSpec.title}
                </h3>
                <button
                  onClick={() => {
                    navigate(`/categories?category=${catSpec.categoryId || catSpec.id}`);
                  }}
                  className="text-xs font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full flex items-center gap-0.5 transition cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontally scrollable product card row */}
              <div className="relative group/track">
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
                  {catProducts.map((p: any) => (
                    <div key={p.id} className="w-[170px] sm:w-[200px] flex-shrink-0 snap-start">
                      <ProductCard
                        product={p}
                        onProductClick={onProductClick}
                      />
                    </div>
                  ))}
                </div>
                {/* Soft visual left/right fade masks */}
                <div className="absolute left-0 top-0 bottom-4 w-6 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-4 w-6 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
              </div>
            </section>
          );
        })}
      </div>

      {/* Customer Trust Reviews Module */}
      <section className="bg-zinc-50 rounded-[32px] p-6 sm:p-10 border border-zinc-100 space-y-8">
        <div className="text-center space-y-1.5">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-600">CUSTOMER TRUST</h3>
          <h4 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">What Our Customers Say</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CUSTOMER_REVIEWS.map((rev, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-100 space-y-4 flex flex-col justify-between shadow-sm hover:border-zinc-200 transition">
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

      {/* Frequently Asked Questions */}
      <section className="max-w-3xl mx-auto space-y-6">
        <h3 className="text-lg sm:text-xl font-black text-center text-zinc-900">Frequently Asked Questions</h3>
        
        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, idx) => (
            <div 
              key={idx} 
              className="border border-zinc-200 rounded-2xl bg-white overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-zinc-800 hover:bg-zinc-50 transition"
              >
                <span>{faq.q}</span>
                {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>
              
              {openFaqIndex === idx && (
                <div className="px-5 pb-4 pt-1 text-xs text-zinc-500 leading-relaxed border-t border-zinc-50 animate-in slide-in-from-top-1">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Support form */}
      <section className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 sm:p-10 rounded-[32px] grid grid-cols-1 md:grid-cols-2 gap-8 shadow-xl shadow-emerald-500/10">
        <div className="space-y-4 flex flex-col justify-center">
          <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase self-start">
            SUPPORT ASSISTANCE
          </span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">Need help with an order? Contact Support</h3>
          <p className="text-zinc-100 text-xs sm:text-sm font-medium">
            Our hyper-local assistance staff is active 24/7. Reach out for replacements, cancellations, or delivery inquiries.
          </p>

          <div className="space-y-2 pt-2 text-xs font-semibold">
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-300" /> +91 98765 43210</p>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-amber-300" /> support@quicknow.com</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-300" /> Sector 5, Salt Lake City, West Bengal</p>
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
                type="type"
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
                className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none resize-none"
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
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl transition uppercase cursor-pointer"
          >
            Send Message
          </button>
        </form>
      </section>

      {/* Invite & Earn Premium Section */}
      <section className="bg-gradient-to-br from-indigo-900 via-zinc-900 to-emerald-950 text-white rounded-[32px] p-6 sm:p-10 border border-zinc-800 space-y-8 relative overflow-hidden shadow-2xl">
        {/* Abstract design blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold text-xs uppercase tracking-wider rounded-full border border-emerald-500/20">
              <Gift className="w-4 h-4 animate-bounce" />
              <span>REFER & EARN CASHBACK</span>
            </div>
            
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Invite friends & earn flat <span className="text-emerald-400">₹100 cashback</span> reward!
            </h3>
            
            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-md">
              Share the magic of 10-minute grocery delivery. Gift your friends <strong className="text-white">₹100 off</strong> on their first lightning order, and get <strong className="text-emerald-400">100 SuperPoints (worth ₹100)</strong> instantly credited to your wallet when they buy!
            </p>

            <div className="space-y-2 pt-2">
              <p className="text-xs text-zinc-400 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Your friend gets ₹100 free credit instantly
              </p>
              <p className="text-xs text-zinc-400 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> You get ₹100 added to your wallet on first purchase
              </p>
              <p className="text-xs text-zinc-400 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Unlimited referrals — earn as much as you invite!
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="text-center md:text-left">
              <p className="text-[11px] text-zinc-400 font-black uppercase tracking-widest">YOUR PERSONAL REFERRAL CODE</p>
              <div className="mt-3 flex items-center justify-between bg-zinc-950/60 border border-white/10 rounded-xl p-2 gap-4">
                <span className="font-mono text-base sm:text-lg font-black text-emerald-400 uppercase tracking-widest pl-3 select-all">
                  QUICK_SUBH_77
                </span>
                <button
                  onClick={handleCopyReferral}
                  className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  {copiedReferral ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWhatsAppShare}
                className="py-3 bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white font-black text-xs rounded-xl transition uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleCopyReferral}
                className="py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-black text-xs rounded-xl transition uppercase flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>Invite Friends</span>
              </button>
            </div>

            <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
              *By sharing, you agree to our referral program terms & conditions. Rewards are credited only after your friend's order is successfully delivered.
            </p>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
