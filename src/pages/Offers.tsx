import React, { useState } from "react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { ProductCard } from "../components/ProductCard";
import { 
  Percent, Sparkles, Tag, Copy, Check, Gift, Landmark, CreditCard, Flame, Award, ArrowUpRight 
} from "lucide-react";

export const Offers: React.FC<{ onProductClick: (product: any) => void }> = ({ onProductClick }) => {
  const { coupons, products, addNotification } = useApp() as any;
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addNotification("Promo Copied", `Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const bankOffers = [
    {
      id: "bank-1",
      bank: "AXIS Bank",
      logo: "💳",
      title: "10% Instant Discount on Axis Cards",
      description: "Get up to ₹100 instant discount on Axis Debit & Credit Cards. Min order: ₹600",
      validUntil: "Valid till end of month",
      color: "border-red-100 bg-red-50/35 text-red-800"
    },
    {
      id: "bank-2",
      bank: "SBI Credit Card",
      logo: "🏦",
      title: "Save Flat ₹150 with SBI Cards",
      description: "Flat ₹150 discount on transaction value exceeding ₹1,200. Limited to once per card.",
      validUntil: "Valid on Friday & Weekends",
      color: "border-blue-100 bg-blue-50/35 text-blue-800"
    },
    {
      id: "bank-3",
      bank: "CRED Pay UPI",
      logo: "⚡",
      title: "Assured Cashback up to ₹250",
      description: "Pay using CRED Pay UPI on checkout to win assured cashbacks from ₹30 to ₹250.",
      validUntil: "No min order required",
      color: "border-purple-100 bg-purple-50/35 text-purple-800"
    },
    {
      id: "bank-4",
      bank: "Paytm Wallet",
      logo: "📱",
      title: "Flat ₹50 Paytm Wallet Cashback",
      description: "Pay using Paytm Wallet for first 3 orders of the month. Min order value: ₹499",
      validUntil: "Valid for pre-paid wallet",
      color: "border-sky-100 bg-sky-50/35 text-sky-800"
    }
  ];

  const activePromoCoupons = coupons || [];
  const flashSaleProducts = products.filter((p: any) => p.isFlashSale);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pb-24 space-y-10"
    >
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-[32px] p-6 sm:p-10 text-white shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-xl space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-yellow-300 font-extrabold text-xs uppercase tracking-wider animate-pulse">
            <Percent className="w-5 h-5" />
            <span>Super Saver Festival is Live!</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
            Deals, Vouchers & Cashback Hub
          </h1>
          <p className="text-zinc-100 text-xs sm:text-sm font-medium leading-relaxed">
            Stack discounts using our voucher codes, unlock flat banking discounts, and grab mega discounts on fresh flash sales running right now.
          </p>
        </div>
      </div>

      {/* Grid: Coupons & Referral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Promo Coupons (Left 2/3) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4.5 h-4.5 text-orange-500" />
              Active Promo Coupons ({activePromoCoupons.length})
            </h3>
            <span className="text-[10px] text-zinc-400 font-bold">Tap code to copy instantly</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePromoCoupons.map((coupon: any) => (
              <div 
                key={coupon.code}
                onClick={() => handleCopyCode(coupon.code)}
                className="group relative bg-gradient-to-br from-zinc-50 to-white hover:from-orange-50/20 border-2 border-dashed border-zinc-200 hover:border-orange-200 p-5 rounded-2xl cursor-pointer transition flex items-start gap-4"
              >
                {/* Left Percent Badge */}
                <div className="w-14 h-14 bg-orange-500 text-white rounded-xl flex flex-col items-center justify-center font-black flex-shrink-0 border border-orange-600/10 shadow-md">
                  <span className="text-sm">{coupon.discountPercent}%</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold">OFF</span>
                </div>

                {/* Info details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 tracking-wider">
                      {coupon.code}
                    </span>
                    <span className="text-[10px] text-zinc-450 font-bold">Min: ₹{coupon.minOrderValue}</span>
                  </div>
                  <p className="text-xs text-zinc-700 font-extrabold leading-relaxed">
                    {coupon.description}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-bold">
                    Applies automatically on checkout above threshold
                  </p>
                </div>

                {/* Floating copy check overlay */}
                {copiedCode === coupon.code && (
                  <div className="absolute inset-0 bg-orange-600/95 rounded-2xl flex items-center justify-center text-white text-xs font-black uppercase tracking-wider animate-in fade-in duration-100">
                    <Check className="w-4 h-4 mr-1.5 animate-bounce" />
                    Code Copied!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite and earn sidebar (Right 1/3) */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-4.5 h-4.5 text-emerald-600" />
              Referral Program
            </h3>
          </div>

          <div className="bg-gradient-to-b from-emerald-50 to-emerald-100/30 border border-emerald-100 p-6 rounded-[28px] space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                MEGA BONUSES
              </span>
              <h4 className="font-extrabold text-sm text-zinc-850">Earn ₹100 Free Wallet Funds</h4>
              <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                Gift your relatives or friends <strong>₹100 discount</strong>. Once they complete their first order, you instantly receive <strong>100 SuperPoints</strong> added to your profile!
              </p>
            </div>

            <div className="border border-emerald-200/50 rounded-2xl bg-white p-3.5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-zinc-450 uppercase">YOUR INVITE CODE</p>
                <p className="font-mono text-sm font-black text-emerald-800 tracking-wider">QUICK_SUBH_77</p>
              </div>
              <button 
                onClick={() => handleCopyCode("QUICK_SUBH_77")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition cursor-pointer"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Bank Cashback Partners (Section 2) */}
      <section className="space-y-5">
        <div className="pb-2 border-b border-zinc-100">
          <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-4.5 h-4.5 text-indigo-600" />
            Credit Card & Wallet Cashback Partners
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankOffers.map((offer) => (
            <div 
              key={offer.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-sm hover:translate-y-[-2px] transition-transform duration-300 ${offer.color}`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg">{offer.logo}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded border border-current">
                    {offer.bank}
                  </span>
                </div>
                <h4 className="text-xs font-black tracking-tight">{offer.title}</h4>
                <p className="text-[10px] opacity-80 leading-relaxed font-semibold">
                  {offer.description}
                </p>
              </div>
              <p className="text-[9px] font-extrabold opacity-70 italic">
                {offer.validUntil}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sale Product Highlight (Section 3) */}
      {flashSaleProducts.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4.5 h-4.5 text-red-500 animate-bounce" />
              Spotlight Flash Sales (Mega-Discounts)
            </h3>
            <span className="text-[10px] bg-red-600 text-white font-extrabold px-2.5 py-0.5 rounded-full animate-pulse uppercase">
              Limited Stock
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {flashSaleProducts.map((p: any) => (
              <ProductCard
                key={p.id}
                product={p}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        </section>
      )}

    </motion.div>
  );
};
