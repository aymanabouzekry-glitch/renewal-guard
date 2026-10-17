"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Palette,
  Sparkles,
  ShieldCheck,
  Database,
  HardDrive,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isAr = locale === "ar";

  const [appName, setAppName] = useState("RenewalGuard");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [contactEmail, setContactEmail] = useState("admin@renewalguard.com");
  const [integrations, setIntegrations] = useState<any>(null);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loadingSample, setLoadingSample] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (status === "authenticated") {
      fetchSettings();
      fetchAuditLogs();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setAppName(data.appName || "RenewalGuard");
        setPrimaryColor(data.primaryColor || "#2563eb");
        setContactEmail(data.contactEmail || "admin@renewalguard.com");
        if (data.integrations) setIntegrations(data.integrations);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const result = await res.json();
        setAuditLogs(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, primaryColor, contactEmail }),
      });
      if (res.ok) {
        setSaveMessage(t.brandingSavedMsg);
        fetchAuditLogs();
        setTimeout(() => {
          window.location.reload();
        }, 900);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSampleData = async () => {
    setLoadingSample(true);
    try {
      const sampleRecords = [
        {
          name: "ISO 27001 Security Certificate",
          type: "License",
          status: "Active",
          dueDate: "2026-11-05",
          cost: 4500,
        },
        {
          name: "AWS Enterprise Cloud Infrastructure",
          type: "Contract",
          status: "Active",
          dueDate: "2026-10-28",
          cost: 12800,
        },
        {
          name: "Commercial General Liability Policy",
          type: "Insurance",
          status: "Pending",
          dueDate: "2026-12-15",
          cost: 6200,
        },
      ];

      const res = await fetch("/api/documents/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: sampleRecords }),
      });

      if (res.ok) {
        fetchAuditLogs();
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to load sample data:", error);
    } finally {
      setLoadingSample(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-400">
            Loading Governance & Security...
          </span>
        </div>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      String(log.actorEmail || "").toLowerCase().includes(q) ||
      String(log.action || "").toLowerCase().includes(q) ||
      String(log.targetType || "").toLowerCase().includes(q) ||
      String(log.targetName || "").toLowerCase().includes(q)
    );
  });

  // تجميع إحصائيات سجل المراقبة الأمنية للرسم البياني التفاعلي
  const actionCountsMap: Record<string, number> = {};
  auditLogs.forEach((l) => {
    const key = String(l.targetType || "System");
    actionCountsMap[key] = (actionCountsMap[key] || 0) + 1;
  });
  const auditChartData = Object.entries(actionCountsMap).map(
    ([category, events]) => ({
      category,
      events,
    })
  );

  const initials = appName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen bg-slate-100/80 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={session?.user} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-7">
            {/* 1. Midnight-Navy Animated Hero Banner */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-7 lg:p-8 shadow-xl border border-slate-800"
            >
              <div className="pointer-events-none absolute -top-24 -inset-e-24 h-72 w-72 rounded-full bg-emerald-600/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 inset-s-1/3 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

              <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>
                      {isAr
                        ? "الحوكمة وتخصيص الهوية وسجل المراقبة الأمنية"
                        : "Enterprise Governance, White-Label & Security Telemetry"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                    {t.settingsTitle}
                  </h1>
                  <p className="text-sm text-slate-300 max-w-2xl">
                    {t.settingsDesc}
                  </p>
                </div>

                {/* Live Brand Badge Preview inside Hero */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 shrink-0">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {initials || "RG"}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">
                      {isAr ? "معاينة الهوية الحية" : "Live Brand Identity"}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {appName}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. Staggered Animated Infrastructure Adapter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  id: "db",
                  title: isAr
                    ? "قاعدة البيانات (PostgreSQL)"
                    : "Database Persistence",
                  provider: "Neon Serverless PostgreSQL",
                  desc: isAr
                    ? "متصل ونشط • جميع السجلات محفوظة فعلياً"
                    : "Active & verified • Drizzle ORM schema synced",
                  configured: true,
                  icon: Database,
                  accent: "from-emerald-600 to-teal-600",
                },
                {
                  id: "storage",
                  title: isAr
                    ? "محول التخزين السحابي (Object Storage)"
                    : "Document Storage Adapter",
                  provider:
                    integrations?.storage?.provider || "LOCAL_DEV_VAULT",
                  desc: integrations?.storage?.configured
                    ? isAr
                      ? "متصل بحاوية S3 إنتاجية"
                      : "Connected to S3 bucket"
                    : isAr
                    ? "وضع التطوير المحلي (أضف مفاتيح S3 في .env للإنتاج)"
                    : "Isolated dev vault active (Set S3 keys in .env for live cloud)",
                  configured: Boolean(integrations?.storage?.configured),
                  icon: HardDrive,
                  accent: "from-blue-600 to-indigo-600",
                },
                {
                  id: "email",
                  title: isAr
                    ? "محول البريد والتنبيهات (SMTP / Email)"
                    : "Notification & Email Adapter",
                  provider: integrations?.email?.provider || "LOCAL_MAIL_SINK",
                  desc: integrations?.email?.configured
                    ? isAr
                      ? "إرسال البريد الخارجي مفعل"
                      : "Live external email dispatch active"
                    : isAr
                    ? "مركز الإشعارات الداخلي نشط (أضف SMTP_HOST للبريد الخارجي)"
                    : "In-app notifications active (Set SMTP_HOST for live email)",
                  configured: Boolean(integrations?.email?.configured),
                  icon: Mail,
                  accent: "from-indigo-600 to-violet-600",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                  >
                    <Card className="rounded-2xl border-slate-200/90 shadow-sm hover:shadow-xl transition-all bg-white dark:bg-zinc-900 overflow-hidden h-full">
                      <div
                        className={`h-1.5 w-full bg-linear-to-r ${item.accent}`}
                      />
                      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {item.title}
                        </CardTitle>
                        <div
                          className={`h-10 w-10 rounded-xl bg-linear-to-br ${item.accent} flex items-center justify-center text-white shadow-md`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          {item.configured ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          )}
                          <span
                            className="font-extrabold text-base text-slate-900 dark:text-white"
                            dir="ltr"
                          >
                            {item.provider}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {item.desc}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* 3. White-Label Studio & Audit Activity Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="lg:col-span-6"
              >
                <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <Palette className="w-5 h-5 text-blue-600" />
                      {t.brandingTitle}
                    </CardTitle>
                    <CardDescription>{t.brandingDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t.productNameLabel}</Label>
                        <Input
                          value={appName}
                          onChange={(e) => setAppName(e.target.value)}
                          required
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t.primaryColorLabel}</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-10 w-16 rounded-xl border cursor-pointer p-1"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            dir="ltr"
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{t.contactEmailLabel}</Label>
                        <Input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          dir="ltr"
                          required
                          className="rounded-xl"
                        />
                      </div>

                      {saveMessage && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                          {saveMessage}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
                      >
                        {saving ? t.saving : t.saveBrandingBtn}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="lg:col-span-6 flex flex-col gap-6"
              >
                {/* Recharts Security Audit Activity Distribution */}
                <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base font-bold">
                      <span className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        {isAr
                          ? "تحليل نشاط المراقبة الأمنية (Audit Telemetry)"
                          : "Security Audit Activity by Target"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {auditLogs.length} {isAr ? "حدث" : "Events"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "توزيع العمليات الموثقة في قاعدة البيانات حسب نوع الهدف."
                        : "Real-time breakdown of recorded security audit events."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={
                            auditChartData.length > 0
                              ? auditChartData
                              : [{ category: "Workspace", events: 1 }]
                          }
                          margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="category"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              color: "#fff",
                              borderRadius: "10px",
                              border: "none",
                              fontSize: "12px",
                            }}
                          />
                          <Bar
                            dataKey="events"
                            fill="#10b981"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Guided Sample Onboarding Card */}
                <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900 flex-1 flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      {t.onboardingTitle}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t.guidedWorkspaceDesc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      onClick={handleLoadSampleData}
                      disabled={loadingSample}
                      className="w-full rounded-xl flex items-center justify-center gap-2 border-indigo-200 hover:bg-indigo-50/60"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      {loadingSample ? t.saving : t.loadSampleBtn}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* 4. Animated Immutable Security Audit Log Table */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
            >
              <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      {t.auditLogTitle}
                    </CardTitle>
                    <CardDescription>{t.auditLogDesc}</CardDescription>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute inset-s-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={
                        isAr
                          ? "تصفية السجل الأمني بالعملية أو المستخدم..."
                          : "Filter audit trail by actor or action..."
                      }
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="ps-9 rounded-xl bg-slate-50/80 dark:bg-zinc-900"
                    />
                  </div>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-start">
                          {t.colActor}
                        </TableHead>
                        <TableHead className="text-start">
                          {t.colAction}
                        </TableHead>
                        <TableHead className="text-start">
                          {t.colTargetType}
                        </TableHead>
                        <TableHead className="text-start">
                          {t.colDetails}
                        </TableHead>
                        <TableHead className="text-start">
                          {t.colTimestamp}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredLogs.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground py-8"
                            >
                              {t.noAuditLogs}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredLogs.map((log: any, idx: number) => (
                            <motion.tr
                              key={log.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, delay: idx * 0.03 }}
                              className="border-b hover:bg-emerald-50/30 dark:hover:bg-zinc-900/50 transition-colors"
                            >
                              <TableCell
                                className="text-start font-semibold text-xs"
                                dir="ltr"
                              >
                                {log.actorEmail}
                              </TableCell>
                              <TableCell className="text-start">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-mono bg-slate-50 dark:bg-zinc-800"
                                >
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-start text-xs font-medium">
                                {log.targetType}
                              </TableCell>
                              <TableCell className="text-start text-xs font-medium">
                                {log.targetName}
                              </TableCell>
                              <TableCell
                                className="text-start text-xs text-slate-500"
                                dir="ltr"
                              >
                                {log.createdAt
                                  ? new Date(log.createdAt).toLocaleString(
                                      isAr ? "ar-EG" : "en-US"
                                    )
                                  : "-"}
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}