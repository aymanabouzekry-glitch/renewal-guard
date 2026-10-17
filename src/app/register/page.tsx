"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Globe,
  ArrowRight,
  Zap,
  Bell,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  DollarSign,
  Users,
  Briefcase,
  Scale,
  ShoppingCart,
  Building2,
  Rocket,
  Layers,
  Mail,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

// مكون خلفية الفضاء والنجوم المتصلة المتحركة (Interactive Space Constellation Canvas)
function SpaceConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1,
      isGold: Math.random() > 0.45,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isGold
          ? "rgba(245, 158, 11, 0.85)"
          : "rgba(56, 189, 248, 0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.isGold ? "#f59e0b" : "#38bdf8";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 150) * 0.25;
            ctx.strokeStyle = p.isGold
              ? `rgba(245, 158, 11, ${alpha})`
              : `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-75"
    />
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { locale, toggleLanguage } = useTranslation();
  const isAr = locale === "ar";
  const authFormRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scrollToAuth = (targetMode?: "LOGIN" | "REGISTER", prefillEmail?: string) => {
    if (targetMode) setMode(targetMode);
    if (prefillEmail) setEmail(prefillEmail);
    authFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // الدخول التجريبي الفوري للمشتري بضغطة واحدة
  const handleInstantDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const demoEmail = "admin@renewalguard.com";
      localStorage.setItem("rg_active_user_email", demoEmail);
      localStorage.setItem("rg_active_user_name", "Executive Buyer");

      await signOut({ redirect: false });

      const loginRes = await signIn("credentials", {
        redirect: false,
        name: "Executive Buyer",
        email: demoEmail,
        password: "adminpassword",
      });

      if (loginRes?.error) {
        setError(
          isAr ? "تعذر تفعيل جلسة المعاينة." : "Demo login failed."
        );
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Network error during demo login.");
      setLoading(false);
    }
  };

  // تسجيل الدخول أو إنشاء حساب جديد
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName =
        mode === "REGISTER" && name.trim()
          ? name.trim()
          : cleanEmail.split("@")[0];

      localStorage.setItem("rg_active_user_email", cleanEmail);
      localStorage.setItem("rg_active_user_name", cleanName);

      await signOut({ redirect: false });

      const loginRes = await signIn("credentials", {
        redirect: false,
        name: cleanName,
        email: cleanEmail,
        password,
      });

      if (loginRes?.error) {
        setError(
          isAr
            ? "كلمة المرور غير مطابقة لهذا البريد الإلكتروني."
            : "Invalid password for this email address."
        );
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Network error occurred.");
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: isAr ? "كيف أضيف العقود والتراخيص في المنصة؟" : "How do I add contracts and licenses?",
      a: isAr
        ? "استخدم نموذج الإضافة السريع لإدخال التفاصيل الأساسية مثل تاريخ الاستحقاق، التكلفة، والنوع، أو قم باستيراد مئات العقود دفعة واحدة عبر ملف CSV."
        : "Use the guided contract modal to enter due dates, costs, and types, or bulk import hundreds of contracts via CSV in seconds.",
    },
    {
      q: isAr ? "ماذا لو كان لدي أكثر من 500 عقد؟" : "What if we manage over 500+ enterprise contracts?",
      a: isAr
        ? "تدعم المنصة سجل عقود غير محدود مع محرك بحث فوري (Ctrl+K)، وتصفية ذكية، وحساب تلقائي لمؤشر الجاهزية (0-100)."
        : "RenewalGuard supports unlimited contract registries with instant Ctrl+K search, smart filtering, and automated readiness scoring.",
    },
    {
      q: isAr ? "هل بيانات عقودي معزولة وآمنة؟" : "Are my contracts isolated and secure?",
      a: isAr
        ? "نعم 100%. يحصل كل حساب على خزنة بيانات معزولة تماماً (Multi-Tenant Vault Isolation) مع سجل مراقبة أمنية (Audit Trail) غير قابل للتعديل."
        : "Yes. Every workspace operates inside an isolated multi-tenant vault backed by an immutable security audit trail.",
    },
    {
      q: isAr ? "هل يمكنني تخصيص مواعيد التذكير والاعتمادات؟" : "Can I customize reminder windows and approval workflows?",
      a: isAr
        ? "بكل تأكيد. يراقب النظام نوافذ الـ 60 و30 و14 و7 أيام تلقائياً، مع طابور مهام واعتمادات مالية وقانونية متكامل."
        : "Absolutely. Automated alerts trigger at 60, 30, 14, and 7-day intervals alongside multi-stage finance and legal approval queues.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950 pb-24">
      {/* خلفية الفضاء والنجوم المتحركة + النقاط المضيئة */}
      <SpaceConstellationCanvas />
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* الشريط العلوي الزجاجي (Sticky Glass Navbar) */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#030712]/80 border-b border-slate-800/80 px-6 lg:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-sm shadow-lg shadow-cyan-500/30">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight flex items-center gap-2">
              <span>RenewalGuard</span>
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] hidden sm:inline-flex">
                PRO
              </Badge>
            </div>
            <div className="text-[11px] text-cyan-400 font-medium">
              {isAr ? "متتبع تجديد العقود المؤسسي" : "Enterprise Contract Renewal Tracker"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/pricing")}
            className="rounded-xl bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-800 text-xs cursor-pointer"
          >
            {isAr ? "التسعير والباقات" : "Pricing"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="rounded-xl bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-800 text-xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 me-1.5 text-cyan-400" />
            {locale === "en" ? "العربية" : "English"}
          </Button>
          <Button
            size="sm"
            onClick={() => scrollToAuth("LOGIN")}
            className="rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs px-4 cursor-pointer hidden sm:inline-flex"
          >
            {isAr ? "دخول المنصة" : "Sign In"}
          </Button>
        </div>
      </header>

      {/* 1. قسم الهيرو الفضائي + بوابة الدخول (Hero Constellation Section) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-8 text-center lg:text-start">
          {/* أيقونة الماسة الفضائية المتوهجة */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex flex-col items-center lg:items-start gap-3"
          >
            <div className="h-16 w-16 rounded-full border border-amber-500/30 bg-amber-500/5 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <div className="h-5 w-5 rotate-45 border-2 border-amber-400 bg-amber-400/20" />
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isAr
                  ? "رينيوال جارد • متتبع تجديد العقود الذكي"
                  : "RENEWALGUARD • INTELLIGENT CONTRACT TRACKER"}
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15]"
          >
            {isAr ? (
              <>
                لن تفوتك أي{" "}
                <span className="bg-linear-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  مواعيد نهائية لتجديد العقود
                </span>{" "}
                مرة أخرى.
              </>
            ) : (
              <>
                Never Miss a{" "}
                <span className="bg-linear-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Contract Renewal Deadline
                </span>{" "}
                Ever Again.
              </>
            )}
          </motion.h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
            {isAr
              ? "تساعد RenewalGuard الفرق والشركات على تتبع العقود، وإرسال تذكيرات ذكية قبل مواعيد الاستحقاق، وإدارة جميع عمليات التجديد والاعتمادات المالية في لوحة تحكم واحدة بسيطة ومؤمّنة."
              : "RenewalGuard helps teams track contracts, send automated pre-deadline reminders, and govern all renewal approvals in one unified command center."}
          </p>

          {/* أزرار المعاينة الفورية للمشتري + البدء المجاني */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <Button
              type="button"
              onClick={handleInstantDemoLogin}
              disabled={loading}
              className="w-full sm:w-auto rounded-2xl bg-linear-to-r from-cyan-400 via-teal-400 to-emerald-500 hover:opacity-95 text-slate-950 font-black h-14 px-8 shadow-[0_0_35px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2.5 text-sm cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-slate-950 animate-bounce" />
              <span>
                {isAr
                  ? "🚀 معاينة حية فورية للمشتري (دخول بنقرة واحدة)"
                  : "🚀 Instant Live Demo Sandbox (1-Click)"}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => scrollToAuth("REGISTER")}
              className="w-full sm:w-auto rounded-2xl bg-slate-900/80 border-slate-700 hover:border-cyan-400 text-white font-bold h-14 px-7 text-sm cursor-pointer"
            >
              <span>{isAr ? "أنشئ حسابك مجاناً" : "Start Free Workspace"}</span>
              <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180 text-cyan-400" />
            </Button>
          </div>

          {/* البطاقات الـ 3 السريعة تحت الهيرو (مسار / يحذر / مراجعة) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 text-start">
            {[
              {
                icon: CheckCircle2,
                color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                title: isAr ? "مسار موحد" : "Track",
                desc: isAr ? "حالة العقد في لوحة تحكم واحدة" : "Contract status in one view",
              },
              {
                icon: AlertTriangle,
                color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                title: isAr ? "يُحذّر مبكراً" : "Alert",
                desc: isAr ? "جداول تذكير قابلة للتخصيص" : "Customizable reminder schedules",
              },
              {
                icon: Layers,
                color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
                title: isAr ? "مراجعة وحوكمة" : "Audit",
                desc: isAr ? "الفوترة وضوابط التصدير" : "Billing & export controls",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-800/90 flex items-center gap-3.5"
                >
                  <div
                    className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* بوابة تسجيل الدخول وإنشاء الحساب المعزول */}
        <div ref={authFormRef} className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl bg-slate-900/85 backdrop-blur-xl border border-slate-800 p-7 sm:p-9 shadow-[0_0_60px_rgba(14,165,233,0.12)] space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {mode === "REGISTER"
                    ? isAr
                      ? "تجهيز مساحة عمل معزولة"
                      : "Isolated Workspace Provisioning"
                    : isAr
                    ? "بوابة دخول المشغلين"
                    : "Operator Command Login"}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                {mode === "REGISTER"
                  ? isAr
                    ? "إنشاء حساب مؤسسي جديد"
                    : "Create Enterprise Account"
                  : isAr
                  ? "تسجيل الدخول إلى لوحة التحكم"
                  : "Sign In to Command Center"}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "كل حساب يعمل داخل خزنة بيانات مستقلة ومعزولة بالكامل."
                  : "Every account receives a private, isolated contract vault."}
              </p>
            </div>

            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode("LOGIN");
                  setError("");
                }}
                className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "LOGIN"
                    ? "bg-linear-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("REGISTER");
                  setError("");
                }}
                className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "REGISTER"
                    ? "bg-linear-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isAr ? "حساب جديد مجاني" : "Create Account"}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "REGISTER" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs text-slate-300">
                    {isAr ? "الاسم الكامل" : "Full Operator Name"}
                  </Label>
                  <Input
                    id="name"
                    required
                    placeholder={isAr ? "مثال: أيمن فتح الله" : "e.g., Ayman Fathallah"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl h-11 bg-slate-950 border-slate-800 text-white"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-slate-300">
                  {isAr ? "البريد الإلكتروني للعمل" : "Work Email Address"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  dir="ltr"
                  placeholder="work@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-11 bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-slate-300">
                  {isAr ? "كلمة المرور" : "Security Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-11 bg-slate-950 border-slate-800 text-white"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-semibold text-red-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-linear-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {loading
                    ? isAr
                      ? "جاري الدخول..."
                      : "Authenticating..."
                    : mode === "REGISTER"
                    ? isAr
                      ? "ابدأ مجاناً وافتح لوحة التحكم"
                      : "Provision Free Workspace"
                    : isAr
                    ? "دخول لمركز القيادة"
                    : "Access Command Center"}
                </span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </form>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isAr ? "خطة مجانية متاحة • إلغاء في أي وقت" : "Free tier available • Cancel anytime"}
              </span>
              <span className="text-cyan-400 font-mono">SHA-256</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. قسم الصدمة المالية: ثمن النسيان 68% و 10,000$ (The Cost of Forgetting) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs font-extrabold uppercase tracking-widest text-rose-500">
              {isAr ? "ثمن النسيان" : "THE COST OF FORGETTING"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight">
              {isAr
                ? "تكلف عمليات التجديد التلقائي الشركات أكثر من 10,000 دولار سنوياً"
                : "Auto-Renewals Cost Companies Over $10,000+ Every Year"}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {isAr
                ? "تفشل جداول البيانات التقليدية. وتضيع الملاحظات اللاصقة. ويتم تجاهل تذكيرات التقويم. وبدون نظام مخصص، تضيع العقود بين الشقوق وتُخصم الفواتير تلقائياً."
                : "Spreadsheets fail. Sticky notes disappear. Calendar alerts get ignored. Without a dedicated system, contracts slip through the cracks."}
            </p>

            <div className="flex items-center gap-6 pt-2">
              <div className="text-5xl sm:text-7xl font-black bg-linear-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                68%
              </div>
              <p className="text-sm sm:text-base text-slate-300 max-w-xs font-medium">
                {isAr
                  ? "يتم تجديد عقود برامج SaaS والموردين تلقائياً دون أن يلاحظها أحد في الوقت المناسب."
                  : "of SaaS & vendor contracts auto-renew without anyone noticing in time."}
              </p>
            </div>
          </div>

          {/* بطاقة الإنذار العائمة باللون الأحمر */}
          <div className="lg:col-span-5">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="rounded-3xl bg-linear-to-b from-rose-950/40 to-slate-900/90 border border-rose-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.15)] space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Bell className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">
                      {isAr ? "تجديد غداً — فوات أوان الإلغاء!" : "Renews Tomorrow — Window Closed!"}
                    </div>
                    <div className="text-xs text-rose-300">
                      {isAr ? "ينتهي العرض وفترة الإشعار اليوم" : "Auto-renewal lock-in triggered"}
                    </div>
                  </div>
                </div>
                <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  -$4,200.00
                </Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                {isAr
                  ? "«سيتم تجديد ترخيص مؤسستك تلقائياً غداً لمدة 12 شهراً إضافياً. تم خصم رسوم تجديد الاشتراك السنوي لعدم تقديم إشعار الإلغاء قبل 30 يوماً.»"
                  : "“Your enterprise license will automatically renew tomorrow for another 12 months. $4,200.00 has been scheduled for charge.”"}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. خط الزمن التلقائي للتنبيهات (30 / 14 / 7 أيام) + الأتمتة */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
              {isAr ? "الأتمتة الذكية" : "AUTOMATED REMINDER ENGINE"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight">
              {isAr
                ? "اضبطه مرة واحدة. ولن تقلق بعد ذلك."
                : "Set It Once. Never Worry Again."}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {isAr
                ? "قم بضبط جداول التذكير لكل عقد وأرسل إشعارات التجديد عبر البريد الإلكتروني وداخل المنصة قبل المواعيد النهائية بوقت كافٍ للتفاوض أو الإلغاء."
                : "Configure custom reminder schedules for every contract and dispatch automated alerts before lock-in deadlines."}
            </p>

            <ul className="space-y-3 text-sm text-slate-200">
              {[
                isAr
                  ? "رسائل تذكير عبر البريد الإلكتروني مع جداول زمنية قابلة للتخصيص (60، 30، 14، 7، و1 يوم)"
                  : "Customizable email & in-app alerts (60, 30, 14, 7, and 1-day intervals)",
                isAr
                  ? "دعم مستلمي الإشعارات الإضافيين وطابور اعتمادات الفريق المالي والقانوني"
                  : "Multi-recipient routing & legal/finance approval workflows",
                isAr
                  ? "مؤشر جاهزية ذكي (0-100) يكشف العقود الحرجة فور دخولك"
                  : "Explainable Readiness Index (0–100) highlighting critical exposures",
              ].map((pt, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* مخطط الـ 30 / 14 / 7 أيام المضيء */}
          <div className="lg:col-span-6 relative ps-8 border-s-2 border-slate-800 space-y-6">
            {[
              {
                days: isAr ? "التجديد خلال 30 يوماً" : "Renews in 30 Days",
                sub: isAr
                  ? "سينتهي عقدك مع شركة Acme Corp قريباً — ابدأ مراجعة الشروط"
                  : "Acme Corp contract approaching notice window",
                active: false,
              },
              {
                days: isAr ? "التجديد خلال 14 يوماً" : "Renews in 14 Days",
                sub: isAr
                  ? "حان الوقت لمراجعة خياراتك واعتماد الميزانية"
                  : "Time to review pricing options & approve budget",
                active: false,
              },
              {
                days: isAr ? "التجديد خلال 7 أيام" : "Renews in 7 Days",
                sub: isAr
                  ? "تذكير أخير — بادر بالتحرك الآن قبل التجديد التلقائي!"
                  : "Final warning — take action now before auto-renewal!",
                active: true,
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className={`relative p-5 rounded-2xl border backdrop-blur-md ${
                  step.active
                    ? "bg-cyan-950/30 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.18)]"
                    : "bg-slate-900/70 border-slate-800"
                }`}
              >
                <div
                  className={`absolute -inset-s-12 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border flex items-center justify-center ${
                    step.active
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                      : "bg-slate-900 border-slate-700 text-slate-400"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <div
                  className={`font-bold text-base ${
                    step.active ? "text-cyan-300" : "text-white"
                  }`}
                >
                  {step.days}
                </div>
                <div className="text-xs text-slate-400 mt-1">{step.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. رادار النظام المركزي (Orbital System Radar) + 6 ميزات مرقمة (01 - 06) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
            {isAr ? "سير العمل المتكامل" : "UNIFIED RENEWAL WORKFLOW"}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black">
            {isAr
              ? "احتفظ بأعمال التجديد في نظام واحد"
              : "Keep All Renewal Operations in One System"}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            {isAr
              ? "تسجيل تفاصيل العقد، وتكوين التذكيرات، ومراقبة الحالة، وإدارة الفواتير من واجهة منتج واحدة."
              : "Log contract details, configure alerts, monitor status, and govern billing from a single command interface."}
          </p>

          {/* رسم الرادار الفضائي المتصل */}
          <div className="relative h-64 flex items-center justify-center my-8">
            <div className="h-28 w-28 rounded-full bg-cyan-500/15 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_60px_rgba(34,211,238,0.35)] z-10">
              <Clock className="w-10 h-10 text-cyan-300" />
            </div>
            <div className="absolute h-56 w-56 rounded-full border border-dashed border-slate-700 animate-spin animation-duration-[28s]" />
            <div className="absolute h-40 w-40 rounded-full border border-cyan-500/20" />
          </div>
        </div>

        {/* الشبكة المرقمة 01 إلى 06 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              icon: DollarSign,
              title: isAr ? "وقف تسرب الإيرادات" : "Stop Revenue Leakage",
              desc: isAr
                ? "اكتشف عمليات التجديد غير المرغوب فيها قبل خصمها من ميزانيتك. تحكم مالي كامل."
                : "Catch unwanted auto-renewals before they hit your corporate card.",
            },
            {
              num: "02",
              icon: Zap,
              title: isAr ? "إعداد سريع في 3 دقائق" : "3-Minute Fast Setup",
              desc: isAr
                ? "أضف العقود باستخدام نموذج إرشادي أو استيراد CSV وابدأ بتتبع عمليات التجديد على الفور."
                : "Add contracts via guided forms or CSV import and track immediately.",
            },
            {
              num: "03",
              icon: Users,
              title: isAr ? "رؤية واضحة للفريق" : "Clear Team Visibility",
              desc: isAr
                ? "تتبع الحالات وتواريخ التجديد وصلاحيات الفريق في مكان واحد بدلاً من الجداول المتناثرة."
                : "Centralize contract ownership and RBAC permissions in one hub.",
            },
            {
              num: "04",
              icon: FileText,
              title: isAr ? "البيانات القابلة للتصدير" : "Sanitized CSV Exports",
              desc: isAr
                ? "تصدير بيانات العقود والتقارير المالية إلى ملفات CSV جاهزة للمراجعة المحاسبية."
                : "Export contract registries to clean CSV reports anytime.",
            },
            {
              num: "05",
              icon: Bell,
              title: isAr ? "قواعد تذكير مرنة" : "Flexible Alert Rules",
              desc: isAr
                ? "اختر فترات التذكير (60، 30، 14، 7، و1 يوم) لكل عقد مع طابور اعتمادات."
                : "Tailor notification intervals for every vendor agreement.",
            },
            {
              num: "06",
              icon: ShieldCheck,
              title: isAr ? "راحة البال والحوكمة" : "Peace of Mind & Audit",
              desc: isAr
                ? "نم نوماً هانئاً وأنت تعلم أن لا شيء ينتهي دون علمك بفضل سجل المراقبة الأمنية."
                : "Sleep soundly knowing every action is logged in an immutable audit trail.",
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="p-7 rounded-3xl bg-slate-900/75 border border-slate-800/90 hover:border-cyan-500/40 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="h-10 w-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-black text-cyan-400">
                    {card.num}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. قصص واقعية من مجتمعات الأعمال (Real-World Renewal Stories) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
            {isAr ? "قصص واقعية من الشركات" : "REAL-WORLD RENEWAL DISASTERS"}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black">
            {isAr
              ? "ماذا يحدث عندما تدير عقودك بدون RenewalGuard؟"
              : "What Happens Without Automated Renewal Tracking?"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              tag: isAr ? "30/60 يوماً" : "30/60 Days Notice",
              border: "border-s-4 border-s-rose-500",
              quote: isAr
                ? "«تم رفض طلب الإلغاء وتم تجديد العقد تلقائياً لمدة 12 شهراً أخرى بسبب نزاع حول فترة الإشعار المبكر.»"
                : "“Cancellation request denied—contract auto-renewed for 12 months due to a missed 60-day notice clause.”",
              source: "— r/legaladvice",
              solutionTitle: isAr
                ? "يتتبع منتجنا مواعيد تجديد العقود وإلغائها مبكراً"
                : "We track notice windows before lock-in",
            },
            {
              tag: isAr ? "89 يوماً" : "89 Days Lock-in",
              border: "border-s-4 border-s-amber-400",
              quote: isAr
                ? "«حتى بعد إرسال الإشعار، استمرت الفرق في مواجهة نزاعات التجديد التلقائي ومواعيد التجديد النهائية.»"
                : "“Even after sending notice, teams kept facing auto-renewal disputes and missed vendor cutoffs.”",
              source: "— r/salesforce",
              solutionTitle: isAr
                ? "يوفر منتجنا جدولاً زمنياً موحداً وسجل تدقيق قانوني"
                : "Centralized timeline & immutable legal audit log",
            },
            {
              tag: isAr ? "يدوي" : "Manual Chaos",
              border: "border-s-4 border-s-purple-500",
              quote: isAr
                ? "«وصف المسؤولون استخدامهم لبرنامج Outlook وجداول البيانات بأنه قنبلة موقوتة لتجديدات التراخيص.»"
                : "“Admins described tracking license renewals in Outlook and Excel spreadsheets as a ticking time bomb.”",
              source: "— r/sysadmin",
              solutionTitle: isAr
                ? "استبدل الجداول اليدوية بلوحة قيادة أوتوماتيكية"
                : "Replace manual sheets with automated command center",
            },
          ].map((st, i) => (
            <div
              key={i}
              className={`rounded-3xl bg-slate-900/80 border border-slate-800 p-7 space-y-5 flex flex-col justify-between ${st.border}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-serif text-amber-400">”</span>
                  <Badge className="bg-slate-950 text-amber-300 border border-slate-800 text-xs">
                    {st.tag}
                  </Badge>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed italic">
                  {st.quote}
                </p>
                <div className="text-xs text-slate-500 font-mono">{st.source}</div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-1.5">
                <div className="text-xs font-bold text-cyan-400">
                  {st.solutionTitle}
                </div>
                <button
                  type="button"
                  onClick={() => scrollToAuth("REGISTER")}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAr ? "تتبع النوافذ الزمنية الآن" : "Track deadlines now"}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-cyan-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. مصمم لكل فريق (Built for Every Team) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black">
            {isAr ? "مصمم لكل فريق" : "Built for Every Department"}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            {isAr
              ? "من الشركات الناشئة إلى المؤسسات الكبيرة، تتكيف RenewalGuard مع سير عملك."
              : "From lean startups to enterprise operations, RenewalGuard adapts to your workflow."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Building2,
              title: isAr ? "خدمات B2B" : "B2B Services",
              badge: isAr ? "العملاء المحتفظ بهم" : "Client Retention",
              color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
            },
            {
              icon: Briefcase,
              title: isAr ? "المدراء الماليون" : "CFOs & Finance",
              badge: isAr ? "أنفق بشكل مرئي" : "Spend Visibility",
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            },
            {
              icon: Scale,
              title: isAr ? "الفرق القانونية" : "Legal & Compliance",
              badge: isAr ? "التفاصيل مركزية" : "Centralized Terms",
              color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
            },
            {
              icon: ShoppingCart,
              title: isAr ? "المشتريات والتوريد" : "Procurement",
              badge: isAr ? "إدارة البائعين" : "Vendor Control",
              color: "text-teal-400 bg-teal-500/10 border-teal-500/30",
            },
            {
              icon: ShieldCheck,
              title: isAr ? "المقاولون والتراخيص" : "Contractors",
              badge: isAr ? "الالتزام بالامتثال" : "License Compliance",
              color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            },
            {
              icon: Layers,
              title: isAr ? "تجار الجملة والتوزيع" : "Wholesalers",
              badge: isAr ? "التحكم في التكاليف" : "Margin Protection",
              color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
            },
            {
              icon: Users,
              title: isAr ? "مديرو العمليات" : "Operations",
              badge: isAr ? "سير عمل موحد" : "Synced Workflows",
              color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
            },
            {
              icon: Rocket,
              title: isAr ? "الشركات الناشئة" : "Startups",
              badge: isAr ? "نمو بدون عبء إداري" : "Zero Admin Bloat",
              color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
            },
          ].map((team, idx) => {
            const Icon = team.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/75 border border-slate-800 flex flex-col justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-sm text-white">{team.title}</span>
                </div>
                <div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${team.color}`}
                  >
                    {team.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. جدول المقارنة الحاسم (RenewalGuard vs. Spreadsheets) */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20 border-t border-slate-900 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black">
            {isAr
              ? "لماذا تتفوق RenewalGuard على جداول البيانات؟"
              : "Why RenewalGuard Beats Spreadsheets"}
          </h2>
          <p className="text-slate-400 text-sm">
            {isAr
              ? "مقارنة مباشرة على مستوى الميزات لتغطية تتبع التجديد والحوكمة"
              : "Feature-by-feature comparison for enterprise contract governance"}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-3 p-5 bg-slate-950 border-b border-slate-800 text-xs sm:text-sm font-extrabold">
            <div>{isAr ? "الميزة" : "Capability"}</div>
            <div className="text-center text-slate-400">
              {isAr ? "جداول البيانات (Excel)" : "Spreadsheets"}
            </div>
            <div className="text-center text-cyan-400">RenewalGuard PRO</div>
          </div>

          {[
            {
              feat: isAr ? "إمكانية رؤية تاريخ التجديد ومؤشر الخطر" : "Renewal Readiness & Risk Scoring",
              excel: isAr ? "يدوي ومشتت" : "Manual",
              rg: isAr ? "تلقائي (0-100)" : "Automated (0–100)",
            },
            {
              feat: isAr ? "رسائل تذكير مجدولة عبر البريد والمنصة" : "Automated Multi-Stage Alerts",
              excel: isAr ? "غير متوفر ✕" : "None ✕",
              rg: isAr ? "مدمج وتلقائي ✓" : "Built-in ✓",
            },
            {
              feat: isAr ? "طابور اعتمادات وموافقات (Workflows)" : "Approval Workflow Queue",
              excel: isAr ? "غير متوفر ✕" : "None ✕",
              rg: isAr ? "متكامل ✓" : "Full RBAC Queue ✓",
            },
            {
              feat: isAr ? "سجل مراقبة أمنية (Audit Trail)" : "Immutable Security Audit Log",
              excel: isAr ? "غير متوفر ✕" : "None ✕",
              rg: isAr ? "مُشفّر وموثق ✓" : "Verified ✓",
            },
            {
              feat: isAr ? "ضوابط الفوترة وعزل الحسابات" : "Multi-Tenant Vault & Billing",
              excel: isAr ? "غير متوفر ✕" : "None ✕",
              rg: isAr ? "مفعّل 100% ✓" : "Enterprise Grade ✓",
            },
          ].map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-3 p-4 sm:p-5 border-b border-slate-800/70 text-xs sm:text-sm items-center"
            >
              <div className="font-semibold text-slate-200">{row.feat}</div>
              <div className="text-center text-rose-400 font-medium">{row.excel}</div>
              <div className="text-center text-emerald-400 font-bold">{row.rg}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. الأسئلة الشائعة التفاعلية (Interactive FAQ Accordion) */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 border-t border-slate-900 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black">
            {isAr ? "الأسئلة الشائعة وتمت الإجابة عليها." : "Frequently Asked Questions."}
          </h2>
          <p className="text-slate-400 text-sm">
            {isAr ? "كل ما تحتاج لمعرفته قبل البدء" : "Everything you need to know"}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-start font-bold text-sm sm:text-base text-cyan-300 hover:text-cyan-200 cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      isOpen ? "rotate-180 text-cyan-400" : "text-slate-500"
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. قسم الإغلاق والتسجيل السريع بالبريد (Bottom Email Capture CTA) */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-3xl sm:text-5xl font-black">
          {isAr ? "هل أنت مستعد لعدم تفويت أي تجديد؟" : "Ready to Never Miss a Renewal Again?"}
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          {isAr
            ? "ابدأ بالخطة المجانية أو جرب بيئة المشتري الفورية بضغطة واحدة، وقم بالترقية في أي وقت."
            : "Start with our free workspace or launch the 1-click buyer sandbox immediately."}
        </p>

        <div className="max-w-lg mx-auto flex flex-col sm:flex-row gap-2.5 pt-2">
          <Input
            type="email"
            dir="ltr"
            placeholder="work@company.com"
            value={quickEmail}
            onChange={(e) => setQuickEmail(e.target.value)}
            className="h-13 rounded-2xl bg-slate-900 border-slate-700 text-white px-4"
          />
          <Button
            type="button"
            onClick={() => scrollToAuth("REGISTER", quickEmail)}
            className="h-13 px-8 rounded-2xl bg-linear-to-r from-cyan-400 to-blue-600 text-slate-950 font-black shrink-0 cursor-pointer"
          >
            <span>{isAr ? "ابدأ الآن" : "Get Started"}</span>
            <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {isAr ? "خطة مجانية متاحة" : "Free plan available"}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {isAr ? "يمكنك الإلغاء في أي وقت" : "Cancel anytime"}
          </span>
        </div>

        {/* روابط الفوتر القانونية المعتمدة */}
        <div className="pt-12 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>RenewalGuard Enterprise Edition © 2026</div>
          <div className="flex items-center gap-6">
            <span
              onClick={() => router.push("/terms")}
              className="hover:text-cyan-400 cursor-pointer"
            >
              {isAr ? "شروط الخدمة وسياسة الخصوصية" : "Terms & Privacy Policy"}
            </span>
            <span
              onClick={() => router.push("/pricing")}
              className="hover:text-cyan-400 cursor-pointer"
            >
              {isAr ? "الأسعار والباقات" : "Pricing & Buyout"}
            </span>
          </div>
        </div>
      </section>

      {/* الشريط العائم السفلي مثل الموقع العالمي (Sticky Bottom CTA Bar) */}
      <div className="fixed bottom-4 inset-x-4 z-50 max-w-md mx-auto">
        <Button
          type="button"
          onClick={handleInstantDemoLogin}
          className="w-full h-13 rounded-2xl bg-linear-to-r from-cyan-400 via-teal-400 to-blue-500 text-slate-950 font-black shadow-[0_10px_40px_rgba(6,182,212,0.45)] flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <span>{isAr ? "ابدأ مجاناً / معاينة فورية" : "Start Free / Instant Demo"}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}