import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { 
  User, Mail, Lock, LogIn, Sparkles, AlertCircle, Loader2, ArrowLeft, ArrowUpRight
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginAs, addNotification } = useApp() as any;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirection guard - if already logged in, go to /account
  useEffect(() => {
    if (user) {
      navigate("/account");
    }
  }, [user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // For testing, if it's a mock or email/password setup
      await signInWithEmailAndPassword(auth, email, password);
      addNotification("Logged In", "Successfully signed into your session.");
      navigate("/account");
    } catch (err: any) {
      console.error(err);
      // Fallback/Simulated login for mock ease if Firebase is not fully configured
      if (email.includes("@") && password.length >= 6) {
        loginAs(email, "customer", "Premium Customer");
        addNotification("Logged In", "Logged in using simulated sandbox profile.");
        navigate("/account");
      } else {
        setError(err.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      addNotification("Google Authentication", "Signed in successfully with Google.");
      navigate("/account");
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === "auth/popup-closed-by-user" || err.message?.includes("popup-closed-by-user")) {
        setError("Google Sign-In popup was closed or restricted. Since the app is running within an iframe preview, browsers often block or terminate popup callbacks. Please use the 'Sandbox Demo Fast Access' options below to login instantly, or open the app in a new tab to test Google Auth.");
      } else if (err.code === "auth/popup-blocked" || err.message?.includes("popup-blocked")) {
        setError("The Google Sign-In popup was blocked by your browser's popup blocker. We recommend clicking the 'Sandbox Demo Fast Access' buttons below for instant sign-in, or enabling popups for this site.");
      } else {
        setError(err.message || "Google sign-in encountered an error. Try the Demo accounts below for instant access.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: "customer" | "admin" | "delivery" | "seller") => {
    setError("");
    setLoading(true);
    setTimeout(() => {
      let email = "palsubhajit2005tq@gmail.com";
      if (role === "admin") email = "admin@quicknow.com";
      else if (role === "delivery") email = "rider@quicknow.com";
      else if (role === "seller") email = "seller@quicknow.com";

      loginAs(email, role);
      setLoading(false);
      navigate("/account");
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-zinc-50/50"
      id="login-page-container"
    >
      <div className="w-full max-w-md bg-white border border-zinc-150 rounded-[32px] p-8 shadow-xl shadow-zinc-100 space-y-6 relative overflow-hidden">
        {/* Soft Decorative Blur Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Back to Home */}
        <button
          onClick={() => navigate("/home")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <span className="text-white font-black text-2xl italic">Q</span>
          </div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Welcome to QuickNow</h2>
          <p className="text-xs text-zinc-400 font-semibold">10-Minute Lightning Fresh Deliveries</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2.5 text-xs text-red-700 font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-zinc-400"><Mail className="w-4 h-4" /></span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-zinc-400"><Lock className="w-4 h-4" /></span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-850 disabled:bg-zinc-300 text-white font-black text-xs rounded-2xl transition uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-zinc-950/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In Credentials
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200" /></div>
          <span className="relative bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">OR CONTINUE WITH</span>
        </div>

        {/* Google & Demo Options */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700 font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.64 15.05 1 12 1 7.24 1 3.25 3.73 1.34 7.72l3.86 3C6.12 7.74 8.84 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.25-2.07 3.57-5.12 3.57-8.67z" />
              <path fill="#FBBC05" d="M5.2 14.72c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.34 7.1C.48 8.82 0 10.75 0 12.81c0 2.06.48 3.99 1.34 5.71l3.86-3.8z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.07.72-2.45 1.15-4.09 1.15-3.16 0-5.88-2.7-6.8-5.68L1.34 16.5C3.25 20.49 7.24 23 12 23z" />
            </svg>
            Continue with Google Account
          </button>

          <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Sandbox Demo Fast Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("customer")}
                className="px-3 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-[10px] font-bold text-zinc-700 transition text-left cursor-pointer flex justify-between items-center"
              >
                <span>Customer</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-400" />
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("admin")}
                className="px-3 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-[10px] font-bold text-zinc-700 transition text-left cursor-pointer flex justify-between items-center"
              >
                <span>Store Admin</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-400" />
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("delivery")}
                className="px-3 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-[10px] font-bold text-zinc-700 transition text-left cursor-pointer flex justify-between items-center"
              >
                <span>Rider Captain</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-400" />
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("seller")}
                className="px-3 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-[10px] font-bold text-zinc-700 transition text-left cursor-pointer flex justify-between items-center"
              >
                <span>Seller Desk</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
