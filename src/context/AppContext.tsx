import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, PRODUCTS as INITIAL_PRODUCTS } from "../data/products";
import { UserProfile, CartItem, Order, Coupon, UserRole, SupportTicket, Review, DeliveryChargeConfig, DeliveryZone, Banner, HomepageSection, Category } from "../types";
import { TRANSLATIONS, Language } from "../data/translations";
import { auth, db } from "../lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { getUserProfile } from "../lib/auth-service";

interface AppContextType {
  user: UserProfile | null;
  loginAs: (email: string, role: UserRole, name?: string) => void;
  logout: () => void;
  cart: CartItem[];
  addToCart: (product: Product, selectedWeight?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartWeight: (productId: string, weight: number) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  orders: Order[];
  placeOrder: (address: string, paymentMethod: "COD" | "UPI", couponCode?: string, deliveryNotes?: string) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order["status"], partnerId?: string | null) => Promise<void>;
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (code: string, updated: Partial<Coupon>) => void;
  deleteCoupon: (code: string) => void;
  activeCoupon: Coupon | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  deliveryCharge: number;
  setDeliveryCharge: (charge: number) => void;
  deliveryConfig: DeliveryChargeConfig;
  updateDeliveryConfig: (config: DeliveryChargeConfig) => Promise<void>;
  getDynamicDeliveryChargeForAddress: (targetAddress: string, orderSubtotal: number) => number;
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  recentlyViewed: string[];
  addToRecentlyViewed: (id: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  notifications: Array<{ id: string; title: string; message: string; date: string; read: boolean }>;
  addNotification: (title: string, message: string) => void;
  markNotificationsAsRead: () => void;
  referralCode: string;
  applyReferralCode: (code: string) => boolean;
  addWalletFunds: (amount: number) => void;
  redeemPoints: () => void;
  isDeliveryOnline: boolean;
  setDeliveryOnline: (online: boolean) => void;
  aiRecommendations: Product[];
  aiReasoning: string;
  fetchAIRecommendations: (cartItems: CartItem[]) => Promise<void>;
  tickets: SupportTicket[];
  createTicket: (category: "Late Delivery" | "Damaged Item" | "Wrong Item" | "Billing Issue" | "General Feedback", description: string, orderId?: string) => void;
  addTicketMessage: (ticketId: string, text: string, sender: "customer" | "support") => void;
  resolveTicket: (ticketId: string) => void;
  reviews: Review[];
  addProductReview: (productId: string, rating: number, comment: string, userName?: string) => void;
  banners: Banner[];
  addBanner: (banner: Banner) => void;
  updateBanner: (id: string, updated: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  homepageSections: HomepageSection[];
  addSection: (section: HomepageSection) => void;
  updateSection: (id: string, updated: Partial<HomepageSection>) => void;
  deleteSection: (id: string) => void;
  customCategories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updated: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_DELIVERY_CONFIG: DeliveryChargeConfig = {
  type: "fixed",
  fixedAmount: 25,
  chargePerKm: 10,
  baseCharge: 20,
  baseDistanceKm: 2,
  minOrderForFreeDelivery: 499,
  citiesConfig: {
    "Kolkata": { fixedAmount: 20, chargePerKm: 8, baseCharge: 15, isCustom: true },
    "Delhi": { fixedAmount: 30, chargePerKm: 12, baseCharge: 25, isCustom: true }
  },
  zones: [
    { id: "zone-1", name: "Sector 5 Salt Lake", city: "Kolkata", lat: 22.5726, lng: 88.3639, radiusKm: 5, deliveryCharge: 15, isActive: true },
    { id: "zone-2", name: "Cyber City Phase 2", city: "Gurugram", lat: 28.4952, lng: 77.0894, radiusKm: 6, deliveryCharge: 30, isActive: true }
  ],
  googleMapsEnabled: true
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Core States ---
  const [user, setUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem("qn_user");
    if (cached) return JSON.parse(cached);
    // Default mock user
    return {
      uid: "cust-1",
      email: "palsubhajit2005tq@gmail.com",
      name: "Subhajit Pal",
      phone: "+91 98765 43210",
      role: "customer",
      walletBalance: 350,
      loyaltyPoints: 120,
      addresses: ["12, Premium Park, Sector 5, Salt Lake, Kolkata", "45, Cyber City, Phase 2, Gurugram"],
      referralCode: "QUICK_SUBH_77",
      recentlyViewed: []
    };
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const cached = localStorage.getItem("qn_cart");
    return cached ? JSON.parse(cached) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const cached = localStorage.getItem("qn_wishlist");
    return cached ? JSON.parse(cached) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem("qn_products");
    return cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const cached = localStorage.getItem("qn_coupons");
    if (cached) return JSON.parse(cached);
    return [
      { code: "QUICK20", discountPercent: 20, minOrderValue: 299, description: "20% OFF on order value above ₹299", isActive: true },
      { code: "FRESH50", discountPercent: 50, minOrderValue: 599, description: "Save up to ₹150 on fresh items above ₹599", isActive: true },
      { code: "FIRSTNOW", discountPercent: 30, minOrderValue: 199, description: "30% OFF welcome deal on orders above ₹199", isActive: true }
    ];
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const cached = localStorage.getItem("qn_banners");
    if (cached) return JSON.parse(cached);
    return [
      {
        id: "slide-1",
        title: "Super Saver Grocery Deals",
        tagline: "UP TO 50% OFF",
        desc: "Farm fresh organic apples, avocados & daily essentials delivered in 10 minutes flat.",
        bg: "from-blue-600 to-indigo-700",
        accent: "text-amber-300",
        btnText: "Shop Fresh Fruits",
        badge: "Organic Freshness",
        categoryId: "fruits-veg",
        isEnabled: true,
        order: 1
      },
      {
        id: "slide-2",
        title: "Gourmet Dairy & Artisanal Bakeries",
        tagline: "FRESH EVERY MORNING",
        desc: "Whole milk, creamier local paneer, premium butter, and authentic sourdough loaves.",
        bg: "from-amber-400 to-orange-500",
        accent: "text-white",
        btnText: "Explore Dairy",
        badge: "Artisanal Bakeries",
        categoryId: "dairy-bread",
        isEnabled: true,
        order: 2
      },
      {
        id: "slide-3",
        title: "Summer Chills & Hydration Station",
        tagline: "FLAT 20% OFF",
        desc: "Cold-pressed juices, premium Japanese matcha green tea & imported sparkling water.",
        bg: "from-sky-500 to-indigo-600",
        accent: "text-yellow-300",
        btnText: "Order Drinks",
        badge: "Summer Specials",
        categoryId: "beverages",
        isEnabled: true,
        order: 3
      }
    ];
  });

  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(() => {
    const cached = localStorage.getItem("qn_homepage_sections");
    if (cached) return JSON.parse(cached);
    return [
      { id: 'sec-veg', title: 'Vegetables', categoryId: 'fruits-veg', isVisible: true, order: 1 },
      { id: 'sec-fruits', title: 'Fruits', categoryId: 'fruits-veg', isVisible: true, order: 2 },
      { id: 'sec-grocery', title: 'Grocery', categoryId: 'grocery-staples', isVisible: true, order: 3 },
      { id: 'sec-rice', title: 'Rice', categoryId: 'grocery-staples', isVisible: true, order: 4 },
      { id: 'sec-dal', title: 'Dal', categoryId: 'grocery-staples', isVisible: true, order: 5 },
      { id: 'sec-oil', title: 'Oil', categoryId: 'grocery-staples', isVisible: true, order: 6 },
      { id: 'sec-dairy', title: 'Dairy & Milk', categoryId: 'dairy-bread', isVisible: true, order: 7 },
      { id: 'sec-snacks', title: 'Snacks', categoryId: 'snacks-munchies', isVisible: true, order: 8 },
      { id: 'sec-beverages', title: 'Beverages', categoryId: 'beverages', isVisible: true, order: 9 },
      { id: 'sec-personal', title: 'Personal Care', categoryId: 'personal-care', isVisible: true, order: 10 },
      { id: 'sec-household', title: 'Household & Essentials', categoryId: 'household', isVisible: true, order: 11 }
    ];
  });

  const [customCategories, setCustomCategories] = useState<Category[]>(() => {
    const cached = localStorage.getItem("qn_custom_categories");
    if (cached) return JSON.parse(cached);
    return [
      { id: 'fruits-veg', name: 'Fruits & Vegetables', icon: 'Apple', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', order: 1 },
      { id: 'grocery-staples', name: 'Grocery & Staples', icon: 'Wheat', color: 'bg-amber-50 text-amber-600 border-amber-100', order: 2 },
      { id: 'dairy-bread', name: 'Dairy & Bread', icon: 'Egg', color: 'bg-sky-50 text-sky-600 border-sky-100', order: 3 },
      { id: 'snacks-munchies', name: 'Snacks & Munchies', icon: 'Cookie', color: 'bg-orange-50 text-orange-600 border-orange-100', order: 4 },
      { id: 'beverages', name: 'Beverages', icon: 'CupSoda', color: 'bg-purple-50 text-purple-600 border-purple-100', order: 5 },
      { id: 'personal-care', name: 'Personal Care', icon: 'Sparkles', color: 'bg-pink-50 text-pink-600 border-pink-100', order: 6 },
      { id: 'household', name: 'Household', icon: 'Home', color: 'bg-teal-50 text-teal-600 border-teal-100', order: 7 }
    ];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const cached = localStorage.getItem("qn_orders");
    if (cached) return JSON.parse(cached);
    // Default initial mock orders to populate dashboard and driver panels
    return [
      {
        id: "QN-1024",
        customerId: "cust-1",
        customerName: "Subhajit Pal",
        customerPhone: "+91 98765 43210",
        items: [
          { product: INITIAL_PRODUCTS[0], quantity: 2 }, // Organic Red Apples
          { product: INITIAL_PRODUCTS[9], quantity: 1 }  // Organic Whole Milk
        ],
        subtotal: 362,
        discount: 0,
        deliveryCharge: 25,
        total: 387,
        status: "Delivered",
        createdAt: "2026-06-30T18:45:00Z",
        address: "12, Premium Park, Sector 5, Salt Lake, Kolkata",
        paymentMethod: "UPI",
        paymentStatus: "Paid",
        deliveryOTP: "4821",
        deliveryPartnerId: "driver-1"
      },
      {
        id: "QN-1025",
        customerId: "cust-1",
        customerName: "Subhajit Pal",
        customerPhone: "+91 98765 43210",
        items: [
          { product: INITIAL_PRODUCTS[4], quantity: 1 }, // Hass Avocado
          { product: INITIAL_PRODUCTS[6], quantity: 1 }  // Pure Raw Organic Honey
        ],
        subtotal: 444,
        discount: 40,
        deliveryCharge: 25,
        total: 429,
        status: "Pending",
        createdAt: new Date().toISOString(),
        address: "12, Premium Park, Sector 5, Salt Lake, Kolkata",
        paymentMethod: "COD",
        paymentStatus: "Pending",
        deliveryOTP: "1593",
        deliveryPartnerId: null
      }
    ];
  });

  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(25);
  const [deliveryConfig, setDeliveryConfigState] = useState<DeliveryChargeConfig>(DEFAULT_DELIVERY_CONFIG);

  const getDynamicDeliveryChargeForAddress = (targetAddress: string, orderSubtotal: number): number => {
    const config = deliveryConfig || DEFAULT_DELIVERY_CONFIG;

    // 1. Free delivery threshold check
    const freeDeliveryThreshold = config.minOrderForFreeDelivery !== undefined ? config.minOrderForFreeDelivery : 499;
    if (orderSubtotal >= freeDeliveryThreshold) {
      return 0;
    }

    // 2. Zone-based matching (e.g., "Salt Lake", "Sector 5", "Cyber City")
    const matchedZone = config.zones?.find(
      (zone) => zone.isActive && targetAddress.toLowerCase().includes(zone.name.toLowerCase())
    );
    if (matchedZone) {
      return matchedZone.deliveryCharge;
    }

    // 3. Determine City
    let city = "Kolkata";
    if (targetAddress.toLowerCase().includes("delhi")) city = "Delhi";
    else if (targetAddress.toLowerCase().includes("mumbai")) city = "Mumbai";
    else if (targetAddress.toLowerCase().includes("gurugram")) city = "Gurugram";
    else if (targetAddress.toLowerCase().includes("kolkata")) city = "Kolkata";

    const cityConfig = config.citiesConfig?.[city];

    // 4. Calculate based on type: "fixed" or "distance"
    if (config.type === "fixed") {
      if (cityConfig && cityConfig.isCustom) {
        return cityConfig.fixedAmount !== undefined ? cityConfig.fixedAmount : (config.fixedAmount || 25);
      }
      return config.fixedAmount || 25;
    } else {
      // Distance-based calculation
      let distance = 2.5;
      if (targetAddress.toLowerCase().includes("salt lake")) distance = 1.5;
      else if (targetAddress.toLowerCase().includes("sector 5")) distance = 1.2;
      else if (targetAddress.toLowerCase().includes("cyber city")) distance = 3.8;
      else if (targetAddress.toLowerCase().includes("gurugram")) distance = 4.2;

      const activeBaseCharge = (cityConfig && cityConfig.isCustom && cityConfig.baseCharge !== undefined)
        ? cityConfig.baseCharge
        : (config.baseCharge || 20);

      const activeChargePerKm = (cityConfig && cityConfig.isCustom && cityConfig.chargePerKm !== undefined)
        ? cityConfig.chargePerKm
        : (config.chargePerKm || 10);

      const activeBaseDistance = config.baseDistanceKm || 2;

      if (distance <= activeBaseDistance) {
        return activeBaseCharge;
      } else {
        return Math.round(activeBaseCharge + (distance - activeBaseDistance) * activeChargePerKm);
      }
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "delivery_charge_config"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DeliveryChargeConfig;
        setDeliveryConfigState(data);
      } else {
        setDoc(doc(db, "settings", "delivery_charge_config"), DEFAULT_DELIVERY_CONFIG)
          .catch(err => console.warn("Could not write initial delivery config to firestore", err));
      }
    }, (error) => {
      console.warn("Firestore delivery charge config read error: using defaults", error);
    });
    return () => unsub();
  }, []);

