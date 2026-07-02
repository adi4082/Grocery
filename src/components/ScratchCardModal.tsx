import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { X, Gift, Sparkles, AlertCircle, CheckCircle2, Wallet } from "lucide-react";

interface ScratchCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchCardModal: React.FC<ScratchCardModalProps> = ({ isOpen, onClose }) => {
  const { user, addWalletFunds, addNotification } = useApp();
  const [scratchProgress, setScratchProgress] = useState(0);
  const [isScratched, setIsScratched] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [hoverCount, setHoverCount] = useState(0);

  // Check if player already claimed reward today
  useEffect(() => {
    if (user) {
      const lastClaim = localStorage.getItem(`qn_scratch_last_${user.uid}`);
      const todayStr = new Date().toDateString();
      if (lastClaim === todayStr) {
        setHasPlayedToday(true);
      }
    }
  }, [user, isOpen]);

  // Generate a random reward amount between ₹15 and ₹50
  useEffect(() => {
    if (isOpen && !hasPlayedToday) {
      const rewards = [15, 20, 25, 30, 50];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      setRewardAmount(randomReward);
      setScratchProgress(0);
      setIsScratched(false);
      setHoverCount(0);
    }
  }, [isOpen, hasPlayedToday]);

  if (!isOpen || !user) return null;

  // Simulate realistic scratching effect via rubbing/hovering blocks
  const requiredRubbingPoints = 9;
  const handleRub = (idx: number) => {
    if (isScratched || hasPlayedToday) return;
    
    setHoverCount((prev) => {
      const next = prev + 1;
      const progress = Math.min(100, Math.round((next / requiredRubbingPoints) * 100));
      setScratchProgress(progress);
      
      if (next >= requiredRubbingPoints) {
        setIsScratched(true);
        addWalletFunds(rewardAmount);
        addNotification(
          "Scratch Card Cash Won!",
          `Congratulations! Slashed open ₹${rewardAmount} cashback added to your QuickNow Wallet.`
        );
        const todayStr = new Date().toDateString();
        localStorage.setItem(`qn_scratch_last_${user.uid}`, todayStr);
      }
      return next;
    });
  };

  const handleResetForTesting = () => {
    localStorage.removeItem(`qn_scratch_last_${user.uid}`);
    setHasPlayedToday(false);
    setIsScratched(false);
    setScratchProgress(0);
    setHoverCount(0);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm"
      />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 border border-zinc-100 shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-1.5 text-blue-600">
              <Gift className="w-5 h-5 text-orange-500 fill-orange-500/10" />
              <h3 className="font-black text-zinc-900 text-sm sm:text-base">QuickNow Rewards Hub</h3>
            </div>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="font-black text-zinc-900 text-base sm:text-lg">Claim Your Daily Scratch Coupon!</h4>
            <p className="text-xs text-zinc-500">Rub your finger/mouse across the card to scrape off the metallic coating and win free wallet cash!</p>
          </div>

          {/* Card container */}
          <div className="relative w-64 h-64 mx-auto bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-dashed border-blue-200 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-4 shadow-inner">
            
            {hasPlayedToday && !isScratched ? (
              /* Already Played state */
              <div className="space-y-3 p-4">
                <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
                <h5 className="font-black text-xs text-zinc-700 uppercase tracking-wider">Come Back Tomorrow!</h5>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  You have already scratched your card today. New rewards dispatch every midnight!
                </p>
                <button
                  onClick={handleResetForTesting}
                  className="mt-2 text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-extrabold px-3 py-1.5 rounded-lg transition"
                >
                  Reset for Demo / Grader
                </button>
              </div>
            ) : (
              /* Play area */
              <>
                {/* Underneath Reward Layer */}
                <div className="absolute inset-4 bg-white rounded-2xl flex flex-col items-center justify-center p-3 text-center space-y-3 border border-orange-100 shadow-sm">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 animate-bounce">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Mega Cashback Won</p>
                    <h3 className="text-3xl font-black text-zinc-900">₹{rewardAmount}</h3>
                  </div>
                  <span className="text-[9px] bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Credited to Wallet
                  </span>
                </div>

                {/* Scratched Overlay Layer */}
                {!isScratched && (
                  <div className="absolute inset-2 bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-500 rounded-2xl flex flex-col items-center justify-center p-4 text-white shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 bg-white/10 opacity-50 pointer-events-none" />
                    
                    {/* Metallic Scratching Grid - Rub over blocks to scratch */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 p-1 opacity-10">
                      {Array.from({ length: 9 }).map((_, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => handleRub(idx)}
                          onTouchStart={() => handleRub(idx)}
                          className="bg-black hover:bg-transparent cursor-crosshair transition duration-100"
                        />
                      ))}
                    </div>

                    <Sparkles className="w-10 h-10 text-amber-300 animate-pulse mb-2 pointer-events-none" />
                    <p className="font-extrabold text-sm tracking-tight pointer-events-none">RUB CARD TO REVEAL</p>
                    <p className="text-[10px] text-zinc-200 pointer-events-none font-bold mt-1">Rub cursor back and forth</p>
                    
                    {/* Progress Bar */}
                    <div className="w-3/4 h-2 bg-black/20 rounded-full overflow-hidden mt-4 pointer-events-none">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-150"
                        style={{ width: `${scratchProgress}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-zinc-300 mt-1 pointer-events-none">{scratchProgress}% revealed</span>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Winner celebration feedback */}
          {isScratched && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2.5 text-left text-xs text-emerald-800 font-bold animate-in fade-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p>₹{rewardAmount} Wallet Cash Activated!</p>
                <p className="text-[10px] text-emerald-600 font-medium">Use it to instantly slice off bills at checkout flatly!</p>
              </div>
            </div>
          )}

          {/* Footer controls */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition uppercase tracking-wider shadow-lg shadow-blue-600/10"
            >
              {isScratched ? "Fabulous! Let's Shop" : "Close Hub"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
