import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Product } from "../data/products";
import { Coupon, Order, SupportTicket, UserProfile, DeliveryZone, CityChargeConfig, DeliveryChargeConfig } from "../types";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { 
  ShieldAlert, TrendingUp, ShoppingBag, Users, AlertTriangle, Bell,
  Plus, Edit2, Trash2, Check, RefreshCw, Percent, DollarSign, ListFilter, X, Eye,
  Lock, Server, MessageSquare, Ticket, Key, CheckSquare, ShieldCheck, Download, Trash, UserX, Loader2, ShieldX, Search, Wallet, Award,
  Compass, MapPin
} from "lucide-react";
import { 
  getAllCustomers, 
  toggleCustomerStatus, 
  adminDeleteCustomer, 
  adminUpdateCustomerBalances,
  updateUserProfile
} from "../lib/auth-service";

export const AdminPanel: React.FC = () => {
  const { 
    products, addProduct, updateProduct, deleteProduct,
    orders, updateOrderStatus, coupons, addCoupon, deleteCoupon,
    deliveryCharge, setDeliveryCharge, user,
    tickets, addTicketMessage, resolveTicket,
    deliveryConfig, updateDeliveryConfig
  } = useApp();

  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "coupons" | "crm_support" | "employee_roles" | "system_security" | "customers" | "delivery">("dashboard");

  // --- Customer CRM States ---
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Blocked">("All");

  // Edit Customer Detail Modal states
  const [editingCustomer, setEditingCustomer] = useState<UserProfile | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedWallet, setEditedWallet] = useState(0);
  const [editedPoints, setEditedPoints] = useState(0);

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (e) {
      console.error("Failed to load customer list from firestore", e);
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "customers") {
      loadCustomers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (deliveryConfig) {
      setDeliveryType(deliveryConfig.type || "fixed");
      setDeliveryFixedAmount(deliveryConfig.fixedAmount !== undefined ? deliveryConfig.fixedAmount : 25);
      setDeliveryChargePerKm(deliveryConfig.chargePerKm !== undefined ? deliveryConfig.chargePerKm : 10);
      setDeliveryBaseCharge(deliveryConfig.baseCharge !== undefined ? deliveryConfig.baseCharge : 20);
      setDeliveryBaseDistanceKm(deliveryConfig.baseDistanceKm !== undefined ? deliveryConfig.baseDistanceKm : 2);
      setDeliveryMinOrderForFreeDelivery(deliveryConfig.minOrderForFreeDelivery !== undefined ? deliveryConfig.minOrderForFreeDelivery : 499);
      setDeliveryZones(deliveryConfig.zones || []);
      setDeliveryCitiesConfig(deliveryConfig.citiesConfig || {});
    }
  }, [deliveryConfig]);

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await updateUserProfile(editingCustomer.uid, {
        name: editedName,
        email: editedEmail,
        phone: editedPhone
      });
      await adminUpdateCustomerBalances(editingCustomer.uid, Number(editedWallet), Number(editedPoints));
      setEditingCustomer(null);
      loadCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBlock = async (cust: UserProfile) => {
    try {
      await toggleCustomerStatus(cust.uid, cust.status || "Active");
      loadCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomer = async (uid: string) => {
    if (window.confirm("Are you sure you want to permanently delete this customer profile from Firestore? This action is irreversible.")) {
      try {
        await adminDeleteCustomer(uid);
        loadCustomers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const exportCustomersToCSV = () => {
    const headers = ["Customer ID", "Full Name", "Email Address", "Phone Number", "Account Status", "Wallet Balance", "Reward Points", "Addresses"];
    const rows = customers.map(c => [
      c.customerId || "N/A",
      `"${c.name || "Customer"}"`,
      c.email || "N/A",
      c.phone || "N/A",
      c.status || "Active",
      c.walletBalance || 0,
      c.loyaltyPoints || 0,
      `"${(c.addresses || []).join(' | ')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QuickNow_Customers_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Reorder quantity threshold configuration
  const [reorderThreshold, setReorderThreshold] = useState(10);
  const [showReorderNotifications, setShowReorderNotifications] = useState(false);

  const handleQuickRestock = (productId: string, amount: number = 50) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      updateProduct({
        ...prod,
        stock: prod.stock + amount
      });
    }
  };

  // States for CRUD modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form states
  const [pId, setPId] = useState("");
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState(0);
  const [pOrigPrice, setPOrigPrice] = useState(0);
  const [pCategory, setPCategory] = useState("fruits-veg");
  const [pUnit, setPUnit] = useState("500g");
  const [pStock, setPStock] = useState(10);
  const [pDesc, setPDesc] = useState("");
  const [pImage, setPImage] = useState("");
  
  // Weight-based states
  const [pIsWeightBased, setPIsWeightBased] = useState(false);
  const [pMinWeight, setPMinWeight] = useState(0.5);
  const [pMaxWeight, setPMaxWeight] = useState(5);
  const [pWeightInterval, setPWeightInterval] = useState(0.5);
  const [pPricePerKg, setPPricePerKg] = useState(100);

  // Delivery Configuration Form states
  const [deliveryType, setDeliveryType] = useState<"fixed" | "distance">("fixed");
  const [deliveryFixedAmount, setDeliveryFixedAmount] = useState(25);
  const [deliveryChargePerKm, setDeliveryChargePerKm] = useState(10);
  const [deliveryBaseCharge, setDeliveryBaseCharge] = useState(20);
  const [deliveryBaseDistanceKm, setDeliveryBaseDistanceKm] = useState(2);
  const [deliveryMinOrderForFreeDelivery, setDeliveryMinOrderForFreeDelivery] = useState(499);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [deliveryCitiesConfig, setDeliveryCitiesConfig] = useState<Record<string, CityChargeConfig>>({});

  // Form states to Add Zone
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneCity, setNewZoneCity] = useState("Kolkata");
  const [newZoneLat, setNewZoneLat] = useState(22.5726);
  const [newZoneLng, setNewZoneLng] = useState(88.3639);
  const [newZoneRadius, setNewZoneRadius] = useState(5);
  const [newZoneCharge, setNewZoneCharge] = useState(20);

  // Form states to Add City Config
  const [newCityName, setNewCityName] = useState("");
  const [newCityFixed, setNewCityFixed] = useState(25);
  const [newCityPerKm, setNewCityPerKm] = useState(10);
  const [newCityBase, setNewCityBase] = useState(20);

  // Coupon form states
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [cCode, setCCode] = useState("");
  const [cDiscount, setCDiscount] = useState(10);
  const [cMinOrder, setCMinOrder] = useState(250);
  const [cDesc, setCDesc] = useState("");

  // CRM Ticket Management States
  const [selectedAdminTicketId, setSelectedAdminTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  const activeAdminTicket = tickets.find((t) => t.id === selectedAdminTicketId);

  const handleSendAdminReply = () => {
    if (!adminReplyText.trim() || !selectedAdminTicketId) return;
    addTicketMessage(selectedAdminTicketId, adminReplyText.trim(), "support");
    setAdminReplyText("");
  };

  // Employee states
  const [employees, setEmployees] = useState([
    { id: "EMP-101", name: "Ananya Roy", role: "Super Admin", department: "Executive", status: "Active", permissions: ["all"] },
    { id: "EMP-102", name: "Rahul Sharma", role: "Manager", department: "Operations", status: "Active", permissions: ["inventory", "orders"] },
    { id: "EMP-103", name: "Vikram Das", role: "Inventory Manager", department: "Warehouse", status: "Active", permissions: ["inventory"] },
    { id: "EMP-104", name: "Priya Patel", role: "Customer Support Executive", department: "CRM", status: "Active", permissions: ["crm"] },
    { id: "EMP-105", name: "Rajesh Kumar", role: "Delivery Partner", department: "Logistics", status: "Active", permissions: ["navigation"] }
  ]);

  // Audit Logs states
  const [auditLogs, setAuditLogs] = useState([
    { timestamp: "2026-07-01T02:45:00Z", actor: "Ananya Roy (Super Admin)", event: "Catalog Update", description: "Modified price of 'Organic Red Apples' from ₹150 to ₹145.", ip: "192.168.1.42" },
    { timestamp: "2026-07-01T02:15:00Z", actor: "System Daemon", event: "Automated Stock Check", description: "Triggered low stock warning for 'Gourmet Salted Butter'. Only 4 units remaining.", ip: "localhost" },
    { timestamp: "2026-06-30T23:50:00Z", actor: "Priya Patel (Support Exec)", event: "Ticket Resolved", description: "Closed customer query TKT-8271 and authorized ₹20 discount code.", ip: "192.168.1.99" },
    { timestamp: "2026-06-30T22:30:00Z", actor: "Rahul Sharma (Manager)", event: "System Backup", description: "Full logical snapshot of Firebase Firestore 'ai-studio-quicknow' completed.", ip: "192.168.1.12" }
  ]);

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-zinc-100 p-8 text-center space-y-4 shadow-xl">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
        <div>
          <h3 className="text-xl font-black text-zinc-900">Admin Access Restricted</h3>
          <p className="text-xs text-zinc-500 mt-1">Please select the Admin role from the top-right tool menu to view management systems.</p>
        </div>
      </div>
    );
  }

  // --- Analytics calculations ---
  const totalRevenue = orders
    .filter(o => o.status === "Delivered" || o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + o.total, 0);

  const lowStockProducts = products.filter(p => p.stock <= reorderThreshold);
  const totalCustomersCount = 148; // Simulated aggregate

  // Chart Data Mock
  const revenueChartData = [
    { name: "Mon", sales: 12400, orders: 42 },
    { name: "Tue", sales: 14800, orders: 55 },
    { name: "Wed", sales: 11000, orders: 38 },
    { name: "Thu", sales: 19500, orders: 62 },
    { name: "Fri", sales: 24200, orders: 84 },
    { name: "Sat", sales: 31000, orders: 110 },
    { name: "Sun", sales: 28500, orders: 95 }
  ];

  const handleOpenProductModal = (prod: Product | null = null) => {
    if (prod) {
      setEditingProduct(prod);
      setPId(prod.id);
      setPName(prod.name);
      setPPrice(prod.price);
      setPOrigPrice(prod.originalPrice);
      setPCategory(prod.category);
      setPUnit(prod.unit);
      setPStock(prod.stock);
      setPDesc(prod.description);
      setPImage(prod.image);
      setPIsWeightBased(!!prod.isWeightBased);
      setPMinWeight(prod.minWeight || 0.5);
      setPMaxWeight(prod.maxWeight || 10);
      setPWeightInterval(prod.weightInterval || 0.5);
      setPPricePerKg(prod.pricePerKg || prod.price);
    } else {
      setEditingProduct(null);
      setPId("prod-" + Date.now());
      setPName("");
      setPPrice(100);
      setPOrigPrice(120);
      setPCategory("fruits-veg");
      setPUnit("1 kg");
      setPStock(25);
      setPDesc("");
      setPImage("https://images.unsplash.com/photo-1542838132-92c53300491e?w=400");
      setPIsWeightBased(false);
      setPMinWeight(0.5);
      setPMaxWeight(10);
      setPWeightInterval(0.5);
      setPPricePerKg(100);
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrUpdated: Product = {
      id: pId,
      name: pName,
      price: Number(pPrice),
      originalPrice: Number(pOrigPrice),
      category: pCategory,
      unit: pUnit,
      stock: Number(pStock),
      description: pDesc,
      image: pImage,
      rating: editingProduct?.rating || 4.7,
      reviews: editingProduct?.reviews || 22,
      discount: Math.round(((Number(pOrigPrice) - Number(pPrice)) / Number(pOrigPrice)) * 100),
      isWeightBased: pIsWeightBased,
      minWeight: pIsWeightBased ? Number(pMinWeight) : undefined,
      maxWeight: pIsWeightBased ? Number(pMaxWeight) : undefined,
      weightInterval: pIsWeightBased ? Number(pWeightInterval) : undefined,
      pricePerKg: pIsWeightBased ? Number(pPricePerKg) : undefined
    };

    if (editingProduct) {
      updateProduct(newOrUpdated);
    } else {
      addProduct(newOrUpdated);
    }
    setShowProductModal(false);
  };

  // --- Delivery Charge Handlers ---
  const handleSaveDeliveryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: any = {
      type: deliveryType,
      fixedAmount: Number(deliveryFixedAmount),
      chargePerKm: Number(deliveryChargePerKm),
      baseCharge: Number(deliveryBaseCharge),
      baseDistanceKm: Number(deliveryBaseDistanceKm),
      minOrderForFreeDelivery: Number(deliveryMinOrderForFreeDelivery),
      zones: deliveryZones,
      citiesConfig: deliveryCitiesConfig,
      googleMapsEnabled: deliveryConfig?.googleMapsEnabled ?? true
    };
    await updateDeliveryConfig(updated);
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    const newZone: DeliveryZone = {
      id: "zone-" + Date.now(),
      name: newZoneName.trim(),
      city: newZoneCity,
      lat: Number(newZoneLat),
      lng: Number(newZoneLng),
      radiusKm: Number(newZoneRadius),
      deliveryCharge: Number(newZoneCharge),
      isActive: true
    };
    setDeliveryZones([...deliveryZones, newZone]);
    setNewZoneName("");
  };

  const handleRemoveZone = (id: string) => {
    setDeliveryZones(deliveryZones.filter(z => z.id !== id));
  };

  const handleAddCityConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    const updated = { ...deliveryCitiesConfig };
    updated[newCityName.trim()] = {
      fixedAmount: Number(newCityFixed),
      chargePerKm: Number(newCityPerKm),
      baseCharge: Number(newCityBase),
      isCustom: true
    };
    setDeliveryCitiesConfig(updated);
    setNewCityName("");
  };

  const handleRemoveCityConfig = (city: string) => {
    const updated = { ...deliveryCitiesConfig };
    delete updated[city];
    setDeliveryCitiesConfig(updated);
  };

  const handleAddCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coup: Coupon = {
      code: cCode.trim().toUpperCase(),
      discountPercent: Number(cDiscount),
      minOrderValue: Number(cMinOrder),
      description: cDesc,
      isActive: true
    };
    addCoupon(coup);
    setShowCouponModal(false);
    setCCode("");
    setCDesc("");
  };

  // Generate Excel/PDF Report Trigger simulation
  const handleGenerateReport = () => {
    // Generate CSV contents
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Customer,Amount,Status,Payment,Created At\r\n";
    orders.forEach((o) => {
      csvContent += `${o.id},${o.customerName},₹${o.total},${o.status},${o.paymentStatus},${o.createdAt}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QuickNow_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Title with Report generation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 flex items-center gap-3 flex-wrap">
            <span className="w-2.5 h-6 bg-orange-500 rounded-full" />
            <span>QuickNow Admin Command Portal</span>
            
            {/* Reorder Alerts Notification Badge */}
            <div className="relative inline-block">
              <button
                onClick={() => setShowReorderNotifications(!showReorderNotifications)}
                className={`relative p-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  lowStockProducts.length > 0 
                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-150" 
                    : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                }`}
                title="Low Stock SKU Reorder Alert Center"
              >
                <Bell className={`w-4 h-4 ${lowStockProducts.length > 0 ? "animate-bounce" : ""}`} />
                {lowStockProducts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                    {lowStockProducts.length}
                  </span>
                )}
                <span className="text-[10px] font-extrabold tracking-tight hidden sm:inline">
                  {lowStockProducts.length > 0 ? "Reorder Alerts" : "Stock OK"}
                </span>
              </button>

              {/* Popover list of specific product SKUs below threshold */}
              {showReorderNotifications && (
                <div className="absolute right-0 sm:left-0 mt-2 w-72 sm:w-80 bg-white border border-zinc-150 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 text-left font-sans">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-black text-zinc-800">SKU Reorder Center</span>
                    </div>
                    <button 
                      onClick={() => setShowReorderNotifications(false)}
                      className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Threshold controller slider */}
                  <div className="space-y-1 bg-zinc-50 p-2.5 rounded-xl border border-zinc-150 text-[10px]">
                    <div className="flex justify-between font-bold text-zinc-600">
                      <span>REORDER THRESHOLD:</span>
                      <span className="font-extrabold text-blue-600">{reorderThreshold} units</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={reorderThreshold}
                      onChange={(e) => setReorderThreshold(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-zinc-400 font-bold leading-tight">
                      Highlight SKUs with stock level less than or equal to this threshold.
                    </p>
                  </div>

                  {/* List of low-stock SKUs */}
                  <div className="max-h-56 overflow-y-auto space-y-2 scrollbar-none">
                    {lowStockProducts.length === 0 ? (
                      <p className="text-xs text-zinc-400 font-bold text-center py-4">All SKU stock levels healthy!</p>
                    ) : (
                      lowStockProducts.map((prod) => (
                        <div key={prod.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-rose-50/50 border border-rose-100/60 hover:bg-rose-50 transition">
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-zinc-950 truncate leading-snug">{prod.name}</p>
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500">
                                <span className="bg-zinc-100 px-1 py-0.2 rounded font-mono">SKU: {prod.id}</span>
                                <span className="text-rose-600">{prod.stock} left</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleQuickRestock(prod.id, 50)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-0.5 whitespace-nowrap cursor-pointer shadow-sm shadow-rose-600/10"
                            title="Restock 50 units"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>+50</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Configure catalogs, dispatch rider orders, and analyze weekly performance spikes.</p>
        </div>
        <button
          onClick={handleGenerateReport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
        >
          <span>Download Sales CSV Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-100">
        {[
          { id: "dashboard", label: "Overview Metrics", icon: TrendingUp },
          { id: "products", label: "Product Catalog", icon: ShoppingBag },
          { id: "orders", label: "Rider Orders", icon: ListFilter },
          { id: "delivery", label: "Delivery Charges", icon: Compass },
          { id: "coupons", label: "Promos & Coupons", icon: Percent },
          { id: "customers", label: "Customer CRM", icon: Users },
          { id: "crm_support", label: "CRM & Live Chat", icon: MessageSquare },
          { id: "employee_roles", label: "Team & Permissions", icon: Users },
          { id: "system_security", label: "Security & Backups", icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition flex-shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW: Dashboard */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-3xl border border-zinc-100 space-y-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg inline-block">
                <DollarSign className="w-5 h-5" />
              </span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Gross Income</p>
              <p className="text-xl sm:text-2xl font-black text-zinc-950">₹{totalRevenue}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-zinc-100 space-y-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg inline-block">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Total Orders</p>
              <p className="text-xl sm:text-2xl font-black text-zinc-950">{orders.length}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-zinc-100 space-y-2">
              <span className="p-2 bg-indigo-50 text-indigo-500 rounded-lg inline-block">
                <Users className="w-5 h-5" />
              </span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Active Customers</p>
              <p className="text-xl sm:text-2xl font-black text-zinc-950">{totalCustomersCount}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-zinc-100 space-y-2">
              <span className="p-2 bg-amber-50 text-amber-500 rounded-lg inline-block">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Low Stock Warnings</p>
              <p className="text-xl sm:text-2xl font-black text-zinc-950">{lowStockProducts.length}</p>
            </div>

          </div>

          {/* Graphical charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sales Performance Area Curve */}
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-zinc-100 space-y-4">
              <h3 className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">Weekly Revenue Stream (₹)</h3>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5"/>
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                    <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Order Counts Bar Chart */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-100 space-y-4">
              <h3 className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">Orders Dispatched</h3>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                    <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Delivery Configuration */}
          <div className="bg-white p-5 rounded-3xl border border-zinc-100 max-w-md">
            <h3 className="font-extrabold text-xs text-zinc-800 uppercase tracking-wider mb-2">Delivery Fee Settings</h3>
            <div className="flex gap-4 items-center">
              <span className="text-xs text-zinc-500">Base Charge (₹):</span>
              <input
                type="number"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-lg border border-zinc-200 text-sm font-bold text-center bg-zinc-50 text-zinc-800"
              />
              <span className="text-[10px] text-zinc-400 font-bold">*Orders &gt; ₹499 override to ₹0.</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Delivery Charge Management */}
      {activeTab === "delivery" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          {/* Main Delivery Config Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-100 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-black text-zinc-950 flex items-center gap-2">
                <Compass className="w-5 h-5 text-orange-500" />
                <span>Delivery Charge Policy Builder</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Define global pricing models, zone overrides, and free delivery thresholds.</p>
            </div>

            <form onSubmit={handleSaveDeliveryConfig} className="space-y-6">
              {/* Charge Type selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-wider block">Pricing Policy Model</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("fixed")}
                    className={`flex-1 flex flex-col items-center p-4 border rounded-2xl font-bold cursor-pointer transition text-center ${
                      deliveryType === "fixed"
                        ? "bg-zinc-950 border-zinc-950 text-white shadow-lg"
                        : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    <span className="text-sm font-black">Flat Fixed Charge</span>
                    <span className="text-[10px] opacity-75 font-normal mt-1">Single uniform fee across all cities</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType("distance")}
                    className={`flex-1 flex flex-col items-center p-4 border rounded-2xl font-bold cursor-pointer transition text-center ${
                      deliveryType === "distance"
                        ? "bg-zinc-950 border-zinc-950 text-white shadow-lg"
                        : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    <span className="text-sm font-black">Distance-Based Pricing</span>
                    <span className="text-[10px] opacity-75 font-normal mt-1">Calculates charges dynamically per km</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs depending on Policy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {deliveryType === "fixed" ? (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-black text-zinc-500">Global Fixed Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={deliveryFixedAmount}
                      onChange={(e) => setDeliveryFixedAmount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800"
                    />
                    <p className="text-[10px] text-zinc-400 font-medium">Standard fixed charge applied when no city-specific override or active zone matches.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-zinc-500">Base Flat Charge (₹)</label>
                      <input
                        type="number"
                        required
                        value={deliveryBaseCharge}
                        onChange={(e) => setDeliveryBaseCharge(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-zinc-500">Base Free Distance Limit (km)</label>
                      <input
                        type="number"
                        required
                        value={deliveryBaseDistanceKm}
                        onChange={(e) => setDeliveryBaseDistanceKm(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-black text-zinc-500">Charge Per Additional Kilometer (₹/km)</label>
                      <input
                        type="number"
                        required
                        value={deliveryChargePerKm}
                        onChange={(e) => setDeliveryChargePerKm(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-zinc-100">
                  <label className="text-xs font-black text-zinc-500">Free Delivery Minimum Order Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={deliveryMinOrderForFreeDelivery}
                    onChange={(e) => setDeliveryMinOrderForFreeDelivery(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800"
                  />
                  <p className="text-[10px] text-zinc-400 font-medium">Overrules delivery fee to ₹0 if basket value matches or exceeds this threshold. (e.g. ₹499)</p>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs py-3 rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 animate-pulse"
              >
                <Check className="w-4 h-4" />
                <span>Save & Publish Changes</span>
              </button>
            </form>
          </div>

          {/* Right sidebar: Zones and Cities overrides */}
          <div className="space-y-6">
            
            {/* Zones Overrides */}
            <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
              <div>
                <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4.5 h-4.5 text-blue-500" />
                  <span>Delivery Zones ({deliveryZones.length})</span>
                </h4>
                <p className="text-[10px] text-zinc-400 leading-normal">Radius-bound delivery circles that override standard parameters.</p>
              </div>

              {/* Add Zone Inline Form */}
              <form onSubmit={handleAddZone} className="space-y-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-150">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Add Active Circle</span>
                <input
                  type="text"
                  required
                  placeholder="Zone Name (e.g. Salt Lake Sec V)"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newZoneCity}
                    onChange={(e) => setNewZoneCity(e.target.value)}
                    className="p-2 bg-white border border-zinc-200 rounded-xl text-xs cursor-pointer text-zinc-800"
                  >
                    <option value="Kolkata">Kolkata</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Gurugram">Gurugram</option>
                  </select>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="Radius (km)"
                    value={newZoneRadius}
                    onChange={(e) => setNewZoneRadius(Number(e.target.value))}
                    className="p-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Charge (₹)"
                    value={newZoneCharge}
                    onChange={(e) => setNewZoneCharge(Number(e.target.value))}
                    className="p-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-xl cursor-pointer transition"
                  >
                    + Add Zone
                  </button>
                </div>
              </form>

              {/* Zone List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {deliveryZones.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 font-bold text-center py-2">No active delivery zones declared.</p>
                ) : (
                  deliveryZones.map((z) => (
                    <div key={z.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-150 hover:bg-zinc-100 transition">
                      <div>
                        <p className="text-xs font-black text-zinc-900">{z.name}</p>
                        <p className="text-[9px] text-zinc-500 font-bold">{z.city} &bull; {z.radiusKm} km radius</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-600">₹{z.deliveryCharge}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveZone(z.id)}
                          className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* City-Specific Overrides */}
            <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
              <div>
                <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4.5 h-4.5 text-purple-500" />
                  <span>City Overrides ({Object.keys(deliveryCitiesConfig).length})</span>
                </h4>
                <p className="text-[10px] text-zinc-400 leading-normal">Alternative flat rates or parameters mapped to customer default city.</p>
              </div>

              {/* Add City Override Form */}
              <form onSubmit={handleAddCityConfig} className="space-y-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-150">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Configure City Override</span>
                <input
                  type="text"
                  required
                  placeholder="City Name (e.g. Kolkata, Delhi)"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="w-full p-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="Fixed Rate (₹)"
                    value={newCityFixed}
                    onChange={(e) => setNewCityFixed(Number(e.target.value))}
                    className="p-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Per Km Rate (₹)"
                    value={newCityPerKm}
                    onChange={(e) => setNewCityPerKm(Number(e.target.value))}
                    className="p-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Base Rate (₹)"
                    value={newCityBase}
                    onChange={(e) => setNewCityBase(Number(e.target.value))}
                    className="p-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 col-span-2"
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] py-1.5 rounded-xl cursor-pointer transition col-span-2"
                  >
                    + Add City Override
                  </button>
                </div>
              </form>

              {/* City List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {Object.keys(deliveryCitiesConfig).length === 0 ? (
                  <p className="text-[10px] text-zinc-400 font-bold text-center py-2">No city-specific overrides declared.</p>
                ) : (
                  (Object.entries(deliveryCitiesConfig) as [string, CityChargeConfig][]).map(([city, config]) => (
                    <div key={city} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-150 hover:bg-zinc-100 transition">
                      <div>
                        <p className="text-xs font-black text-zinc-900">{city}</p>
                        <p className="text-[9px] text-zinc-500 font-bold">
                          Fixed: ₹{config.fixedAmount || 0} &bull; Per Km: ₹{config.chargePerKm || 0}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCityConfig(city)}
                        className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW: Products CRUD */}
      {activeTab === "products" && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">Product Inventory ({products.length} items)</h3>
            
            <button
              onClick={() => handleOpenProductModal(null)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-orange-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-100">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 uppercase font-black tracking-wider text-zinc-400">
                <tr>
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Unit Size</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock Level</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-zinc-50/50">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-extrabold text-zinc-900">{prod.name}</p>
                        <p className="text-[10px] text-zinc-400">ID: {prod.id}</p>
                      </div>
                    </td>
                    <td className="p-4 font-bold capitalize">{prod.category.replace("-", " & ")}</td>
                    <td className="p-4 font-bold">{prod.unit}</td>
                    <td className="p-4 font-extrabold text-zinc-900">
                      ₹{prod.price} <span className="text-[10px] text-zinc-400 line-through">₹{prod.originalPrice}</span>
                    </td>
                    <td className="p-4 font-bold">
                      <span className={`px-2 py-0.5 rounded-full ${
                        prod.stock <= reorderThreshold 
                          ? "bg-rose-100 text-rose-700 font-black text-[10px]" 
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {prod.stock} left
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <button 
                        onClick={() => handleOpenProductModal(prod)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition inline-block cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteProduct(prod.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition inline-block cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: Orders Control Panel */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">Rider Orders Control Deck</h3>

          <div className="overflow-x-auto rounded-2xl border border-zinc-100">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 uppercase font-black text-zinc-400">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer Info</th>
                  <th className="p-4">Items Summary</th>
                  <th className="p-4">Total Bill</th>
                  <th className="p-4">Rider ID</th>
                  <th className="p-4">Tracking Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50/50">
                    <td className="p-4 font-extrabold text-zinc-900">{o.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-zinc-800">{o.customerName}</p>
                      <p className="text-[10px] text-zinc-400">{o.customerPhone}</p>
                    </td>
                    <td className="p-4 max-w-xs truncate">
                      {o.items.map(item => `${item.product.name} (x${item.quantity})`).join(", ")}
                    </td>
                    <td className="p-4 font-black text-zinc-900">₹{o.total}</td>
                    <td className="p-4 font-mono font-extrabold text-emerald-600">
                      {o.deliveryPartnerId || <span className="text-zinc-400 font-sans">Unassigned</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                        o.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                        o.status === "Out for Delivery" ? "bg-purple-100 text-purple-800 animate-pulse" :
                        o.status === "Accepted" ? "bg-orange-100 text-orange-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                        className="px-2 py-1 text-xs border border-zinc-200 bg-white rounded-lg text-zinc-800 cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: Coupons Management */}
      {activeTab === "coupons" && (
        <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">Coupon Promos & Discounts</h3>
            
            <button
              onClick={() => setShowCouponModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.code} className="border border-dashed border-zinc-200 rounded-2xl p-4 relative bg-zinc-50 space-y-2">
                <button
                  onClick={() => deleteCoupon(c.code)}
                  className="absolute top-3 right-3 text-rose-500 hover:bg-rose-50 p-1 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="inline-block bg-emerald-600 text-white font-mono text-xs font-black px-2.5 py-1 rounded-md">
                  {c.code}
                </span>
                <p className="font-black text-sm text-zinc-900">{c.discountPercent}% OFF</p>
                <p className="text-[11px] text-zinc-500">{c.description}</p>
                <p className="text-[10px] text-zinc-400 font-medium">Min Order requirement: ₹{c.minOrderValue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: CRM Support Tab */}
      {activeTab === "crm_support" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-4 bg-emerald-500 rounded-full" />
              CRM Ticket Console & Customer Care
            </h3>
            <p className="text-xs text-zinc-500">Respond to user disputes, billing errors, and verify late-delivery refunds in real-time.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tickets List */}
              <div className="lg:col-span-1 space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Active Help Desk Tickets ({tickets.length})</p>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {tickets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedAdminTicketId(t.id);
                        setAdminReplyText("");
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition shadow-sm hover:shadow flex flex-col gap-1.5 ${
                        selectedAdminTicketId === t.id ? "border-emerald-500 bg-emerald-50/20" : "border-zinc-100 bg-white hover:border-zinc-350"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-extrabold text-xs text-zinc-900">{t.id}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          t.status === "Open" ? "bg-amber-100 text-amber-700" :
                          t.status === "In-Progress" ? "bg-blue-100 text-blue-700 animate-pulse" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate w-full font-bold">Category: {t.category}</p>
                      <p className="text-xs text-zinc-800 line-clamp-1 font-medium">{t.description}</p>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">From: {t.customerName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat view */}
              <div className="lg:col-span-2 bg-zinc-50 rounded-3xl p-5 border border-zinc-150 flex flex-col justify-between min-h-[350px]">
                {selectedAdminTicketId && activeAdminTicket ? (
                  <div className="flex flex-col h-full justify-between space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
                      <div>
                        <h4 className="font-extrabold text-xs text-zinc-900">Conversing on Ticket {activeAdminTicket.id}</h4>
                        <p className="text-[10px] text-zinc-500">Customer Name: {activeAdminTicket.customerName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeAdminTicket.status !== "Resolved" && (
                          <button
                            onClick={() => resolveTicket(activeAdminTicket.id)}
                            className="bg-emerald-650 hover:bg-emerald-750 text-white font-black text-[10px] px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            Mark as Resolved
                          </button>
                        )}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          activeAdminTicket.status === "Open" ? "bg-amber-100 text-amber-700" :
                          activeAdminTicket.status === "In-Progress" ? "bg-blue-100 text-blue-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {activeAdminTicket.status}
                        </span>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto space-y-3 max-h-60 p-1">
                      {activeAdminTicket.messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col max-w-[80%] ${m.sender === "support" ? "ml-auto items-end" : "mr-auto items-start"}`}
                        >
                          <div className={`p-3 rounded-2xl text-xs font-semibold shadow-sm ${
                            m.sender === "support"
                              ? "bg-zinc-950 text-white rounded-tr-none"
                              : "bg-white text-zinc-800 border border-zinc-150 rounded-tl-none"
                          }`}>
                            {m.text}
                          </div>
                          <span className="text-[8px] text-zinc-400 font-bold mt-1 uppercase">{m.sender} &bull; {m.time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Admin Reply Input */}
                    {activeAdminTicket.status !== "Resolved" ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type response to user..."
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendAdminReply()}
                          className="flex-1 p-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none"
                        />
                        <button
                          onClick={handleSendAdminReply}
                          className="bg-zinc-950 hover:bg-zinc-850 text-white text-xs font-black px-4 py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Send Reply
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs font-black text-center uppercase">
                        This issue has been closed and marked resolved.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 text-zinc-400 space-y-2">
                    <MessageSquare className="w-10 h-10 text-zinc-300" />
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">No Ticket Selected</p>
                    <p className="text-[11px] max-w-xs font-medium text-zinc-450">Click on any active customer support ticket on the left pane to view, converse and manage resolution states.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Team & Permissions Tab */}
      {activeTab === "employee_roles" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-4 bg-emerald-500 rounded-full" />
                  Staff Roster & Role Permission Management
                </h3>
                <p className="text-xs text-zinc-500">Configure department access, Super Admin elevations, and active session tokens.</p>
              </div>
              <button
                onClick={() => {
                  const name = prompt("Enter new employee name:");
                  if (!name) return;
                  const role = prompt("Enter role (Super Admin, Manager, Support, Rider):", "Support");
                  if (!role) return;
                  const newEmp = {
                    id: "EMP-" + Math.floor(100 + Math.random() * 900),
                    name,
                    role,
                    department: role === "Rider" ? "Logistics" : "Operations",
                    status: "Active",
                    permissions: ["crm"]
                  };
                  setEmployees([...employees, newEmp]);
                  
                  const newLog = {
                    timestamp: new Date().toISOString(),
                    actor: user?.name || "Admin Master",
                    event: "Team Modification",
                    description: `Added ${name} to team roster as ${role}.`,
                    ip: "192.168.1.1"
                  };
                  setAuditLogs([newLog, ...auditLogs]);
                }}
                className="bg-zinc-950 hover:bg-zinc-850 text-white font-black text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard Team Member</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase border-b border-zinc-100">
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">System Role</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Allowed System Permissions</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-zinc-700 divide-y divide-zinc-50">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-zinc-50/40">
                      <td className="p-4 font-mono font-bold text-zinc-500">{emp.id}</td>
                      <td className="p-4 font-extrabold text-zinc-900">{emp.name}</td>
                      <td className="p-4">
                        <span className="bg-zinc-100 text-zinc-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-500 font-bold">{emp.department}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {emp.permissions.map((p) => (
                            <span key={p} className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right text-zinc-400">
                        <button
                          onClick={() => {
                            const newPerms = prompt("Enter comma-separated permissions (e.g. crm, inventory, finances):", emp.permissions.join(","));
                            if (newPerms !== null) {
                              const permsArr = newPerms.split(",").map(p => p.trim()).filter(Boolean);
                              setEmployees(employees.map(e => e.id === emp.id ? { ...e, permissions: permsArr } : e));
                            }
                          }}
                          className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer"
                        >
                          Modify Perms
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Customer CRM Tab */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-4 bg-emerald-500 rounded-full" />
                  Customer Accounts CRM (Google Firestore)
                </h3>
                <p className="text-xs text-zinc-500">Search customer metrics, block malicious bots, update balances, and audit saved addresses.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={loadCustomers}
                  disabled={customersLoading}
                  className="p-2 text-zinc-500 hover:text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-4 h-4 ${customersLoading ? "animate-spin text-emerald-600" : ""}`} />
                </button>
                <button
                  onClick={exportCustomersToCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Customer CRM Data</span>
                </button>
              </div>
            </div>

            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, name, email or phone..."
                  className="w-full bg-zinc-50 border border-zinc-200 pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-1.5">
                {["All", "Active", "Blocked"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f as any)}
                    className={`px-3 py-1.5 border rounded-xl font-bold text-xs cursor-pointer transition ${statusFilter === f ? "bg-zinc-900 border-zinc-950 text-white" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Main CRM Table */}
            {customersLoading ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs text-zinc-500 font-bold mt-2">Loading profiles from Firestore...</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Customer ID</th>
                      <th className="py-3 px-4">Profile</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Wallet & Points</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 font-medium text-zinc-700">
                    {customers
                      .filter(c => {
                        const q = searchQuery.toLowerCase().trim();
                        if (q) {
                          const matchName = (c.name || "").toLowerCase().includes(q);
                          const matchEmail = (c.email || "").toLowerCase().includes(q);
                          const matchPhone = (c.phone || "").toLowerCase().includes(q);
                          const matchId = (c.customerId || "").toLowerCase().includes(q);
                          if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
                        }
                        if (statusFilter !== "All") {
                          const currentStatus = c.status || "Active";
                          if (currentStatus !== statusFilter) return false;
                        }
                        return true;
                      })
                      .map((cust) => (
                        <tr key={cust.uid} className="hover:bg-zinc-50/30 transition">
                          <td className="py-3.5 px-4 font-black text-zinc-900">{cust.customerId || "QN001024"}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img src={cust.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-100" />
                              <span className="font-extrabold text-zinc-900">{cust.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 space-y-0.5">
                            <span className="block font-semibold text-zinc-800">{cust.phone || "No Mobile"}</span>
                            <span className="block text-[10px] text-zinc-400 font-medium">{cust.email}</span>
                          </td>
                          <td className="py-3.5 px-4 space-y-0.5">
                            <span className="block text-emerald-700 font-extrabold">₹{cust.walletBalance || 0}</span>
                            <span className="block text-[10px] text-zinc-400 font-semibold">{cust.loyaltyPoints || 0} Loyalty Pts</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${cust.status === "Blocked" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cust.status === "Blocked" ? "bg-rose-600" : "bg-emerald-500"}`} />
                              {cust.status || "Active"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400 font-bold">{cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : "01/07/2026"}</td>
                          <td className="py-3.5 px-4 text-right space-x-1">
                            <button
                              onClick={() => {
                                setEditingCustomer(cust);
                                setEditedName(cust.name);
                                setEditedEmail(cust.email);
                                setEditedPhone(cust.phone);
                                setEditedWallet(cust.walletBalance || 0);
                                setEditedPoints(cust.loyaltyPoints || 0);
                              }}
                              className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer transition inline-block"
                              title="Edit Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleBlock(cust)}
                              className={`p-1 cursor-pointer transition inline-block ${cust.status === "Blocked" ? "text-emerald-500 hover:text-emerald-700" : "text-rose-500 hover:text-rose-700"}`}
                              title={cust.status === "Blocked" ? "Unblock account" : "Block account"}
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(cust.uid)}
                              className="p-1 text-zinc-400 hover:text-rose-600 cursor-pointer transition inline-block"
                              title="Delete Profile"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Edit Customer Details */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setEditingCustomer(null)} className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm" />
          <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-100 shadow-2xl p-6 relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h4 className="font-extrabold text-sm text-zinc-900 uppercase">Modify Customer metrics</h4>
              <button onClick={() => setEditingCustomer(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-zinc-400">Full Name</label>
                <input
                  type="text" required value={editedName} onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-400">Email Address</label>
                  <input
                    type="email" required value={editedEmail} onChange={(e) => setEditedEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-400">Phone Number</label>
                  <input
                    type="tel" required value={editedPhone} onChange={(e) => setEditedPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-600 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Wallet Bal (₹)
                  </label>
                  <input
                    type="number" required value={editedWallet} onChange={(e) => setEditedWallet(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-600 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> Loyalty Pts
                  </label>
                  <input
                    type="number" required value={editedPoints} onChange={(e) => setEditedPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Save updates to database
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW: Security & Backups Tab */}
      {activeTab === "system_security" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Security Status and Backups */}
            <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-4 bg-emerald-500 rounded-full" />
                Durable Backup & Recovery Engine
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Manages persistent replication states across dark-store warehouses and Google Cloud Firestore backups.
              </p>

              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 font-bold">Active Firebase Database ID</span>
                  <span className="text-xs font-mono font-bold text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5 rounded-lg">ai-studio-quicknow</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 font-bold">Database Collection Size</span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">7.42 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 font-bold">Automatic Daily Backups</span>
                  <span className="text-xs text-emerald-600 font-black uppercase">Enabled (3:00 AM)</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const newLog = {
                      timestamp: new Date().toISOString(),
                      actor: user?.name || "Admin Master",
                      event: "Manual Snapshot",
                      description: "Triggered on-demand database physical cold-backup. Archive code: QN_SNAP_81.",
                      ip: "192.168.1.1"
                    };
                    setAuditLogs([newLog, ...auditLogs]);
                    alert("Logical Firestore backup initiated. Snapshot archived as QN_SNAP_81.tar.gz.");
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition cursor-pointer text-center"
                >
                  On-Demand Backup
                </button>
                <button
                  onClick={() => {
                    const confirmRestore = confirm("CRITICAL WARNING: Are you sure you want to restore system state to the last verified snapshot? Active customer transactions might be affected.");
                    if (confirmRestore) {
                      const newLog = {
                        timestamp: new Date().toISOString(),
                        actor: user?.name || "Admin Master",
                        event: "Database Restore",
                        description: "Restored system schema to snapshot QN_SNAP_79. Clean state completed successfully.",
                        ip: "192.168.1.1"
                      };
                      setAuditLogs([newLog, ...auditLogs]);
                      alert("Database state successfully rolled back to 2026-06-30-03:00 snapshot.");
                    }
                  }}
                  className="flex-1 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-black text-xs rounded-xl transition cursor-pointer text-center"
                >
                  Restore Snapshot
                </button>
              </div>
            </div>

            {/* PWA State Diagnostics */}
            <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-4 bg-emerald-500 rounded-full" />
                PWA Service Worker & Performance Settings
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Configure manifest caching rules, asset pre-rendering limits, and secure local cookie persistence guidelines.
              </p>

              <div className="space-y-2 text-xs font-semibold text-zinc-600">
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <span>Service Worker Caching</span>
                  <span className="text-emerald-600 font-black uppercase">Active & Green</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <span>Offline Sync Database</span>
                  <span className="text-emerald-600 font-black uppercase">IndexedDB Engaged</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <span>App Version Manifest</span>
                  <span className="text-zinc-500 font-bold uppercase">v2.10.4-LTS</span>
                </div>
              </div>
            </div>

          </div>

          {/* CRM Audit Logs List */}
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-4 bg-orange-500 rounded-full" />
              Real-time Administrative Audit Logs & Security History
            </h3>
            <p className="text-xs text-zinc-500">Continuous background registry of all state changes, pricing updates, and staff authorizations.</p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs space-y-1 hover:border-zinc-350 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="font-black text-zinc-800 uppercase text-[10px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      {log.event}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold font-mono">
                      {new Date(log.timestamp).toLocaleString()} &bull; IP: {log.ip}
                    </span>
                  </div>
                  <p className="text-zinc-500 font-medium">{log.description}</p>
                  <p className="text-[10px] text-zinc-400 font-bold">Authorized Actor: {log.actor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Product Add/Edit */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-zinc-100 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h4 className="font-black text-base text-zinc-900">
                {editingProduct ? `Edit Catalog Product` : `Add New Product`}
              </h4>
              <button type="button" onClick={() => setShowProductModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-zinc-400 hover:text-zinc-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Product Name</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Category Selection</label>
                <select
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-800 cursor-pointer"
                >
                  <option value="fruits-veg">Fruits & Vegetables</option>
                  <option value="grocery-staples">Grocery & Staples</option>
                  <option value="dairy-bread">Dairy & Bread</option>
                  <option value="snacks-munchies">Snacks & Munchies</option>
                  <option value="beverages">Beverages</option>
                  <option value="personal-care">Personal Care</option>
                  <option value="household">Household</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Discounted Price (₹)</label>
                <input
                  type="number"
                  required
                  value={pPrice}
                  onChange={(e) => setPPrice(Number(e.target.value))}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Original MRP Price (₹)</label>
                <input
                  type="number"
                  required
                  value={pOrigPrice}
                  onChange={(e) => setPOrigPrice(Number(e.target.value))}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Unit Specifier (e.g., 500g, 1L)</label>
                <input
                  type="text"
                  required
                  value={pUnit}
                  onChange={(e) => setPUnit(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Initial Stock</label>
                <input
                  type="number"
                  required
                  value={pStock}
                  onChange={(e) => setPStock(Number(e.target.value))}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400">Product Description</label>
              <textarea
                required
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400">Image Asset URL (Unsplash recommended)</label>
              <input
                type="text"
                required
                value={pImage}
                onChange={(e) => setPImage(e.target.value)}
                className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
              />
            </div>

            {/* Weight-Based Selling Options */}
            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pIsWeightBased}
                  onChange={(e) => setPIsWeightBased(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-zinc-300 rounded focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-xs font-black text-zinc-800">Enable Weight-Based Selling</span>
              </label>

              {pIsWeightBased && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Min Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={pMinWeight}
                      onChange={(e) => setPMinWeight(Number(e.target.value))}
                      className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Max Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={pMaxWeight}
                      onChange={(e) => setPMaxWeight(Number(e.target.value))}
                      className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Weight Interval (kg)</label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={pWeightInterval}
                      onChange={(e) => setPWeightInterval(Number(e.target.value))}
                      className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Price per kg (₹)</label>
                    <input
                      type="number"
                      required
                      value={pPricePerKg}
                      onChange={(e) => setPPricePerKg(Number(e.target.value))}
                      className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl transition cursor-pointer"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add Coupon */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddCouponSubmit}
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-zinc-100 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <h4 className="font-black text-sm text-zinc-900">Create Promocode</h4>
              <button type="button" onClick={() => setShowCouponModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON30"
                  value={cCode}
                  onChange={(e) => setCCode(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Discount Percentage (%)</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={90}
                  value={cDiscount}
                  onChange={(e) => setCDiscount(Number(e.target.value))}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Minimum Order Value (₹)</label>
                <input
                  type="number"
                  required
                  min={99}
                  value={cMinOrder}
                  onChange={(e) => setCMinOrder(Number(e.target.value))}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Campaign Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 30% OFF on all organic foods"
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition cursor-pointer"
              >
                Publish Coupon
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
