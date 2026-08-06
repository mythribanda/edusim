import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Atom,
  Brain,
  Check,
  Compass,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Play,
  Smartphone,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

type FieldName = "name" | "email" | "mobileNumber" | "password" | "confirmPassword" | "termsAccepted";

function Signup() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false,
    email: false,
    mobileNumber: false,
    password: false,
    confirmPassword: false,
    termsAccepted: false,
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const [particles, setParticles] = useState<{ id: number; left: number; top: number; delay: number; duration: number }[]>([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 8 + Math.random() * 4,
      }))
    );
  }, []);

  useEffect(() => {
    if (submitted) {
      setTouched({
        name: true,
        email: true,
        mobileNumber: true,
        password: true,
        confirmPassword: true,
        termsAccepted: true,
      });
    }
  }, [submitted]);

  const passwordChecks = useMemo(() => {
    const digitsOnly = mobileNumber.replace(/\D/g, "");
    const nameTrimmed = name.trim();
    const nameLen = nameTrimmed.length >= 3;
    const nameRegex = nameTrimmed.length === 0 || /^[A-Za-z0-9_]+$/.test(nameTrimmed);
    return {
      nameLen,
      nameRegex,
      name: nameLen && nameRegex,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
      mobile: digitsOnly.length === 0 || /^\d{10}$/.test(digitsOnly),
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      confirm: confirmPassword.length > 0 && password === confirmPassword,
      terms: termsAccepted,
      digitsOnly,
    };
  }, [confirmPassword, email, mobileNumber, name, password, termsAccepted]);

  const isPasswordValid = (passwordChecks as any).length && passwordChecks.uppercase && passwordChecks.lowercase && passwordChecks.number && passwordChecks.special;
  const isFormValid = passwordChecks.name && passwordChecks.email && passwordChecks.mobile && isPasswordValid && passwordChecks.confirm && passwordChecks.terms;

  const showError = (field: FieldName, valid: boolean) => (touched[field] || submitted) && !valid;

  const focusFirstInvalidField = () => {
    if (!passwordChecks.name) return nameRef.current?.focus();
    if (!passwordChecks.email) return emailRef.current?.focus();
    if (!passwordChecks.mobile) return mobileRef.current?.focus();
    if (!isPasswordValid) return passwordRef.current?.focus();
    if (!passwordChecks.confirm) return confirmPasswordRef.current?.focus();
    if (!passwordChecks.terms) return termsRef.current?.focus();
  };

  const handleMobileChange = (value: string) => {
    setMobileNumber(value.replace(/\D/g, "").slice(0, 10));
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    if (isSubmitting || isLoading) return;

    if (!isFormValid) {
      focusFirstInvalidField();
      if (!name && !email && !password && !confirmPassword) {
        toast.error("Please fill all required fields");
      } else {
        toast.error("Please correct the highlighted errors");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        mobile: passwordChecks.digitsOnly || undefined,
      });

      if (success) {
        toast.success("Account created successfully! Please login now.");
        window.setTimeout(() => navigate({ to: "/login" } as any), 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthScore = [(passwordChecks as any).length, passwordChecks.uppercase, passwordChecks.lowercase, passwordChecks.number, passwordChecks.special].filter(Boolean).length;
  const strength = strengthScore <= 2 ? { label: "Weak Password", width: "33%", color: "bg-red-500" } : strengthScore <= 4 ? { label: "Medium Password", width: "66%", color: "bg-amber-400" } : { label: "Strong Password ✓", width: "100%", color: "bg-green-500" };

  const fieldClass = (valid: boolean, error: boolean) =>
    `w-full rounded-2xl bg-background text-sm text-foreground outline-none placeholder:text-muted-foreground/60 transition-all duration-300 ${
      error
        ? "border border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
        : valid
          ? "border border-green-500/60 focus:border-green-500 focus:ring-2 focus:ring-green-500/25"
          : "border border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
    }`;

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-background text-foreground font-sans">
      {/* Soft Ambient Background Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#FAFCFF] via-[#F4F9FF] to-[#E6F2FF] dark:from-[#030712] dark:via-[#080E1A] dark:to-[#050811]" />

      <div className="relative z-10 grid min-h-[100svh] w-full max-w-[1100px] grid-cols-1 lg:grid-cols-2 items-center gap-12 px-6 py-8 mx-auto">
        
        {/* Left Hero Panel */}
        <div className="hidden lg:flex flex-col justify-center gap-8 h-full">
          <Link to="/" className="flex items-center gap-2.5 group relative z-10 w-fit">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm hover:rotate-12 transition-transform duration-300">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wider font-mono text-foreground">
              Edu<span className="text-primary">Sim</span>
            </span>
          </Link>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary border border-border/40 text-[10px] text-primary font-semibold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-primary" /> Next Generation Learning
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Explore Science Through <br />
              <span className="text-primary">Immersive Simulations</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-muted-foreground text-[13px] leading-relaxed max-w-lg">
              Step into a new era of interactive learning with AI tutors, smart simulations, and powerful formula labs.
            </motion.p>
          </div>

          <div className="space-y-4">
            {[
              { label: "AI-Powered Tutor", desc: "Get instant answers and explanations", icon: Brain, color: "#70B5FF" },
              { label: "Interactive Simulations", desc: "High-fidelity physics engine", icon: Play, color: "#70B5FF" },
              { label: "Formula Lab Explorer", desc: "Track variables and master formulas", icon: Atom, color: "#70B5FF" },
              { label: "Progress Tracking", desc: "Detailed mastery dashboards", icon: TrendingUp, color: "#70B5FF" },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="group bg-card border border-border rounded-2xl p-4 hover:border-primary/60 hover:bg-secondary/40 transition-all duration-300 cursor-pointer shadow-sm" style={{ animation: `slideInLeft 0.6s ease-out ${index * 0.1}s both` }}>
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${feature.color}12`, border: `1px solid ${feature.color}25`, color: feature.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{feature.label}</h3>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="w-full max-w-[420px] mx-auto rounded-[24px] p-8 border border-border shadow-[0_8px_30px_rgba(112,181,255,0.06)] relative bg-card overflow-hidden group">
          
          <div className="mb-6 space-y-1 text-left">
            <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              Create Your Account
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </h3>
            <p className="text-xs text-muted-foreground">Unlock interactive educational simulations</p>
          </div>

          <form onSubmit={handleSignupSubmit} className="space-y-4 text-left" noValidate>
            <div className="space-y-1">
              <label htmlFor="name" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">USERNAME</label>
              <div className="relative group/input">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <input id="name" ref={nameRef} type="text" placeholder="Enter your username" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, name: true }))} aria-invalid={showError("name", passwordChecks.name)} aria-describedby={showError("name", passwordChecks.name) ? "name-error" : undefined} className={fieldClass(passwordChecks.name, showError("name", passwordChecks.name)) + " pl-10 pr-4 py-3"} />
              </div>
              {showError("name", passwordChecks.name) && (
                <p id="name-error" className="text-xs text-red-400 mt-1">
                  {name.trim().length === 0
                    ? "Username is required"
                    : !passwordChecks.nameLen
                      ? "Username must be at least 3 characters"
                      : "Only letters, numbers and underscores allowed"}
                </p>
              )}
              {passwordChecks.name && name.trim().length >= 3 && (
                <p className="text-xs text-green-500 mt-1">
                  Username available ✓
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">EMAIL ADDRESS</label>
              <div className="relative group/input">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <input id="email" ref={emailRef} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, email: true }))} aria-invalid={showError("email", passwordChecks.email)} aria-describedby={showError("email", passwordChecks.email) ? "email-error" : undefined} className={fieldClass(passwordChecks.email, showError("email", passwordChecks.email)) + " pl-10 pr-4 py-3"} />
              </div>
              {showError("email", passwordChecks.email) && (
                <p id="email-error" className="text-xs text-red-400">
                  {email.trim().length === 0
                    ? "Email is required"
                    : "Please enter a valid email address"}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="mobile" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">MOBILE NUMBER <span className="text-muted-foreground/60">(optional)</span></label>
              <div className="relative group/input">
                <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <input id="mobile" ref={mobileRef} type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} placeholder="10-digit mobile number" value={mobileNumber} onChange={(e) => handleMobileChange(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, mobileNumber: true }))} aria-invalid={showError("mobileNumber", passwordChecks.mobile)} aria-describedby={showError("mobileNumber", passwordChecks.mobile) ? "mobile-error" : undefined} className={fieldClass(passwordChecks.mobile, showError("mobileNumber", passwordChecks.mobile)) + " pl-10 pr-4 py-3"} />
              </div>
              {showError("mobileNumber", passwordChecks.mobile) && <p id="mobile-error" className="text-xs text-red-400">Please enter a valid mobile number</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">PASSWORD</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <input id="password" ref={passwordRef} type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, password: true }))} className={fieldClass(isPasswordValid, showError("password", isPasswordValid)) + " pl-10 pr-10 py-3"} />
                <button type="button" onClick={() => { setShowPassword((prev) => !prev); toast.success("Password visibility toggled"); }} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-md" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {showError("password", isPasswordValid) && (
                <p id="password-error" className="text-xs text-red-400 mt-1">
                  {password.length === 0
                    ? "Password is required"
                    : !passwordChecks.length
                      ? "Password must be at least 8 characters"
                      : !passwordChecks.uppercase
                        ? "Must contain at least one uppercase letter"
                        : !passwordChecks.lowercase
                          ? "Must contain at least one lowercase letter"
                          : !passwordChecks.number
                            ? "Must contain at least one number"
                            : "Must contain at least one special character"}
                </p>
              )}

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-muted-foreground">Strength</span>
                  <span className={strength.color.replace("bg-", "text-")}>{strength.label}</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className={`h-full rounded-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 p-3.5 rounded-2xl bg-secondary border border-border/40 text-[10px]">
                  {[
                    { met: passwordChecks.length, label: "8+ characters" },
                    { met: passwordChecks.uppercase, label: "Uppercase letter" },
                    { met: passwordChecks.lowercase, label: "Lowercase letter" },
                    { met: passwordChecks.number, label: "One number" },
                    { met: passwordChecks.special, label: "Special character" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      {item.met ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
                      <span className={item.met ? "text-green-500/90 font-medium" : "text-muted-foreground"}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider">CONFIRM PASSWORD</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <input id="confirmPassword" ref={confirmPasswordRef} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))} aria-invalid={showError("confirmPassword", passwordChecks.confirm)} aria-describedby={showError("confirmPassword", passwordChecks.confirm) ? "confirm-password-error" : undefined} className={fieldClass(passwordChecks.confirm, showError("confirmPassword", passwordChecks.confirm)) + " pl-10 pr-10 py-3"} />
                <button type="button" onClick={() => { setShowConfirmPassword((prev) => !prev); toast.success("Password visibility toggled"); }} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-md" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {showError("confirmPassword", passwordChecks.confirm) && (
                <p id="confirm-password-error" className="text-xs text-red-400 mt-1">
                  {confirmPassword.length === 0
                    ? "Confirm Password is required"
                    : "Passwords do not match"}
                </p>
              )}
              {passwordChecks.confirm && confirmPassword.length > 0 && (
                <p className="text-xs text-green-500 mt-1">
                  Passwords match ✓
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-2xl bg-secondary border border-border/40 p-4">
              <div className="flex items-start gap-3">
                <input id="termsAccepted" ref={termsRef} type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} onBlur={() => setTouched((current) => ({ ...current, termsAccepted: true }))} className="mt-1 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary" />
                <label htmlFor="termsAccepted" className="text-xs text-muted-foreground leading-relaxed select-none">I agree to the <span className="text-foreground font-medium">Terms of Service</span> and <span className="text-foreground font-medium">Privacy Policy</span></label>
              </div>
              {showError("termsAccepted", passwordChecks.terms) && <p className="text-xs text-red-400">Please accept the Terms of Service and Privacy Policy</p>}
            </div>

            <button type="submit" disabled={!isFormValid || isLoading || isSubmitting} className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
              {isLoading || isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-1.5">Create Account <ArrowRight className="w-4 h-4" /></span>}
            </button>
          </form>

          <div className="text-center pt-4 text-xs font-medium">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" search={{ verify_token: undefined, reset_token: undefined }} className="text-primary hover:underline transition-colors font-bold">Log in</Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
