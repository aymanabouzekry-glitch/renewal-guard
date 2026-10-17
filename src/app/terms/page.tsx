"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, Globe, Lock, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/LanguageContext";

export default function TermsAndPrivacyPage() {
  const router = useRouter();
  const { locale, toggleLanguage } = useTranslation();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
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
              Enterprise Compliance & Legal Governance
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12 w-full">
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white p-0 h-auto text-xs flex items-center gap-1.5 mb-2"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{isAr ? "العودة للخلف" : "Back"}</span>
          </Button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {isAr ? "اتفاقية الاستخدام وسياسة الخصوصية" : "Terms of Service & GDPR Privacy Policy"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isAr ? "الشروط والأحكام وسياسة حماية البيانات" : "Terms & Data Protection Governance"}
          </h1>

          <p className="text-xs text-slate-400" dir="ltr">
            Last Updated: October 2026 • RenewalGuard Enterprise Edition
          </p>
        </div>

        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3 p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>1. {isAr ? "شروط تقديم الخدمة (SaaS Terms)" : "SaaS Service Agreement"}</span>
            </h2>
            <p>
              {isAr
                ? "تمنح منصة RenewalGuard تراخيص برمجية مؤسسية لإدارة عقود التوريد والتراخيص ومخاطر التجديد. باستخدامك للمنصة أو اشتراكك في باقاتها، فإنك توافق على الالتزام بمعايير الحوكمة الأمنية وعزل البيانات التابعة لمساحة عملك الخاصة."
                : "RenewalGuard provides enterprise software licenses for contract lifecycle management and renewal intelligence. By accessing or subscribing to our workspaces, you agree to adhere to our multi-tenant data isolation and security standards."}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>2. {isAr ? "سياسة الخصوصية وحماية البيانات (GDPR Compliance)" : "Privacy & GDPR Data Protection"}</span>
            </h2>
            <p>
              {isAr
                ? "نحن نلتزم بحماية سرية وأمان بياناتك المؤسسية. يتم تشفير كافة كلمات المرور وسجلات المراقبة (Audit Trail) وفق أعلى معايير التشفير القياسية. لا يتم مشاركة بيانات عقودك أو التزاماتك المالية مع أي أطراف ثالثة."
                : "We are committed to safeguarding your corporate data. All passwords and audit trails are encrypted to industry standards. Your contract registries and financial commitments are never shared with unauthorized third parties."}
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>3. {isAr ? "سياسة الاشتراكات والاسترجاع (Refund & Billing Policy)" : "Billing & Refund Policy"}</span>
            </h2>
            <p>
              {isAr
                ? "تخضع الاشتراكات الشهرية والسنوية لسياسة فترات تجريبية واضحة. وفي حال عمليات الاستحواذ الكامل على الشيفرة المصدرية (Source Code Buyout)، يتم نقل حقوق الملكية الفكرية بالكامل للمشتري فور تأكيد التسوية البنكية المعتمدة."
                : "Monthly and annual subscriptions operate under clear licensing terms. For full source code and IP acquisitions, intellectual property rights transfer immediately upon verified bank settlement."}
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>RenewalGuard Enterprise Edition • All Rights Reserved © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <span
              onClick={() => router.push("/pricing")}
              className="cursor-pointer hover:text-white transition-colors"
            >
              {isAr ? "باقات الأسعار" : "Pricing Tiers"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}