  // Recalculate active deliveryCharge based on current cart subtotal and user's primary address
  useEffect(() => {
    const currentAddress = user?.addresses[0] || "12, Premium Park, Sector 5, Salt Lake, Kolkata";
    
    const getCartItemPrice = (item: any) => {
      if (item.product.isWeightBased) {
        const weight = item.selectedWeight || item.product.minWeight || 1;
        const pricePerKg = item.product.pricePerKg || item.product.price;
        return pricePerKg * weight;
      }
      return item.product.price;
    };
    const subtotal = cart.reduce((sum, item) => sum + getCartItemPrice(item) * item.quantity, 0);
    const calculatedCharge = getDynamicDeliveryChargeForAddress(currentAddress, subtotal);
    setDeliveryCharge(calculatedCharge);
  }, [cart, user, deliveryConfig]);

  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [language, setLanguageState] = useState<Language>("en");
  const [darkMode, setDarkModeState] = useState<boolean>(false);
  const [isDeliveryOnline, setDeliveryOnline] = useState<boolean>(true);

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; date: string; read: boolean }>>(() => {
    return [
      { id: "notif-1", title: "Welcome to QuickNow!", message: "Get fresh groceries delivered in 10 minutes flat.", date: "Just now", read: false }
    ];
  });

  // AI states
  const [aiRecommendations, setAiRecommendations] = useState<Product[]>([]);
  const [aiReasoning, setAiReasoning] = useState<string>("");

  // Customer Support & Tickets states
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const cached = localStorage.getItem("qn_tickets");
    if (cached) return JSON.parse(cached);
    return [
      {
        id: "TKT-8271",
        orderId: "QN-1024",
        customerName: "Subhajit Pal",
        category: "Billing Issue",
        description: "Applied discount coupon is not displaying properly on the PDF invoice download.",
        status: "Open",
        createdAt: "2026-06-30T19:00:00Z",
        messages: [
          { sender: "customer", text: "Hi, I checked out with QUICK20 but the invoice displays full amount before discount, please rectify.", time: "19:00" },
          { sender: "support", text: "We are reviewing your transaction history. It will be credited back shortly.", time: "19:15" }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("qn_tickets", JSON.stringify(tickets));
  }, [tickets]);

  // Product Reviews State
  const [reviews, setReviews] = useState<Review[]>(() => {
    const cached = localStorage.getItem("qn_reviews");
    if (cached) return JSON.parse(cached);

    const initialReviews: Review[] = [];
    const reviewers = [
      { name: "Ananya Sharma" },
      { name: "Arjun Mehta" },
      { name: "Siddharth Sen" },
      { name: "Priya Nair" },
      { name: "Karan Johar" },
      { name: "Riya Kapoor" }
    ];

    const feedbackTemplates: { rating: number; comment: string }[] = [
      { rating: 5, comment: "Absolutely outstanding quality! Extremely fresh, well-packaged, and arrived cold." },
      { rating: 5, comment: "Super fast 10-minute delivery and the quality is better than what I pick myself." },
      { rating: 4, comment: "Great taste and freshness. Slightly higher priced but the convenient delivery is worth it." },
      { rating: 4, comment: "Very fresh and hygiene standards are visible in the packaging. Will order again." },
      { rating: 5, comment: "Exactly what I was looking for! Perfect ripeness and flavor." }
    ];

    INITIAL_PRODUCTS.forEach((prod, pIdx) => {
      for (let i = 0; i < 3; i++) {
        const templateIdx = (pIdx * 3 + i) % feedbackTemplates.length;
        const reviewerIdx = (pIdx * 2 + i) % reviewers.length;
        const template = feedbackTemplates[templateIdx];
        const reviewer = reviewers[reviewerIdx];
        
        const date = new Date();
        date.setDate(date.getDate() - (i * 2 + (pIdx % 3)));
        
        initialReviews.push({
          id: `rev-${prod.id}-${i}`,
          productId: prod.id,
          userName: reviewer.name,
          rating: template.rating,
          comment: template.comment,
          date: date.toISOString().split('T')[0],
          isVerifiedPurchase: true
        });
      }
    });

    return initialReviews;
  });

  useEffect(() => {
    localStorage.setItem("qn_reviews", JSON.stringify(reviews));
  }, [reviews]);

  // --- Firebase Authentication Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch full profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setUser(profile);
        } else {
          // Fallback if firestore document hasn't completed setup yet
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "Premium Customer",
            phone: firebaseUser.phoneNumber || "",
            role: "customer",
            walletBalance: 0,
            loyaltyPoints: 0,
            addresses: [],
            structuredAddresses: [],
            referralCode: "QN_USER_" + firebaseUser.uid.substring(0, 5).toUpperCase(),
            recentlyViewed: []
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Sync with LocalStorage on State Changes ---
  useEffect(() => {
    localStorage.setItem("qn_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("qn_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("qn_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("qn_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("qn_coupons", JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem("qn_orders", JSON.stringify(orders));
  }, [orders]);

  // --- Light Mode Enforced setup ---
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // --- Methods ---
  const loginAs = (email: string, role: UserRole, name?: string) => {
    firebaseSignOut(auth).catch(() => {});
    let mockName = name || (role === "admin" ? "Admin Master" : role === "delivery" ? "Rider Captain" : role === "seller" ? "Fresh Farms Inc. (Seller)" : "Subhajit Pal");
    let mockPhone = role === "delivery" ? "+91 88888 77777" : role === "seller" ? "+91 77777 66666" : "+91 98765 43210";
    
    const newUser: UserProfile = {
      uid: role === "admin" ? "admin-1" : role === "delivery" ? "driver-1" : role === "seller" ? "seller-1" : "cust-1",
      email,
      name: mockName,
      phone: mockPhone,
      role,
      walletBalance: role === "customer" ? 500 : role === "seller" ? 14200 : 0,
      loyaltyPoints: role === "customer" ? 150 : 0,
      addresses: ["12, Premium Park, Sector 5, Salt Lake, Kolkata"],
      referralCode: "QUICK_" + role.toUpperCase() + "_99",
      recentlyViewed: []
    };
    setUser(newUser);
    addNotification("Logged in successfully", `Welcome back, ${mockName}! Acting as ${role.toUpperCase()}.`);
  };

  const logout = () => {
    firebaseSignOut(auth).catch(() => {});
    setUser(null);
    setActiveCoupon(null);
    setCart([]);
    addNotification("Logged Out", "You have safely signed out of your session.");
  };

  const addToCart = (product: Product, selectedWeight?: number) => {
    setCart((prev) => {
      const defaultWeight = product.isWeightBased ? (selectedWeight || product.minWeight || 1) : undefined;
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1, selectedWeight: defaultWeight || item.selectedWeight } 
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedWeight: defaultWeight }];
    });
    addNotification("Added to Cart", `${product.name} is now in your basket.`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const updateCartWeight = (productId: string, weight: number) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, selectedWeight: weight } : item))
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const addNotification = (title: string, message: string) => {
    const newNotif = {
      id: "notif-" + Date.now(),
      title,
      message,
      date: "Just now",
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // --- Placing Order ---
  const placeOrder = async (
    address: string,
    paymentMethod: "COD" | "UPI",
    couponCode?: string,
    deliveryNotes?: string
  ): Promise<Order> => {
    const getCartItemPrice = (item: any) => {
      if (item.product.isWeightBased) {
        const weight = item.selectedWeight || item.product.minWeight || 1;
        const pricePerKg = item.product.pricePerKg || item.product.price;
        return pricePerKg * weight;
      }
      return item.product.price;
    };
    const subtotal = cart.reduce((sum, item) => sum + getCartItemPrice(item) * item.quantity, 0);
    let discount = 0;
    if (activeCoupon) {
      discount = Math.round((subtotal * activeCoupon.discountPercent) / 100);
    }
    const charge = getDynamicDeliveryChargeForAddress(address, subtotal);
    const finalTotal = subtotal - discount + charge;

    // Generate standard interactive delivery verify OTP
    const generatedOTP = String(Math.floor(1000 + Math.random() * 9000));

    const newOrder: Order = {
      id: "QN-" + Math.floor(1000 + Math.random() * 9000),
      customerId: user?.uid || "guest",
      customerName: user?.name || "Premium Customer",
      customerPhone: user?.phone || "+91 99999 88888",
      items: [...cart],
      subtotal,
      discount,
      deliveryCharge: charge,
      total: finalTotal,
      status: "Pending",
      createdAt: new Date().toISOString(),
      address,
      paymentMethod,
      paymentStatus: paymentMethod === "UPI" ? "Paid" : "Pending",
      deliveryOTP: generatedOTP,
      deliveryPartnerId: null,
      deliveryNotes
    };

    // Update stock levels
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const cartItem = cart.find((c) => c.product.id === p.id);
        if (cartItem) {
          const newStock = Math.max(0, p.stock - cartItem.quantity);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );

    // Deduct wallet if Customer has enough balance? The user requested Cash On Delivery or UPI Payment, but wallet is there.
    // If they pay via UPI we set paid. 

    // Update User loyalty points
    if (user) {
      const addedPoints = Math.floor(finalTotal / 10); // 1 point for every ₹10 spent
      setUser((prev) =>
        prev
          ? {
              ...prev,
              loyaltyPoints: prev.loyaltyPoints + addedPoints,
            }
          : null
      );
    }

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setActiveCoupon(null);

    addNotification(
      "Order Placed!",
      `Order ${newOrder.id} has been created. A QuickNow rider is being assigned.`
    );

    // Simulate Rider auto-acceptance for live order tracking demo after 5 seconds
    setTimeout(() => {
      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          if (o.id === newOrder.id) {
            addNotification("Rider Assigned", `Rider Captain is picking up your package for order ${o.id}!`);
            return { ...o, status: "Accepted", deliveryPartnerId: "driver-1" };
          }
          return o;
        })
      );
    }, 6000);

    return newOrder;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order["status"],
    partnerId: string | null = null
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: Order = { ...o, status };
          if (partnerId !== undefined) {
            updated.deliveryPartnerId = partnerId;
          }
          if (status === "Delivered") {
            updated.paymentStatus = "Paid";
          }
          return updated;
        }
        return o;
      })
    );
    addNotification(`Order status updated`, `Order ${orderId} is now: ${status.toUpperCase()}`);
  };

  const updateDeliveryConfig = async (newConfig: DeliveryChargeConfig) => {
    try {
      await setDoc(doc(db, "settings", "delivery_charge_config"), newConfig);
      setDeliveryConfigState(newConfig);
      setDeliveryCharge(newConfig.fixedAmount || 25);
      addNotification("Delivery Settings Saved", "Dynamic delivery charge rules updated successfully.");
    } catch (e) {
      console.error("Firestore write error", e);
      addNotification("Error Saving", "Could not save delivery configuration.");
    }
  };

  // --- Coupons ---
  const applyCoupon = (code: string): boolean => {
    const found = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (found) {
      const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      if (subtotal >= found.minOrderValue) {
        setActiveCoupon(found);
        addNotification("Coupon Applied!", `Saved ${found.discountPercent}% off on this order.`);
        return true;
      }
    }
    return false;
  };

  const removeCoupon = () => setActiveCoupon(null);

  const addCoupon = (c: Coupon) => setCoupons((prev) => [c, ...prev]);
  const updateCoupon = (code: string, updated: Partial<Coupon>) => {
    setCoupons((prev) =>
      prev.map((c) => (c.code === code ? { ...c, ...updated } : c))
    );
  };
  const deleteCoupon = (code: string) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code));
  };

  // --- Products CRUD for Admin ---
  const addProduct = (p: Product) => setProducts((prev) => [p, ...prev]);
  const updateProduct = (p: Product) => {
    setProducts((prev) => prev.map((orig) => (orig.id === p.id ? p : orig)));
  };
  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // --- Recently Viewed ---
  const addToRecentlyViewed = (id: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item !== id);
      return [id, ...filtered].slice(0, 5);
    });
  };

  // --- Language Switch ---
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    addNotification("Language Switched", `Language changed to: ${lang.toUpperCase()}`);
  };

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
  };

  // --- Wallet & Loyalty points ---
  const addWalletFunds = (amount: number) => {
    if (user) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              walletBalance: prev.walletBalance + amount,
            }
          : null
      );
      addNotification("Funds Added", `Successfully credited ₹${amount} to your QuickNow Wallet.`);
    }
  };

  const redeemPoints = () => {
    if (user && user.loyaltyPoints >= 100) {
      const discountValue = Math.floor(user.loyaltyPoints / 100) * 10; // 100 points = ₹10
      setUser((prev) =>
        prev
          ? {
              ...prev,
              walletBalance: prev.walletBalance + discountValue,
              loyaltyPoints: prev.loyaltyPoints % 100,
            }
          : null
      );
      addNotification(
        "Loyalty Points Redeemed",
        `Redeemed points for ₹${discountValue} in your wallet!`
      );
    }
  };

  // --- Referral ---
  const applyReferralCode = (code: string): boolean => {
    if (code.trim().toUpperCase() === "QUICK_SUBH_77") {
      if (user) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                walletBalance: prev.walletBalance + 50,
                loyaltyPoints: prev.loyaltyPoints + 100,
              }
            : null
        );
        addNotification("Referral Code Applied!", "You received ₹50 wallet credit and 100 loyalty points!");
        return true;
      }
    }
    return false;
  };

  // --- AI Recommendations ---
  const fetchAIRecommendations = async (cartItems: CartItem[]) => {
    try {
      const response = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cartItems.map((c) => ({ id: c.product.id, name: c.product.name })),
          category: cartItems.length > 0 ? cartItems[0].product.category : ""
        })
      });

      if (response.ok) {
        const data = await response.json();
        const recommendedIds: string[] = data.recommendations || [];
        const matched = products.filter((p) => recommendedIds.includes(p.id));
        setAiRecommendations(matched.length > 0 ? matched : products.slice(0, 4));
        setAiReasoning(data.reasoning || "Picked specifically to balance and supplement your healthy shopping list.");
      } else {
        // Fallback
        setAiRecommendations(products.slice(0, 4));
        setAiReasoning("Healthy recommendations selected from our premium bestseller list.");
      }
    } catch (e) {
      // Handle fallback silently without logging errors to console
      setAiRecommendations(products.slice(0, 4));
      setAiReasoning("Premium fresh produce matching your selection.");
    }
  };

  // Trigger recommendation recalculation whenever cart item layout changes
  useEffect(() => {
    fetchAIRecommendations(cart);
  }, [cart]);

  const createTicket = (
    category: "Late Delivery" | "Damaged Item" | "Wrong Item" | "Billing Issue" | "General Feedback",
    description: string,
    orderId?: string
  ) => {
    const newTicket: SupportTicket = {
      id: "TKT-" + Math.floor(1000 + Math.random() * 9000),
      orderId,
      customerName: user?.name || "Premium Customer",
      category,
      description,
      status: "Open",
      createdAt: new Date().toISOString(),
      messages: [
        { sender: "customer", text: description, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
      ]
    };
    setTickets((prev) => [newTicket, ...prev]);
    addNotification("Support Ticket Opened", `Your ticket ${newTicket.id} for "${category}" has been raised successfully.`);
  };

  const addTicketMessage = (ticketId: string, text: string, sender: "customer" | "support") => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: sender === "support" ? "In-Progress" : t.status,
            messages: [
              ...t.messages,
              { sender, text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
            ]
          };
        }
        return t;
      })
    );
  };

  const resolveTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          addNotification("Ticket Resolved", `Ticket ${ticketId} has been marked as RESOLVED by support.`);
          return { ...t, status: "Resolved" };
        }
        return t;
      })
    );
  };

  const addProductReview = (productId: string, rating: number, comment: string, userName?: string) => {
    const newReview: Review = {
      id: `rev-user-${Date.now()}`,
      productId,
      userName: userName || user?.name || "Anonymous Customer",
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
      isVerifiedPurchase: true
    };

    setReviews((prev) => [newReview, ...prev]);

    // Update product stats
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        if (p.id === productId) {
          const productReviews = [newReview, ...reviews.filter((r) => r.productId === productId)];
          const totalReviews = productReviews.length;
          const averageRating = Number(
            (productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
          );
          return {
            ...p,
            rating: averageRating,
            reviews: totalReviews
          };
        }
        return p;
      });
    });

    addNotification(
      "Review Submitted!",
      `Thank you for rating our product ${rating} out of 5 stars.`
    );
  };

  const addBanner = (b: Banner) => {
    const updated = [...banners, b];
    setBanners(updated);
    localStorage.setItem("qn_banners", JSON.stringify(updated));
  };
  const updateBanner = (id: string, updated: Partial<Banner>) => {
    const updatedBanners = banners.map(b => b.id === id ? { ...b, ...updated } : b);
    setBanners(updatedBanners);
    localStorage.setItem("qn_banners", JSON.stringify(updatedBanners));
  };
  const deleteBanner = (id: string) => {
    const updated = banners.filter(b => b.id !== id);
    setBanners(updated);
    localStorage.setItem("qn_banners", JSON.stringify(updated));
  };

  const addSection = (s: HomepageSection) => {
    const updated = [...homepageSections, s];
    setHomepageSections(updated);
    localStorage.setItem("qn_homepage_sections", JSON.stringify(updated));
  };
  const updateSection = (id: string, updated: Partial<HomepageSection>) => {
    const updatedSections = homepageSections.map(s => s.id === id ? { ...s, ...updated } : s);
    setHomepageSections(updatedSections);
    localStorage.setItem("qn_homepage_sections", JSON.stringify(updatedSections));
  };
  const deleteSection = (id: string) => {
    const updated = homepageSections.filter(s => s.id !== id);
    setHomepageSections(updated);
    localStorage.setItem("qn_homepage_sections", JSON.stringify(updated));
  };

  const addCategory = (c: Category) => {
    const updated = [...customCategories, c];
    setCustomCategories(updated);
    localStorage.setItem("qn_custom_categories", JSON.stringify(updated));
  };
  const updateCategory = (id: string, updated: Partial<Category>) => {
    const updatedCats = customCategories.map(c => c.id === id ? { ...c, ...updated } : c);
    setCustomCategories(updatedCats);
    localStorage.setItem("qn_custom_categories", JSON.stringify(updatedCats));
  };
  const deleteCategory = (id: string) => {
    const updated = customCategories.filter(c => c.id !== id);
    setCustomCategories(updated);
    localStorage.setItem("qn_custom_categories", JSON.stringify(updated));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loginAs,
        logout,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartWeight,
        clearCart,
        wishlist,
        toggleWishlist,
        orders,
        placeOrder,
        updateOrderStatus,
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        activeCoupon,
        applyCoupon,
        removeCoupon,
        deliveryCharge,
        setDeliveryCharge,
        deliveryConfig,
        updateDeliveryConfig,
        getDynamicDeliveryChargeForAddress,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        recentlyViewed,
        addToRecentlyViewed,
        language,
        setLanguage,
        darkMode,
        setDarkMode,
        notifications,
        addNotification,
        markNotificationsAsRead,
        referralCode: "QUICK_USER_" + Math.floor(100 + Math.random() * 900),
        applyReferralCode,
        addWalletFunds,
        redeemPoints,
        isDeliveryOnline,
        setDeliveryOnline,
        aiRecommendations,
        aiReasoning,
        fetchAIRecommendations,
        tickets,
        createTicket,
        addTicketMessage,
        resolveTicket,
        reviews,
        addProductReview,
        banners,
        addBanner,
        updateBanner,
        deleteBanner,
        homepageSections,
        addSection,
        updateSection,
        deleteSection,
        customCategories,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
