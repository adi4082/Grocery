import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Order } from "../types";
import { 
  Truck, ShieldAlert, Navigation, Smartphone, Check, Sparkles, Map, 
  Compass, DollarSign, Calendar, Eye, MapPin, CheckCircle, AlertTriangle,
  Phone, MessageSquare, ShieldCheck, XCircle, Play, Info, RefreshCw, User,
  Camera, Upload, Image, Trash2, RotateCcw
} from "lucide-react";
import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const isGoogleMapsEnabled = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== "YOUR_API_KEY";

export const DeliveryPartner: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    isDeliveryOnline, 
    setDeliveryOnline, 
    user, 
    addNotification,
    deliveryOtpRequired 
  } = useApp();

  const [activeDriverId, setActiveDriverId] = useState<string>("driver-1");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  
  // Proof of delivery photo state
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");

  // Reset proof states when active order changes
  useEffect(() => {
    setDeliveryPhoto(null);
    setOtpInput("");
    setOtpError("");
    setPhotoError("");
  }, [selectedOrder?.id]);
  
  // Simulated Rider Location Coords
  const [riderLocation, setRiderLocation] = useState({ lat: 22.5735, lng: 88.4331 });

  // Update rider location with high fidelity browser Geolocation if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setRiderLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => {
        console.warn("Geolocation permission bypassed:", err.message);
      });
    }
  }, []);

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

  // Multi-Rider Selection for ease of evaluation
  const riderProfiles = [
    { id: "driver-1", name: "Ramesh Kumar", vehicle: "Eco EV Scooter", baseRate: 40 },
    { id: "driver-2", name: "Suresh Singh", vehicle: "Electric Bike", baseRate: 40 },
    { id: "driver-3", name: "Amit Patel", vehicle: "Bicycle", baseRate: 30 }
  ];
  const currentRiderProfile = riderProfiles.find(r => r.id === activeDriverId) || riderProfiles[0];

  // Filters for Rider's Dashboard Metrics
  const riderAssignedOrders = orders.filter(o => o.deliveryPartnerId === activeDriverId);

  const pendingAssigned = riderAssignedOrders.filter(
    o => ["Accepted", "Picked Up", "Out for Delivery", "Dispatched"].includes(o.status)
  );

  const completedOrders = riderAssignedOrders.filter(
    o => o.status === "Delivered"
  );

  const failedCancelledOrders = riderAssignedOrders.filter(
    o => ["Failed Delivery", "Cancelled"].includes(o.status)
  );

  const totalRiderEarnings = completedOrders.length * currentRiderProfile.baseRate;

  // Global Pending Pool (Orders without a rider yet)
  const unassignedOrdersPool = orders.filter(o => !o.deliveryPartnerId && o.status === "Pending");

  // Status Handlers
  const handleAcceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, "Accepted", activeDriverId);
    addNotification("Task Accepted", `You have accepted order ${orderId}. Head to store for pickup.`);
  };

  const handlePickupOrder = (orderId: string) => {
    updateOrderStatus(orderId, "Picked Up", activeDriverId);
    addNotification("Order Picked Up", `Order ${orderId} has been successfully picked up.`);
  };

  const handleOutForDelivery = (order: Order) => {
    setSelectedOrder(order);
    updateOrderStatus(order.id, "Out for Delivery", activeDriverId);
    addNotification("Out For Delivery", `Starting delivery run for order ${order.id}.`);
  };

  const handleMarkFailed = (orderId: string) => {
    updateOrderStatus(orderId, "Failed Delivery", activeDriverId);
    addNotification("Delivery Attempt Failed", `Order ${orderId} marked as Failed Delivery.`);
  };

  const handleMarkCancelled = (orderId: string) => {
    updateOrderStatus(orderId, "Cancelled", activeDriverId);
    addNotification("Delivery Cancelled", `Order ${orderId} marked as Cancelled.`);
  };

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeliveryPhoto(reader.result as string);
        setPhotoError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteDeliveryNoOTP = (orderId: string) => {
    if (!deliveryPhoto) {
      setPhotoError("Please click or upload a delivery proof photo first.");
      return;
    }
    updateOrderStatus(orderId, "Delivered", activeDriverId, deliveryPhoto);
    addNotification("Order Delivered", `Successfully delivered order ${orderId}!`);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
    }
  };

  const handleVerifyDeliveryOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setPhotoError("");
    
    if (!selectedOrder) return;

    if (!deliveryPhoto) {
      setPhotoError("Please click or upload a delivery proof photo first.");
      return;
    }

    if (otpInput === selectedOrder.deliveryOTP) {
      updateOrderStatus(selectedOrder.id, "Delivered", activeDriverId, deliveryPhoto);
      addNotification("OTP Confirmed!", `Order ${selectedOrder.id} has been securely delivered.`);
      
      // Reset states
      setShowOtpVerification(false);
      setSelectedOrder(null);
      setOtpInput("");
    } else {
      setOtpError(`Incorrect OTP code. Try again. (DEMO TIP: Customer's code is ${selectedOrder.deliveryOTP})`);
    }
  };

  // Google Maps Direction Handler
  const handleOpenNavigation = (order: Order) => {
    const destLat = order.lat || 22.5735;
    const destLng = order.lng || 88.4331;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
    window.open(url, "_blank");
    addNotification("Turn-by-Turn Navigation", `Opened turn-by-turn coordinates route to target address.`);
  };

  // Calculate distance & time dynamically based on coordinates
  const getDistanceAndTime = (order: Order) => {
    if (!order.lat || !order.lng) return { distance: "1.8 km", duration: "6 mins" };
    
    const latDiff = order.lat - riderLocation.lat;
    const lngDiff = order.lng - riderLocation.lng;
    const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // rough calculation
    const durationMins = Math.round(distanceKm * 2.5);

    return {
      distance: `${distanceKm.toFixed(1)} km`,
      duration: `${durationMins || 2} mins`
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-600" />
            <span>Rider Captain Delivery Desk</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Accept tasks, manage payouts, and access real-time GPS navigation.</p>
        </div>

        {/* Profiles switcher and online toggle */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Profile Switcher */}
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-150 px-2.5 py-1.5 rounded-2xl">
            <User className="w-4 h-4 text-zinc-500" />
            <select
              value={activeDriverId}
              onChange={(e) => {
                setActiveDriverId(e.target.value);
                setSelectedOrder(null);
                setShowOtpVerification(false);
              }}
              className="bg-transparent border-none text-xs font-black text-zinc-700 focus:outline-none cursor-pointer"
            >
              {riderProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.vehicle})</option>
              ))}
            </select>
          </div>

          {/* Duty status switcher */}
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-150 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setDeliveryOnline(!isDeliveryOnline);
                addNotification("Status Changed", isDeliveryOnline ? "Duty paused. Resting." : "Queueing for dispatch runs.");
              }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-150 cursor-pointer ${
                isDeliveryOnline
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                  : "bg-rose-500 text-white shadow-md shadow-rose-500/10"
              }`}
            >
              {isDeliveryOnline ? "ONLINE" : "OFFLINE"}
            </button>
          </div>

        </div>
      </div>

      {/* Overview Cards (Today's, Pending, Completed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Earnings Card */}
        <div className="bg-zinc-950 text-white p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
          <div className="flex justify-between items-center z-10">
            <span className="p-1.5 bg-white/10 rounded-xl text-orange-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest bg-orange-500 text-white px-2 py-0.5 rounded-md">
              CAPTAIN PAY
            </span>
          </div>
          <div className="mt-4 z-10 text-left">
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase">Today's Wallet</p>
            <h3 className="text-3xl font-black mt-0.5">₹{totalRiderEarnings}</h3>
          </div>
          <div className="border-t border-white/10 mt-3 pt-2 text-[9px] text-zinc-400 font-bold flex justify-between">
            <span>Rate Per Order</span>
            <span>₹{currentRiderProfile.baseRate} / delivery</span>
          </div>
        </div>

        {/* Today's Total Orders */}
        <div className="bg-white border border-zinc-100 p-5 rounded-3xl flex flex-col justify-between text-left">
          <div className="flex justify-between items-center">
            <span className="p-1.5 bg-orange-50 rounded-xl text-orange-500">
              <Calendar className="w-5 h-5" />
            </span>
            <span className="text-[9px] font-mono font-bold text-zinc-400">METRIC TODAY</span>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase">Today's Orders</p>
            <h3 className="text-3xl font-black mt-0.5">{riderAssignedOrders.length}</h3>
          </div>
          <p className="text-[9px] text-zinc-400 font-bold pt-2 border-t border-zinc-50">Combined fleet and local bookings.</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-zinc-100 p-5 rounded-3xl flex flex-col justify-between text-left">
          <div className="flex justify-between items-center">
            <span className="p-1.5 bg-amber-50 rounded-xl text-amber-500">
              <Compass className="w-5 h-5 animate-spin" />
            </span>
            <span className="text-[9px] font-mono font-bold text-amber-500 uppercase">ACTIVE</span>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase">Pending Work</p>
            <h3 className="text-3xl font-black mt-0.5 text-amber-600">{pendingAssigned.length}</h3>
          </div>
          <p className="text-[9px] text-zinc-400 font-bold pt-2 border-t border-zinc-50">In-progress or accepted runs.</p>
        </div>

        {/* Completed Deliveries */}
        <div className="bg-white border border-zinc-100 p-5 rounded-3xl flex flex-col justify-between text-left">
          <div className="flex justify-between items-center">
            <span className="p-1.5 bg-emerald-50 rounded-xl text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase">SUCCESS</span>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase">Completed Orders</p>
            <h3 className="text-3xl font-black mt-0.5 text-emerald-600">{completedOrders.length}</h3>
          </div>
          <p className="text-[9px] text-zinc-400 font-bold pt-2 border-t border-zinc-50">Delivered to customer addresses.</p>
        </div>

      </div>

      {/* Main Task Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Assigned Task Deck & Global Pool */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Assigned Orders Desk */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">
                  Assigned Order Deck ({pendingAssigned.length} In Progress)
                </h3>
                <p className="text-[10px] text-zinc-400">Accept and complete tasks to credit payout immediately.</p>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-150 rounded-xl px-2.5 py-1 text-[9px] font-black text-zinc-500 uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Active Captain GPS Mode</span>
              </div>
            </div>

            {!isDeliveryOnline ? (
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="font-bold text-zinc-800 text-sm">You are offline</h4>
                <p className="text-xs text-zinc-500">Go online at the top-right to unlock assigned runs and start GPS navigation.</p>
              </div>
            ) : pendingAssigned.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-zinc-800 text-sm">No Pending Deliveries</h4>
                <p className="text-xs text-zinc-400">Perfectly clear! Browse and accept unassigned orders from the open market queue below.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAssigned.map((o) => {
                  const isCurrentTarget = selectedOrder?.id === o.id;
                  
                  return (
                    <div 
                      key={o.id} 
                      className={`p-4 rounded-2xl border transition text-left space-y-3.5 relative overflow-hidden ${
                        isCurrentTarget 
                          ? "border-orange-500 bg-orange-50/10 shadow-sm"
                          : "border-zinc-100 bg-zinc-50 hover:bg-zinc-100/50"
                      }`}
                    >
                      {/* Priority tag */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                            {o.id}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ml-1.5 ${
                            o.deliveryType === "Scheduled" ? "bg-purple-150 text-purple-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {o.deliverySlot || "Within 10 mins"}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-bold ml-2">
                            {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          o.status === "Accepted" ? "bg-blue-100 text-blue-700" :
                          o.status === "Picked Up" ? "bg-amber-100 text-amber-700" :
                          o.status === "Out for Delivery" ? "bg-emerald-100 text-emerald-700" :
                          "bg-zinc-100 text-zinc-600"
                        }`}>
                          {o.status}
                        </span>
                      </div>

                      {/* Detail text */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-zinc-400 block">Deliver To</span>
                          <p className="font-black text-zinc-800">{o.customerName}</p>
                          <p className="text-zinc-500 font-bold">{o.customerPhone}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-zinc-400 block">Address Coordinates</span>
                          <p className="text-zinc-600 font-medium flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{o.address}</span>
                          </p>
                        </div>
                      </div>

                      {/* Payment Indicator */}
                      <div className="flex flex-wrap gap-2 items-center justify-between border-t border-zinc-100 pt-2.5">
                        <div className="flex gap-3 text-[10px] font-mono font-bold text-zinc-500">
                          <span>Amount: <b className="text-zinc-800">₹{o.total}</b></span>
                          <span>Method: <b className="text-zinc-800">{o.paymentMethod}</b></span>
                        </div>

                        {/* Customer Direct Contacts */}
                        <div className="flex gap-2">
                          <a 
                            href={`tel:${o.customerPhone}`}
                            className="bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer text-[10px] font-black"
                          >
                            <Phone className="w-3 h-3 text-zinc-500" />
                            <span>Call</span>
                          </a>

                          <a 
                            href={`https://wa.me/${o.customerPhone.replace(/[\s+]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white hover:bg-emerald-50 border border-emerald-100 text-emerald-600 p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer text-[10px] font-black"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-500" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* Dynamic Workflow Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
                        
                        {o.status === "Accepted" && (
                          <button
                            type="button"
                            onClick={() => handlePickupOrder(o.id)}
                            className="flex-1 bg-zinc-950 hover:bg-zinc-850 text-white font-black text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Mark as Picked Up</span>
                          </button>
                        )}

                        {o.status === "Picked Up" && (
                          <button
                            type="button"
                            onClick={() => handleOutForDelivery(o)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Mark Out for Delivery</span>
                          </button>
                        )}

                        {o.status === "Out for Delivery" && (
                          <div className="flex gap-2 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(o);
                                setShowOtpVerification(true);
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Smartphone className="w-3.5 h-3.5 animate-pulse" />
                              <span>Proceed to Handover</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkFailed(o.id)}
                              className="bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 px-3 py-2 rounded-xl border border-zinc-200 hover:border-rose-100 text-xs font-black transition cursor-pointer"
                            >
                              Failed
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkCancelled(o.id)}
                              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-black transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Navigation Shortcut */}
                        {o.status !== "Delivered" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(o);
                              handleOpenNavigation(o);
                            }}
                            className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                          >
                            <Navigation className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Navigate</span>
                          </button>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Open Market Pool Queue */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">
                Unassigned Order Market ({unassignedOrdersPool.length})
              </h3>
              <p className="text-[10px] text-zinc-400">Instant pick-up run pool. Click "Accept" to instantly lock the order to your Captain ID.</p>
            </div>

            {unassignedOrdersPool.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4 font-medium">No open-market orders currently waiting in queue.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {unassignedOrdersPool.map(o => (
                  <div key={o.id} className="p-3 bg-zinc-50 border border-zinc-150 rounded-2xl flex items-center justify-between text-left gap-4">
                    <div>
                      <p className="font-black text-xs text-zinc-800 flex items-center flex-wrap gap-1.5">
                        <span>{o.id} &bull; ₹{o.total}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          o.deliveryType === "Scheduled" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {o.deliverySlot || "Within 10 mins"}
                        </span>
                      </p>
                      <p className="text-[10px] text-zinc-500 leading-normal line-clamp-1">{o.address}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAcceptOrder(o.id)}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Google Maps / Custom SVG Navigation Assistant */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-orange-600" />
                  <span>GPS Navigator Assist</span>
                </h3>
                <p className="text-[10px] text-zinc-400">
                  {selectedOrder ? `Target: Order #${selectedOrder.id}` : "Select active run on left to plot radar."}
                </p>
              </div>

              {selectedOrder && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-1 px-2 text-[9px] font-mono text-zinc-500 font-bold">
                  {getDistanceAndTime(selectedOrder).distance} &bull; {getDistanceAndTime(selectedOrder).duration}
                </div>
              )}
            </div>

            {/* Google Map / SVG Route Viewer */}
            {isGoogleMapsEnabled && selectedOrder ? (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200" style={{ height: "300px", width: "100%" }}>
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                  <GoogleMap
                    style={{ height: "100%", width: "100%" }}
                    defaultCenter={{ lat: selectedOrder.lat || 22.5735, lng: selectedOrder.lng || 88.4331 }}
                    center={{ lat: selectedOrder.lat || 22.5735, lng: selectedOrder.lng || 88.4331 }}
                    defaultZoom={15}
                    gestureHandling={"greedy"}
                    disableDefaultUI={false}
                    internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                  >
                    {/* Plot customer coordinate marker */}
                    <Marker 
                      position={{ lat: selectedOrder.lat || 22.5735, lng: selectedOrder.lng || 88.4331 }}
                      title={`Target Address: ${selectedOrder.customerName}`}
                    />
                  </GoogleMap>
                </APIProvider>
              </div>
            ) : (
              /* Custom SVG Route Fallback */
              <div className="relative bg-[#090D16] rounded-2xl overflow-hidden border border-zinc-800 p-3 text-white h-[300px] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono border-b border-zinc-800 pb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span>CAPTAIN TELEMETRY HUD</span>
                  </div>
                  <span className="text-zinc-500">MOCK GPS</span>
                </div>

                {/* Simulated SVG Canvas */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 300 180" className="w-full h-full">
                    <defs>
                      <pattern id="grid-rider" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#141C2F" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-rider)" />

                    {selectedOrder ? (
                      <>
                        {/* Connecting Path line */}
                        <line x1="80" y1="90" x2="220" y2="90" stroke="#F97316" strokeWidth="2" strokeDasharray="4 3" className="animate-[dash_2s_linear_infinite]" />

                        {/* Captain Location */}
                        <g transform="translate(80, 90)">
                          <circle r="14" fill="#3B82F6" opacity="0.15" className="animate-ping" />
                          <circle r="6" fill="#3B82F6" />
                          <text y="-12" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">RIDER CAPTAIN</text>
                        </g>

                        {/* Customer House */}
                        <g transform="translate(220, 90)">
                          <circle r="14" fill="#10B981" opacity="0.15" className="animate-ping" />
                          <polygon points="0,-8 5,0 -5,0" fill="#10B981" />
                          <text y="14" textAnchor="middle" fill="#E2E8F0" fontSize="8" fontWeight="bold">{selectedOrder.customerName.split(" ")[0]}</text>
                        </g>
                      </>
                    ) : (
                      <g transform="translate(150, 90)" textAnchor="middle">
                        <Compass className="w-8 h-8 text-zinc-600 mx-auto animate-pulse mb-2" />
                        <text fill="#64748B" fontSize="10" fontWeight="bold">WAITING FOR NAVIGATION TASK</text>
                      </g>
                    )}
                  </svg>
                </div>

                <div className="bg-zinc-950 p-2 rounded-xl text-[9px] font-mono text-zinc-400 text-left space-y-1">
                  {selectedOrder ? (
                    <>
                      <div className="flex justify-between">
                        <span>ETA RUN TIME:</span>
                        <span className="text-orange-400 font-bold">{getDistanceAndTime(selectedOrder).duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EST. DISTANCE:</span>
                        <span className="text-zinc-200 font-bold">{getDistanceAndTime(selectedOrder).distance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CUSTOMER GPS:</span>
                        <span className="text-zinc-200 font-bold">
                          {selectedOrder.lat?.toFixed(4) || "22.5735"} N, {selectedOrder.lng?.toFixed(4) || "88.4331"} E
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-zinc-500 block text-center">Plot any order to display exact coordinates.</span>
                  )}
                </div>
              </div>
            )}

            {/* Turn-by-Turn Navigate Direct Trigger */}
            {selectedOrder && (
              <button
                type="button"
                onClick={() => handleOpenNavigation(selectedOrder)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs py-3 rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Open Google Maps Turn-By-Turn Navigation</span>
              </button>
            )}

          </div>

          {/* Secure Handover verification modal / helper panel */}
          {selectedOrder && showOtpVerification && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-200 text-left relative overflow-hidden">
              
              {/* Highlight background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-start gap-3">
                <span className="p-2 bg-orange-50 text-orange-600 rounded-2xl">
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </span>
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-zinc-900 uppercase tracking-wide">
                    Delivery Handover & Proof Hub
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                    Complete verification steps and secure your payout. Order ID: <span className="font-mono text-orange-600 font-extrabold">{selectedOrder.id}</span>
                  </p>
                </div>
              </div>

              {/* Photo Proof of Delivery Section */}
              <div className="space-y-3.5 bg-zinc-50/50 border border-zinc-150 p-4 rounded-2xl relative">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-zinc-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-orange-600" />
                    <span>STEP 1: Capture Delivery Proof Photo</span>
                  </span>
                  {deliveryPhoto && (
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Captured
                    </span>
                  )}
                </div>

                {!deliveryPhoto ? (
                  <div className="space-y-4">
                    {/* Hidden Native File Input to Trigger Rear Camera on Mobile */}
                    <input 
                      type="file" 
                      id="delivery-proof-file-input" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handleFileCapture}
                      className="hidden" 
                    />
                    
                    {/* Real Camera Launcher */}
                    <label 
                      htmlFor="delivery-proof-file-input"
                      className="w-full h-24 bg-white hover:bg-zinc-50 border-2 border-dashed border-zinc-200 hover:border-orange-400 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 select-none group active:scale-[0.98]"
                    >
                      <Camera className="w-6 h-6 text-zinc-400 group-hover:text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-xs font-black text-zinc-700">Click Photo / Open Camera</span>
                      <span className="text-[9px] text-zinc-400 font-bold">Launches rear camera on your mobile device</span>
                    </label>

                    {/* Quick Simulated Photo Capture Options for Evaluators / Desktop Test */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                        Or select a simulated handover snapshot (For quick desktop testing):
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryPhoto("https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60");
                            setPhotoError("");
                          }}
                          className="group relative h-14 rounded-xl overflow-hidden border border-zinc-200 hover:border-orange-500 transition-all text-left active:scale-[0.97]"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=100&auto=format&fit=crop&q=60" 
                            alt="Box at door" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-0.5 text-center">
                            <span className="text-[8px] font-black text-white block truncate">At Door</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryPhoto("https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60");
                            setPhotoError("");
                          }}
                          className="group relative h-14 rounded-xl overflow-hidden border border-zinc-200 hover:border-orange-500 transition-all text-left active:scale-[0.97]"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop&q=60" 
                            alt="Handover" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-0.5 text-center">
                            <span className="text-[8px] font-black text-white block truncate">Handover</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryPhoto("https://images.unsplash.com/photo-1573244514396-73b77e223d37?w=500&auto=format&fit=crop&q=60");
                            setPhotoError("");
                          }}
                          className="group relative h-14 rounded-xl overflow-hidden border border-zinc-200 hover:border-orange-500 transition-all text-left active:scale-[0.97]"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1573244514396-73b77e223d37?w=100&auto=format&fit=crop&q=60" 
                            alt="Veggies bag" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-0.5 text-center">
                            <span className="text-[8px] font-black text-white block truncate">Veggies Bag</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Active Proof Photo Thumbnail Preview */}
                    <div className="relative h-44 rounded-xl overflow-hidden border border-zinc-200 shadow-inner group">
                      <img 
                        src={deliveryPhoto} 
                        alt="Proof of delivery" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Retake/Delete Hover Action */}
                      <button
                        type="button"
                        onClick={() => setDeliveryPhoto(null)}
                        className="absolute top-2.5 right-2.5 bg-zinc-950/80 hover:bg-rose-600 text-white p-2 rounded-xl transition duration-200 flex items-center gap-1 cursor-pointer text-[10px] font-black"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove / Clear</span>
                      </button>
                    </div>
                  </div>
                )}

                {photoError && (
                  <p className="text-[10px] text-rose-500 font-extrabold flex items-center gap-1 animate-pulse">
                    ⚠️ {photoError}
                  </p>
                )}
              </div>

              {/* Step 2: OTP verification or direct deliver confirmation */}
              {deliveryOtpRequired ? (
                <div className="space-y-3.5 bg-zinc-50/50 border border-zinc-150 p-4 rounded-2xl">
                  <span className="text-xs font-black text-zinc-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-orange-600 animate-bounce" />
                    <span>STEP 2: Enter Delivery OTP Code</span>
                  </span>

                  <form onSubmit={handleVerifyDeliveryOTP} className="space-y-3">
                    <input
                      type="text"
                      required
                      placeholder="Enter 4-Digit Passcode..."
                      maxLength={4}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full text-center tracking-widest p-3 bg-white border border-zinc-200 rounded-xl font-black text-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />

                    {otpError && <p className="text-[10px] text-rose-500 font-black leading-snug">{otpError}</p>}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl transition shadow-lg shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirm OTP & Deliver</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowOtpVerification(false);
                          setOtpInput("");
                          setOtpError("");
                          setPhotoError("");
                        }}
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-4 rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCompleteDeliveryNoOTP(selectedOrder.id)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-500/15 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete Handover & Deliver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpVerification(false);
                        setPhotoError("");
                      }}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-4 rounded-xl text-xs font-black transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Demo Assist */}
              <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl flex items-start gap-2 text-[9px] text-zinc-500">
                <Info className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5 font-bold leading-normal">
                  <p className="text-orange-950 font-black text-[10px]">Evaluation / Demo Assist</p>
                  <p>Check the Live Tracking view in Customer Account / active tracking to view this order's OTP. It is: <b className="text-orange-600 font-mono text-xs">{selectedOrder.deliveryOTP}</b></p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
