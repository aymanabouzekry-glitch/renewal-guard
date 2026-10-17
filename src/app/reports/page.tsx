"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  CalendarRange,
  ShieldAlert,
  Clock,
  CheckCircle2,
  DollarSign,
  Printer,
  Sparkles,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
} from "lucide-react";
import {
  calculateDaysRemaining,
  calculateReadinessScore,
  getScoreColor,
} from "@/lib/renewal";
import { useTranslation } from "@/i18n/LanguageContext";

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<
    "ALL" | "OVERDUE" | "DUE_30" | "SAFE"
  >("ALL");
  const [pipelineMode, setPipelineMode] = useState<"EXPOSURE" | "VOLUME">(
    "EXPOSURE"
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (status === "authenticated") {
      fetchAllDocs();
    }
  }, [status, router]);

  const fetchAllDocs = async () => {
    try {
      const res = await fetch("/api/documents?page=1&limit=100");
      if (res.ok) {
        const result = await res.json();
        setDocuments(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load reports data:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-400">
            Loading Executive Analytics...
          </span>
        </div>
      </div>
    );
  }

  // 1. حسابات المحفظة الحقيقية
  const overdueDocs = documents.filter(
    (d) => calculateDaysRemaining(d.dueDate) < 0
  );
  const due30Docs = documents.filter((d) => {
    const days = calculateDaysRemaining(d.dueDate);
    return days >= 0 && days <= 30;
  });
  const safeDocs = documents.filter(
    (d) => calculateDaysRemaining(d.dueDate) > 30
  );

  const totalExposure = documents.reduce(
    (sum, d) => sum + (Number(d.cost) || 0),
    0
  );

  const avgReadiness =
    documents.length > 0
      ? Math.round(
          documents.reduce((s, d) => s + calculateReadinessScore(d), 0) /
            documents.length
        )
      : 100;

  // 2. تجميع البيانات حسب الشهر (Monthly Renewal Pipeline Chart)
  const monthlyMap: Record<
    string,
    { month: string; exposure: number; count: number }
  > = {};

  documents.forEach((doc) => {
    const rawDate = doc.dueDate ? new Date(doc.dueDate) : new Date();
    const ym = !isNaN(rawDate.getTime())
      ? `${rawDate.getFullYear()}-${String(rawDate.getMonth() + 1).padStart(
          2,
          "0"
        )}`
      : "Unknown";
    if (!monthlyMap[ym]) {
      monthlyMap[ym] = { month: ym, exposure: 0, count: 0 };
    }
    monthlyMap[ym].exposure += Number(doc.cost) || 0;
    monthlyMap[ym].count += 1;
  });

  const monthlyPipelineData = Object.values(monthlyMap).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  // 3. تجميع البيانات حسب التصنيف (Category Exposure BarChart)
  const categories = ["Contract", "License", "Insurance", "Legal"];
  const categoryStats = categories.map((cat) => {
    const items = documents.filter((d) => d.type === cat);
    const exposure = items.reduce((s, d) => s + (Number(d.cost) || 0), 0);
    const pct =
      documents.length > 0
        ? Math.round((items.length / documents.length) * 100)
        : 0;
    return { category: cat, count: items.length, exposure, pct };
  });

  // 4. توزيع مستويات الجاهزية (Readiness Score Donut Chart)
  const criticalScoreCount = documents.filter(
    (d) => calculateReadinessScore(d) < 50
  ).length;
  const moderateScoreCount = documents.filter((d) => {
    const s = calculateReadinessScore(d);
    return s >= 50 && s < 80;
  }).length;
  const optimalScoreCount = documents.filter(
    (d) => calculateReadinessScore(d) >= 80
  ).length;

  const readinessPieData = [
    {
      name: isAr ? "حرج (<50)" : "Critical (<50)",
      value: criticalScoreCount,
      color: "#ef4444",
    },
    {
      name: isAr ? "متوسط (50-79)" : "Moderate (50-79)",
      value: moderateScoreCount,
      color: "#f59e0b",
    },
    {
      name: isAr ? "ممتاز (80-100)" : "Optimal (80+)",
      value: optimalScoreCount,
      color: "#10b981",
    },
  ].filter((item) => item.value > 0);

  // 5. فلترة السجلات للتقويم والجدول
  const filteredDocs = documents
    .filter((doc) => {
      if (selectedCategory !== "ALL" && doc.type !== selectedCategory) {
        return false;
      }
      const days = calculateDaysRemaining(doc.dueDate);
      if (urgencyFilter === "OVERDUE") return days < 0;
      if (urgencyFilter === "DUE_30") return days >= 0 && days <= 30;
      if (urgencyFilter === "SAFE") return days > 30;
      return true;
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  return (
    <div className="flex h-screen bg-slate-100/80 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={session?.user} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-7">
            {/* 1. Midnight-Navy Animated Executive Hero */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-7 lg:p-8 shadow-xl border border-slate-800"
            >
              <div className="pointer-events-none absolute -top-24 -inset-e-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 inset-s-1/3 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

              <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>
                      {isAr
                        ? "ذكاء الأعمال والتقويم التعاقدي المتقدم"
                        : "Executive Business Intelligence & Renewal Calendar"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                    {isAr
                      ? "تقويم التجديدات والتحليلات التنفيذية"
                      : "Renewal Calendar & Executive Reports"}
                  </h1>
                  <p className="text-sm text-slate-300 max-w-2xl">
                    {isAr
                      ? "تحليلات بصرية متقدمة على التدفقات المالية الشهرية، وتوزيع المخاطر، والجدول الزمني للاستحقاقات."
                      : "Interactive visual analytics on monthly financial exposure, readiness distribution, and contract expiration timelines."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      (window.location.href = "/api/documents/export")
                    }
                    className="rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700"
                  >
                    <Download className="w-4 h-4 me-2" />
                    {isAr ? "تصدير CSV" : "Export CSV"}
                  </Button>
                  <Button
                    onClick={() => window.print()}
                    className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  >
                    <Printer className="w-4 h-4 me-2" />
                    {isAr ? "طباعة التقرير" : "Print Executive Report"}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* 2. Staggered Animated KPI Cards (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  id: "OVERDUE",
                  title: isAr ? "التجديدات المتأخرة" : "Overdue Renewals",
                  value: overdueDocs.length,
                  sub: isAr
                    ? "تصعيد فوري مطلوب"
                    : "Immediate escalation required",
                  icon: ShieldAlert,
                  accent: "from-red-600 to-rose-600",
                  textColor: "text-red-600",
                },
                {
                  id: "DUE_30",
                  title: isAr
                    ? "تنتهي خلال 30 يوماً"
                    : "Expiring Within 30 Days",
                  value: due30Docs.length,
                  sub: isAr ? "نافذة التحذير النشطة" : "Active warning window",
                  icon: Clock,
                  accent: "from-amber-500 to-orange-600",
                  textColor: "text-amber-600",
                },
                {
                  id: "SAFE",
                  title: isAr ? "آمنة (> 30 يوماً)" : "Healthy (> 30 Days)",
                  value: safeDocs.length,
                  sub: isAr
                    ? "عقود في النطاق الآمن"
                    : "On track & compliant",
                  icon: CheckCircle2,
                  accent: "from-emerald-600 to-teal-600",
                  textColor: "text-emerald-600",
                },
                {
                  id: "ALL",
                  title: isAr
                    ? "إجمالي الالتزامات المالية"
                    : "Cumulative Exposure",
                  value: `$${totalExposure.toLocaleString()}`,
                  sub: `${
                    isAr ? "متوسط الجاهزية:" : "Avg Readiness:"
                  } ${avgReadiness}/100`,
                  icon: DollarSign,
                  accent: "from-blue-600 to-indigo-600",
                  textColor: "text-slate-900 dark:text-white",
                },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                const active = urgencyFilter === kpi.id;
                return (
                  <motion.div
                    key={kpi.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card
                      onClick={() => setUrgencyFilter(kpi.id as any)}
                      className={`cursor-pointer rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all relative overflow-hidden ${
                        active
                          ? "ring-2 ring-blue-600 border-blue-300"
                          : "border-slate-200/90 dark:border-zinc-800"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-full bg-linear-to-r ${kpi.accent}`}
                      />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {kpi.title}
                        </CardTitle>
                        <div
                          className={`h-10 w-10 rounded-xl bg-linear-to-br ${kpi.accent} flex items-center justify-center text-white shadow-md`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-3xl font-extrabold tracking-tight ${kpi.textColor}`}
                          dir="ltr"
                        >
                          {kpi.value}
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          {kpi.sub}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* 3. Multi-Chart Interactive Recharts BI Suite */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chart 1 (5 cols): Monthly Renewal Pipeline AreaChart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="lg:col-span-5"
              >
                <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900 h-full flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span>
                          {isAr
                            ? "التدفق الشهري للتجديدات"
                            : "Monthly Renewal Pipeline"}
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPipelineMode("EXPOSURE")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            pipelineMode === "EXPOSURE"
                              ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-xs"
                              : "text-slate-500"
                          }`}
                        >
                          {isAr ? "التكلفة ($)" : "Cost ($)"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPipelineMode("VOLUME")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            pipelineMode === "VOLUME"
                              ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-xs"
                              : "text-slate-500"
                          }`}
                        >
                          {isAr ? "العدد" : "Volume"}
                        </button>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "توزيع الاستحقاقات الشهرية من واقع تواريخ العقود المسجلة."
                        : "Chronological projection of contract expirations by month."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="h-60 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={monthlyPipelineData}
                          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="monthlyGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#4f46e5"
                                stopOpacity={0.45}
                              />
                              <stop
                                offset="95%"
                                stopColor="#4f46e5"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              color: "#fff",
                              borderRadius: "12px",
                              border: "1px solid #334155",
                              fontSize: "12px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey={
                              pipelineMode === "EXPOSURE" ? "exposure" : "count"
                            }
                            stroke="#4f46e5"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#monthlyGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Chart 2 (4 cols): Category Exposure BarChart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="lg:col-span-4"
              >
                <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900 h-full flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        {isAr
                          ? "التكاليف حسب التصنيف"
                          : "Category Exposure ($)"}
                      </span>
                      <span
                        className="text-xs font-bold text-blue-600"
                        dir="ltr"
                      >
                        ${totalExposure.toLocaleString()}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "مقارنة القيمة المالية التراكمية لكل تصنيف."
                        : "Cumulative renewal value across document types."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="h-60 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categoryStats}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              color: "#fff",
                              borderRadius: "12px",
                              border: "none",
                              fontSize: "12px",
                            }}
                          />
                          <Bar
                            dataKey="exposure"
                            fill="#2563eb"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Chart 3 (3 cols): Readiness Score Distribution Donut */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.35 }}
                className="lg:col-span-3"
              >
                <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900 h-full flex flex-col justify-between">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-emerald-600" />
                      {isAr ? "توزيع الجاهزية" : "Readiness Tiers"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "تقسيم العقود حسب نقاط الجاهزية."
                        : "Portfolio breakdown by score tier."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="h-44 w-full relative" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={readinessPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={68}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {readinessPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              color: "#fff",
                              borderRadius: "10px",
                              border: "none",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className="text-xl font-extrabold text-slate-900 dark:text-white"
                          dir="ltr"
                        >
                          {avgReadiness}%
                        </span>
                        <span className="text-[10px] uppercase text-slate-400">
                          {isAr ? "المتوسط" : "Avg Score"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                          {isAr ? "حرج (<50)" : "Critical (<50)"}
                        </span>
                        <span className="font-bold">{criticalScoreCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                          {isAr ? "متوسط (50-79)" : "Moderate (50-79)"}
                        </span>
                        <span className="font-bold">{moderateScoreCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          {isAr ? "ممتاز (80+)" : "Optimal (80+)"}
                        </span>
                        <span className="font-bold">{optimalScoreCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* 4. Interactive Visual Renewal Timeline Cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
            >
              <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <CalendarRange className="h-5 w-5 text-blue-600" />
                      {isAr
                        ? "التقويم الزمني التفاعلي للاستحقاقات"
                        : "Interactive Expiration Timeline & Calendar Matrix"}
                    </CardTitle>
                    <CardDescription>
                      {isAr
                        ? "بطاقات زمنية مرتبة حسب أقرب موعد انتهاء مع إمكانية التصفية الفورية."
                        : "Chronological timeline cards sorted by upcoming renewal urgency."}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {["ALL", "Contract", "License", "Insurance", "Legal"].map(
                      (cat) => (
                        <Button
                          key={cat}
                          size="sm"
                          variant={
                            selectedCategory === cat ? "default" : "outline"
                          }
                          onClick={() => setSelectedCategory(cat)}
                          className="rounded-xl text-xs h-8"
                        >
                          {cat === "ALL" ? (isAr ? "الكل" : "All Types") : cat}
                        </Button>
                      )
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Visual Timeline Grid (Top 6 Urgent Cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocs.slice(0, 6).map((doc, idx) => {
                      const days = calculateDaysRemaining(doc.dueDate);
                      const score = calculateReadinessScore(doc);
                      const isOverdue = days < 0;
                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.05 }}
                          whileHover={{ y: -3 }}
                          className={`p-4 rounded-2xl border transition-all ${
                            isOverdue
                              ? "bg-red-50/40 border-red-200/90"
                              : days <= 30
                              ? "bg-amber-50/40 border-amber-200/90"
                              : "bg-slate-50/70 border-slate-200/90"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="truncate">
                              <div className="font-bold text-sm text-slate-900 truncate">
                                {doc.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {doc.type} •{" "}
                                <span className="font-semibold" dir="ltr">
                                  ${Number(doc.cost || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant={isOverdue ? "destructive" : "secondary"}
                              className="text-[10px] shrink-0"
                            >
                              {isOverdue
                                ? `${Math.abs(days)}d overdue`
                                : `${days}d left`}
                            </Badge>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                            <span
                              className="font-mono text-slate-600 font-semibold"
                              dir="ltr"
                            >
                              {doc.dueDate?.split("T")[0]}
                            </span>
                            <span
                              dir="ltr"
                              className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${getScoreColor(
                                score
                              )}`}
                            >
                              {score} / 100
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Full Filtered Portfolio Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-start">
                          {isAr ? "المستند" : "Document"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "التصنيف" : "Type"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "الحالة" : "Status"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "تاريخ الاستحقاق" : "Due Date"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "التكلفة" : "Cost"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "الجاهزية" : "Readiness"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredDocs.map((doc, i) => {
                          const score = calculateReadinessScore(doc);
                          return (
                            <motion.tr
                              key={doc.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.03 }}
                              className="border-b hover:bg-blue-50/40 transition-colors"
                            >
                              <TableCell className="font-semibold">
                                {doc.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{doc.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    doc.status === "Active"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {doc.status}
                                </Badge>
                              </TableCell>
                              <TableCell dir="ltr" className="font-medium">
                                {doc.dueDate?.split("T")[0]}
                              </TableCell>
                              <TableCell dir="ltr" className="font-bold">
                                ${Number(doc.cost || 0).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <span
                                  dir="ltr"
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-bold ${getScoreColor(
                                    score
                                  )}`}
                                >
                                  {score} / 100
                                </span>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
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