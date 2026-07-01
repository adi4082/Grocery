import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Order } from "../types";
import { 
  Truck, ShieldAlert, Navigation, Smartphone, Check, Sparkles, Map, 
  Compass, DollarSign, Calendar, Eye, MapPin, CheckCircle, AlertTriangle 
} from "lucide-react";

export const DeliveryPartner: React.FC = () => {
  const { orders, updateOrderStatus, isDeliveryOnline, setDeliveryOnline, user, addNotification } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showOtpVerification, setShowOtpVerification] = useState(false);

  if (!user || user.role !== "delivery") {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-zinc-100 p-8 text-center space-y-4 shadow-xl">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
        <div>
          <h3 className="text-xl font-black text-zinc-900">Delivery Partner restricted</h3>
          <p className="text-xs text-zinc-500 mt-1">Please select the Rider role from the top-right tool menu to log into the delivery captain terminal.</p>
        </div>
      </div>
    );
  }

  // Filter assigned orders
  const assignedOrders = orders.filter(
    (o) => o.deliveryPartnerId === "driver-1" && o.status !== "Delivered" && o.status !== "Rejected"
  );

  const deliveryHistory = orders.filter(
    (o) => o.deliveryPartnerId === "driver-1" && o.status === "Delivered"
  );

  // Rider earnings: ₹40 per successfully delivered order
  const baseRatePerDelivery = 40;
  const totalRiderEarnings = deliveryHistory.length * baseRatePerDelivery;

  const handleAcceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, "Accepted", "driver-1");
    addNotification("Order Accepted", `Rider Captain accepted order ${orderId}. Sourcing packaging details.`);
  };

  const handleStartDelivery = (order: Order) => {
    setSelectedOrder(order);
    updateOrderStatus(order.id, "Out for Delivery", "driver-1");
    addNotification("Out for Delivery", `Rider Captain is en-route for order ${order.id}.`);
  };

  const handleVerifyDeliveryOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    
    if (!selectedOrder) return;

    if (otpInput === selectedOrder.deliveryOTP) {
      updateOrderStatus(selectedOrder.id, "Delivered", "driver-1");
      addNotification("Order Delivered!", `Order ${selectedOrder.id} has been delivered successfully. Payout credited.`);
      
      // Reset states
      setShowOtpVerification(false);
      setSelectedOrder(null);
      setOtpInput("");
    } else {
      setOtpError(`Incorrect OTP. Check the live order tracking section to view customer's OTP (it is ${selectedOrder.deliveryOTP} for demo convenience).`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Status Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600 animate-bounce" />
            Rider Captain Hub
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Accept tasks, manage payouts, and access integrated GPS assistance.</p>
        </div>

        {/* Online Toggle */}
        <div className="flex items-center gap-3 bg-zinc-50 p-2 rounded-2xl border border-zinc-100 max-w-max">
          <span className="text-xs font-black text-zinc-600 uppercase pl-1.5">Duty:</span>
          <button
            onClick={() => {
              setDeliveryOnline(!isDeliveryOnline);
              addNotification("Duty Updated", isDeliveryOnline ? "Logged off the duty queue." : "Ready to receive dispatch orders.");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all duration-150 cursor-pointer ${
              isDeliveryOnline
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                : "bg-rose-500 text-white shadow-md"
            }`}
          >
            {isDeliveryOnline ? "ONLINE" : "OFFLINE"}
          </button>
        </div>
      </div>

      {/* Grid earnings & assigned orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Earnings Stats block */}
        <div className="space-y-4">
          
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-white/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-400" />
              </span>
              <span className="text-[10px] bg-orange-500 text-white px-2.5 py-0.5 rounded-full font-bold">RIDER STATUS</span>
            </div>
            
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Accumulated Earnings</p>
              <h3 className="text-3xl font-black">₹{totalRiderEarnings}</h3>
            </div>

            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Standard Payout Rate</span>
              <span className="font-bold text-white">₹{baseRatePerDelivery} per dispatch</span>
            </div>
          </div>

          {/* Delivery History Log */}
          <div className="bg-white rounded-3xl p-5 border border-zinc-100 space-y-3">
            <h4 className="font-extrabold text-xs text-zinc-400 uppercase tracking-wider">Completed Deliveries</h4>
            
            {deliveryHistory.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Deliver your first order to populate log.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {deliveryHistory.map((o) => (
                  <div key={o.id} className="p-3 bg-zinc-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-black text-xs text-zinc-800">{o.id}</p>
                      <p className="text-[10px] text-zinc-400">{o.customerName}</p>
                    </div>
                    <span className="text-emerald-600 font-extrabold text-xs">+₹40</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Assigned Orders column */}
        <div className="lg:col-span-2 space-y-4">
          
          <h3 className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">
            Assigned Orders Deck ({assignedOrders.length} orders)
          </h3>

          {!isDeliveryOnline ? (
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 text-center space-y-2">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="font-bold text-zinc-800">You are offline</h4>
              <p className="text-xs text-zinc-500">Go online above to accept and process deliveries.</p>
            </div>
          ) : assignedOrders.length === 0 ? (
            <div className="bg-white border border-zinc-100 rounded-3xl p-8 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-zinc-800">All Clear!</h4>
              <p className="text-xs text-zinc-400">Waiting for customers to check out items. New order assignments will display here instantly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-3xl p-5 border border-zinc-100 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase font-mono">
                        {o.id}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold">{new Date(o.createdAt).toLocaleTimeString()}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-zinc-900">{o.customerName}</p>
                      <p className="text-[11px] text-zinc-500">{o.customerPhone}</p>
                      <p className="text-xs text-zinc-600 font-semibold flex items-start gap-1.5 pt-1">
                        <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{o.address}</span>
                      </p>
                    </div>

                    {o.deliveryNotes && (
                      <div className="p-2.5 bg-orange-50/40 border border-orange-100 rounded-xl text-[10px] text-orange-600 font-bold">
                        Rider Note: "{o.deliveryNotes}"
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-50 pt-4 flex gap-2">
                    {o.status === "Pending" ? (
                      <button
                        onClick={() => handleAcceptOrder(o.id)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-emerald-500/15 cursor-pointer"
                      >
                        Accept Task
                      </button>
                    ) : o.status === "Accepted" || o.status === "Dispatched" ? (
                      <button
                        onClick={() => handleStartDelivery(o)}
                        className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="w-4 h-4" />
                        Start GPS Navigation
                      </button>
                    ) : o.status === "Out for Delivery" ? (
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setShowOtpVerification(true);
                        }}
                        className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        Verify OTP & Deliver
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* --- GPS Mock Navigation & OTP Modal --- */}
      {selectedOrder && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 shadow-xl">
          
          {/* GPS Navigation Mapping Mock */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
                GPS CO-ORDINATES MAPPED
              </span>
              <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold">1.2 KM REMAINING</span>
            </div>

            {/* GPS Map Graphic */}
            <div className="relative aspect-video w-full rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 flex items-center justify-center">
              {/* Dynamic route visual mapping mock */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="space-y-2 text-center z-10 p-4">
                <p className="font-black text-xs text-zinc-800 uppercase tracking-widest">Store Branch #3 &rarr; Customer House</p>
                <div className="w-44 h-1 bg-zinc-200 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full animate-pulse" style={{ width: "65%" }} />
                </div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Active Driving Status: En-Route via salt lake bypass road</p>
              </div>

              {/* Styled points */}
              <div className="absolute left-1/4 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="w-3 h-3 bg-zinc-800 rounded-full ring-4 ring-zinc-200" />
                <span className="text-[8px] font-black text-zinc-500 uppercase mt-1">Branch</span>
              </div>
              
              <div className="absolute right-1/4 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="w-3 h-3 bg-emerald-600 rounded-full ring-4 ring-emerald-100 animate-ping" />
                <span className="text-[8px] font-black text-emerald-600 uppercase mt-1">Customer</span>
              </div>
            </div>
          </div>

          {/* OTP verify form */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-1">
              <h4 className="font-black text-base text-zinc-900">OTP Verification Required</h4>
              <p className="text-xs text-zinc-500">Ask the customer for the 4-digit verification passcode to close the order successfully.</p>
            </div>

            <form onSubmit={handleVerifyDeliveryOTP} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Enter 4-Digit OTP..."
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full text-center tracking-widest p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-black text-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {otpError && <p className="text-[10px] text-rose-500 font-bold">{otpError}</p>}

              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl transition shadow-md shadow-orange-500/15 uppercase cursor-pointer"
              >
                Submit & Complete Payout
              </button>
            </form>

            <p className="text-[10px] text-zinc-400 font-bold text-center uppercase tracking-tight">
              *Customer Verification Code is listed securely on customer's tracking screen.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
