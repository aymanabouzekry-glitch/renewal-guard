"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Globe,
  Zap,
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
  Lock,
  Printer,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n/LanguageContext";

interface SelectedCheckoutPlan {
  id: string;
  name: string;
  amount: number;
  originalAmount?: number;
  savings?: number;
  periodLabel: string;
  isBuyout?: boolean;
}

interface PaymentOrder {
  orderId: string;
  date: string;
  planId: string;
  planName: string;
  amount: number;
  method: string;
  reference: string;
  payerName: string;
  email: string;
  status: "PENDING_VERIFICATION" | "VERIFIED_PAID" | "REJECTED_FAKE";
}

function isValidLuhnCard(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length !== 16) return false;
  if (/^(\d)\1{15}$/.test(digits)) return false;
  if (!digits.startsWith("4") && !digits.startsWith("5")) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isValidExpiryDate(expiry: string): boolean {
  const parts = expiry.split("/");
  if (parts.length !== 2) return false;
  const month = parseInt(parts[0], 10);
  const year = 2000 + parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  if (year > currentYear + 10) return false;
  return true;
}

function isValidTransferReference(ref: string): boolean {
  const clean = ref.trim();
  if (clean.length < 8) return false;
  const digitsOnly = clean.replace(/\D/g, "");
  if (digitsOnly.length < 6) return false;
  if (/^(\d)\1+$/.test(digitsOnly)) return false;
  if (
    clean.toLowerCase().includes("test") ||
    clean.toLowerCase().includes("fake") ||
    clean.includes("123456")
  ) {
    return false;
  }
  return true;
}

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { locale, toggleLanguage } = useTranslation();
  const isAr = locale === "ar";

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">(
    "ANNUAL"
  );

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] =
    useState<SelectedCheckoutPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "INSTAPAY" | "BANK" | "CARD" | "PAYPAL"
  >("INSTAPAY");

  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [transferRef, setTransferRef] = useState("");

  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState<PaymentOrder | null>(
    null
  );

  const [orders, setOrders] = useState<PaymentOrder[]>([]);

  const activeUserEmail = (
    session?.user?.email ||
    (typeof window !== "undefined"
      ? localStorage.getItem("rg_active_user_email")
      : "") ||
    ""
  )
    .trim()
    .toLowerCase();

    
    const envOwner = (process.env.NEXT_PUBLIC_OWNER_EMAIL || "").trim().toLowerCase();
    const isOwnerAdmin = envOwner !== "" && activeUserEmail === envOwner;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rg_payment_orders_v1");
      if (saved) {
        setOrders(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to read payment orders:", e);
    }
  }, []);

  const saveOrdersList = (updated: PaymentOrder[]) => {
    setOrders(updated);
    try {
      localStorage.setItem("rg_payment_orders_v1", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save payment orders:", e);
    }
  };

  const handleAdminVerifyOrder = (
    orderId: string,
    decision: "VERIFIED_PAID" | "REJECTED_FAKE"
  ) => {
    const updated = orders.map((o) =>
      o.orderId === orderId ? { ...o, status: decision } : o
    );
    saveOrdersList(updated);

    const target = updated.find((o) => o.orderId === orderId);
    if (decision === "VERIFIED_PAID" && target) {
      localStorage.setItem(
        "rg_active_subscription",
        JSON.stringify({
          planId: target.planId,
          planName: target.planName,
          amount: target.amount,
          orderId: target.orderId,
          payerEmail: target.email,
          status: "ACTIVE_VERIFIED",
          activatedAt: new Date().toISOString(),
        })
      );
    }
    if (submittedOrder && submittedOrder.orderId === orderId) {
      setSubmittedOrder({ ...submittedOrder, status: decision });
    }
  };

  const plans = [
    {
      id: "starter",
      name: isAr ? "الباقة الأساسية (Starter)" : "Starter Workspace",
      monthlyPrice: 49,
      annualTotal: 468,
      annualOriginal: 588,
      annualSavings: 120,
      monthlyEquivalent: 39,
      desc: isAr
        ? "مثالية للشركات الناشئة لتتبع العقود الأساسية والتنبيهات المبكرة."
        : "Essential contract tracking and early expiration warnings for lean teams.",
      features: [
        isAr ? "إدارة حتى 50 عقد ومستند" : "Up to 50 active contracts",
        isAr ? "مؤشر الجاهزية الذكي (0-100)" : "Explainable readiness index",
        isAr ? "تصدير البيانات واستيراد CSV" : "CSV import & sanitized export",
        isAr ? "تنبيهات البريد الإلكتروني" : "Automated email notifications",
      ],
      popular: false,
    },
    {
      id: "professional",
      name: isAr ? "باقة الأعمال (Professional)" : "Professional Tier",
      monthlyPrice: 129,
      annualTotal: 1188,
      annualOriginal: 1548,
      annualSavings: 360,
      monthlyEquivalent: 99,
      desc: isAr
        ? "مخصصة للشركات المتوسطة مع طابور اعتمادات وسير عمل متقدم."
        : "Advanced multi-stage approval workflows and role-based access.",
      features: [
        isAr ? "عقود ومستندات غير محدودة" : "Unlimited contract registry",
        isAr ? "طابور مهام وسير عمل الاعتمادات" : "Multi-stage approval workflows",
        isAr ? "سجل المراقبة الأمنية (Audit Trail)" : "Immutable security audit log",
        isAr ? "إدارة الفريق والصلاحيات (RBAC)" : "Team RBAC access control",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: isAr ? "الباقة المؤسسية (Enterprise)" : "Enterprise Sovereign",
      monthlyPrice: 349,
      annualTotal: 3588,
      annualOriginal: 4188,
      annualSavings: 600,
      monthlyEquivalent: 299,
      desc: isAr
        ? "أقصى درجات الأمان وحوكمة السيرفر، مع تخصيص الهوية (White-Label)."
        : "Sovereign deployment, custom S3 & SMTP adapters, and white-label branding.",
      features: [
        isAr ? "نشر مستقل (Isolated Single-Tenant)" : "Dedicated tenant architecture",
        isAr ? "تخصيص الهوية بالكامل (White-Label)" : "Full white-label branding",
        isAr ? "محولات تخزين S3 وبريد SMTP" : "Custom S3 & SMTP adapters",
        isAr ? "دعم فني هندسي مخصص 24/7" : "Priority 24/7 engineering support",
      ],
      popular: false,
    },
  ];

  const openPlanCheckout = (plan: (typeof plans)[0]) => {
    setPaymentError("");
    setSubmittedOrder(null);
    const isAnnual = billingCycle === "ANNUAL";
    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      amount: isAnnual ? plan.annualTotal : plan.monthlyPrice,
      originalAmount: isAnnual ? plan.annualOriginal : undefined,
      savings: isAnnual ? plan.annualSavings : undefined,
      periodLabel: isAnnual
        ? isAr
          ? "اشتراك سنوي كامل (شامل خصم 20%)"
          : "Annual Subscription (20% Off Applied)"
        : isAr
        ? "اشتراك شهري متجدد"
        : "Monthly Subscription",
    });
    setCheckoutOpen(true);
  };

  const openBuyoutCheckout = () => {
    setPaymentError("");
    setSubmittedOrder(null);
    setSelectedPlan({
      id: "source-code-buyout",
      name: isAr
        ? "الاستحواذ الكامل على المنصة والكود المصدري (Full IP Buyout)"
        : "Full Source Code & IP Acquisition License",
      amount: 4900,
      originalAmount: 6500,
      savings: 1600,
      periodLabel: isAr
        ? "دفعة واحدة لامتلاك المشروع بالكامل مدى الحياة"
        : "One-Time Commercial IP Acquisition",
      isBuyout: true,
    });
    setCheckoutOpen(true);
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setPaymentError("");

    if (!payerName.trim() || !payerEmail.trim()) {
      setPaymentError(
        isAr
          ? "يرجى إدخال الاسم الكامل والبريد الإلكتروني."
          : "Please enter your full name and email."
      );
      return;
    }

    if (paymentMethod === "CARD") {
      if (!isValidLuhnCard(cardNumber)) {
        setPaymentError(
          isAr
            ? "تم رفض البطاقة: رقم البطاقة البنكية غير صحيح (فشل فحص خوارزمية البنك Luhn Checksum)."
            : "Card Declined: Invalid credit card number."
        );
        return;
      }

      if (!isValidExpiryDate(cardExpiry) || cardCvc.length < 3) {
        setPaymentError(
          isAr
            ? "تاريخ انتهاء البطاقة أو رمز CVC غير صالح."
            : "Invalid card expiration date or security CVC."
        );
        return;
      }

      setPaymentError(
        isAr
          ? "بوابة البطاقات تتطلب ربط مفتاح التاجر الحي في السيرفر. يرجى استخدام InstaPay أو التحويل البنكي."
          : "Credit card checkout requires live merchant keys. Please use InstaPay or Bank Wire."
      );
      return;
    }

    if (paymentMethod === "PAYPAL") {
      setPaymentError(
        isAr
          ? "الدفع عبر PayPal يتطلب حساب التاجر المعتمد. يرجى استخدام InstaPay أو التحويل البنكي."
          : "PayPal checkout requires merchant credentials. Please use InstaPay or Bank Wire."
      );
      return;
    }

    if (!isValidTransferReference(transferRef)) {
      setPaymentError(
        isAr
          ? "رقم مرجع التحويل غير صالح أو يبدو وهمياً! يرجى إدخال رقم المعاملة البنكية الحقيقي."
          : "Invalid or fake transfer reference! Please enter a valid bank reference."
      );
      return;
    }

    setProcessingPayment(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      const orderId = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const methodLabel =
        paymentMethod === "INSTAPAY"
          ? "InstaPay / Mobile Wallet"
          : "Bank Wire Transfer (IBAN)";

      const newOrder: PaymentOrder = {
        orderId,
        date: new Date().toISOString().split("T")[0],
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.amount,
        method: methodLabel,
        reference: transferRef.trim(),
        payerName: payerName.trim(),
        email: payerEmail.trim(),
        status: "PENDING_VERIFICATION",
      };

      const updatedOrders = [newOrder, ...orders];
      saveOrdersList(updatedOrders);
      setSubmittedOrder(newOrder);
    } catch {
      setPaymentError("Unexpected error while submitting payment verification.");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="h-20 border-b border-slate-800/80 px-8 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-sm shadow-lg shadow-blue-600/40">
            RG
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight">
              RenewalGuard
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              Enterprise Pricing & Verified Billing
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="rounded-xl bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 text-xs"
          >
            <Globe className="w-3.5 h-3.5 me-1.5" />
            {locale === "en" ? "العربية" : "English"}
          </Button>

          <Button
            onClick={() => router.push("/register")}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
          >
            {isAr ? "دخول لوحة التحكم" : "Access Platform"}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16 space-y-12 w-full">
        {/* لوحة مراجعة واعتماد التحويلات المالية */}
        {(isOwnerAdmin || orders.length > 0) && (
          <div className="rounded-3xl bg-slate-900/95 border border-amber-500/40 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-extrabold text-white">
                  {isAr
                    ? "مركز التحقق المالي واعتماد إيصالات الدفع"
                    : "Financial Verification & Transfer Approval Desk"}
                </h2>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                {
                  orders.filter((o) => o.status === "PENDING_VERIFICATION")
                    .length
                }{" "}
                {isAr ? "بانتظار مراجعة الإيصال" : "Pending Review"}
              </Badge>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-400">
                {isAr
                  ? "لا توجد إيصالات تحويل معلقة حالياً."
                  : "No payment transfer receipts submitted yet."}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono font-bold text-blue-400"
                          dir="ltr"
                        >
                          {ord.orderId}
                        </span>
                        <span className="font-bold text-white">
                          {ord.planName}
                        </span>
                        <span
                          className="font-extrabold text-emerald-400"
                          dir="ltr"
                        >
                          (${ord.amount.toLocaleString()})
                        </span>
                      </div>
                      <div className="text-slate-400">
                        {ord.payerName} ({ord.email}) • {ord.method} •{" "}
                        <span className="text-amber-300 font-mono" dir="ltr">
                          Ref: {ord.reference}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.status === "PENDING_VERIFICATION" && (
                        <>
                          <Badge className="bg-amber-500/20 text-amber-300 border-none">
                            {isAr ? "قيد التحقق" : "Pending Bank Check"}
                          </Badge>
                          {isOwnerAdmin && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAdminVerifyOrder(
                                    ord.orderId,
                                    "VERIFIED_PAID"
                                  )
                                }
                                className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                              >
                                {isAr ? "تأكيد وتفعيل" : "Verify & Activate"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleAdminVerifyOrder(
                                    ord.orderId,
                                    "REJECTED_FAKE"
                                  )
                                }
                                className="h-8 rounded-xl text-xs font-bold"
                              >
                                {isAr ? "رفض" : "Reject"}
                              </Button>
                            </>
                          )}
                        </>
                      )}

                      {ord.status === "VERIFIED_PAID" && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {isAr ? "✓ مفعّلة ومؤكدة" : "✓ Verified & Active"}
                        </Badge>
                      )}

                      {ord.status === "REJECTED_FAKE" && (
                        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                          {isAr ? "✕ مرفوضة" : "✕ Rejected"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {isAr
                ? "بوابات دفع محمية ضد البيانات الوهمية"
                : "Fraud-Protected Billing & Verified Settlement"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {isAr
              ? "استثمر في منصة عقود جاهزة لتحقيق العوائد من اليوم الأول"
              : "Enterprise SaaS Plans Built for Scalable Recurring Revenue"}
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            {isAr
              ? "جميع المدفوعات تخضع للتحقق البنكي الفعلي لضمان أعلى معايير الأمان المؤسسي."
              : "All transactions enforce strict bank validation before workspace activation."}
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-4 flex items-center justify-center">
            <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setBillingCycle("MONTHLY")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "MONTHLY"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isAr ? "دفع شهري" : "Monthly Billing"}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("ANNUAL")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  billingCycle === "ANNUAL"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>
                  {isAr
                    ? "دفع سنوي (خصم 20%)"
                    : "Annual Billing (Save 20%)"}
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px]">
                  {isAr ? "الأوفر سنوياً" : "Best Value"}
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          {plans.map((plan, idx) => {
            const isAnnual = billingCycle === "ANNUAL";
            const displayPrice = isAnnual
              ? `$${plan.annualTotal.toLocaleString()}`
              : `$${plan.monthlyPrice}`;
            const periodText = isAnnual
              ? isAr
                ? "سنوياً"
                : "per year"
              : isAr
              ? "شهرياً"
              : "per month";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className={`relative rounded-3xl bg-slate-900 border p-8 flex flex-col justify-between shadow-xl ${
                  plan.popular
                    ? "ring-2 ring-blue-500 border-blue-400/50 bg-linear-to-b from-slate-900 to-slate-950"
                    : "border-slate-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 inset-s-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide shadow-md">
                    {isAr ? "الأكثر طلباً للشركات" : "Most Popular Choice"}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2" dir="ltr">
                      <span className="text-4xl font-extrabold text-white">
                        {displayPrice}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        / {periodText}
                      </span>
                      {isAnnual && (
                        <span className="text-sm text-slate-500 line-through ms-1">
                          ${plan.annualOriginal.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {isAnnual ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                          {isAr
                            ? `توفير $${plan.annualSavings} سنوياً (يعادل $${plan.monthlyEquivalent}/شهرياً)`
                            : `Save $${plan.annualSavings}/yr ($${plan.monthlyEquivalent}/mo eq.)`}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">
                        {isAr
                          ? `أو ادفع سنوياً ووفّر $${plan.annualSavings} في السنة`
                          : `Or switch to annual billing to save $${plan.annualSavings}/year`}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {isAr ? "مميزات الباقة:" : "What's Included:"}
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8 space-y-2.5">
                  <Button
                    type="button"
                    onClick={() => openPlanCheckout(plan)}
                    className={`w-full h-12 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isAr
                        ? "اشترك الآن (دفع موثّق)"
                        : "Subscribe (Verified Checkout)"}
                    </span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Source Code Acquisition Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-3xl bg-linear-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/30 p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isAr
                  ? "استحواذ كامل على الشيفرة المصدرية (Full Source Code Buyout — $4,900)"
                  : "Exclusive Source Code Acquisition Option ($4,900 One-Time)"}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isAr
                ? "مهتم بشراء المشروع بالكامل ونقله لملكيتك الخاصة؟"
                : "Looking to acquire the full IP and source code?"}
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "احصل على حقوق الملكية الفكرية الكاملة، الكود المصدري على GitHub، مع عقد استحواذ رسمي بعد التحقق البنكي."
                : "Acquire complete intellectual property rights and GitHub repository transfer upon verified bank settlement."}
            </p>
          </div>

          <Button
            type="button"
            onClick={openBuyoutCheckout}
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 shadow-lg shadow-emerald-600/30 shrink-0 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 me-2" />
            {isAr
              ? "طلب شراء واستحواذ المنصة ($4,900)"
              : "Acquire Full Source Code ($4,900)"}
          </Button>
        </motion.div>
      </main>

      {/* نافذة الدفع المحمية */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-xl bg-slate-950 text-white border border-slate-800">
          {selectedPlan && !submittedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2 text-white">
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    {isAr
                      ? "بوابة الدفع والتحقق المالي الصارم"
                      : "Verified Financial Checkout Gateway"}
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                    {isAr ? "محمي ضد الدفع الوهمي" : "Anti-Fraud Guard"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {selectedPlan.name} — {selectedPlan.periodLabel}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleProcessPayment} className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">
                      {isAr ? "إجمالي المبلغ المطلوب:" : "Total Amount Due:"}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {selectedPlan.name}
                    </div>
                  </div>
                  <div className="text-end" dir="ltr">
                    <div className="text-3xl font-extrabold text-emerald-400">
                      ${selectedPlan.amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">
                    {isAr ? "وسيلة الدفع المعتمدة:" : "Payment Method:"}
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        id: "INSTAPAY",
                        label: isAr ? "إنستا باي" : "InstaPay",
                        icon: Smartphone,
                      },
                      {
                        id: "BANK",
                        label: isAr ? "تحويل بنكي" : "Wire / IBAN",
                        icon: Building2,
                      },
                      {
                        id: "CARD",
                        label: isAr ? "بطاقة بنكية" : "Bank Card",
                        icon: CreditCard,
                      },
                      {
                        id: "PAYPAL",
                        label: "PayPal",
                        icon: Wallet,
                      },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(m.id as any);
                            setPaymentError("");
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            active
                              ? "bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      {isAr ? "اسم المحوّل / العميل" : "Full Payer Name"}
                    </Label>
                    <Input
                      required
                      placeholder={isAr ? "الاسم الثلاثي" : "Full Legal Name"}
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="bg-slate-900 border-slate-800 text-white h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      {isAr ? "البريد الإلكتروني للحساب" : "Account Email"}
                    </Label>
                    <Input
                      type="email"
                      required
                      dir="ltr"
                      placeholder="user@company.com"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      className="bg-slate-900 border-slate-800 text-white h-10 rounded-xl"
                    />
                  </div>
                </div>

                {paymentMethod === "INSTAPAY" && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                    <div className="font-bold text-emerald-400">
                      {isAr
                        ? "1. حوّل المبلغ عبر تطبيق InstaPay إلى الحساب الرسمي:"
                        : "1. Transfer via InstaPay to official IPA:"}
                    </div>
                    <div
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-200"
                      dir="ltr"
                    >
                      IPA: renewalguard@instapay
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">
                        {isAr
                          ? "2. أدخل رقم مرجع عملية إنستا باي الحقيقي:"
                          : "2. Enter Official InstaPay Reference Number:"}
                      </Label>
                      <Input
                        dir="ltr"
                        placeholder="e.g., 610293847561"
                        value={transferRef}
                        onChange={(e) => setTransferRef(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white font-mono h-10 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "BANK" && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                    <div className="font-bold text-blue-400">
                      {isAr
                        ? "بيانات التحويل البنكي للشركات (IBAN):"
                        : "Corporate Bank Wire Details:"}
                    </div>
                    <div
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-300 space-y-1"
                      dir="ltr"
                    >
                      <div>Bank: Commercial International Bank (CIB)</div>
                      <div>IBAN: EG890010000000000123456789012</div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">
                        {isAr
                          ? "رقم إيصال التحويل البنكي:"
                          : "Bank Wire Reference ID:"}
                      </Label>
                      <Input
                        dir="ltr"
                        placeholder="e.g., CIB-2026-9081726"
                        value={transferRef}
                        onChange={(e) => setTransferRef(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white font-mono h-10 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "CARD" && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {isAr
                          ? "فحص البطاقة بخوارزمية Luhn البنكية"
                          : "Luhn Checksum Verified Card Input"}
                      </span>
                      <span className="font-mono text-amber-400">
                        LUHN GUARD ACTIVE
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300">
                        {isAr ? "رقم البطاقة (16 رقم حقيقي)" : "Card Number"}
                      </Label>
                      <Input
                        dir="ltr"
                        placeholder="4532 •••• •••• ••••"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(formatCardNumber(e.target.value))
                        }
                        className="bg-slate-950 border-slate-800 text-white font-mono h-10 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">
                          {isAr ? "تاريخ الانتهاء (MM/YY)" : "Expiry Date"}
                        </Label>
                        <Input
                          dir="ltr"
                          placeholder="08/29"
                          value={cardExpiry}
                          onChange={(e) =>
                            setCardExpiry(formatExpiry(e.target.value))
                          }
                          className="bg-slate-950 border-slate-800 text-white font-mono h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">
                          {isAr ? "رمز الأمان (CVC)" : "Security CVC"}
                        </Label>
                        <Input
                          dir="ltr"
                          type="password"
                          maxLength={4}
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) =>
                            setCardCvc(e.target.value.replace(/\D/g, ""))
                          }
                          className="bg-slate-950 border-slate-800 text-white font-mono h-10 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "PAYPAL" && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
                    <div className="font-bold text-blue-400">
                      PayPal Merchant Gateway
                    </div>
                    <p>
                      {isAr
                        ? "يتطلب ربط حساب التاجر الحي أو استخدم InstaPay للتحقق البنكي المباشر."
                        : "Requires live credentials or use InstaPay/Wire."}
                    </p>
                  </div>
                )}

                {paymentError && (
                  <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs font-bold text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={processingPayment}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg cursor-pointer"
                  >
                    {processingPayment
                      ? isAr
                        ? "جاري فحص البيانات وإرسال الطلب..."
                        : "Validating & Submitting..."
                      : isAr
                      ? `إرسال إشعار الدفع للمراجعة ($${selectedPlan.amount.toLocaleString()})`
                      : `Submit Payment for Verification ($${selectedPlan.amount.toLocaleString()})`}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {submittedOrder && (
            <div className="space-y-5 py-3">
              <div className="flex flex-col items-center text-center space-y-2">
                {submittedOrder.status === "PENDING_VERIFICATION" && (
                  <>
                    <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-extrabold text-white">
                      {isAr
                        ? "طلبك قيد المراجعة والتحقق المالي!"
                        : "Payment Pending Financial Verification!"}
                    </h3>
                  </>
                )}

                {submittedOrder.status === "VERIFIED_PAID" && (
                  <>
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-extrabold text-white">
                      {isAr
                        ? "تم اعتماد التحويل وتفعيل الباقة رسمياً!"
                        : "Transfer Verified & Plan Activated!"}
                    </h3>
                  </>
                )}

                {submittedOrder.status === "REJECTED_FAKE" && (
                  <>
                    <div className="h-14 w-14 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400">
                      <XCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-extrabold text-red-400">
                      {isAr
                        ? "تم رفض العملية: إيصال دفع غير صحيح!"
                        : "Transaction Rejected!"}
                    </h3>
                  </>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {isAr ? "رقم الطلب:" : "Order ID:"}
                  </span>
                  <span className="font-mono font-bold text-blue-400" dir="ltr">
                    {submittedOrder.orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {isAr ? "حالة التفعيل:" : "Activation Status:"}
                  </span>
                  <Badge
                    className={
                      submittedOrder.status === "VERIFIED_PAID"
                        ? "bg-emerald-500/20 text-emerald-400 border-none"
                        : submittedOrder.status === "REJECTED_FAKE"
                        ? "bg-red-500/20 text-red-400 border-none"
                        : "bg-amber-500/20 text-amber-300 border-none"
                    }
                  >
                    {submittedOrder.status === "VERIFIED_PAID"
                      ? isAr
                        ? "مفعّلة ومؤكدة"
                        : "Verified & Active"
                      : submittedOrder.status === "REJECTED_FAKE"
                      ? isAr
                        ? "مرفوضة"
                        : "Rejected"
                      : isAr
                      ? "بانتظار مراجعة البنك"
                      : "Pending Bank Verification"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {isAr ? "الباقة المطلوبة:" : "Requested Plan:"}
                  </span>
                  <span className="font-bold text-white">
                    {submittedOrder.planName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {isAr ? "رقم المرجع:" : "Submitted Reference:"}
                  </span>
                  <span className="font-mono text-amber-300" dir="ltr">
                    {submittedOrder.reference}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-300">
                    {isAr ? "المبلغ الخاضع للمراجعة:" : "Amount Under Review:"}
                  </span>
                  <span
                    className="text-lg font-extrabold text-amber-400"
                    dir="ltr"
                  >
                    ${submittedOrder.amount.toLocaleString()} USD
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                  className="rounded-xl bg-slate-900 border-slate-700 text-white hover:bg-slate-800 flex-1"
                >
                  <Printer className="w-4 h-4 me-2" />
                  {isAr ? "طباعة إشعار المراجعة" : "Print Order Slip"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex-1"
                >
                  {isAr ? "إغلاق ومتابعة" : "Close & Track"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer مع ربط صفحة الشروط والأحكام القانونية */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              RenewalGuard Enterprise Edition • All Rights Reserved © 2026
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span
              onClick={() => router.push("/terms")}
              className="cursor-pointer hover:text-white transition-colors"
            >
              {isAr ? "الشروط والأحكام" : "Terms & Privacy"}
            </span>
            <span
              onClick={() => router.push("/settings")}
              className="cursor-pointer hover:text-white transition-colors"
            >
              {isAr ? "الحوكمة والأمان" : "Security Governance"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}