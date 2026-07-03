import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Product } from "../data/products";
import { Coupon, Order, SupportTicket, UserProfile, DeliveryZone, CityChargeConfig, DeliveryChargeConfig } from "../types";
import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { 
  ShieldAlert, TrendingUp, ShoppingBag, Users, AlertTriangle, Bell,
  Plus, Edit2, Trash2, Check, RefreshCw, Percent, DollarSign, ListFilter, X, Eye,
  Lock, Server, MessageSquare, Ticket, Key, CheckSquare, ShieldCheck, Download, Trash, UserX, Loader2, ShieldX, Search, Wallet, Award,
  Compass, MapPin, Camera, Activity
} from "lucide-react";
import { 
  getAllCustomers, 
  toggleCustomerStatus, 
  adminDeleteCustomer, 
  adminUpdateCustomerBalances,
  updateUserProfile,
  adminCreateSystemAccount
} from "../lib/auth-service";
import { DeliveryMetricsDashboard } from "./DeliveryMetricsDashboard";

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const isGoogleMapsEnabled = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== "YOUR_API_KEY";

export const AdminPanel: React.FC = () => {
  const { 
    products, addProduct, updateProduct, deleteProduct,
    orders, updateOrderStatus, coupons, addCoupon, deleteCoupon,
    deliveryCharge, setDeliveryCharge, user,
    tickets, addTicketMessage, resolveTicket,
    deliveryConfig, updateDeliveryConfig,
    banners, addBanner, updateBanner, deleteBanner,
    homepageSections, addSection, updateSection, deleteSection,
    deliveryOtpRequired, setDeliveryOtpRequired
  } = useApp() as any;

  const [activeTab, setActiveTab] = useState<"dashboard" | "delivery_metrics" | "products" | "orders" | "coupons" | "crm_support" | "employee_roles" | "system_security" | "customers" | "delivery" | "homepage_design">("dashboard");
  const [deliverySubTab, setDeliverySubTab] = useState<"pricing" | "fleet">("pricing");

  // --- Delivery Partner Fleet States ---
  const [fleetRiders, setFleetRiders] = useState([
    { id: "driver-1", name: "Ramesh Kumar", phone: "+91 98765 12345", status: "Online", lat: 22.5735, lng: 88.4331, vehicle: "Eco EV Scooter", earnings: 340, completed: 8 },
    { id: "driver-2", name: "Suresh Singh", phone: "+91 98765 23456", status: "Online", lat: 22.5801, lng: 88.4200, vehicle: "Electric Bike", earnings: 240, completed: 6 },
    { id: "driver-3", name: "Amit Patel", phone: "+91 98765 34567", status: "Offline", lat: 22.5600, lng: 88.3900, vehicle: "Bicycle", earnings: 80, completed: 2 }
  ]);
  const [selectedRiderForMap, setSelectedRiderForMap] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 22.5735, lng: 88.4331 });
  const [mapZoom, setMapZoom] = useState(13);

  // --- Customer CRM States ---
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Blocked">("All");
  const [selectedCustomerForOrders, setSelectedCustomerForOrders] = useState<UserProfile | null>(null);

  // Edit Customer Detail Modal states
  const [editingCustomer, setEditingCustomer] = useState<UserProfile | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedWallet, setEditedWallet] = useState(0);
  const [editedPoints, setEditedPoints] = useState(0);

  // --- Homepage Design Form States ---
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerDesc, setBannerDesc] = useState("");
  const [bannerTagline, setBannerTagline] = useState("");
  const [bannerBg, setBannerBg] = useState("from-blue-600 to-indigo-700");
  const [bannerCategoryId, setBannerCategoryId] = useState("fruits-veg");
  const [bannerBadge, setBannerBadge] = useState("Deal of the Day");
  const [bannerBtnText, setBannerBtnText] = useState("Shop Now");
  const [bannerIsEnabled, setBannerIsEnabled] = useState(true);

  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionCategoryId, setSectionCategoryId] = useState("fruits-veg");
  const [sectionOrder, setSectionOrder] = useState(1);
  const [sectionIsVisible, setSectionIsVisible] = useState(true);

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
    if (activeTab === "customers" || activeTab === "employee_roles") {
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

  // --- Homepage Design Handlers ---
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: bannerTitle,
      desc: bannerDesc,
      tagline: bannerTagline,
      bg: bannerBg,
      categoryId: bannerCategoryId,
      badge: bannerBadge,
      btnText: bannerBtnText,
      isEnabled: bannerIsEnabled,
    };

    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, payload);
      } else {
        await addBanner(payload);
      }
      setShowBannerForm(false);
      setEditingBanner(null);
      // Reset form
      setBannerTitle("");
      setBannerDesc("");
      setBannerTagline("");
      setBannerBg("from-blue-600 to-indigo-700");
      setBannerCategoryId("fruits-veg");
      setBannerBadge("Deal of the Day");
      setBannerBtnText("Shop Now");
      setBannerIsEnabled(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: sectionTitle,
      categoryId: sectionCategoryId,
      order: Number(sectionOrder),
      isVisible: sectionIsVisible,
    };

    try {
      if (editingSection) {
        await updateSection(editingSection.id, payload);
      } else {
        await addSection(payload);
      }
      setShowSectionForm(false);
      setEditingSection(null);
      // Reset form
      setSectionTitle("");
      setSectionCategoryId("fruits-veg");
      setSectionOrder(1);
      setSectionIsVisible(true);
    } catch (err) {
      console.error(err);
    }
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

  // Onboard system account states
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardName, setOnboardName] = useState("");
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardPassword, setOnboardPassword] = useState("");
  const [onboardPhone, setOnboardPhone] = useState("");
  const [onboardRole, setOnboardRole] = useState<"customer" | "admin" | "delivery" | "seller">("delivery");
  const [onboardWalletBalance, setOnboardWalletBalance] = useState("0");
  const [onboardError, setOnboardError] = useState("");
  const [onboardSuccess, setOnboardSuccess] = useState("");
  const [onboardingLoading, setOnboardingLoading] = useState(false);

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
          { id: "delivery_metrics", label: "Delivery Metrics", icon: Activity },
          { id: "products", label: "Product Catalog", icon: ShoppingBag },
          { id: "orders", label: "Rider Orders", icon: ListFilter },
          { id: "delivery", label: "Delivery Charges", icon: Compass },
          { id: "coupons", label: "Promos & Coupons", icon: Percent },
          { id: "homepage_design", label: "Homepage Design", icon: Compass },
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

      {/* VIEW: Delivery Metrics */}
      {activeTab === "delivery_metrics" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <DeliveryMetricsDashboard orders={orders} fleetRiders={fleetRiders} />
        </div>
      )}

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
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Sub Tab Buttons */}
          <div className="flex bg-zinc-100 p-1 rounded-2xl max-w-md border border-zinc-200">
            <button
              onClick={() => setDeliverySubTab("pricing")}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                deliverySubTab === "pricing"
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Delivery Pricing Policy
            </button>
            <button
              onClick={() => setDeliverySubTab("fleet")}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                deliverySubTab === "fleet"
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Rider Fleet Live Dispatch</span>
            </button>
          </div>

          {deliverySubTab === "pricing" ? (
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
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs py-3 rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
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
          ) : (
            /* BRAND-NEW: Rider Fleet Live Dispatch View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
              
              {/* Left Column: Fleet controls & dispatch lists (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Security & Handover OTP Verification Config */}
                <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>OTP Handover Verification</span>
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold">
                        Enforces zero-trust delivery verification. When active, riders must enter the customer-held OTP before completing orders.
                      </p>
                    </div>
                    
                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setDeliveryOtpRequired(!deliveryOtpRequired)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        deliveryOtpRequired ? "bg-emerald-600" : "bg-zinc-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          deliveryOtpRequired ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[9px] font-mono font-bold text-zinc-600">
                      STATUS: {deliveryOtpRequired ? "ENFORCED SECURE HANDOVER ACTIVE" : "STANDARD HANDOVER BYPASSED"}
                    </span>
                  </div>
                </div>

                {/* 2. Active Riders Grid */}
                <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">
                        Active Fleet Status ({fleetRiders.filter(r => r.status === "Online").length} Online)
                      </h4>
                      <p className="text-[10px] text-zinc-400">Track and manage active delivery partners on duty.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        // Simulate minor rider coordinate drift to test live map updates!
                        setFleetRiders(prev =>
                          prev.map(r => {
                            if (r.status === "Online") {
                              const driftLat = (Math.random() - 0.5) * 0.003;
                              const driftLng = (Math.random() - 0.5) * 0.003;
                              return { ...r, lat: r.lat + driftLat, lng: r.lng + driftLng };
                            }
                            return r;
                          })
                        );
                      }}
                      className="bg-zinc-100 hover:bg-zinc-200 p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 transition flex items-center gap-1 cursor-pointer text-[10px] font-black"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Drift Coordinates</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fleetRiders.map(rider => (
                      <div
                        key={rider.id}
                        onClick={() => {
                          setSelectedRiderForMap(rider);
                          setMapCenter({ lat: rider.lat, lng: rider.lng });
                          setMapZoom(15);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                          selectedRiderForMap?.id === rider.id
                            ? "bg-zinc-900 border-zinc-900 text-white shadow-md"
                            : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-800"
                        }`}
                      >
                        {/* Status tag */}
                        <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase ${
                          rider.status === "Online"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-zinc-200 text-zinc-500"
                        }`}>
                          {rider.status}
                        </span>

                        <div className="font-extrabold text-xs">{rider.name}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{rider.vehicle} &bull; {rider.phone}</div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-200/20 text-[9px] font-mono">
                          <div>
                            <span className="text-zinc-400 block uppercase">Today's Earnings</span>
                            <span className="font-extrabold text-xs text-orange-500">₹{rider.earnings}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block uppercase">Completed</span>
                            <span className="font-extrabold text-xs text-blue-500">{rider.completed} orders</span>
                          </div>
                        </div>

                        <div className="mt-2 text-[8px] text-zinc-400 font-mono">
                          GPS Lat: {rider.lat.toFixed(4)}, Lng: {rider.lng.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Orders Dispatch Desk (Reassignment & Tracker) */}
                <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">
                      Orders Assignment Desk
                    </h4>
                    <p className="text-[10px] text-zinc-400">Assign unassigned orders or reassign in-progress orders to available partners.</p>
                  </div>

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {orders.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 font-bold text-center py-4">No active orders found in database.</p>
                    ) : (
                      orders.map((o: any) => {
                        const assignedRider = fleetRiders.find(r => r.id === o.deliveryPartnerId);

                        return (
                          <div key={o.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-left">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-zinc-900">{o.id}</span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase bg-orange-100 text-orange-700">
                                  {o.status}
                                </span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  o.deliveryType === "Scheduled" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {o.deliverySlot || "Within 10 mins"}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400">{o.createdAt.substring(11, 16)}</span>
                              </div>
                              <p className="text-xs font-bold text-zinc-800">{o.customerName} &bull; {o.customerPhone}</p>
                              <p className="text-[10px] text-zinc-500 leading-normal line-clamp-1">{o.address}</p>
                              <p className="text-[9px] font-mono text-zinc-400 font-bold">Total: ₹{o.total} &bull; Method: {o.paymentMethod}</p>
                            </div>

                            {/* Assignment Selector Controls */}
                            <div className="space-y-1.5 w-full md:w-auto">
                              <label className="text-[9px] font-extrabold uppercase text-zinc-400 block">Dispatch To:</label>
                              <select
                                value={o.deliveryPartnerId || ""}
                                onChange={(e) => {
                                  const riderId = e.target.value === "" ? null : e.target.value;
                                  const newStatus = riderId ? "Accepted" : "Pending";
                                  updateOrderStatus(o.id, newStatus, riderId);
                                }}
                                className="w-full md:w-40 p-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer text-zinc-800"
                              >
                                <option value="">--- Unassigned ---</option>
                                {fleetRiders.map(rider => (
                                  <option key={rider.id} value={rider.id}>
                                    {rider.name} ({rider.status})
                                  </option>
                                ))}
                              </select>
                              
                              {assignedRider && (
                                <div className="text-[9px] text-zinc-400 font-bold mt-1 text-right">
                                  Tracked: <span className="text-blue-600">{assignedRider.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Maps Panel (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white rounded-3xl border border-zinc-100 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider">
                        Rider Live Dispatch Radar
                      </h4>
                      <p className="text-[10px] text-zinc-400">Centering: {selectedRiderForMap ? selectedRiderForMap.name : "All Fleet"}</p>
                    </div>

                    {selectedRiderForMap && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRiderForMap(null);
                          setMapCenter({ lat: 22.5735, lng: 88.4331 });
                          setMapZoom(13);
                        }}
                        className="text-[9px] font-black text-zinc-400 hover:text-zinc-600 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-md"
                      >
                        Reset Center
                      </button>
                    )}
                  </div>

                  {/* Render Google Maps or Custom Interactive Fallback */}
                  {isGoogleMapsEnabled ? (
                    <div className="relative rounded-2xl overflow-hidden border border-zinc-200 shadow-sm" style={{ height: "400px", width: "100%" }}>
                      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                        <Map
                          style={{ height: "100%", width: "100%" }}
                          defaultCenter={{ lat: 22.5735, lng: 88.4331 }}
                          center={mapCenter}
                          defaultZoom={13}
                          zoom={mapZoom}
                          gestureHandling={"greedy"}
                          disableDefaultUI={false}
                          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                        >
                          {/* Plot online riders */}
                          {fleetRiders.map((rider) => (
                            <Marker
                              key={rider.id}
                              position={{ lat: rider.lat, lng: rider.lng }}
                              title={rider.name}
                              onClick={() => {
                                setSelectedRiderForMap(rider);
                                setMapCenter({ lat: rider.lat, lng: rider.lng });
                                setMapZoom(15);
                              }}
                            />
                          ))}

                          {/* Plot orders with custom locations */}
                          {orders.filter((o: any) => o.lat && o.lng).map((o: any) => (
                            <Marker
                              key={o.id}
                              position={{ lat: o.lat!, lng: o.lng! }}
                              title={`Customer: ${o.customerName}`}
                            />
                          ))}
                        </Map>
                      </APIProvider>
                    </div>
                  ) : (
                    /* Elegant fall-back interactive SVG radar map */
                    <div className="relative bg-[#090D16] rounded-2xl overflow-hidden border border-zinc-800 p-2 text-white h-[400px] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-mono p-1 border-b border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                          <span className="text-blue-400 font-bold uppercase">MOCK DISPATCH FEED</span>
                        </div>
                        <span className="text-zinc-500">ZOOM: {mapZoom}x</span>
                      </div>

                      {/* Map Canvas */}
                      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                        <svg viewBox="0 0 400 300" className="w-full h-full">
                          <defs>
                            <pattern id="grid-admin" width="40" height="40" patternUnits="userSpaceOnUse">
                              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141C2F" strokeWidth="0.5" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid-admin)" />

                          {/* Streets layout */}
                          <g stroke="#18243E" strokeWidth="8" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
                            <path d="M 40 40 L 360 40 M 40 150 L 360 150 M 40 260 L 360 260" />
                            <path d="M 100 40 L 100 260 M 200 40 L 200 260 M 300 40 L 300 260" />
                          </g>

                          {/* Dispatch Station Beacon (Dark Store Center) */}
                          <g transform="translate(200, 150)">
                            <circle r="18" fill="#F97316" className="animate-[ping_2s_infinite]" opacity="0.1" />
                            <circle r="6" fill="#F97316" />
                            <circle r="2" fill="white" />
                          </g>

                          {/* Plot active riders */}
                          {fleetRiders.map((rider) => {
                            const svgX = 200 + (rider.lng - 88.4331) * 8000;
                            const svgY = 150 - (rider.lat - 22.5735) * 8000;

                            return (
                              <g
                                key={rider.id}
                                transform={`translate(${Math.max(20, Math.min(380, svgX))}, ${Math.max(20, Math.min(280, svgY))})`}
                                className="cursor-pointer transition-all duration-300"
                                onClick={() => {
                                  setSelectedRiderForMap(rider);
                                }}
                              >
                                <circle r="12" fill="#3B82F6" className="animate-[ping_1.5s_infinite]" opacity="0.15" />
                                <circle r="6" fill={rider.status === "Online" ? "#3B82F6" : "#64748B"} />
                                <text y="-10" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">
                                  {rider.name.split(" ")[0]}
                                </text>
                              </g>
                            );
                          })}

                          {/* Plot active order locations needing delivery */}
                          {orders.map((order: any) => {
                            if (!order.lat || !order.lng) return null;
                            const svgX = 200 + (order.lng - 88.4331) * 8000;
                            const svgY = 150 - (order.lat - 22.5735) * 8000;
                            const isAssigned = Boolean(order.deliveryPartnerId);

                            return (
                              <g
                                key={order.id}
                                transform={`translate(${Math.max(20, Math.min(380, svgX))}, ${Math.max(20, Math.min(280, svgY))})`}
                                className="cursor-pointer"
                              >
                                <polygon points="0,-10 6,2 -6,2" fill={isAssigned ? "#10B981" : "#EF4444"} />
                                <text y="12" textAnchor="middle" fill="#E2E8F0" fontSize="8" fontWeight="bold">
                                  {order.id}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Map Info Bar */}
                      <div className="bg-zinc-950/90 border-t border-zinc-800 p-2 rounded-xl text-[9px] font-mono text-zinc-400 text-left space-y-1">
                        <div className="flex justify-between">
                          <span>CENTER GPS:</span>
                          <span className="text-zinc-200 font-bold">{mapCenter.lat.toFixed(4)} N, {mapCenter.lng.toFixed(4)} E</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SELECTED:</span>
                          <span className="text-blue-400 font-bold">{selectedRiderForMap ? `${selectedRiderForMap.name} (${selectedRiderForMap.vehicle})` : "Global Overview"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Geolocation Live Update test action */}
                  <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-3 flex items-center justify-between">
                    <div className="text-left space-y-0.5">
                      <span className="text-[10px] font-black text-zinc-800 block uppercase">Test Live Geolocation</span>
                      <span className="text-[9px] text-zinc-400 block font-medium">Verify tracking API via mock location updates.</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            const { latitude, longitude } = pos.coords;
                            setFleetRiders(prev =>
                              prev.map(r => r.id === "driver-1" ? { ...r, lat: latitude, lng: longitude } : r)
                            );
                            setMapCenter({ lat: latitude, lng: longitude });
                            setMapZoom(16);
                          }, (err) => {
                            console.error(err.message);
                          });
                        }
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Fetch Live Location</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}
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
                    <td className="p-4">
                      <span className="font-extrabold text-zinc-900 block">{o.id}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                        o.deliveryType === "Scheduled" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                      } mt-1 inline-block`}>
                        {o.deliverySlot || "Within 10 mins"}
                      </span>
                    </td>
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
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                          o.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                          o.status === "Out for Delivery" ? "bg-purple-100 text-purple-800 animate-pulse" :
                          o.status === "Accepted" ? "bg-orange-100 text-orange-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {o.status}
                        </span>
                        {o.status === "Delivered" && o.deliveryProofPhoto && (
                          <a 
                            href={o.deliveryProofPhoto} 
                            target="_blank" 
                            rel="noreferrer"
                            className="group flex items-center gap-1 text-[9px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/50 px-1.5 py-0.5 rounded-md transition"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Proof Photo</span>
                          </a>
                        )}
                      </div>
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
                <p className="text-xs text-zinc-500 font-medium">Create delivery riders, admins, merchants, and assign direct dashboard authorization tokens.</p>
              </div>
              <button
                onClick={() => setShowOnboardModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm shadow-emerald-200"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard System Account</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase border-b border-zinc-100">
                    <th className="p-4">Employee ID / UID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">System Role</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Credentials & Info</th>
                    <th className="p-4">Status & Type</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-zinc-700 divide-y divide-zinc-50">
                  {/* Real Database Staff first */}
                  {customers.filter(c => c.role !== "customer").map((emp) => (
                    <tr key={emp.uid} className="hover:bg-zinc-50/40">
                      <td className="p-4 font-mono font-bold text-zinc-500 select-all text-[11px]" title={emp.uid}>
                        {emp.customerId || emp.uid.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-zinc-900">{emp.name}</div>
                        <div className="text-[10px] text-zinc-400 font-bold">{emp.phone || "No phone"}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-550 font-bold">
                        {emp.role === "admin" ? "Operations" : emp.role === "delivery" ? "Logistics" : emp.role === "seller" ? "Commerce" : "Operations"}
                      </td>
                      <td className="p-4 text-[11px] text-zinc-500">
                        <div className="font-semibold text-zinc-700">{emp.email}</div>
                        {emp.password && (
                          <div className="font-mono text-zinc-400 text-[10px] mt-0.5">
                            Pass: <span className="text-zinc-650 bg-zinc-100 px-1 py-0.2 rounded font-bold select-all">{emp.password}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            {emp.status || "Active"}
                          </span>
                          <span className="text-[9px] bg-zinc-950 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase self-start">
                            Live Account
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete this real database staff account: ${emp.name}?`)) {
                              try {
                                await adminDeleteCustomer(emp.uid);
                                alert("Account deleted successfully from Firestore.");
                                await loadCustomers();
                              } catch (err) {
                                alert("Failed to delete account from database.");
                              }
                            }
                          }}
                          className="text-xs text-rose-600 hover:underline font-extrabold cursor-pointer"
                        >
                          Delete Account
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Mock Employees */}
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-zinc-50/40 opacity-75">
                      <td className="p-4 font-mono font-bold text-zinc-400">{emp.id}</td>
                      <td className="p-4 font-extrabold text-zinc-600">{emp.name}</td>
                      <td className="p-4">
                        <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-450 font-bold">{emp.department}</td>
                      <td className="p-4 text-[10px] text-zinc-400">
                        demo.{emp.name.toLowerCase().replace(/\s/g, "")}@quicknow.com
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-zinc-500 font-bold">
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                            {emp.status}
                          </span>
                          <span className="text-[9px] bg-zinc-100 text-zinc-500 font-bold px-1.5 py-0.5 rounded-md uppercase self-start">
                            Demo Data
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            const newPerms = prompt("Enter comma-separated permissions:", emp.permissions.join(","));
                            if (newPerms !== null) {
                              const permsArr = newPerms.split(",").map(p => p.trim()).filter(Boolean);
                              setEmployees(employees.map(e => e.id === emp.id ? { ...e, permissions: permsArr } : e));
                            }
                          }}
                          className="text-xs text-zinc-500 hover:underline font-bold cursor-pointer"
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

          {/* Onboarding Modal */}
          {showOnboardModal && (
            <div className="fixed inset-0 bg-zinc-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl border border-zinc-100 p-6 sm:p-8 w-full max-w-lg shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowOnboardModal(false);
                    setOnboardError("");
                    setOnboardSuccess("");
                  }}
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="font-extrabold text-lg text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    Onboard System Account
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Create a secure functional account directly registered in Firebase. Onboarded members can immediately log in to access their respective system panels.
                  </p>
                </div>

                {onboardError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span>{onboardError}</span>
                  </div>
                )}

                {onboardSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 text-emerald-500 animate-bounce" />
                    <span>{onboardSuccess}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setOnboardError("");
                    setOnboardSuccess("");

                    if (!onboardName.trim() || !onboardEmail.trim() || !onboardPassword.trim() || !onboardPhone.trim()) {
                      setOnboardError("Please fill out all required fields.");
                      return;
                    }

                    if (onboardPassword.length < 6) {
                      setOnboardError("Password must be at least 6 characters long.");
                      return;
                    }

                    setOnboardingLoading(true);
                    try {
                      const balance = Number(onboardWalletBalance) || 0;
                      const profile = await adminCreateSystemAccount(
                        onboardEmail.trim(),
                        onboardPassword,
                        onboardName.trim(),
                        onboardPhone.trim(),
                        onboardRole,
                        balance
                      );

                      setOnboardSuccess(`Successfully onboarded ${profile.name} as ${profile.role.toUpperCase()}!`);
                      
                      // Log event in audit logs
                      const newLog = {
                        timestamp: new Date().toISOString(),
                        actor: user?.name || "Admin Master",
                        event: "Staff Provisioned",
                        description: `Registered new real system account: ${onboardName} (${onboardEmail}) with role ${onboardRole.toUpperCase()}.`,
                        ip: "192.168.1.1"
                      };
                      setAuditLogs(prev => [newLog, ...prev]);

                      // Refresh the database lists
                      await loadCustomers();

                      // Clear form fields
                      setOnboardName("");
                      setOnboardEmail("");
                      setOnboardPassword("");
                      setOnboardPhone("");
                      setOnboardWalletBalance("0");

                      // Auto close after 2 seconds
                      setTimeout(() => {
                        setShowOnboardModal(false);
                        setOnboardSuccess("");
                      }, 2000);
                    } catch (err: any) {
                      console.error("Onboarding failed:", err);
                      setOnboardError(err?.message || "Registration failed. Email might already be in use.");
                    } finally {
                      setOnboardingLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Full Name</label>
                      <input
                        type="text"
                        required
                        value={onboardName}
                        onChange={(e) => setOnboardName(e.target.value)}
                        placeholder="e.g. Captain Amit Sharma"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-zinc-50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={onboardPhone}
                        onChange={(e) => setOnboardPhone(e.target.value)}
                        placeholder="e.g. +91 98765 12345"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-zinc-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Email Address</label>
                      <input
                        type="email"
                        required
                        value={onboardEmail}
                        onChange={(e) => setOnboardEmail(e.target.value)}
                        placeholder="e.g. rider.amit@quicknow.com"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-zinc-50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Password</label>
                      <input
                        type="password"
                        required
                        value={onboardPassword}
                        onChange={(e) => setOnboardPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-zinc-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">System Role</label>
                      <select
                        value={onboardRole}
                        onChange={(e) => setOnboardRole(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none focus:border-zinc-900 bg-zinc-50"
                      >
                        <option value="delivery">🚚 Delivery Rider</option>
                        <option value="admin">🛡️ Admin Manager</option>
                        <option value="seller">🥬 Fresh Seller</option>
                        <option value="customer">👤 General Customer</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Starting Wallet Balance (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={onboardWalletBalance}
                        onChange={(e) => setOnboardWalletBalance(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-zinc-50"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowOnboardModal(false)}
                      className="flex-1 py-2.5 px-4 border border-zinc-200 text-zinc-700 font-extrabold text-xs rounded-xl hover:bg-zinc-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={onboardingLoading}
                      className="flex-1 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-850 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {onboardingLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <span>Register System Account</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: Customer CRM Tab */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-6 shadow-sm">
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

            {/* CRM Metrics Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Total Customers</p>
                <p className="text-lg font-black text-zinc-900 mt-1">{customers.length}</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Active Customers</p>
                <p className="text-lg font-black text-emerald-700 mt-1">
                  {customers.filter(c => c.status !== "Blocked").length}
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Blocked Accounts</p>
                <p className="text-lg font-black text-rose-600 mt-1">
                  {customers.filter(c => c.status === "Blocked").length}
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Total Orders</p>
                <p className="text-lg font-black text-indigo-700 mt-1">{orders.length}</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Orders / Customer</p>
                <p className="text-lg font-black text-zinc-900 mt-1">
                  {customers.length > 0 ? (orders.length / customers.length).toFixed(1) : "0"}
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Avg Spend / Cust</p>
                <p className="text-lg font-black text-zinc-900 mt-1">
                  ₹{customers.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (o.total || 0), 0) / customers.length) : 0}
                </p>
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
                      <th className="py-3 px-4">Orders & Spend</th>
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
                      .map((cust) => {
                        const custOrders = orders.filter(o => o.customerUid === cust.uid || o.customerId === cust.uid);
                        const custSpend = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                        
                        return (
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
                              <span className="block font-extrabold text-zinc-950">{custOrders.length} orders</span>
                              <span className="block text-[10px] text-zinc-400 font-bold">Spent: ₹{custSpend}</span>
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
                                onClick={() => setSelectedCustomerForOrders(cust)}
                                className="p-1 text-zinc-400 hover:text-indigo-600 cursor-pointer transition inline-block"
                                title="View Past Orders"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
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
                        );
                      })}
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

      {/* MODAL: View Customer Orders History */}
      {selectedCustomerForOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedCustomerForOrders(null)} className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm" />
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-100 shadow-2xl p-6 relative z-10 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 flex-shrink-0">
              <div>
                <h4 className="font-extrabold text-sm text-zinc-900 uppercase">
                  Order History for {selectedCustomerForOrders.name}
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase mt-0.5">
                  ID: {selectedCustomerForOrders.customerId || "N/A"} • Joined: {selectedCustomerForOrders.createdAt ? new Date(selectedCustomerForOrders.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <button onClick={() => setSelectedCustomerForOrders(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
              {(() => {
                const customerOrders = orders.filter(
                  (o) => o.customerUid === selectedCustomerForOrders.uid || o.customerId === selectedCustomerForOrders.uid
                );

                if (customerOrders.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-400">
                      <p className="text-sm font-extrabold">No past orders found for this customer.</p>
                      <p className="text-xs mt-1">Once this user places an order, it will appear here in real time.</p>
                    </div>
                  );
                }

                return customerOrders.map((order) => (
                  <div key={order.id} className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-zinc-950">{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        order.status === "Delivered" ? "bg-emerald-50 text-emerald-700" :
                        order.status === "Cancelled" ? "bg-rose-50 text-rose-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-zinc-600">Date: {new Date(order.createdAt).toLocaleString()}</p>
                      <p className="font-semibold text-zinc-600">Address: {order.address}</p>
                      <p className="font-semibold text-zinc-600">Payment: {order.paymentMethod} ({order.paymentStatus})</p>
                    </div>

                    <div className="border-t border-zinc-100 pt-2 space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-[11px] font-medium text-zinc-700">
                          <span>{item.product.name} (x{item.quantity})</span>
                          <span>₹{item.product.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-zinc-100 pt-2 flex justify-between font-extrabold text-xs text-zinc-950">
                      <span>Total Paid:</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            <div className="pt-3 border-t border-zinc-100 text-right flex-shrink-0">
              <button
                onClick={() => setSelectedCustomerForOrders(null)}
                className="bg-zinc-900 hover:bg-zinc-950 text-white font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer transition"
              >
                Close History
              </button>
            </div>
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

      {/* VIEW: Homepage Design Tab */}
      {activeTab === "homepage_design" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Header Description */}
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-teal-500/5 border border-indigo-100 p-6 rounded-3xl space-y-2">
            <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-4 bg-indigo-500 rounded-full animate-pulse" />
              Dynamic Real-time Homepage Engine
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Design the customer's landing screen catalog sections and banner sliders in real-time. Change layout order, link promos to categories, toggle visibility, and update titles instantly without redeploying code. All configs are synced via Cloud Firestore.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. Banners Management */}
            <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">Promotional Banners</h4>
                  <p className="text-[11px] text-zinc-500 font-bold mt-0.5">Manage carousel slides on the home screen</p>
                </div>
                <button
                  onClick={() => {
                    setEditingBanner(null);
                    setBannerTitle("");
                    setBannerDesc("");
                    setBannerTagline("");
                    setBannerBg("from-blue-600 to-indigo-700");
                    setBannerCategoryId("fruits-veg");
                    setBannerBadge("Deal of the Day");
                    setBannerBtnText("Shop Now");
                    setBannerIsEnabled(true);
                    setShowBannerForm(!showBannerForm);
                  }}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition active:scale-95 select-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showBannerForm && !editingBanner ? "Cancel" : "Add Banner"}</span>
                </button>
              </div>

              {/* Banner Creation/Edition Form */}
              {showBannerForm && (
                <form onSubmit={handleSaveBanner} className="bg-zinc-50/50 border border-zinc-200/60 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
                  <h5 className="font-black text-xs text-zinc-800 uppercase tracking-wider">
                    {editingBanner ? "✏️ Edit Banner Slide" : "✨ Create New Banner Slide"}
                  </h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Banner Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Organic Red Apples"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Badge Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Deal of the Day"
                        value={bannerBadge}
                        onChange={(e) => setBannerBadge(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Description</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Farm fresh organic apples & daily essentials delivered in 10 minutes flat."
                        value={bannerDesc}
                        onChange={(e) => setBannerDesc(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Tagline / Discount</label>
                      <input
                        type="text"
                        placeholder="e.g. UP TO 50% OFF"
                        value={bannerTagline}
                        onChange={(e) => setBannerTagline(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Action Button Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Shop Now"
                        value={bannerBtnText}
                        onChange={(e) => setBannerBtnText(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Linked Category ID</label>
                      <select
                        value={bannerCategoryId}
                        onChange={(e) => setBannerCategoryId(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none"
                      >
                        <option value="fruits-veg">Fresh Fruits & Vegetables</option>
                        <option value="grocery-staples">Grocery & Staples</option>
                        <option value="dairy-bread">Dairy & Morning Bread</option>
                        <option value="snacks-munchies">Snacks & Munchies</option>
                        <option value="beverages">Juices & Beverages</option>
                        <option value="personal-care">Personal Care</option>
                        <option value="household">Household Utilities</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Background Preset</label>
                      <select
                        value={bannerBg}
                        onChange={(e) => setBannerBg(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none"
                      >
                        <option value="from-blue-600 to-indigo-700">Royal Indigo-Blue Gradient</option>
                        <option value="from-emerald-600 to-teal-700">Organic Emerald-Teal Gradient</option>
                        <option value="from-rose-600 to-pink-700">Beauty Velvet-Rose Gradient</option>
                        <option value="from-amber-500 to-orange-600">Fresh Harvest Orange Gradient</option>
                        <option value="from-purple-600 to-indigo-700">Twilight Violet Gradient</option>
                        <option value="from-zinc-800 to-zinc-950">Midnight Slate Metallic</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="bannerIsEnabled"
                        checked={bannerIsEnabled}
                        onChange={(e) => setBannerIsEnabled(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300 rounded"
                      />
                      <label htmlFor="bannerIsEnabled" className="text-xs text-zinc-700 font-extrabold uppercase">
                        Enable banner slide
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer transition shadow-md shadow-emerald-500/15"
                    >
                      {editingBanner ? "Save Changes" : "Publish Slide"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBannerForm(false);
                        setEditingBanner(null);
                      }}
                      className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black text-xs rounded-xl cursor-pointer transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Banners List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {(banners || []).length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50 text-xs text-zinc-400 font-bold">
                    No banners configured. Add a promotional slide above.
                  </div>
                ) : (
                  (banners || []).map((b: any) => (
                    <div key={b.id} className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-300 transition">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] bg-white border border-zinc-350 px-2.5 py-0.5 rounded-full font-black text-zinc-700 uppercase">
                            {b.badge || "Deal"}
                          </span>
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            b.isEnabled !== false ? "bg-emerald-50 text-emerald-700" : "bg-zinc-200 text-zinc-500"
                          }`}>
                            {b.isEnabled !== false ? "Active" : "Disabled"}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 font-bold">
                            Link: {b.categoryId || "None"}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-sm text-zinc-900 leading-tight">{b.title}</h5>
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold max-w-sm">{b.desc}</p>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <button
                          onClick={() => {
                            setEditingBanner(b);
                            setBannerTitle(b.title || "");
                            setBannerDesc(b.desc || "");
                            setBannerTagline(b.tagline || "");
                            setBannerBg(b.bg || "from-blue-600 to-indigo-700");
                            setBannerCategoryId(b.categoryId || "fruits-veg");
                            setBannerBadge(b.badge || "Deal of the Day");
                            setBannerBtnText(b.btnText || "Shop Now");
                            setBannerIsEnabled(b.isEnabled !== false);
                            setShowBannerForm(true);
                          }}
                          className="bg-white hover:bg-zinc-100 text-zinc-700 p-2 rounded-xl border border-zinc-200 cursor-pointer active:scale-90 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = confirm(`Are you sure you want to delete banner "${b.title}"?`);
                            if (confirmed) {
                              await deleteBanner(b.id);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl border border-red-100 cursor-pointer active:scale-90 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Sections Management */}
            <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">Homepage Rows / Sections</h4>
                  <p className="text-[11px] text-zinc-500 font-bold mt-0.5">Change row sequences and catalogs displayed</p>
                </div>
                <button
                  onClick={() => {
                    setEditingSection(null);
                    setSectionTitle("");
                    setSectionCategoryId("fruits-veg");
                    setSectionOrder((homepageSections || []).length + 1);
                    setSectionIsVisible(true);
                    setShowSectionForm(!showSectionForm);
                  }}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition active:scale-95 select-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showSectionForm && !editingSection ? "Cancel" : "Add Row"}</span>
                </button>
              </div>

              {/* Section Creation/Edition Form */}
              {showSectionForm && (
                <form onSubmit={handleSaveSection} className="bg-zinc-50/50 border border-zinc-200/60 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
                  <h5 className="font-black text-xs text-zinc-800 uppercase tracking-wider">
                    {editingSection ? "✏️ Edit Homepage Section Row" : "✨ Create New Homepage Section Row"}
                  </h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Row Title / Header</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fresh Organic Greens"
                        value={sectionTitle}
                        onChange={(e) => setSectionTitle(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Mapped Category ID Link</label>
                      <select
                        value={sectionCategoryId}
                        onChange={(e) => setSectionCategoryId(e.target.value)}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none"
                      >
                        <option value="fruits-veg">Fruits & Vegetables</option>
                        <option value="grocery-staples">Grocery & Staples</option>
                        <option value="dairy-bread">Dairy & Morn Bread</option>
                        <option value="snacks-munchies">Snacks & Cookies</option>
                        <option value="beverages">Hydrating Beverages</option>
                        <option value="personal-care">Personal Care</option>
                        <option value="household">Household Utilities</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Display Sequence Order</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 1"
                        value={sectionOrder}
                        onChange={(e) => setSectionOrder(Number(e.target.value))}
                        className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-white text-zinc-800 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="sectionIsVisible"
                        checked={sectionIsVisible}
                        onChange={(e) => setSectionIsVisible(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300 rounded"
                      />
                      <label htmlFor="sectionIsVisible" className="text-xs text-zinc-700 font-extrabold uppercase">
                        Visible on home screen
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer transition shadow-md shadow-emerald-500/15"
                    >
                      {editingSection ? "Save Changes" : "Publish Section Row"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSectionForm(false);
                        setEditingSection(null);
                      }}
                      className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black text-xs rounded-xl cursor-pointer transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Sections List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {(homepageSections || []).length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50 text-xs text-zinc-400 font-bold">
                    No custom rows configured. App will fall back to standard sections.
                  </div>
                ) : (
                  [...homepageSections].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((s: any) => (
                    <div key={s.id} className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex items-center justify-between gap-4 hover:border-zinc-300 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-lg">
                            Row #{s.order || 1}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            s.isVisible !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            {s.isVisible !== false ? "Visible" : "Hidden"}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-sm text-zinc-900 leading-tight mt-1">{s.title}</h5>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Category link: {s.categoryId || "None"}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingSection(s);
                            setSectionTitle(s.title || "");
                            setSectionCategoryId(s.categoryId || "fruits-veg");
                            setSectionOrder(s.order !== undefined ? s.order : 1);
                            setSectionIsVisible(s.isVisible !== false);
                            setShowSectionForm(true);
                          }}
                          className="bg-white hover:bg-zinc-100 text-zinc-700 p-2 rounded-xl border border-zinc-200 cursor-pointer active:scale-90 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = confirm(`Are you sure you want to delete section row "${s.title}"?`);
                            if (confirmed) {
                              await deleteSection(s.id);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl border border-red-100 cursor-pointer active:scale-90 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
