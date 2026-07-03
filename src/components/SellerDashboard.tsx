import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Product } from "../data/products";
import { 
  Store, TrendingUp, Package, AlertTriangle, CheckCircle, Clock, 
  Search, Plus, X, Edit, Trash2, Sliders, ArrowUpRight, ArrowDownRight,
  Sparkles, DollarSign, ListFilter, RotateCcw
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Mock historic performance data for Recharts area graph
const HOURLY_SALES_DATA = [
  { time: "08:00", sales: 2400, orders: 12 },
  { time: "10:00", sales: 4500, orders: 22 },
  { time: "12:00", sales: 7800, orders: 38 },
  { time: "14:00", sales: 6200, orders: 31 },
  { time: "16:00", sales: 9100, orders: 45 },
  { time: "18:00", sales: 12500, orders: 62 },
  { time: "20:00", sales: 15400, orders: 79 },
  { time: "22:00", sales: 8900, orders: 41 },
];

export const SellerDashboard: React.FC = () => {
  const { 
    user, products, orders, updateOrderStatus, addProduct, updateProduct, deleteProduct 
  } = useApp();

  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "orders">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Product modal form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("fruits-veg");
  const [pPrice, setPPrice] = useState(100);
  const [pOrigPrice, setPOrigPrice] = useState(130);
  const [pUnit, setPUnit] = useState("500g");
  const [pStock, setPStock] = useState(50);
  const [pDesc, setPDesc] = useState("");
  const [pImage, setPImage] = useState("");

  if (!user || user.role !== "seller") {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-zinc-100 p-8 text-center space-y-4 shadow-xl">
        <Store className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
        <div>
          <h3 className="text-xl font-black text-zinc-900">Seller Hub Restricted</h3>
          <p className="text-xs text-zinc-500 mt-1">Please select the Seller role from the top-right tool menu to log into the Merchant panel.</p>
        </div>
      </div>
    );
  }

  // Filter products belonging to this seller's perspective
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Seller stats calculations
  const sellerOrders = orders.filter(o => o.status !== "Rejected");
  const totalRevenue = sellerOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Accepted");
  const lowStockCount = products.filter(p => p.stock < 10).length;

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setPName("");
    setPCategory("fruits-veg");
    setPPrice(100);
    setPOrigPrice(130);
    setPUnit("500g");
    setPStock(50);
    setPDesc("");
    setPImage("https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80");
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setPName(p.name);
    setPCategory(p.category);
    setPPrice(p.price);
    setPOrigPrice(p.originalPrice);
    setPUnit(p.unit);
    setPStock(p.stock);
    setPDesc(p.description || "");
    setPImage(p.image);
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: pName,
        category: pCategory,
        price: pPrice,
        originalPrice: pOrigPrice,
        unit: pUnit,
        stock: pStock,
        description: pDesc,
        image: pImage,
        discount: Math.round(((pOrigPrice - pPrice) / pOrigPrice) * 100)
      });
    } else {
      const newP: Product = {
        id: "fv-" + Date.now(),
        name: pName,
        category: pCategory,
        price: pPrice,
        originalPrice: pOrigPrice,
        unit: pUnit,
        stock: pStock,
        description: pDesc,
        image: pImage,
        rating: 4.5,
        reviews: 1,
        discount: Math.round(((pOrigPrice - pPrice) / pOrigPrice) * 100)
      };
      addProduct(newP);
    }
    setShowProductModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-yellow-400/10 via-emerald-500/10 to-emerald-50/20 border border-yellow-200/50 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              Verified Partner Store
            </span>
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-yellow-900/10" /> Super Seller
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Store className="w-8 h-8 text-emerald-600 animate-bounce" />
            {user.name} Dashboard
          </h2>
          <p className="text-xs text-zinc-500 font-medium">
            Manage your dark store catalog, live dispatch deck, and track hourly revenues instantly.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("inventory")}
            className="px-5 py-3 bg-white hover:bg-zinc-50 text-zinc-800 font-bold text-xs rounded-xl shadow-sm border border-zinc-100 transition cursor-pointer flex items-center gap-2"
          >
            <Package className="w-4 h-4 text-emerald-500" />
            Manage Inventory
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/10 transition cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* KPI stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Gross Revenues</p>
            <h4 className="text-2xl font-black text-zinc-900">₹{totalRevenue}</h4>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14.2% today
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Fulfillments Deck</p>
            <h4 className="text-2xl font-black text-zinc-900">{sellerOrders.length}</h4>
            <span className="text-[10px] text-zinc-400 font-bold">100% On-Time dispatch</span>
          </div>
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Low Stock Warnings</p>
            <h4 className="text-2xl font-black text-zinc-900">{lowStockCount}</h4>
            <span className={`text-[10px] font-bold ${lowStockCount > 0 ? "text-rose-500" : "text-emerald-600"}`}>
              {lowStockCount > 0 ? "Action required immediately" : "All inventories healthy"}
            </span>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pending Orders</p>
            <h4 className="text-2xl font-black text-zinc-900">{pendingOrders.length}</h4>
            <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-0.5">
              <Clock className="w-3 h-3 animate-spin" /> Live Queue Processing
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 gap-2">
        {(["overview", "inventory", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === t 
                ? "border-emerald-600 text-emerald-600" 
                : "border-transparent text-zinc-400 hover:text-zinc-650"
            }`}
          >
            {t === "overview" && "Performance Overview"}
            {t === "inventory" && "Catalog & Stock"}
            {t === "orders" && `Fulfillment Queue (${pendingOrders.length})`}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart panel */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-zinc-100 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-zinc-900">Live Sales Analytics</h4>
                <p className="text-[10px] text-zinc-400 font-bold">Hourly business volume trend lines</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">
                Live updates enabled
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY_SALES_DATA}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="time" stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ borderRadius: "16px", border: "1px solid #f4f4f5", fontSize: "11px", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions / Stock health panel */}
          <div className="bg-white rounded-3xl p-5 border border-zinc-100 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-zinc-50 pb-2">
                <h4 className="font-black text-sm text-zinc-900">Quick Alerts Shelf</h4>
                <p className="text-[10px] text-zinc-400 font-bold">Urgent notifications requiring merchant attention</p>
              </div>

              <div className="space-y-3">
                {products.filter(p => p.stock < 10).slice(0, 3).map(p => (
                  <div key={p.id} className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img src={p.image} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-extrabold text-zinc-800 truncate max-w-[130px]">{p.name}</p>
                        <p className="text-[10px] text-rose-500 font-black uppercase">Stock: {p.stock} units left</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="px-2.5 py-1.5 bg-rose-600 text-white font-bold text-[10px] rounded-lg hover:bg-rose-700 transition cursor-pointer"
                    >
                      Refill
                    </button>
                  </div>
                ))}

                {products.filter(p => p.stock < 10).length === 0 && (
                  <div className="py-6 text-center text-zinc-400 space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold">All items in stock!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-400/10 border border-yellow-200/50 p-3.5 rounded-2xl space-y-1.5">
              <p className="text-xs font-black text-yellow-800 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-yellow-600" /> Merchant Payout Cycle
              </p>
              <p className="text-[11px] text-zinc-500 leading-tight">
                Your earned funds will clear and process directly into registered bank account every Wednesday at 00:00.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Inventory management tab */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-3xl p-5 border border-zinc-100 space-y-4 shadow-sm">
          
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b border-zinc-50 pb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search catalog products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex gap-2 items-center">
              <ListFilter className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 font-bold text-zinc-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="fruits-veg">Fruits & Vegetables</option>
                <option value="grocery-staples">Grocery & Staples</option>
                <option value="dairy-bread">Dairy & Bread</option>
                <option value="snacks-munchies">Snacks & Munchies</option>
                <option value="beverages">Beverages</option>
                <option value="personal-care">Personal Care</option>
                <option value="household">Household</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-2">Product Info</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Price Structure</th>
                  <th className="py-3 px-2">Unit</th>
                  <th className="py-3 px-2 text-center">Stock Level</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-3">
                        <img src={p.image} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <p className="font-extrabold text-zinc-900">{p.name}</p>
                          <p className="text-[10px] text-zinc-400 font-bold">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-bold text-zinc-650 capitalize">{p.category}</td>
                    <td className="py-3.5 px-2">
                      <span className="font-black text-zinc-900">₹{p.price}</span>
                      <span className="text-[10px] text-zinc-400 line-through ml-1.5 font-bold">₹{p.originalPrice}</span>
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-zinc-500">{p.unit}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        p.stock === 0 
                          ? "bg-rose-100 text-rose-700"
                          : p.stock < 10 
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <Package className="w-12 h-12 text-zinc-300 mx-auto" />
                <p className="text-zinc-500 font-bold">No products found. Add items to kickstart your sales.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Orders dispatch tab */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-800 uppercase tracking-wider">Live Fulfillment Deck</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.filter(o => o.status === "Pending" || o.status === "Accepted" || o.status === "Dispatched" || o.status === "Out for Delivery").map(o => (
              <div key={o.id} className="bg-white rounded-3xl p-5 border border-zinc-100 space-y-4 shadow-sm">
                
                <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
                  <div>
                    <span className="font-mono font-black text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                      {o.id}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ml-1.5 ${
                      o.deliveryType === "Scheduled" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {o.deliverySlot || "Within 10 mins"}
                    </span>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1">Plural: {o.items.reduce((sum, i) => sum + i.quantity, 0)} items</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    o.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {o.status}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold text-zinc-700">
                      <span>{item.product.name} <span className="text-zinc-400">x {item.quantity}</span></span>
                      <span>₹{item.product.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-50 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Customer info</p>
                    <p className="text-xs font-extrabold text-zinc-800">{o.customerName}</p>
                  </div>

                  <div className="flex gap-2">
                    {o.status === "Pending" && (
                      <button
                        onClick={() => updateOrderStatus(o.id, "Accepted")}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-black text-xs rounded-xl transition cursor-pointer"
                      >
                        Accept Order
                      </button>
                    )}
                    {o.status === "Accepted" && (
                      <button
                        onClick={() => updateOrderStatus(o.id, "Dispatched")}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition cursor-pointer"
                      >
                        Dispatch / Ready for Rider
                      </button>
                    )}
                    {(o.status === "Dispatched" || o.status === "Out for Delivery") && (
                      <span className="text-xs font-bold text-zinc-400 italic">Waiting for Rider pickup...</span>
                    )}
                  </div>
                </div>

              </div>
            ))}

            {orders.filter(o => o.status === "Pending" || o.status === "Accepted" || o.status === "Dispatched" || o.status === "Out for Delivery").length === 0 && (
              <div className="col-span-2 bg-white border border-zinc-100 rounded-3xl p-10 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-zinc-800">Clear Deck!</h4>
                <p className="text-xs text-zinc-400">No active incoming orders at this minute.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product edit modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-zinc-100 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <h4 className="font-black text-sm text-zinc-900">
                {editingProduct ? "Modify Catalog Item" : "Publish New Listing"}
              </h4>
              <button type="button" onClick={() => setShowProductModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="font-bold text-zinc-500 uppercase">Item Name</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500 uppercase">Category</label>
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
                <label className="font-bold text-zinc-500 uppercase">Unit Size</label>
                <input
                  type="text"
                  required
                  value={pUnit}
                  onChange={(e) => setPUnit(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500 uppercase">Discounted Price (₹)</label>
                <input
                  type="number"
                  required
                  value={pPrice}
                  onChange={(e) => setPPrice(Number(e.target.value))}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500 uppercase">Original Price (₹)</label>
                <input
                  type="number"
                  required
                  value={pOrigPrice}
                  onChange={(e) => setPOrigPrice(Number(e.target.value))}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500 uppercase">Initial Stock</label>
                <input
                  type="number"
                  required
                  value={pStock}
                  onChange={(e) => setPStock(Number(e.target.value))}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500 uppercase">Image URL</label>
                <input
                  type="text"
                  required
                  value={pImage}
                  onChange={(e) => setPImage(e.target.value)}
                  className="w-full p-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-zinc-500 uppercase">Product Description</label>
              <textarea
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-850 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition cursor-pointer"
              >
                Save Listing
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
