import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { 
  Wallet, Sparkles, ArrowLeft, Loader2, DollarSign, Award, ArrowUpRight, HelpCircle, ShieldAlert
} from "lucide-react";

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, walletBalance, loyaltyPoints, addWalletFunds, redeemPoints, addNotification 
  } = useApp() as any;

  // Redirection guard - if not logged in, go to /login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(true);
  const [fundingAmount, setFundingAmount] = useState("200");
  const [adding, setAdding] = useState(false);

  // Loading animation simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  const handleAddFunds = () => {
    const amt = parseFloat(fundingAmount);
    if (!isNaN(amt) && amt > 0) {
      setAdding(true);
      setTimeout(() => {
        addWalletFunds(amt);
        setAdding(false);
        setFundingAmount("200");
      }, 600);
    } else {
      addNotification("Invalid Amount", "Please input a positive numeric value.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-4xl mx-auto pb-24 px-4 pt-4"
      id="wallet-page-root"
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
            <Wallet className="w-5 h-5 text-blue-600" />
            Wallet & Loyalty SuperPoints
          </h1>
          <p className="text-xs text-zinc-400 font-semibold">Unify micro-payments, credit refund vouchers, and track reward tokens.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-zinc-400 font-extrabold uppercase tracking-widest">Opening Secure Vault...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Stat Boxes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Wallet Balance Box */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[32px] p-6 sm:p-8 space-y-5 shadow-lg shadow-blue-600/10 relative overflow-hidden select-none">
              {/* Subtle design element */}
              <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-blue-100">QuickWallet Balance</span>
                <Wallet className="w-5 h-5 text-blue-100" />
              </div>
              
              <div className="space-y-1">
                <p className="text-4xl font-black font-mono tracking-tight">₹{walletBalance}</p>
                <p className="text-[10px] text-blue-200/90 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  100% SECURE SANDBOX ESCROW ACTIVE
                </p>
              </div>

              {/* Add funds simulation input group */}
              <div className="pt-3 border-t border-white/15 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-200 block">Top-up Balance (Sandbox simulation)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-zinc-300 text-xs font-bold font-mono">₹</span>
                    <input
                      type="number"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      placeholder="Amt..."
                      className="w-full pl-6 pr-3 py-2.5 bg-white/15 border border-white/10 rounded-xl text-white placeholder-zinc-300 text-xs font-black focus:outline-none focus:bg-white/20 focus:border-white/20 transition"
                    />
                  </div>
                  <button
                    onClick={handleAddFunds}
                    disabled={adding}
                    className="px-5 bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-350 text-zinc-950 font-black text-xs rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                  >
                    {adding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <DollarSign className="w-3.5 h-3.5" />
                        ADD FUNDS
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Loyalty Points Redeem Box */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-[32px] p-6 sm:p-8 shadow-lg shadow-emerald-600/10 relative overflow-hidden select-none flex flex-col justify-between">
              {/* Subtle design element */}
              <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-100 font-semibold">Loyalty Rewards Desk</span>
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              
              <div className="space-y-1 my-4">
                <p className="text-4xl font-black font-mono tracking-tight">{loyaltyPoints} Points</p>
                <p className="text-[10px] text-emerald-200/90 font-bold">Redeem 100 Points for ₹50 instant QuickWallet balance!</p>
              </div>

              <div className="pt-3 border-t border-white/15">
                <button
                  onClick={redeemPoints}
                  disabled={loyaltyPoints < 100}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition duration-200 flex items-center justify-center gap-1.5 ${
                    loyaltyPoints >= 100 
                      ? "bg-amber-400 text-zinc-950 hover:bg-amber-300 cursor-pointer active:scale-95 shadow-md shadow-amber-400/15"
                      : "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  {loyaltyPoints >= 100 ? "REDEEM 100 POINTS" : "NEED 100 POINTS TO REDEEM"}
                </button>
              </div>
            </div>

          </div>

          {/* Transaction Ledger Card */}
          <div className="bg-white border border-zinc-150 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-widest">Mock Transaction Ledger</h3>
            
            <div className="border border-zinc-100 rounded-2xl bg-zinc-50/50 divide-y divide-zinc-150 text-xs text-zinc-700">
              <div className="p-4 flex justify-between items-center font-semibold hover:bg-zinc-100/30 transition">
                <div>
                  <p className="text-zinc-800 font-extrabold">Initial Sandbox Account Credit</p>
                  <p className="text-[9px] text-zinc-400 font-bold">Automatic Registration Setup</p>
                </div>
                <span className="text-emerald-600 font-mono font-black text-xs">+₹350</span>
              </div>
              
              <div className="p-4 flex justify-between items-center font-semibold hover:bg-zinc-100/30 transition">
                <div>
                  <p className="text-zinc-800 font-extrabold">Loyalty Points Claim Credit</p>
                  <p className="text-[9px] text-zinc-400 font-bold">Automatic Sign-in Bounty</p>
                </div>
                <span className="text-emerald-600 font-mono font-black text-xs">+120 Points</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
};
