import React from "react";
import { Order } from "../types";
import { useApp } from "../context/AppContext";
import { 
  Clock, Shield, User, Smartphone, Check, ArrowRight, X, Phone, 
  MapPin, CheckCircle2, ChevronRight, ShoppingBag 
} from "lucide-react";
import { InteractiveMap } from "./InteractiveMap";

interface LiveTrackingProps {
  orderId: string;
  onClose: () => void;
}

export const LiveTracking: React.FC<LiveTrackingProps> = ({
  orderId,
  onClose
}) => {
  const { orders, updateOrderStatus, language } = useApp();

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto border border-zinc-100 shadow-2xl">
        <p className="font-extrabold text-zinc-800">Order not found.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer">
          Return Home
        </button>
      </div>
    );
  }

  // Define tracking progress steps
  const steps = [
    { label: "Order Received", desc: "Successfully logged in QuickNow system", status: "Pending" },
    { label: "Packaging Essentials", desc: "Cleaned & washed organic items packed", status: "Accepted" },
    { label: "Package Dispatched", desc: "Order left dispatch center branch", status: "Dispatched" },
    { label: "Out for Delivery", desc: "Rider Captain is en-route to your door", status: "Out for Delivery" },
    { label: "Delivered", desc: "Order handover successfully completed", status: "Delivered" }
  ];

  const getStepIndex = (status: Order["status"]) => {
    switch (status) {
      case "Pending": return 0;
      case "Accepted": return 1;
      case "Dispatched": return 2;
      case "Out for Delivery": return 3;
      case "Delivered": return 4;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Main timeline tracker card */}
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <div className="relative bg-white rounded-3xl max-w-lg w-full p-5 sm:p-8 border border-zinc-100 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">REAL-TIME DISPATCH CONTROL</p>
              <h3 className="font-black text-lg text-zinc-900 flex items-center gap-1.5">
                Track Order <span className="text-blue-600 font-mono font-black">{order.id}</span>
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-50 transition cursor-pointer">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Quick Status banner */}
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Estimated Delivery Time</p>
              <p className="text-base sm:text-lg font-black text-zinc-900">
                {order.status === "Delivered" ? "Successfully Delivered!" : "Arriving in 8 - 10 minutes flat"}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>

          {/* OTP Box */}
          {order.status !== "Delivered" && (
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Verification Passcode OTP</p>
                <p className="text-xs text-zinc-500">Share this code with rider to verify order handover:</p>
              </div>
              <div className="bg-amber-500 text-white font-mono font-black text-lg px-4 py-2 rounded-xl tracking-widest shadow-md shadow-amber-500/15">
                {order.deliveryOTP}
              </div>
            </div>
          )}

          {/* Real-time Interactive Map Tracking Widget */}
          {order.status === "Out for Delivery" ? (
            <InteractiveMap orderId={order.id} />
          ) : order.status !== "Delivered" && order.status !== "Rejected" ? (
            <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 text-center space-y-2">
              <p className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600 animate-pulse" />
                Live GPS Map Tracking
              </p>
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                The active satellite radar tracking feed activates instantly once your order is marked as <span className="font-extrabold text-zinc-650">Out for Delivery</span> and the Captain starts transit.
              </p>
            </div>
          ) : null}

          {/* Interactive Timeline Stepper */}
          <div className="space-y-5 py-2">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              
              return (
                <div key={idx} className="flex gap-4 relative last:pb-0 pb-1">
                  
                  {/* Vertical bar */}
                  {idx < steps.length - 1 && (
                    <div className={`absolute left-3.5 top-7 bottom-0 w-0.5 -translate-x-1/2 ${
                      idx < currentStepIdx ? "bg-blue-600" : "bg-zinc-100"
                    }`} />
                  )}

                  {/* Icon point */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 transition-all ${
                    isPast 
                      ? "bg-blue-600 text-white" 
                      : isCurrent 
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse" 
                        : "bg-zinc-100 text-zinc-400"
                  }`}>
                    {isPast ? <Check className="w-4 h-4" /> : <span>{idx + 1}</span>}
                  </div>

                  {/* Context text */}
                  <div>
                    <h4 className={`text-xs font-black transition ${
                      isCurrent ? "text-blue-600" : "text-zinc-800"
                    }`}>
                      {step.label}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{step.desc}</p>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Rider profile if assigned */}
          {order.deliveryPartnerId && (
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-zinc-800">Rider Captain: Ramesh Kumar</h5>
                  <p className="text-[10px] text-zinc-400 font-bold">Contact: +91 88888 77777</p>
                </div>
              </div>
              <a 
                href="tel:+918888877777"
                className="p-2.5 bg-white hover:bg-zinc-50 border border-zinc-100 text-zinc-700 rounded-xl transition"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Cancel order option */}
          {order.status === "Pending" && (
            <button
              onClick={() => {
                updateOrderStatus(order.id, "Rejected");
                onClose();
              }}
              className="w-full py-3 border border-rose-200 hover:bg-rose-50 hover:text-rose-600 text-rose-500 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel Delivery Request
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
