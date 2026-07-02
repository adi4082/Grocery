import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { TRANSLATIONS } from "../data/translations";
import { 
  X, Trash2, Plus, Minus, ArrowRight, Percent, ShieldCheck, 
  Truck, MapPin, CheckCircle, Check, CreditCard, Sparkles, Smartphone 
} from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderPlaced
}) => {
  const { 
    cart, updateCartQuantity, removeFromCart, coupons, activeCoupon, 
    applyCoupon, removeCoupon, deliveryCharge, placeOrder, language, user,
    deliveryConfig, updateCartWeight
  } = useApp();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UPI specific states
  const [showUPIScreen, setShowUPIScreen] = useState(false);
  const [upiStatus, setUpiStatus] = useState<"pending" | "success" | "failed">("pending");

  if (!isOpen) return null;

  const t = TRANSLATIONS[language];

  const getCartItemPrice = (item: any) => {
    if (item.product.isWeightBased) {
      const weight = item.selectedWeight || item.product.minWeight || 1;
      const pricePerKg = item.product.pricePerKg || item.product.price;
      return pricePerKg * weight;
    }
    return item.product.price;
  };

  const getCartItemOriginalPrice = (item: any) => {
    if (item.product.isWeightBased) {
      const weight = item.selectedWeight || item.product.minWeight || 1;
      const ratio = item.product.originalPrice / item.product.price;
      const pricePerKg = item.product.pricePerKg || item.product.price;
      return (pricePerKg * ratio) * weight;
    }
    return item.product.originalPrice;
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + getCartItemPrice(item) * item.quantity, 0);
  const originalSubtotal = cart.reduce((sum, item) => sum + getCartItemOriginalPrice(item) * item.quantity, 0);
  const totalSavings = originalSubtotal - subtotal;

  let couponDiscount = 0;
  if (activeCoupon) {
    couponDiscount = Math.round((subtotal * activeCoupon.discountPercent) / 100);
  }

  // Free delivery limit from config, default 499
  const freeDeliveryThreshold = deliveryConfig?.minOrderForFreeDelivery !== undefined ? deliveryConfig.minOrderForFreeDelivery : 499;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const deliveryCost = isFreeDelivery ? 0 : deliveryCharge;
  const amtToFreeDelivery = freeDeliveryThreshold - subtotal;
  const finalTotal = subtotal - couponDiscount + deliveryCost;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const success = applyCoupon(couponInput);
    if (success) {
      setCouponInput("");
    } else {
      setCouponError("Invalid code or minimum order value not met.");
    }
  };

  const handleQuickApply = (code: string) => {
    setCouponError("");
    const success = applyCoupon(code);
    if (!success) {
      setCouponError(`Min order amount required for ${code}`);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === "UPI") {
      setShowUPIScreen(true);
      setUpiStatus("pending");
      
      // Simulate UPI QR Scan payment resolution
      setTimeout(() => {
        setUpiStatus("success");
        // Complete checkout after success animation
        setTimeout(async () => {
          setIsProcessing(true);
          try {
            const placed = await placeOrder(
              user?.addresses[0] || "12, Premium Park, Sector 5, Salt Lake, Kolkata",
              "UPI",
              activeCoupon?.code,
              deliveryNotes
            );
            setShowUPIScreen(false);
            onClose();
            onOrderPlaced(placed.id);
          } catch (e) {
            console.error(e);
          } finally {
            setIsProcessing(false);
          }
        }, 1500);
      }, 3500);

    } else {
      setIsProcessing(true);
      try {
        const placed = await placeOrder(
          user?.addresses[0] || "12, Premium Park, Sector 5, Salt Lake, Kolkata",
          "COD",
          activeCoupon?.code,
          deliveryNotes
        );
        onClose();
        onOrderPlaced(placed.id);
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Main Drawer Shell */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-zinc-50 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </span>
            <h3 className="font-black text-zinc-900 text-base sm:text-lg">
              {t.cart} ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic Free Shipping Counter */}
        {cart.length > 0 && (
          <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 text-xs text-center flex flex-col gap-1">
            {isFreeDelivery ? (
              <span className="text-blue-700 font-bold flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" /> You've unlocked FREE Delivery on this order!
              </span>
            ) : (
              <div className="space-y-1.5">
                <p className="text-zinc-700 font-medium">
                  Add <span className="font-extrabold text-blue-600">₹{amtToFreeDelivery}</span> more to get <span className="font-extrabold">FREE Delivery</span>
                </p>
                <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / 500) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Cart Items & Checkout configurations */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                <Trash2 className="w-10 h-10" />
              </div>
              <div>
                <p className="font-black text-zinc-800 text-base">{t.emptyCart}</p>
                <p className="text-xs text-zinc-400 mt-1">Add items to see checkout options.</p>
              </div>
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full transition cursor-pointer"
              >
                Browse Fresh Products
              </button>
            </div>
          ) : (
            <>
              {/* Product list */}
              <div className="bg-white rounded-2xl p-4 border border-zinc-100 space-y-4 shadow-sm">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Item Details</p>
                <div className="space-y-3 divide-y divide-zinc-50">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between gap-3 pt-3 first:pt-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-zinc-50"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-zinc-800 truncate">{item.product.name}</h4>
                        
                        {item.product.isWeightBased ? (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[9px] text-zinc-400 font-bold">Qty (Weight):</span>
                            <select
                              value={item.selectedWeight || item.product.minWeight || 1}
                              onChange={(e) => updateCartWeight(item.product.id, Number(e.target.value))}
                              className="p-1 border border-zinc-200 rounded text-[10px] font-bold bg-white text-zinc-800 cursor-pointer"
                            >
                              {(() => {
                                const min = item.product.minWeight || 0.5;
                                const max = item.product.maxWeight || 10;
                                const interval = item.product.weightInterval || 0.5;
                                const list = [];
                                for (let w = min; w <= max; w = Number((w + interval).toFixed(2))) {
                                  list.push(w);
                                }
                                return list.map((val) => (
                                  <option key={val} value={val}>
                                    {val >= 1 ? `${val} kg` : `${val * 1000} g`}
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{item.product.unit}</p>
                        )}

                        <p className="text-xs font-extrabold text-zinc-950 mt-1">₹{getCartItemPrice(item)}</p>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-1.5 py-1">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="text-zinc-500 hover:text-zinc-800 p-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-zinc-800 min-w-[14px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="text-zinc-500 hover:text-zinc-800 p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupons Section */}
              <div className="bg-white rounded-2xl p-4 border border-zinc-100 space-y-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-orange-500">
                  <Percent className="w-5 h-5" />
                  <span className="font-extrabold text-xs uppercase tracking-wider">{t.applyCoupon}</span>
                </div>

                {activeCoupon ? (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div>
                      <p className="text-xs font-black text-blue-700">Code {activeCoupon.code} Applied!</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{activeCoupon.description}</p>
                    </div>
                    <button 
                      onClick={removeCoupon}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Promo Code..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-800 uppercase font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs rounded-xl transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponError && <p className="text-[10px] text-rose-500 font-bold">{couponError}</p>}

                {/* Quick select list */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Available Offers</p>
                  <div className="grid grid-cols-1 gap-2">
                    {coupons.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleQuickApply(c.code)}
                        className="text-left p-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-black text-zinc-800">{c.code}</p>
                          <p className="text-[9px] text-zinc-400 font-medium">{c.description}</p>
                        </div>
                        <span className="text-[10px] text-blue-600 font-bold">Apply</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div className="bg-white rounded-2xl p-4 border border-zinc-100 space-y-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <MapPin className="w-4.5 h-4.5 text-blue-600" />
                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-400">Delivering to Home Address</span>
                </div>
                <p className="text-xs font-bold text-zinc-700">
                  {user?.addresses[0] || "12, Premium Park, Sector 5, Salt Lake, Kolkata"}
                </p>
              </div>

              {/* Driver Instructions */}
              <div className="bg-white rounded-2xl p-4 border border-zinc-100 space-y-3 shadow-sm">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Instructions for Delivery Partner</p>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g., Leave package at reception, don't ring the bell..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl p-4 border border-zinc-100 space-y-3.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Select Payment Option</p>
                  <span className="text-[9px] font-bold text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-full">Secure Gateway</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer relative overflow-hidden group select-none active:scale-[0.98] ${
                      paymentMethod === "COD"
                        ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 shadow-sm shadow-emerald-500/5"
                        : "border-zinc-150 text-zinc-600 bg-white hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    {/* Visual accent bar */}
                    {paymentMethod === "COD" && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
                    )}
                    <div className="flex items-center gap-1.5 justify-between w-full">
                      <span className="text-xs font-black">Cash On Delivery</span>
                      <Truck className={`w-4 h-4 transition-transform duration-300 ${paymentMethod === "COD" ? "text-emerald-600 scale-110" : "text-zinc-400 group-hover:translate-x-0.5"}`} />
                    </div>
                    <span className="text-[9px] text-zinc-400 mt-2 font-bold block leading-snug">Pay rider upon safe delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer relative overflow-hidden group select-none active:scale-[0.98] ${
                      paymentMethod === "UPI"
                        ? "border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm shadow-blue-500/5"
                        : "border-zinc-150 text-zinc-600 bg-white hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    {/* Visual accent bar */}
                    {paymentMethod === "UPI" && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                    )}
                    <div className="flex items-center gap-1.5 justify-between w-full">
                      <span className="text-xs font-black">Instant UPI Scan</span>
                      <Smartphone className={`w-4 h-4 transition-transform duration-300 ${paymentMethod === "UPI" ? "text-blue-600 scale-110" : "text-zinc-400 group-hover:scale-105"}`} />
                    </div>
                    <span className="text-[9px] text-blue-600 mt-2 font-extrabold block leading-snug">Recommended & 100% safe</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Payment Block */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-zinc-100 bg-white space-y-4">
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Basket Subtotal</span>
                <span className="font-bold">₹{subtotal}</span>
              </div>
              
              {originalSubtotal > subtotal && (
                <div className="flex justify-between text-orange-600 font-bold">
                  <span>Product Discounts</span>
                  <span>- ₹{totalSavings}</span>
                </div>
              )}

              {activeCoupon && (
                <div className="flex justify-between text-blue-600 font-bold">
                  <span>Promo Discount ({activeCoupon.code})</span>
                  <span>- ₹{couponDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-500">
                <span>Delivery Charge</span>
                <span className="font-bold">
                  {deliveryCost === 0 ? <span className="text-blue-600 uppercase">FREE</span> : `₹${deliveryCost}`}
                </span>
              </div>

              <div className="flex justify-between text-sm text-zinc-900 font-black pt-2 border-t border-zinc-100">
                <span>Grand Total</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>

            {/* Savings highlight */}
            {(totalSavings + couponDiscount) > 0 && (
              <div className="bg-orange-50 border border-orange-100 text-[10px] text-orange-800 font-extrabold p-2.5 rounded-xl text-center">
                🎉 Congratulations! You saved ₹{totalSavings + couponDiscount} on this grocery bill!
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className={`w-full py-4 text-white font-black text-sm rounded-2xl transition-all duration-300 flex items-center justify-between px-5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer ${
                paymentMethod === "UPI"
                  ? "bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
              }`}
            >
              <div className="text-left">
                <span className="block text-[10px] uppercase tracking-widest font-extrabold opacity-90">
                  {paymentMethod === "UPI" ? "⚡ Pay Via Instant UPI" : "🤝 Cash On Delivery"}
                </span>
                <span className="text-base font-black">₹{finalTotal}</span>
              </div>
              <div className="flex items-center gap-2 font-black">
                <span>{isProcessing ? "Processing..." : paymentMethod === "UPI" ? "Scan QR & Pay" : "Confirm & Place Order"}</span>
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </div>
            </button>

          </div>
        )}

      </div>

      {/* --- UPI Simulated Payment Screen Overlay --- */}
      {showUPIScreen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-zinc-100 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="font-black text-sm text-zinc-700">QuickNow Instant UPI Gateway</span>
              <button onClick={() => setShowUPIScreen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
              </button>
            </div>

            {upiStatus === "pending" ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-500">Scan this QR code using Google Pay, PhonePe, Paytm, or any BHIM UPI App to authorize transfer of <span className="font-extrabold text-zinc-900">₹{finalTotal}</span>.</p>
                
                {/* QR Code Graphic Mock */}
                <div className="w-44 h-44 mx-auto bg-white p-3 border-2 border-blue-500 rounded-2xl shadow-inner flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-blue-500/5 animate-pulse rounded-2xl pointer-events-none" />
                  {/* Styled block QR */}
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-90">
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-500 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-100 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-100 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-100 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-100 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-100 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-100 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-100 rounded" />
                    <div className="bg-zinc-900 rounded" />
                    <div className="bg-zinc-900 rounded" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-500 animate-pulse">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                  <span>Waiting for scan authentication...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-zinc-900 text-lg">Transaction Approved</h4>
                  <p className="text-xs text-zinc-500 mt-1">₹{finalTotal} successfully received by QuickNow Limited.</p>
                </div>
              </div>
            )}

            <div className="bg-zinc-50 p-3 rounded-2xl flex items-center gap-2 text-left justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] text-zinc-500 font-bold">SECURE 256-BIT BANK-GRADE ENCRYPTION ENFORCED</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
