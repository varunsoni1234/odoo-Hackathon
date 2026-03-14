import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../providers/ThemeProvider";
import { Package, Mail, Lock, KeyRound, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type AuthView = "login" | "register" | "forgot" | "otp" | "new_password";

export function AuthPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");

  const resetMessages = () => { setError(""); setSuccess(""); };

  // ── LOGIN ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); resetMessages(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate("/");
    setLoading(false);
  };

  // ── REGISTER ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); resetMessages(); setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) {
      setError(error.message);
    } else if (data.user) {
      // Manually insert profile as fallback (trigger may be blocked by RLS during signup)
      await supabase.from("user_profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role: "staff",
      }, { onConflict: "id", ignoreDuplicates: true });
      setSuccess("Account created! Check your email to verify before logging in.");
      setView("login");
    }
    setLoading(false);
  };

  // ── SEND OTP ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); resetMessages(); setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) setError(error.message);
    else { setSuccess(`OTP sent to ${email}. Enter the code below to reset your password.`); setView("otp"); }
    setLoading(false);
  };

  // ── VERIFY OTP + SET NEW PASSWORD ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); resetMessages(); setLoading(true);
    // Use type: 'magiclink' for OTPs sent via signInWithOtp
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "magiclink" });
    if (error) { setError("Invalid or expired OTP. Please try again."); setLoading(false); return; }
    setView("new_password");
    setLoading(false);
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault(); resetMessages(); setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) setError(error.message);
    else { setSuccess("Password updated successfully!"); setTimeout(() => navigate("/"), 1500); }
    setLoading(false);
  };

  const inputClass = `w-full rounded-xl border border-border bg-card/50 dark:bg-card/30 px-4 py-3 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-foreground/30`;
  const btnClass = `w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`;
  const linkClass = "text-brand-500 hover:text-brand-600 text-sm font-medium cursor-pointer transition-colors";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden ${isDark ? "dark" : ""} bg-background text-foreground`}>
      {/* Ambient Background */}
      <div className="absolute top-1/4 left-1/4 -z-10 w-[600px] h-[600px] rounded-full bg-brand-500/15 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 w-[500px] h-[500px] rounded-full bg-indigo-500/15 blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -z-10 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[80px]" />

      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-2xl shadow-brand-500/30 mx-auto mb-5">
            <Package className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">StockFlow IMS</h1>
          <p className="text-foreground/50 text-sm mt-1">
            {view === "login" && "Sign in to your account"}
            {view === "register" && "Create a new account"}
            {view === "forgot" && "Reset your password"}
            {view === "otp" && "Enter your OTP code"}
            {view === "new_password" && "Set your new password"}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl border border-border/60">

          {/* Back button */}
          {(view === "forgot" || view === "otp" || view === "new_password") && (
            <button onClick={() => { setView("login"); resetMessages(); }} className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground mb-5 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to login
            </button>
          )}

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />{success}
            </div>
          )}

          {/* ── LOGIN VIEW ── */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-foreground/30" />
                  <input type="email" required placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass + " pl-10"} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-foreground/30" />
                  <input type={showPass ? "text" : "password"} required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={inputClass + " pl-10 pr-10"} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-foreground/30 hover:text-foreground/60 transition-colors">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => { setView("forgot"); resetMessages(); }} className={linkClass}>Forgot password?</button>
              </div>
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Sign In
              </button>
              <p className="text-center text-sm text-foreground/50 pt-2">
                Don't have an account?{" "}
                <button type="button" onClick={() => { setView("register"); resetMessages(); }} className={linkClass}>Sign up</button>
              </p>
            </form>
          )}

          {/* ── REGISTER VIEW ── */}
          {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input type="text" required placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-foreground/30" />
                  <input type="email" required placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass + " pl-10"} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-foreground/30" />
                  <input type={showPass ? "text" : "password"} required minLength={6} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className={inputClass + " pl-10 pr-10"} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-foreground/30 hover:text-foreground/60 transition-colors">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                Create Account
              </button>
              <p className="text-center text-sm text-foreground/50 pt-2">
                Already have an account?{" "}
                <button type="button" onClick={() => { setView("login"); resetMessages(); }} className={linkClass}>Sign in</button>
              </p>
            </form>
          )}

          {/* ── FORGOT PASSWORD (Send OTP) VIEW ── */}
          {view === "forgot" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-sm text-foreground/60 mb-2">Enter your email address and we'll send you a one-time password (OTP) to verify your identity.</p>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-foreground/30" />
                  <input type="email" required placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass + " pl-10"} />
                </div>
              </div>
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send OTP
              </button>
            </form>
          )}

          {/* ── ENTER OTP VIEW ── */}
          {view === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-foreground/60 mb-2">
                We sent a 6-digit OTP to <span className="font-semibold text-foreground">{email}</span>. Enter it below.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1.5">OTP Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-foreground/30" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={inputClass + " pl-10 tracking-[0.4em] font-mono text-lg text-center"}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || otp.length < 6} className={btnClass}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Verify OTP
              </button>
              <p className="text-center text-sm text-foreground/40">
                Didn't receive it?{" "}
                <button type="button" onClick={() => { setView("forgot"); resetMessages(); }} className={linkClass}>Resend</button>
              </p>
            </form>
          )}

          {/* ── SET NEW PASSWORD VIEW ── */}
          {view === "new_password" && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Identity verified! Set your new password below.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-foreground/30" />
                  <input type={showPass ? "text" : "password"} required minLength={6} placeholder="Min 6 characters" value={newPass} onChange={e => setNewPass(e.target.value)} className={inputClass + " pl-10 pr-10"} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-foreground/30 hover:text-foreground/60">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || newPass.length < 6} className={btnClass}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Update Password
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-foreground/30">
          StockFlow IMS &copy; {new Date().getFullYear()} · Secure Inventory Management
        </p>
      </div>
    </div>
  );
}
