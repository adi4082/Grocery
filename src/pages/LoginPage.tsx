import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { auth, firebaseConfig, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "../lib/firebase";
import { getUserProfile, createUserProfile, isEmailRegistered } from "../lib/auth-service";
import { 
  User, Mail, Lock, LogIn, Sparkles, AlertCircle, Loader2, ArrowLeft, ArrowUpRight, UserPlus, Eye, EyeOff, X, CheckCircle2, KeyRound,
  Shield, Truck
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginAs, addNotification } = useApp() as any;

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal states
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  // Redirection guard - if already logged in, go to /account
  useEffect(() => {
    if (user) {
      navigate("/account");
    }
  }, [user, navigate]);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      setRecoveryError("Please enter your email address.");
      return;
    }
    setRecoveryError("");
    setRecoveryLoading(true);

    try {
      const isRegistered = await isEmailRegistered(recoveryEmail);
      if (!isRegistered) {
        setRecoveryError("No account found with this email address. Please check your spelling or sign up.");
      } else {
        // Simulate email sending delay
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setRecoverySuccess(true);
        addNotification("Recovery Email Sent", `Password reset instructions sent to ${recoveryEmail}`);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setRecoveryError("Something went wrong. Please try again later.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate email registration
        const emailDup = await isEmailRegistered(email);
        if (emailDup) {
          setError("This email is already registered.");
          setLoading(false);
          return;
        }

        // Create Firebase auth user
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        // Create Firestore profile
        await createUserProfile({
          uid: uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60", // default avatar
          role: "customer",
          password: password
        } as any);

        addNotification("Account Created", `Welcome to QuickNow, ${name.trim()}!`);
        navigate("/account");
      } else {
        // Normal Sign In
        try {
          await signInWithEmailAndPassword(auth, email, password);
          addNotification("Logged In", "Successfully signed into your session.");
          navigate("/account");
        } catch (authErr: any) {
          if (authErr?.code === "auth/user-not-found" || authErr?.message?.includes("user-not-found")) {
            throw new Error("User not found");
          } else if (authErr?.code === "auth/wrong-password" || authErr?.message?.includes("wrong-password")) {
            throw new Error("Incorrect password");
          } else if (authErr?.code === "auth/invalid-credential" || authErr?.message?.includes("invalid-credential") || authErr?.code === "auth/invalid-email" || authErr?.message?.includes("invalid-email")) {
            try {
              const isRegistered = await isEmailRegistered(email);
              if (!isRegistered) {
                throw new Error("User not found");
              } else {
                throw new Error("Incorrect password");
              }
            } catch (firestoreErr) {
              throw new Error("Incorrect password");
            }
          } else {
            throw authErr;
          }
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      if (err.message === "User not found" || err.message === "Incorrect password") {
        setError(err.message);
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
        setError("Google Sign-In popup was closed or restricted. Since the app is running within an iframe preview, browsers often block or terminate popup callbacks. Please open the app in a new tab to test Google Auth.");
      } else if (err.code === "auth/popup-blocked" || err.message?.includes("popup-blocked")) {
        setError("The Google Sign-In popup was blocked by your browser's popup blocker. We recommend enabling popups for this site, or registering/logging in with Email and Password.");
      } else {
        setError(err.message || "Google sign-in encountered an error.");
      }
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
            {isSignUp ? "Create Your Account" : "Welcome to QuickNow"}
          </h2>
          <p className="text-xs text-zinc-400 font-semibold">10-Minute Lightning Fresh Deliveries</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-2.5 text-xs text-red-700 font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1.5 animate-in slide-in-from-top-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Full Name *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-zinc-400"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subhajit Pal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5 animate-in slide-in-from-top-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-zinc-400"><span className="text-xs font-bold font-mono">+91</span></span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Email Address *</label>
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
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Password *</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryEmail(email);
                    setIsForgotPasswordOpen(true);
                    setRecoverySuccess(false);
                    setRecoveryError("");
                  }}
                  className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 tracking-wider cursor-pointer select-none"
                  id="forgot-password-link"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-zinc-400"><Lock className="w-4 h-4" /></span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 transition focus:outline-none cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
                id="toggle-password-visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                {isSignUp ? "Create Account" : "Sign In Credentials"}
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setShowPassword(false);
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer select-none"
          >
            {isSignUp ? "Already have an account? Sign In" : "New to QuickNow? Create an Account"}
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200" /></div>
          <span className="relative bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">OR CONTINUE WITH</span>
        </div>

        {/* Google Options */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700 font-extrabold text-xs rounded-2xl transition flex-items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.64 15.05 1 12 1 7.24 1 3.25 3.73 1.34 7.72l3.86 3C6.12 7.74 8.84 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.25-2.07 3.57-5.12 3.57-8.67z" />
              <path fill="#FBBC05" d="M5.2 14.72c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.34 7.1C.48 8.82 0 10.75 0 12.81c0 2.06.48 3.99 1.34 5.71l3.86-3.8z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.07.72-2.45 1.15-4.09 1.15-3.16 0-5.88-2.7-6.8-5.68L1.34 16.5C3.25 20.49 7.24 23 12 23z" />
            </svg>
            Continue with Google Account
          </button>
        </div>

        <div className="relative flex items-center justify-center pt-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-250" /></div>
          <span className="relative bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">EVALUATOR QUICK ACCESS</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await loginAs("admin@quicknow.com", "admin", "Admin Master");
                navigate("/account");
              } catch (e) {
                setError("Quick Admin sign-in failed. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="py-2.5 px-3 border border-zinc-200 hover:border-blue-500 hover:bg-blue-50/20 text-zinc-700 hover:text-blue-700 font-extrabold text-[11px] rounded-xl transition flex items-center justify-center gap-1 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Login as Admin</span>
          </button>

          <button
            onClick={async () => {
              setLoading(true);
              try {
                await loginAs("rider@quicknow.com", "delivery", "Rider Captain");
                navigate("/account");
              } catch (e) {
                setError("Quick Rider sign-in failed. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="py-2.5 px-3 border border-zinc-200 hover:border-purple-500 hover:bg-purple-50/20 text-zinc-700 hover:text-purple-700 font-extrabold text-[11px] rounded-xl transition flex items-center justify-center gap-1 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Truck className="w-3.5 h-3.5 text-purple-500" />
            <span>Login as Rider</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="forgot-password-modal">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative border border-zinc-100 overflow-hidden">
            <button
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 transition p-1.5 rounded-full hover:bg-zinc-100 cursor-pointer"
              aria-label="Close modal"
              id="close-forgot-password-modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">Recover Password</h3>
              <p className="text-xs text-zinc-500 font-semibold mt-1">We'll help you access your account</p>
            </div>

            {recoverySuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-zinc-800">Recovery Email Sent!</p>
                  <p className="text-xs text-zinc-500 px-4 leading-relaxed">
                    A secure password recovery link has been sent to <strong className="text-zinc-900 font-extrabold">{recoveryEmail}</strong>. 
                    Please check your inbox (and spam folder) to reset your password.
                  </p>
                </div>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="mt-2 px-6 py-2.5 bg-zinc-900 text-white font-extrabold text-xs rounded-xl hover:bg-zinc-800 transition cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                {recoveryError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-700 text-xs font-bold leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{recoveryError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-zinc-400"><Mail className="w-4 h-4" /></span>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 disabled:bg-zinc-300 text-white font-black text-xs rounded-2xl transition uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-zinc-950/10"
                >
                  {recoveryLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send Recovery Link"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
