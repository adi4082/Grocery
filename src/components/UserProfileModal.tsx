import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { auth, db } from "../lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { 
  getUserProfile, 
  createUserProfile, 
  isMobileRegistered, 
  isEmailRegistered, 
  saveStructuredAddress, 
  getStructuredAddresses, 
  deleteStructuredAddress,
  updateUserProfile
} from "../lib/auth-service";
import { StructuredAddress, UserProfile, Order } from "../types";
import { CustomerTrendsChart } from "./CustomerTrendsChart";
import { 
  X, User, Wallet, Award, Gift, Clock, History, Check, MapPin, Phone, 
  ArrowUpRight, DollarSign, PlusCircle, Sparkles, Mail, Lock, 
  ShieldCheck, Loader2, Compass, Home, Briefcase, Plus, Trash2, Heart, Bell, 
  HelpCircle, CreditCard, LogOut, CheckSquare, RefreshCw, Upload, Search, ShieldAlert
} from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
  onReplayOnboarding?: () => void;
}

type ModalTab = "login" | "register" | "address_setup" | "dashboard";
type DashboardSubTab = "profile" | "orders" | "addresses" | "wallet" | "rewards" | "payments" | "products" | "notifications" | "support";

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onTrackOrder,
  onReplayOnboarding
}) => {
  const { 
    user, setUser, orders, addNotification, wishlist, products, notifications, markNotificationsAsRead, tickets, createTicket, addTicketMessage
  } = useApp() as any;

  // --- Modal Navigation States ---
  const [activeTab, setActiveTab] = useState<ModalTab>("login");
  const [subTab, setSubTab] = useState<DashboardSubTab>("profile");

  // --- Common Loading & Error States ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- Auth Form States ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  
  // OTP Simulation States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sentOtpValue, setSentOtpValue] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpRateLimit, setOtpRateLimit] = useState<number>(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Avatar Choice
  const [selectedAvatar, setSelectedAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80");

  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80"
  ];

  // --- Address Form States ---
  const [addrType, setAddrType] = useState<"Home" | "Work" | "Other">("Home");
  const [addrHouse, setAddrHouse] = useState("");
  const [addrBuilding, setAddrBuilding] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPin, setAddrPin] = useState("");
  const [addrDefault, setAddrDefault] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState<StructuredAddress[]>([]);

  // --- Customer Dash Actions ---
  const [depositAmount, setDepositAmount] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [supportCategory, setSupportCategory] = useState<any>("General Feedback");
  const [supportDesc, setSupportDesc] = useState("");
  const [supportOrderId, setSupportOrderId] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [supportReplyText, setSupportReplyText] = useState("");

  // Payment Add States
  const [cardNo, setCardNo] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [savedCards, setSavedCards] = useState<Array<{ no: string; name: string; exp: string }>>([
    { no: "•••• •••• •••• 4912", name: "Subhajit Pal", exp: "12/29" }
  ]);

  // Sync address subcollection if logged in
  useEffect(() => {
    if (user && user.uid && user.uid !== "cust-1" && user.uid !== "admin-1") {
      getStructuredAddresses(user.uid).then(addrs => {
        setUserAddresses(addrs);
      });
    }
  }, [user]);

  // Timer countdown for OTP
  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  if (!isOpen) return null;

  // --- Auth Password Validation Helper ---
  const validatePassword = (pass: string) => {
    if (pass.length < 6) return "Password must be at least 6 characters long.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one digit.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character.";
    return null;
  };

  // --- Simulated OTP Trigger ---
  const handleSendOtp = async () => {
    setError("");
    setSuccess("");
    if (!phone || phone.trim().length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Rate Limiting simulation
    if (otpRateLimit > 2) {
      setError("Too many OTP requests. Please wait 2 minutes before requesting again.");
      return;
    }

    setLoading(true);

    try {
      // Check duplicate mobile
      const duplicate = await isMobileRegistered(phone);
      if (duplicate) {
        setError("This mobile number is already registered. Please login instead.");
        setLoading(false);
        return;
      }

      // Generate random 4-digit code
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setSentOtpValue(code);
      setOtpTimer(60);
      setOtpSent(true);
      setOtpRateLimit((prev) => prev + 1);

      // Display high-fidelity alert toast
      alert(`[QUICKNOW OTP VERIFICATION]\nYour 4-digit verification code is: ${code}\nThis code is valid for 5 minutes.`);
      addNotification("OTP Sent", `Verification code sent to ${phone}. Enter ${code} to proceed.`);
      setSuccess(`OTP sent to ${phone}! (Code for preview is ${code})`);
    } catch (e: any) {
      setError(e.message || "Failed to query database.");
    } finally {
      setLoading(false);
    }
  };

  // --- Register Submit ---
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!termsAccepted) {
      setError("You must accept the Terms & Privacy Policy to register.");
      return;
    }

    if (!name || !name.trim()) {
      setError("Full Name is required.");
      return;
    }

    if (!otpSent || otpCode !== sentOtpValue) {
      setError("Please enter the correct verification code sent to your phone.");
      return;
    }

    const passErr = validatePassword(password);
    if (passErr) {
      setError(passErr);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // If email is provided, verify duplicate
      if (email && email.trim()) {
        const emailDup = await isEmailRegistered(email);
        if (emailDup) {
          setError("Email is already registered. Please choose another email.");
          setLoading(false);
          return;
        }
      }

      // Secure Session: Create Firebase Auth User
      const authEmail = email && email.trim() ? email.trim().toLowerCase() : `${phone.replace(/[^0-9]/g, "")}@quicknow.com`;
      const cred = await createUserWithEmailAndPassword(auth, authEmail, password);

      // Create Custom Firestore Document
      const userProfile = await createUserProfile({
        uid: cred.user.uid,
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : authEmail,
        phone: phone.trim(),
        photoUrl: selectedAvatar,
        referredBy: referralCode.trim()
      });

      // Grant rewards if referral used
      if (referralCode.trim()) {
        await updateUserProfile(cred.user.uid, {
          walletBalance: 50,
          loyaltyPoints: 100
        });
        userProfile.walletBalance = 50;
        userProfile.loyaltyPoints = 100;
        addNotification("Referral Success!", "Welcome reward of ₹50 credited to wallet!");
      }

      setUser(userProfile);
      setSuccess("Account registered successfully!");
      addNotification("Account Created!", `Welcome to QuickNow, ${name}!`);
      
      // Auto-Transition to Address Setup
      setActiveTab("address_setup");
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // --- Login Submit ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter both Email/Phone and Password.");
      return;
    }

    setLoading(true);

    try {
      let resolvedEmail = email.trim();
      
      // If user typed a phone instead, try resolving it
      if (/^[0-9+ ]{10,15}$/.test(email.replace(/[^0-9]/g, ""))) {
        resolvedEmail = `${email.replace(/[^0-9]/g, "")}@quicknow.com`;
      }

      const cred = await signInWithEmailAndPassword(auth, resolvedEmail, password);
      const profile = await getUserProfile(cred.user.uid);

      if (profile) {
        if (profile.status === "Blocked") {
          setError("This account has been blocked by the Administrator. Please contact support.");
          await auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(profile);
        setSuccess("Signed in successfully!");
        addNotification("Logged In", `Welcome back, ${profile.name}!`);
        onClose();
      } else {
        setError("User profile not found in database.");
      }
    } catch (err: any) {
      setError("Invalid credentials. Please verify your username and password.");
    } finally {
      setLoading(false);
    }
  };

  // --- Third Party Providers ---
  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const profile = await getUserProfile(cred.user.uid);

      if (profile) {
        if (profile.status === "Blocked") {
          setError("Your account is blocked.");
          await auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(profile);
        addNotification("Logged In", `Welcome back, ${profile.name}!`);
        onClose();
      } else {
        // Create profile on first-time Google sign-in
        const newProfile = await createUserProfile({
          uid: cred.user.uid,
          name: cred.user.displayName || "Google Customer",
          email: cred.user.email || "",
          phone: cred.user.phoneNumber || "+91 99999 88888",
          photoUrl: cred.user.photoURL || selectedAvatar
        });
        setUser(newProfile);
        addNotification("Welcome!", `Account registered with Google.`);
        setActiveTab("address_setup");
      }
    } catch (err: any) {
      setError(err.message || "Google sign-in cancelled or failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    setError("");
    setSuccess("");
    setLoading(true);
    setTimeout(() => {
      setError("Apple Sign-In is only supported on native iOS mobile clients. Please use Google or Phone verification.");
      setLoading(false);
    }, 800);
  };

  // --- Address GPS Auto-fill ---
  const handleUseCurrentGps = () => {
    setGpsLoading(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Simulated high precision geocoding based on browser coords
        setAddrCity("Kolkata");
        setAddrState("West Bengal");
        setAddrPin("700091");
        setAddrStreet("Salt Lake Sector 5, Electronics Complex");
        setAddrLandmark("Near Webel Crossing");
        setSuccess("GPS coordinates synchronized successfully!");
        setGpsLoading(false);
      },
      () => {
        // Fallback mockup coordinate auto-fill
        setAddrCity("Gurugram");
        setAddrState("Haryana");
        setAddrPin("122002");
        setAddrStreet("DLF Cyber City, Phase 3");
        setAddrLandmark("Near Cyber Hub Metro Station");
        setSuccess("GPS simulated coordinates auto-filled successfully!");
        setGpsLoading(false);
      }
    );
  };

  // --- Address Save Submit ---
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!addrHouse || !addrStreet || !addrCity || !addrState || !addrPin) {
      setError("Please fill out all required address fields.");
      return;
    }

    setLoading(true);
    try {
      const newAddress: StructuredAddress = {
        id: `addr-${Date.now()}`,
        type: addrType,
        houseFlat: addrHouse.trim(),
        buildingName: addrBuilding.trim(),
        streetArea: addrStreet.trim(),
        landmark: addrLandmark.trim(),
        city: addrCity.trim(),
        state: addrState.trim(),
        pinCode: addrPin.trim(),
        isDefault: addrDefault,
        latitude: 22.5726,
        longitude: 88.3639
      };

      await saveStructuredAddress(user.uid, newAddress);
      
      // Update local state list
      const updated = await getStructuredAddresses(user.uid);
      setUserAddresses(updated);

      setSuccess("Delivery Address saved successfully!");
      addNotification("Address Saved", `Added ${addrType} delivery location to your list.`);
      
      // Reset address form
      setAddrHouse("");
      setAddrBuilding("");
      setAddrStreet("");
      setAddrLandmark("");
      setAddrCity("");
      setAddrState("");
      setAddrPin("");

      // If registered completely, take to dashboard or close
      onClose();
    } catch (e: any) {
      setError("Failed to write address to database.");
    } finally {
      setLoading(false);
    }
  };

  // --- Wallet Deposit ---
  const handleWalletDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (amt > 0 && user) {
      updateUserProfile(user.uid, {
        walletBalance: (user.walletBalance || 0) + amt
      }).then(() => {
        setUser({ ...user, walletBalance: (user.walletBalance || 0) + amt });
        addNotification("Funds Credited", `Deposited ₹${amt} successfully!`);
        setDepositAmount("");
        setSuccess(`₹${amt} added to wallet!`);
      });
    }
  };

  // --- Loyalty Point Redeem ---
  const handlePointsRedeem = () => {
    if (user && user.loyaltyPoints >= 100) {
      const discount = Math.floor(user.loyaltyPoints / 100) * 10; // 100 pts = ₹10
      const remainingPoints = user.loyaltyPoints % 100;
      updateUserProfile(user.uid, {
        walletBalance: (user.walletBalance || 0) + discount,
        loyaltyPoints: remainingPoints
      }).then(() => {
        setUser({ 
          ...user, 
          walletBalance: (user.walletBalance || 0) + discount,
          loyaltyPoints: remainingPoints
        });
        addNotification("Points Redeemed", `Received ₹${discount} cash balance!`);
        setSuccess(`Successfully redeemed points for ₹${discount}!`);
      });
    }
  };

  // --- Add Saved Card ---
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNo.trim() && cardName.trim()) {
      const masked = "•••• •••• •••• " + cardNo.slice(-4);
      setSavedCards([...savedCards, { no: masked, name: cardName, exp: cardExpiry || "09/30" }]);
      setCardNo("");
      setCardName("");
      setCardExpiry("");
      setSuccess("Mock Card registered securely!");
    }
  };

  // --- CRM Raise Support Ticket ---
  const handleRaiseTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportDesc.trim()) return;
    createTicket(supportCategory, supportDesc.trim(), supportOrderId || undefined);
    setSupportDesc("");
    setSupportOrderId("");
    setSuccess("Support ticket raised. Check tickets listing!");
  };

  // --- CRM Add Message ---
  const handleSupportReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReplyText.trim() || !selectedTicketId) return;
    addTicketMessage(selectedTicketId, supportReplyText.trim(), "customer");
    setSupportReplyText("");
  };

  const userOrders = orders.filter((o: Order) => o.customerId === user?.uid);
  const activeTicket = tickets.find((t: any) => t.id === selectedTicketId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Main card modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-3xl max-w-4xl w-full border border-zinc-100 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[650px] animate-in zoom-in-95 duration-200">
          
          {/* LEFT PANEL: Branding & Visuals */}
          <div className="w-full md:w-2/5 bg-emerald-600 p-8 flex flex-col justify-between text-white relative">
            {/* Top design items */}
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-emerald-600 font-black text-xl italic tracking-tighter">Q!</span>
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight">QuickNow</span>
                  <span className="block text-[9px] text-emerald-200 font-bold tracking-widest uppercase">10 MINS DELIVERY</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <h2 className="text-2xl font-black leading-tight tracking-tight">
                  {user ? "Your Premium Delivery Hub" : "Groceries at your Doorstep in 10 Mins"}
                </h2>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Join millions of users getting organic produce, fresh dairy, household staples, and hot bakeries delivered instantaneously.
                </p>
              </div>
            </div>

            {/* Middle visual illustrations */}
            <div className="hidden md:block my-4 relative z-10">
              <div className="space-y-3 bg-emerald-700/40 p-4 rounded-2xl border border-white/10 text-xs">
                <div className="flex items-center gap-2 text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Secure Firebase Identity Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <Award className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Refer & Gain ₹50 Cashback</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <Wallet className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Instant Wallet Refunds</span>
                </div>
              </div>
            </div>

            {/* Bottom Credit line */}
            <p className="text-[10px] text-emerald-200 relative z-10">
              © 2026 QuickNow Logistics Pvt. Ltd. All security keys managed by Google Firebase Admin SDK.
            </p>

            {/* Glowing background shapes */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-30 -mr-12 -mt-12" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400 rounded-full blur-3xl opacity-30 -ml-12 -mb-12" />
          </div>

          {/* RIGHT PANEL: Forms & Subsystems */}
          <div className="w-full md:w-3/5 flex flex-col bg-white h-full relative">
            
            {/* Top Close bar */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                {user ? `${user.role.toUpperCase()} SESSION` : "SECURE CLIENT GATEWAY"}
              </span>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-500 cursor-pointer transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback & Error Banner */}
            {(error || success) && (
              <div className="px-6 py-2.5 flex-shrink-0">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-600 text-xs font-semibold flex items-center gap-2 animate-pulse">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-600 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}
              </div>
            )}

            {/* Inner scroll area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* SECTION A: SIGN IN VIEW */}
              {!user && activeTab === "login" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Welcome Back</h3>
                    <p className="text-xs text-zinc-400">Sign in with your email or verified mobile handle</p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500">Email or Mobile Number</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="text" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="palsubhajit2005tq@gmail.com or 10-digit mobile"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your strong security password"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3 rounded-xl shadow-lg shadow-emerald-600/10 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In securely"}
                    </button>
                  </form>

                  {/* Dividers */}
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-zinc-100"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">or sign in with</span>
                    <div className="flex-grow border-t border-zinc-100"></div>
                  </div>

                  {/* Third Party Login Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleGoogleSignIn}
                      className="flex items-center justify-center gap-2 border border-zinc-200 hover:bg-zinc-50 py-2.5 rounded-xl text-xs font-bold text-zinc-700 cursor-pointer transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.251 1.094 15.438 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.839 11.57-11.79 0-.79-.086-1.393-.193-1.925H12.24z"/></svg>
                      Google Hub
                    </button>
                    <button 
                      onClick={handleAppleSignIn}
                      className="flex items-center justify-center gap-2 border border-zinc-200 hover:bg-zinc-50 py-2.5 rounded-xl text-xs font-bold text-zinc-700 cursor-pointer transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.05-1 .04-2.19.67-2.91 1.49-.63.71-1.18 1.85-1.03 2.96 1.12.09 2.23-.59 2.95-1.4z"/></svg>
                      Apple iOS
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-xs text-zinc-500">
                      New to QuickNow?{" "}
                      <button onClick={() => setActiveTab("register")} className="text-emerald-600 font-bold hover:underline cursor-pointer">
                        Create an Account now
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION B: REGISTRATION / SIGN UP VIEW */}
              {!user && activeTab === "register" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Create Customer Account</h3>
                    <p className="text-xs text-zinc-400">Fill in fields securely synced to Google Firestore</p>
                  </div>

                  {/* Avatar Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">Select Profile Avatar (Optional)</label>
                    <div className="flex gap-3">
                      {avatars.map((av, idx) => (
                        <button 
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className={`w-12 h-12 rounded-full overflow-hidden border-2 cursor-pointer transition ${selectedAvatar === av ? "border-emerald-600 ring-2 ring-emerald-500/20" : "border-transparent opacity-70"}`}
                        >
                          <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">Full Name *</label>
                        <input 
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Subhajit Pal"
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">Mobile Number *</label>
                        <div className="flex gap-2">
                          <input 
                            type="tel"
                            required
                            disabled={otpSent}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g., 9876543210"
                            className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60"
                          />
                          {!otpSent && (
                            <button 
                              type="button"
                              onClick={handleSendOtp}
                              disabled={loading}
                              className="px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 cursor-pointer transition flex items-center justify-center gap-1"
                            >
                              Send OTP
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* OTP Box */}
                    {otpSent && (
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-emerald-800">Verify Mobile OTP *</label>
                          <span className="text-xs text-emerald-700 font-mono">
                            {otpTimer > 0 ? `Resend in ${otpTimer}s` : (
                              <button type="button" onClick={handleSendOtp} className="underline font-bold">Resend OTP</button>
                            )}
                          </span>
                        </div>
                        <input 
                          type="text"
                          required
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 4-digit code shown in alert"
                          maxLength={4}
                          className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <p className="text-[10px] text-emerald-600 font-bold">Check the browser alert box / notifications above for code.</p>
                      </div>
                    )}

                    {/* Email & Referral */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">Email Address (Optional)</label>
                        <input 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g., pal@domain.com"
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">Referral Code (Optional)</label>
                        <input 
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="Get ₹50 Credit"
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Password & Confirm */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">Password *</label>
                        <input 
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 chars + Upper/Lower/Num/Special"
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">Confirm Password *</label>
                        <input 
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-start gap-2 pt-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 border-zinc-300 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                      />
                      <span className="text-[11px] text-zinc-500 leading-normal select-none">
                        I hereby agree and consent to QuickNow's <strong className="text-zinc-700 hover:underline">Terms of Service</strong> and <strong className="text-zinc-700 hover:underline">Privacy Policy</strong>.
                      </span>
                    </label>

                    {/* Create Button */}
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3 rounded-xl shadow-lg shadow-emerald-600/10 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Create Account"}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <p className="text-xs text-zinc-500">
                      Already have an account?{" "}
                      <button onClick={() => setActiveTab("login")} className="text-emerald-600 font-bold hover:underline cursor-pointer">
                        Sign In instead
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION C: AUTOMATIC ADDRESS SETUP VIEW */}
              {user && activeTab === "address_setup" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Setup Delivery Address</h3>
                      <p className="text-xs text-zinc-400">Add an active shipping location to complete profile</p>
                    </div>
                    <button 
                      onClick={() => onClose()}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
                    >
                      Skip address setup
                    </button>
                  </div>

                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    {/* Address Tag Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500">Address Category Tag</label>
                      <div className="flex gap-2">
                        {[
                          { val: "Home", icon: Home },
                          { val: "Work", icon: Briefcase },
                          { val: "Other", icon: Compass }
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <button 
                              key={item.val}
                              type="button"
                              onClick={() => setAddrType(item.val as any)}
                              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-xl font-bold text-xs cursor-pointer transition ${addrType === item.val ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600"}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {item.val}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Geolocation Button */}
                    <button 
                      type="button"
                      onClick={handleUseCurrentGps}
                      disabled={gpsLoading}
                      className="w-full flex items-center justify-center gap-2 border border-zinc-200 hover:bg-zinc-50 py-2.5 rounded-xl text-xs font-bold text-zinc-700 cursor-pointer transition"
                    >
                      {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Compass className="w-4 h-4 text-emerald-600" />}
                      Use Current GPS Location
                    </button>

                    {/* House & Building */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">House / Flat / Shop Number *</label>
                        <input 
                          type="text" required value={addrHouse} onChange={(e) => setAddrHouse(e.target.value)}
                          placeholder="e.g., Flat 402, 4th Floor"
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">Building / Apartment Name</label>
                        <input 
                          type="text" value={addrBuilding} onChange={(e) => setAddrBuilding(e.target.value)}
                          placeholder="e.g., Green Heritage Complex"
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    {/* Street Area & Landmark */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">Street Address / Local Area *</label>
                        <input 
                          type="text" required value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)}
                          placeholder="e.g., Salt Lake Sector 5, Block GP"
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">Famous Landmark</label>
                        <input 
                          type="text" value={addrLandmark} onChange={(e) => setAddrLandmark(e.target.value)}
                          placeholder="e.g., Opposite Cognizant Tech Park"
                          className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    {/* City, State & Pin */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">City *</label>
                        <input 
                          type="text" required value={addrCity} onChange={(e) => setAddrCity(e.target.value)}
                          placeholder="City"
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">State *</label>
                        <input 
                          type="text" required value={addrState} onChange={(e) => setAddrState(e.target.value)}
                          placeholder="State"
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500">PIN Code *</label>
                        <input 
                          type="text" required value={addrPin} onChange={(e) => setAddrPin(e.target.value)}
                          placeholder="Pin" maxLength={6}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" checked={addrDefault} onChange={(e) => setAddrDefault(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-zinc-600 font-bold">Set as my primary default delivery address</span>
                    </label>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3 rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Delivery Address"}
                    </button>
                  </form>
                </div>
              )}

              {/* SECTION D: REGISTERED USER CUSTOMER DASHBOARD */}
              {user && activeTab !== "address_setup" && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
                  
                  {/* Dash Navigation Sidebar */}
                  <div className="md:col-span-1 space-y-1.5 border-r border-zinc-100 pr-2">
                    {[
                      { id: "profile", label: "My Profile", icon: User },
                      { id: "orders", label: "My Orders", icon: History },
                      { id: "addresses", label: "My Addresses", icon: MapPin },
                      { id: "wallet", label: "Wallet Balance", icon: Wallet },
                      { id: "rewards", label: "Reward Points", icon: Award },
                      { id: "payments", label: "Saved Payments", icon: CreditCard },
                      { id: "products", label: "Saved Products", icon: Heart },
                      { id: "notifications", label: "Notifications", icon: Bell },
                      { id: "support", label: "Help & Support", icon: HelpCircle }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSubTab(item.id as any);
                            if (item.id === "notifications") markNotificationsAsRead();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs text-left cursor-pointer transition ${subTab === item.id ? "bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500" : "text-zinc-600 hover:bg-zinc-50"}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}

                    <div className="pt-4 mt-4 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setUser(null);
                          auth.signOut();
                          setActiveTab("login");
                          addNotification("Logged Out", "Signed out safely.");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs text-left text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout Session
                      </button>
                    </div>
                  </div>

                  {/* Dash Contents Panels */}
                  <div className="md:col-span-3 h-full overflow-y-auto pr-1">

                    {/* D1: My Profile */}
                    {subTab === "profile" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900">My Profile</h4>
                          <p className="text-xs text-zinc-500">Manage account information and identifiers</p>
                        </div>

                        <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                          <img src={user.photoUrl || selectedAvatar} alt="Profile avatar" className="w-16 h-16 rounded-2xl object-cover border border-zinc-200" />
                          <div>
                            <h5 className="font-extrabold text-zinc-900">{user.name}</h5>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-wide mt-1">
                              ID: {user.customerId || "QN001024"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                            <span className="block text-[10px] text-zinc-400 font-extrabold uppercase">Email Address</span>
                            <span className="text-xs font-semibold text-zinc-700">{user.email || "Not linked"}</span>
                          </div>
                          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                            <span className="block text-[10px] text-zinc-400 font-extrabold uppercase">Mobile Number</span>
                            <span className="text-xs font-semibold text-zinc-700">{user.phone || "Not linked"}</span>
                          </div>
                        </div>

                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-2">
                          <span className="block text-[10px] text-zinc-400 font-extrabold uppercase">Referral Code</span>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">{user.referralCode || "QN_REFER_99"}</span>
                            <span className="text-[10px] text-zinc-500">Share with friends to get ₹50 credit each!</span>
                          </div>
                        </div>

                        {/* Order Count / Metadata */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                            <span className="block text-[10px] text-amber-800 font-extrabold uppercase">Total Orders</span>
                            <span className="text-lg font-black text-amber-900">{userOrders.length || user.orderCount || 0} orders</span>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                            <span className="block text-[10px] text-blue-800 font-extrabold uppercase">Joined Date</span>
                            <span className="text-xs font-bold text-blue-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "01/07/2026"}</span>
                          </div>
                        </div>

                        {/* Order Frequency and Spending Trends Chart */}
                        <CustomerTrendsChart userOrders={userOrders} />
                      </div>
                    )}

                    {/* D2: My Orders */}
                    {subTab === "orders" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900">My Orders</h4>
                          <p className="text-xs text-zinc-500">Track delivery status or view receipts</p>
                        </div>

                        {userOrders.length === 0 ? (
                          <div className="text-center py-12 space-y-3">
                            <Clock className="w-12 h-12 text-zinc-300 mx-auto" />
                            <p className="text-sm font-bold text-zinc-500">No orders placed yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {userOrders.map((o: Order) => (
                              <div key={o.id} className="border border-zinc-100 p-4 rounded-2xl space-y-3 hover:border-zinc-200 transition">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-black text-xs text-zinc-900">{o.id}</span>
                                    <span className="block text-[10px] text-zinc-400 font-medium">{new Date(o.createdAt).toLocaleString()}</span>
                                  </div>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${o.status === "Delivered" ? "bg-emerald-50 text-emerald-700" : o.status === "Pending" ? "bg-amber-50 text-amber-700 animate-pulse" : "bg-blue-50 text-blue-700"}`}>
                                    {o.status}
                                  </span>
                                </div>
                                <div className="text-xs text-zinc-500 space-y-1">
                                  {o.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>{item.product.name} x {item.quantity}</span>
                                      <span className="font-bold">₹{item.product.price * item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-zinc-50 pt-2.5 text-xs">
                                  <span>Total Paid: <strong className="text-zinc-950 font-black">₹{o.total}</strong></span>
                                  {o.status !== "Delivered" && o.status !== "Rejected" && (
                                    <button 
                                      onClick={() => {
                                        onTrackOrder(o.id);
                                        onClose();
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] uppercase cursor-pointer"
                                    >
                                      Live Track
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* D3: My Addresses */}
                    {subTab === "addresses" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xl font-black text-zinc-900">Saved Addresses</h4>
                            <p className="text-xs text-zinc-500">Manage delivery targets</p>
                          </div>
                          <button 
                            onClick={() => setActiveTab("address_setup")}
                            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-extrabold text-xs"
                          >
                            <Plus className="w-4 h-4" /> Add Address
                          </button>
                        </div>

                        {userAddresses.length === 0 ? (
                          <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                            <MapPin className="w-10 h-10 text-zinc-300 mx-auto" />
                            <p className="text-xs font-bold text-zinc-400">No saved addresses found. Setup your primary shipping node.</p>
                            <button 
                              onClick={() => setActiveTab("address_setup")}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl"
                            >
                              Configure Address Now
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userAddresses.map((addr) => (
                              <div key={addr.id} className="border border-zinc-100 p-4 rounded-2xl flex items-start gap-3 relative hover:border-zinc-200 transition">
                                <span className="p-2 bg-zinc-50 rounded-xl text-zinc-500">
                                  {addr.type === "Home" ? <Home className="w-4 h-4" /> : addr.type === "Work" ? <Briefcase className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
                                </span>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-xs text-zinc-900">{addr.type} Address</span>
                                    {addr.isDefault && (
                                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider rounded">Default</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-600 leading-relaxed">
                                    {addr.houseFlat}, {addr.buildingName ? addr.buildingName + ", " : ""}{addr.streetArea}, {addr.city}, {addr.state} - {addr.pinCode}
                                  </p>
                                </div>
                                <button 
                                  onClick={async () => {
                                    await deleteStructuredAddress(user.uid, addr.id);
                                    const up = await getStructuredAddresses(user.uid);
                                    setUserAddresses(up);
                                    addNotification("Address Deleted", "Removed address successfully.");
                                  }}
                                  className="absolute top-4 right-4 text-zinc-400 hover:text-rose-600 cursor-pointer p-1 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* D4: Wallet */}
                    {subTab === "wallet" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900">QuickNow Wallet</h4>
                          <p className="text-xs text-zinc-500">Settle checkouts and secure refunds instantly</p>
                        </div>

                        <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 p-6 rounded-2xl text-white space-y-4 shadow-xl shadow-emerald-600/10">
                          <div>
                            <span className="block text-[10px] text-emerald-100 font-extrabold uppercase tracking-wider">Available Balance</span>
                            <span className="text-3xl font-black">₹{user.walletBalance || 0}</span>
                          </div>
                          <span className="block text-[10px] text-emerald-200">100% digital money. Guaranteed checkout in 1 click.</span>
                        </div>

                        {/* Add Money Form */}
                        <form onSubmit={handleWalletDeposit} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
                          <label className="text-xs font-bold text-zinc-600">Top-up Wallet Balance</label>
                          <div className="flex gap-2">
                            <input 
                              type="number"
                              required
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              placeholder="Enter amount (e.g., 500)"
                              className="flex-1 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none"
                            />
                            <button 
                              type="submit"
                              className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl"
                            >
                              Add Funds
                            </button>
                          </div>
                          <div className="flex gap-2">
                            {["100", "200", "500", "1000"].map((v) => (
                              <button 
                                key={v} type="button" onClick={() => setDepositAmount(v)}
                                className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                              >
                                +₹{v}
                              </button>
                            ))}
                          </div>
                        </form>
                      </div>
                    )}

                    {/* D5: Reward Points */}
                    {subTab === "rewards" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900">Loyalty Rewards</h4>
                          <p className="text-xs text-zinc-500">Redeem points for real wallet cash balance</p>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="block text-[10px] text-amber-800 font-extrabold uppercase">My Loyalty Points</span>
                            <span className="text-3xl font-black text-amber-900">{user.loyaltyPoints || 0} PTS</span>
                          </div>
                          <Sparkles className="w-12 h-12 text-amber-500" />
                        </div>

                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
                          <h5 className="font-bold text-xs text-zinc-800">Point Redemption Logic</h5>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Every **100 Loyalty Points** can be converted into **₹10 Cashback Wallet Balance** instantly. Earn points on every order automatically!
                          </p>
                          <button 
                            type="button"
                            onClick={handlePointsRedeem}
                            disabled={user.loyaltyPoints < 100}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black text-xs py-2.5 rounded-xl transition disabled:opacity-50"
                          >
                            Redeem 100 Points for ₹10
                          </button>
                        </div>
                      </div>
                    )}

                    {/* D6: Saved Payments */}
                    {subTab === "payments" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900">Saved Payments</h4>
                          <p className="text-xs text-zinc-500">Securely managed token cards</p>
                        </div>

                        <div className="space-y-3">
                          {savedCards.map((c, idx) => (
                            <div key={idx} className="border border-zinc-100 p-4 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                <div>
                                  <span className="font-extrabold text-xs text-zinc-900">{c.no}</span>
                                  <span className="block text-[10px] text-zinc-400 font-medium">{c.name} - Exp {c.exp}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Tokenized</span>
                            </div>
                          ))}
                        </div>

                        {/* Register card */}
                        <form onSubmit={handleAddCard} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
                          <label className="text-xs font-bold text-zinc-600">Register Mock Card</label>
                          <div className="space-y-2">
                            <input 
                              type="text" required value={cardNo} onChange={(e) => setCardNo(e.target.value)}
                              placeholder="Card Number (16 digits)" maxLength={16}
                              className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="text" required value={cardName} onChange={(e) => setCardName(e.target.value)}
                                placeholder="Holder Name"
                                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none"
                              />
                              <input 
                                type="text" required value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="Expiry (MM/YY)" maxLength={5}
                                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none"
                              />
                            </div>
                          </div>
                          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded-xl">
                            Save Card Securely
                          </button>
                        </form>
                      </div>
                    )}

                    {/* D7: Saved Products (Wishlist) */}
                    {subTab === "products" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900">Saved Products</h4>
                          <p className="text-xs text-zinc-500">Items saved for swift reordering</p>
                        </div>

                        {wishlist.length === 0 ? (
                          <div className="text-center py-12 space-y-3">
                            <Heart className="w-12 h-12 text-rose-200 mx-auto" />
                            <p className="text-xs font-bold text-zinc-400">Wishlist is empty. Save items from the grocery catalog.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {products.filter((p: any) => wishlist.includes(p.id)).map((p: any) => (
                              <div key={p.id} className="border border-zinc-100 p-3 rounded-2xl flex items-center gap-3">
                                <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                                <div className="space-y-0.5">
                                  <h5 className="font-extrabold text-[11px] text-zinc-950 truncate max-w-[120px]">{p.name}</h5>
                                  <span className="block font-black text-xs text-emerald-700">₹{p.price}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* D8: Notifications */}
                    {subTab === "notifications" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900">My Notifications</h4>
                          <p className="text-xs text-zinc-500">Real-time rider updates & promo alerts</p>
                        </div>

                        {notifications.length === 0 ? (
                          <div className="text-center py-12 text-zinc-400 text-xs font-bold">
                            No notifications yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {notifications.map((n: any) => (
                              <div key={n.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-1">
                                <span className="block font-extrabold text-xs text-zinc-900">{n.title}</span>
                                <span className="block text-xs text-zinc-500 leading-normal">{n.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* D9: Help & Support (CRM) */}
                    {subTab === "support" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900">Help & Support</h4>
                          <p className="text-xs text-zinc-500">Raise CRM support tickets with our administrative team</p>
                        </div>

                        {/* Tickets List */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-zinc-700">Active Support Tickets</h5>
                          {tickets.length === 0 ? (
                            <p className="text-xs text-zinc-400">No active support tickets opened.</p>
                          ) : (
                            <div className="space-y-2.5">
                              {tickets.map((t: any) => (
                                <div key={t.id} className="border border-zinc-100 p-3 rounded-xl space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-black text-xs text-emerald-700">{t.id}</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${t.status === "Resolved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700 animate-pulse"}`}>
                                      {t.status}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-zinc-800">{t.category}: <span className="text-zinc-500 font-medium">{t.description}</span></p>
                                  
                                  {/* Chat box */}
                                  <button 
                                    onClick={() => setSelectedTicketId(selectedTicketId === t.id ? null : t.id)}
                                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                                  >
                                    {selectedTicketId === t.id ? "Close ticket chat" : "View discussion thread"}
                                  </button>

                                  {selectedTicketId === t.id && (
                                    <div className="bg-zinc-50 p-3 rounded-xl space-y-3 border border-zinc-100">
                                      <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                        {t.messages.map((m: any, mIdx: number) => (
                                          <div key={mIdx} className={`space-y-0.5 max-w-[80%] p-2 rounded-xl text-xs ${m.sender === "customer" ? "bg-emerald-600 text-white ml-auto" : "bg-white border border-zinc-200 text-zinc-800"}`}>
                                            <p className="leading-relaxed">{m.text}</p>
                                            <span className="block text-[8px] opacity-70 text-right">{m.time}</span>
                                          </div>
                                        ))}
                                      </div>
                                      <form onSubmit={handleSupportReply} className="flex gap-2">
                                        <input 
                                          type="text" required value={supportReplyText} onChange={(e) => setSupportReplyText(e.target.value)}
                                          placeholder="Type support reply..."
                                          className="flex-1 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-xs"
                                        />
                                        <button type="submit" className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg">Send</button>
                                      </form>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Open new Ticket */}
                        <form onSubmit={handleRaiseTicketSubmit} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
                          <h5 className="text-xs font-bold text-zinc-700">Open a New Support Ticket</h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Category</label>
                              <select 
                                value={supportCategory} onChange={(e) => setSupportCategory(e.target.value as any)}
                                className="w-full bg-white border border-zinc-200 p-2 rounded-xl text-xs"
                              >
                                <option value="Late Delivery">Late Delivery</option>
                                <option value="Damaged Item">Damaged Item</option>
                                <option value="Wrong Item">Wrong Item</option>
                                <option value="Billing Issue">Billing Issue</option>
                                <option value="General Feedback">General Feedback</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Order ID (Optional)</label>
                              <input 
                                type="text" value={supportOrderId} onChange={(e) => setSupportOrderId(e.target.value)}
                                placeholder="e.g., QN-1024"
                                className="w-full bg-white border border-zinc-200 p-2 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Issue Description</label>
                            <textarea 
                              required value={supportDesc} onChange={(e) => setSupportDesc(e.target.value)}
                              placeholder="Please detail your complaint or feedback so our executives can resolve it quickly..."
                              className="w-full bg-white border border-zinc-200 p-3 rounded-xl text-xs h-20 resize-none"
                            />
                          </div>
                          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded-xl">
                            File Support Ticket
                          </button>
                        </form>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
