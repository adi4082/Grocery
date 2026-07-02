import { Product } from "./data/products";

export type UserRole = "customer" | "admin" | "delivery" | "seller";

export interface StructuredAddress {
  id: string;
  type: "Home" | "Work" | "Other";
  houseFlat: string;
  buildingName?: string;
  streetArea: string;
  landmark?: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  walletBalance: number;
  loyaltyPoints: number;
  addresses: string[]; // Simple text format for backwards compatibility
  structuredAddresses?: StructuredAddress[];
  referralCode: string;
  referredBy?: string;
  recentlyViewed: string[]; // IDs
  customerId?: string; // e.g., QN000001
  createdAt?: string;
  lastLogin?: string;
  status?: "Active" | "Blocked";
  orderCount?: number;
  photoUrl?: string;
  savedProducts?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight?: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  status: "Pending" | "Accepted" | "Picked Up" | "Out for Delivery" | "Delivered" | "Failed Delivery" | "Cancelled" | "Dispatched" | "Rejected";
  createdAt: string;
  address: string;
  paymentMethod: "COD" | "UPI";
  paymentStatus: "Pending" | "Paid";
  deliveryOTP: string;
  deliveryPartnerId: string | null;
  deliveryNotes?: string;
  lat?: number;
  lng?: number;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minOrderValue: number;
  description: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  productId: string;
  isVerifiedPurchase?: boolean;
}

export interface SupportTicket {
  id: string;
  orderId?: string;
  customerName: string;
  category: "Late Delivery" | "Damaged Item" | "Wrong Item" | "Billing Issue" | "General Feedback";
  description: string;
  status: "Open" | "In-Progress" | "Resolved";
  createdAt: string;
  messages: { sender: "customer" | "support"; text: string; time: string }[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  radiusKm: number;
  deliveryCharge: number;
  isActive: boolean;
}

export interface CityChargeConfig {
  fixedAmount?: number;
  chargePerKm?: number;
  baseCharge?: number;
  isCustom: boolean;
}

export interface DeliveryChargeConfig {
  type: "fixed" | "distance";
  fixedAmount: number;
  chargePerKm: number;
  baseCharge: number;
  baseDistanceKm: number;
  minOrderForFreeDelivery: number;
  citiesConfig: Record<string, CityChargeConfig>;
  zones: DeliveryZone[];
  googleMapsEnabled: boolean;
}

export interface Banner {
  id: string;
  title: string;
  tagline: string;
  desc: string;
  bg: string;
  accent: string;
  btnText: string;
  badge: string;
  image?: string;
  categoryId?: string;
  productId?: string;
  isEnabled: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

export interface HomepageSection {
  id: string;
  title: string;
  categoryId: string;
  productIds?: string[];
  isVisible: boolean;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

