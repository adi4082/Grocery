import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { 
  User, MapPin, Settings, Trash2, Plus, ArrowLeft, Loader2, Check, ShieldCheck, Mail, Phone, Sparkles
} from "lucide-react";

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, addNotification } = useApp() as any;

  // Redirection guard - if not logged in, go to /login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(true);
  const [newAddress, setNewAddress] = useState("");
  const [highPerformance, setHighPerformance] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  // Loading animation simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  const handleAddAddress = () => {
    if (newAddress.trim()) {
      if (!user.addresses.includes(newAddress.trim())) {
        user.addresses.push(newAddress.trim());
        addNotification("Address Saved", "Successfully appended new shipping address.");
        setNewAddress("");
      } else {
        addNotification("Duplicate Address", "This address is already in your ledger.");
      }
    }
  };

  const handleRemoveAddress = (index: number) => {
    if (user.addresses.length > 1) {
      user.addresses.splice(index, 1);
      addNotification("Address Removed", "Address successfully purged.");
      // Trigger update
      setNewAddress(" ");
      setTimeout(() => setNewAddress(""), 0);
    } else {
      addNotification("Purge Failed", "You must keep at least one active address.");
    }
  };

  const handleSavePreferences = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addNotification("Preferences Updated", "Performance & notification parameters are saved.");
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-4xl mx-auto pb-24 px-4 pt-4"
      id="profile-page-root"
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
            <User className="w-5 h-5 text-blue-600" />
            My Profile & Dispatch Settings
          </h1>
          <p className="text-xs text-zinc-400 font-semibold">Verify hyper-local credentials and delivery destinations.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-zinc-400 font-extrabold uppercase tracking-widest">Hydrating Profile Ledger...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Profile info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border border-zinc-150 rounded-[28px] p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-3xl italic tracking-tighter">
                  {user.name ? user.name[0] : "Q"}
                </div>
                <span className="absolute bottom-1 right-1 w-4.5 h-4.5 bg-emerald-500 rounded-full border-3 border-white animate-pulse" />
              </div>

              <div>
                <h2 className="text-base font-black text-zinc-900">{user.name || "Premium Member"}</h2>
                <span className="inline-flex items-center gap-1 mt-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 fill-blue-600/10" />
                  {user.role || "CUSTOMER"}
                </span>
              </div>

              <div className="w-full border-t border-zinc-100 pt-4 space-y-3.5 text-left text-xs">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-zinc-400" />
                  <div>
                    <p className="text-[10px] font-bold text-zinc-450 uppercase leading-none">EMAIL ADDRESS</p>
                    <p className="font-extrabold text-zinc-800 mt-1 leading-tight">{user.email || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-zinc-400" />
                  <div>
                    <p className="text-[10px] font-bold text-zinc-450 uppercase leading-none">PHONE NUMBER</p>
                    <p className="font-extrabold text-zinc-800 mt-1 leading-tight">{user.phone || "+91 98765 43210"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-[10px] font-bold text-zinc-450 uppercase leading-none">INVITE CODE</p>
                    <p className="font-mono font-black text-emerald-700 uppercase tracking-wider mt-1 leading-none bg-emerald-50 px-2 py-1 rounded">
                      {user.referralCode || "QUICK_SUBH_77"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Addresses & Preferences */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Address List Card */}
            <div className="bg-white border border-zinc-150 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-5">
              <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Saved Dispatch Addresses
              </h3>
              
              <div className="space-y-2.5">
                {user.addresses.map((addr: string, idx: number) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-100 text-xs text-zinc-700 bg-zinc-50/50 hover:bg-zinc-100/50 transition font-semibold"
                  >
                    <p className="truncate pr-4 flex-1">{addr}</p>
                    {user.addresses.length > 1 && (
                      <button 
                        onClick={() => handleRemoveAddress(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Enter flat / building / street address details..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-850 bg-zinc-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAddress();
                    }
                  }}
                />
                <button
                  onClick={handleAddAddress}
                  className="px-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-blue-600/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </button>
              </div>
            </div>

            {/* Performance Settings */}
            <div className="bg-white border border-zinc-150 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                System Preferences
              </h3>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer p-1">
                  <div>
                    <p className="text-xs font-bold text-zinc-800">Ultra-performance Rendering</p>
                    <p className="text-[10px] text-zinc-400 font-semibold">Optimizes image caching and limits background thread tracking.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={highPerformance}
                    onChange={(e) => setHighPerformance(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-1">
                  <div>
                    <p className="text-xs font-bold text-zinc-800">SMS Dispatch Alerts</p>
                    <p className="text-[10px] text-zinc-400 font-semibold">Sends automatic SMS notifications once courier exits dark-store gates.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex justify-end">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-black rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </motion.div>
  );
};
