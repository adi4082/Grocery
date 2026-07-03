import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { TRANSLATIONS } from "../data/translations";
import { 
  X, Trash2, Plus, Minus, ArrowRight, Percent, ShieldCheck, 
  Truck, MapPin, CheckCircle, Check, CreditCard, Sparkles, Smartphone,
  Clock, Zap, Calendar
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
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | "Razorpay">("Razorpay");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Delivery Time-Slot Selector States
  const [deliveryType, setDeliveryType] = useState<"Express" | "Scheduled">("Express");
  const [selectedSlot, setSelectedSlot] = useState<string>("Within 10 mins");

  // Helper to generate dynamic 2-hour scheduled delivery slots for Today and Tomorrow
  const getScheduledSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();

    const candidates = [
      { start: 8, label: "08:00 AM - 10:00 AM" },
      { start: 10, label: "10:00 AM - 12:00 PM" },
      { start: 12, label: "12:00 PM - 02:00 PM" },
      { start: 14, label: "02:00 PM - 04:00 PM" },
      { start: 16, label: "04:00 PM - 06:00 PM" },
      { start: 18, label: "06:00 PM - 08:00 PM" },
      { start: 20, label: "08:00 PM - 10:00 PM" },
    ];

    // Today's slots (only if slot starts at least 1 hour in the future)
    candidates.forEach((slot) => {
      if (slot.start > currentHour + 1) {
        slots.push({
          id: `today-${slot.start}`,
          day: "Today",
          label: slot.label,
          value: `Today, ${slot.label}`
        });
      }
    });

    // Tomorrow's slots (all are available)
    candidates.forEach((slot) => {
      slots.push({
        id: `tomorrow-${slot.start}`,
        day: "Tomorrow",
        label: slot.label,
        value: `Tomorrow, ${slot.label}`
      });
    });

    return slots;
  };

  const handleSelectDeliveryType = (type: "Express" | "Scheduled") => {
    setDeliveryType(type);
    if (type === "Express") {
      setSelectedSlot("Within 10 mins");
    } else {
      const slots = getScheduledSlots();
      if (slots.length > 0) {
        setSelectedSlot(slots[0].value);
      } else {
        setSelectedSlot("Scheduled Delivery");
      }
    }
  };
  
  // Razorpay and General payment states
  const [paymentError, setPaymentError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [paymentSuccessStatus, setPaymentSuccessStatus] = useState(false);

  // UPI specific states
  const [showUPIScreen, setShowUPIScreen] = useState(false);
  const [upiStatus, setUpiStatus] = useState<"pending" | "success" | "failed">("pending");

  // Load Razorpay Standard Checkout Script Dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

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
    setPaymentError("");
    
    if (paymentMethod === "Razorpay") {
      setIsProcessing(true);
      setLoadingMessage("Connecting to secure payment gateway...");
      
      try {
        // 1. Load Razorpay SDK
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error("Failed to load Razorpay payment SDK. Please check your internet connection.");
        }
        
        // 2. Fetch Razorpay Key ID
        setLoadingMessage("Initializing gateway session...");
        const keyRes = await fetch("/api/razorpay-key");
        if (!keyRes.ok) throw new Error("Could not retrieve payment gateway credentials.");
        const { keyId } = await keyRes.json();
        
        if (!keyId) {
          throw new Error("Razorpay Key ID is not configured on the server. Please check your environment variables.");
        }
        
        // 3. Create Order on Backend
        setLoadingMessage("Creating secure order...");
        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalTotal,
            receipt: `receipt_qn_${Date.now()}`
          })
        });
        
        if (!orderRes.ok) {
          const errData = await orderRes.json();
          throw new Error(errData.error || "Failed to initiate transaction.");
        }
        
        const rzpOrder = await orderRes.json();
        setLoadingMessage("Opening secure checkout...");
        
        // 4. Open Razorpay Checkout Modal
        const options = {
          key: keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "QuickNow",
          description: `Order total: ₹${finalTotal} (${cart.reduce((sum, item) => sum + item.quantity, 0)} items)`,
          image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=60",
          order_id: rzpOrder.orderId,
          handler: async (response: any) => {
            try {
              setIsProcessing(true);
              setLoadingMessage("Verifying secure payment signature...");
              
              // 5. Verify signature on backend
              const verifyRes = await fetch("/api/razorpay/verify-signature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              
              if (!verifyRes.ok) {
                const errData = await verifyRes.json();
                throw new Error(errData.error || "Payment signature verification failed.");
              }
              
              setLoadingMessage("Securing payment & placing your order...");
              
              // 6. Complete placement on Firestore
              const placed = await placeOrder(
                user?.addresses[0] || "Bongaon, North 24 Parganas, West Bengal - 743235, India",
                "Razorpay",
                activeCoupon?.code,
                deliveryNotes,
                {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature
                },
                deliveryType,
                selectedSlot
              );
              
              // 7. Show Successful state and redirect
              setLoadingMessage("Payment Successful! 🎉");
              setPaymentSuccessStatus(true);
              
              setTimeout(() => {
                setIsProcessing(false);
                setPaymentSuccessStatus(false);
                onClose();
                onOrderPlaced(placed.id);
              }, 2000);
              
            } catch (err: any) {
              console.error("Verification error:", err);
              setPaymentError(err.message || "Payment signature verification failed.");
              setIsProcessing(false);
            }
          },
          prefill: {
            name: user?.name || "Premium Customer",
            email: user?.email || "customer@quicknow.com",
            contact: user?.phone || "+919999988888"
          },
          notes: {
            address: user?.addresses[0] || "Bongaon, North 24 Parganas, West Bengal - 743235, India",
            deliveryNotes: deliveryNotes || ""
          },
          theme: {
            color: "#2563eb" // Blue matching branding
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setPaymentError("Payment session cancelled by the user.");
            }
          }
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          setIsProcessing(false);
          setPaymentError(response.error.description || "The transaction was declined by the bank.");
        });
        rzp.open();
        
      } catch (err: any) {
        console.error("Payment setup error:", err);
        setPaymentError(err.message || "An unexpected error occurred during checkout setup.");
        setIsProcessing(false);
      }
    } else if (paymentMethod === "UPI") {
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
              user?.addresses[0] || "Bongaon, North 24 Parganas, West Bengal - 743235, India",
              "UPI",
              activeCoupon?.code,
              deliveryNotes,
              undefined,
              deliveryType,
              selectedSlot
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
          user?.addresses[0] || "Bongaon, North 24 Parganas, West Bengal - 743235, India",
          "COD",
          activeCoupon?.code,
          deliveryNotes,
          undefined,
          deliveryType,
          selectedSlot
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
                  {user?.addresses[0] || "Bongaon, North 24 Parganas, West Bengal - 743235, India"}
                </p>
              </div>

              {/* Delivery Time-Slot Preference Selector */}
              <div id="delivery-slot-preference-selector" className="bg-white rounded-2xl p-4 border border-zinc-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-950">
                    <Clock className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-700">Delivery Preference</span>
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    deliveryType === "Express"
                      ? "text-amber-700 bg-amber-50 border border-amber-100"
                      : "text-blue-700 bg-blue-50 border border-blue-100"
                  }`}>
                    {deliveryType === "Express" ? "Express Delivery" : "Scheduled Slot"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Express (10-minute) Option */}
                  <button
                    type="button"
                    onClick={() => handleSelectDeliveryType("Express")}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 relative flex flex-col justify-between cursor-pointer active:scale-95 ${
                      deliveryType === "Express"
                        ? "border-amber-500 bg-amber-50/30 text-amber-900 shadow-sm shadow-amber-500/5"
                        : "border-zinc-150 bg-white hover:bg-zinc-50 text-zinc-500"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`p-1.5 rounded-lg ${deliveryType === "Express" ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-500"}`}>
                        <Zap className="w-3.5 h-3.5" />
                      </span>
                      {deliveryType === "Express" && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-black text-zinc-900">Express Delivery</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-bold">⏱️ Within 10 Mins</p>
                    </div>
                  </button>

                  {/* Scheduled Option */}
                  <button
                    type="button"
                    onClick={() => handleSelectDeliveryType("Scheduled")}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 relative flex flex-col justify-between cursor-pointer active:scale-95 ${
                      deliveryType === "Scheduled"
                        ? "border-blue-600 bg-blue-50/30 text-blue-900 shadow-sm shadow-blue-500/5"
                        : "border-zinc-150 bg-white hover:bg-zinc-50 text-zinc-500"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`p-1.5 rounded-lg ${deliveryType === "Scheduled" ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-500"}`}>
                        <Calendar className="w-3.5 h-3.5" />
                      </span>
                      {deliveryType === "Scheduled" && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-black text-zinc-900">Scheduled Slot</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-bold">📅 Choose Slot</p>
                    </div>
                  </button>
                </div>

                {/* Slot Details Selector Container */}
                {deliveryType === "Express" ? (
                  <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in duration-150">
                    <Sparkles className="w-4.5 h-4.5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-black text-amber-900">Superfast Instant Delivery</p>
                      <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">Your fresh items are handpicked and delivered right to your doorstep within 10 minutes from placing your order.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Choose delivery time window</label>
                    <div className="relative">
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        {getScheduledSlots().map((slot) => (
                          <option key={slot.id} value={slot.value}>
                            {slot.value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal">Planning ahead? Choose any convenient 2-hour delivery slot. There are no additional charges for scheduled orders.</p>
                  </div>
                )}
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
                
                <div className="space-y-3">
                  {/* Premium Razorpay Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Razorpay")}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer relative overflow-hidden group select-none active:scale-[0.98] ${
                      paymentMethod === "Razorpay"
                        ? "border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm shadow-blue-500/5"
                        : "border-zinc-150 text-zinc-600 bg-white hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    {paymentMethod === "Razorpay" && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-600" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                        <CreditCard className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-xs font-black block text-zinc-900">Pay Online (Razorpay)</span>
                        <span className="text-[9px] text-zinc-500 font-bold block leading-snug">Cards, Netbanking, UPI, Wallets, EMI</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-blue-600 font-extrabold bg-blue-100/50 px-2.5 py-1 rounded-full group-hover:scale-105 transition-transform">Popular</span>
                  </button>

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
                          ? "border-amber-600 bg-amber-50/40 text-amber-900 shadow-sm shadow-amber-500/5"
                          : "border-zinc-150 text-zinc-600 bg-white hover:bg-zinc-50 hover:border-zinc-300"
                      }`}
                    >
                      {/* Visual accent bar */}
                      {paymentMethod === "UPI" && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />
                      )}
                      <div className="flex items-center gap-1.5 justify-between w-full">
                        <span className="text-xs font-black">Instant UPI Scan</span>
                        <Smartphone className={`w-4 h-4 transition-transform duration-300 ${paymentMethod === "UPI" ? "text-amber-600 scale-110" : "text-zinc-400 group-hover:scale-105"}`} />
                      </div>
                      <span className="text-[9px] text-amber-650 mt-2 font-bold block leading-snug">Quick self-scan code</span>
                    </button>
                  </div>
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

            {paymentError && (
              <div className="bg-rose-50 border border-rose-150 text-rose-800 text-xs font-bold p-3.5 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-150 relative">
                <span className="text-rose-500 mt-0.5 font-extrabold text-sm">⚠️</span>
                <div className="flex-1 pr-6">
                  <p className="font-extrabold text-rose-900">Payment Error</p>
                  <p className="text-[11px] font-medium text-rose-600 mt-0.5 leading-relaxed">{paymentError}</p>
                </div>
                <button 
                  onClick={() => setPaymentError("")} 
                  className="text-rose-400 hover:text-rose-600 font-black cursor-pointer absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-rose-100/50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className={`w-full py-4 text-white font-black text-sm rounded-2xl transition-all duration-300 flex items-center justify-between px-5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer ${
                paymentMethod === "Razorpay"
                  ? "bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                  : paymentMethod === "UPI"
                  ? "bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-500/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
              }`}
            >
              <div className="text-left">
                <span className="block text-[10px] uppercase tracking-widest font-extrabold opacity-90">
                  {paymentMethod === "Razorpay" 
                    ? "💳 Secure Online Pay" 
                    : paymentMethod === "UPI" 
                    ? "⚡ Pay Via Instant UPI" 
                    : "🤝 Cash On Delivery"}
                </span>
                <span className="text-base font-black">₹{finalTotal}</span>
              </div>
              <div className="flex items-center gap-2 font-black">
                <span>
                  {isProcessing 
                    ? "Processing..." 
                    : paymentMethod === "Razorpay" 
                    ? "Proceed to Pay" 
                    : paymentMethod === "UPI" 
                    ? "Scan QR & Pay" 
                    : "Confirm & Place Order"}
                </span>
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </div>
            </button>

          </div>
        )}

      </div>

      {/* Premium Payment Processing & Success Overlay */}
      {isProcessing && paymentMethod === "Razorpay" && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-zinc-100 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-150">
            
            {!paymentSuccessStatus ? (
              <div className="space-y-6">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-extrabold text-zinc-900 text-lg">Processing Payment</h4>
                  <p className="text-xs text-zinc-500 font-medium px-4">
                    {loadingMessage || "Securing your checkout gateway session..."}
                  </p>
                </div>

                <div className="bg-zinc-50 p-3 rounded-2xl flex items-center gap-2 justify-center text-left">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">DO NOT CLOSE THIS TAB OR REFRESH</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100 animate-bounce">
                  <CheckCircle className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-black text-emerald-600 text-2xl">Payment Successful!</h4>
                  <p className="text-xs text-zinc-500 font-medium px-4">
                    Signature verified successfully. Preparing your premium lightning delivery...
                  </p>
                </div>
                
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest animate-pulse">
                  Redirecting to order tracking...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
