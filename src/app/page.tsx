"use client";

import { useState, useEffect, useRef } from "react";
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FileText,
  Activity,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  PieChart as PieChartIcon,
  Eye,
  Sparkles,
  TrendingUp,
  Gauge,
  GitPullRequest,
  Zap,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  calculateDaysRemaining,
  calculateReadinessScore,
  getScoreColor,
} from "@/lib/renewal";
import { useTranslation } from "@/i18n/LanguageContext";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isAr = locale === "ar";

  const [documents, setDocuments] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [teamCount, setTeamCount] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<
    "ALL" | "OVERDUE" | "URGENT_30" | "HEALTHY"
  >("ALL");
  const [chartMode, setChartMode] = useState<"AREA" | "BAR">("AREA");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "Contract",
    status: "Active",
    dueDate: "",
    cost: "",
  });

  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [dispatchingWorkflow, setDispatchingWorkflow] = useState(false);
  const [workflowSuccessMsg, setWorkflowSuccessMsg] = useState("");

  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [previewValidRows, setPreviewValidRows] = useState<any[]>([]);
  const [previewErrorRows, setPreviewErrorRows] = useState<
    { rowNumber: number; raw: string; reason: string }[]
  >([]);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (status === "authenticated") {
      const delayDebounceFn = setTimeout(() => {
        fetchDocuments();
        fetchPortfolioAnalytics();
      }, 250);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [status, router, currentPage, searchTerm]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(
        `/api/documents?page=${currentPage}&limit=5&search=${encodeURIComponent(
          searchTerm
        )}`
      );
      if (res.ok) {
        const result = await res.json();
        setDocuments(result.data || []);
        setTotalDocs(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        if (result.teamCount) setTeamCount(result.teamCount);
      }
    } catch (error) {
      console.error("Failed to fetch paginated documents:", error);
    }
  };

  const fetchPortfolioAnalytics = async () => {
    try {
      const res = await fetch("/api/documents?page=1&limit=100");
      if (res.ok) {
        const result = await res.json();
        setAllDocuments(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio analytics:", error);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      name: "",
      type: "Contract",
      status: "Active",
      dueDate: "",
      cost: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doc: any) => {
    setIsEditMode(true);
    setEditingId(doc.id);
    setFormData({
      name: doc.name,
      type: doc.type,
      status: doc.status,
      dueDate: new Date(doc.dueDate).toISOString().split("T")[0],
      cost: doc.cost.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `/api/documents/${editingId}` : "/api/documents";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchDocuments();
        fetchPortfolioAnalytics();
      }
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDocuments();
        fetchPortfolioAnalytics();
      }
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  // إرسال العقد مباشرة لطابور الاعتمادات والمهام بضغطة زر واحدة
  const handleQuickDispatchToWorkflow = async (doc: any) => {
    setDispatchingWorkflow(true);
    setWorkflowSuccessMsg("");
    try {
      const days = calculateDaysRemaining(doc.dueDate);
      const priority =
        days < 0 ? "Critical" : days <= 30 ? "High" : "Medium";
      const actionTitle =
        days < 0
          ? `Urgent Escalation & Renewal Sign-Off: ${doc.name}`
          : `Renewal Commercial & Legal Review: ${doc.name}`;

      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: doc.name,
          title: actionTitle,
          assignee: session?.user?.email || "Operations Lead",
          priority,
          status: "Pending Approval",
          dueDate: new Date(doc.dueDate).toISOString().split("T")[0],
          notes: `Auto-generated via Smart Playbook • Value: $${Number(
            doc.cost || 0
          ).toLocaleString()} • Readiness: ${calculateReadinessScore(doc)}/100`,
        }),
      });

      if (res.ok) {
        setWorkflowSuccessMsg(
          isAr
            ? "تم إرسال العقد لطابور الاعتمادات وتوثيقه في السجل الأمني بنجاح!"
            : "Dispatched to Approval Queue & logged to Security Audit Trail!"
        );
        setTimeout(() => {
          setSelectedDoc(null);
          setWorkflowSuccessMsg("");
          router.push("/workflows");
        }, 900);
      }
    } catch (error) {
      console.error("Failed to dispatch workflow:", error);
    } finally {
      setDispatchingWorkflow(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      "Name,Type,Status,DueDate,Cost",
      '"Commercial Trade License",License,Active,2026-12-31,1200',
      '"Cloud Hosting SLA",Contract,Active,2026-11-15,3500',
    ].join("\n");
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "renewalguard_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      const rows = text.split("\n").filter((row) => row.trim() !== "");
      if (rows.length <= 1) {
        alert("The CSV file is empty or missing data rows.");
        return;
      }

      const valid: any[] = [];
      const errors: { rowNumber: number; raw: string; reason: string }[] = [];

      rows.slice(1).forEach((row, idx) => {
        const values = row
          .split(",")
          .map((val) => val.replace(/(^"|"$)/g, "").trim());
        const name = values[0] || "";
        const type = values[1] || "Contract";
        const rowStatus = values[2] || "Active";
        const dueDate = values[3] || "";
        const cost = Number(values[4]) || 0;

        const parsedDate = dueDate ? new Date(dueDate) : null;
        if (!name) {
          errors.push({
            rowNumber: idx + 2,
            raw: row,
            reason: "Missing document name",
          });
        } else if (!parsedDate || isNaN(parsedDate.getTime())) {
          errors.push({
            rowNumber: idx + 2,
            raw: row,
            reason: `Invalid dueDate (${dueDate || "empty"})`,
          });
        } else {
          valid.push({
            name,
            type,
            status: rowStatus,
            dueDate: parsedDate.toISOString().split("T")[0],
            cost,
          });
        }
      });

      setPreviewValidRows(valid);
      setPreviewErrorRows(errors);
      setIsImportPreviewOpen(true);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const confirmCsvImport = async () => {
    if (previewValidRows.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch("/api/documents/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: previewValidRows }),
      });

      if (res.ok) {
        setIsImportPreviewOpen(false);
        fetchDocuments();
        fetchPortfolioAnalytics();
      } else {
        alert("Failed to import records.");
      }
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split("T")[0];
    } catch {
      return dateString;
    }
  };

  // توليد خطة العمل التعاقدية الذكية (Smart Renewal Playbook) حسب حالة المستند
  const getPlaybookSteps = (doc: any) => {
    const days = calculateDaysRemaining(doc.dueDate);
    if (days < 0) {
      return [
        isAr
          ? `تصعيد فوري: المستند متأخر منذ ${Math.abs(days)} يوم — تواصل مع المورد أو الجهة المصدرة لمنع الغرامات أو إيقاف الخدمة.`
          : `Immediate Escalation: Record is ${Math.abs(days)} days overdue — contact vendor/authority to prevent service suspension.`,
        isAr
          ? `مراجعة الالتزام المالي البالغ $${Number(doc.cost || 0).toLocaleString()} واعتماد ميزانية التجديد العاجل.`
          : `Verify financial exposure of $${Number(doc.cost || 0).toLocaleString()} and request emergency sign-off.`,
        isAr
          ? "تحويل المستند فوراً إلى طابور الاعتمادات بأولوية قصوى (Critical)."
          : "Dispatch directly to Approval Queue with Critical priority.",
      ];
    }
    if (days <= 30) {
      return [
        isAr
          ? `نافذة الـ 30 يوماً الحرجة (${days} يوم متبقي): بدء التفاوض السعري ومراجعة شروط مستوى الخدمة (SLA).`
          : `30-Day Critical Window (${days}d left): Initiate commercial negotiation and SLA performance review.`,
        isAr
          ? "التأكد من عدم وجود بند تجديد تلقائي غير مرغوب فيه قبل إغلاق مهلة الإشعار."
          : "Verify auto-renewal notice clauses before notice deadline lapses.",
        isAr
          ? "إرسال طلب الاعتماد المالي للمدير المسؤول."
          : "Submit formal renewal approval request to department owner.",
      ];
    }
    return [
      isAr
        ? `الهامش الآمن (${days} يوم متبقي): جدولة مراجعة دورية قبل 60 يوماً من تاريخ الانتهاء.`
        : `Safe Buffer (${days}d left): Schedule standard pre-renewal audit 60 days prior to expiration.`,
      isAr
        ? "تحديث النسخة المرفقة ومراجعة اكتمال بيانات المورد."
        : "Maintain compliance documentation and vendor contact metadata.",
    ];
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-400">
            Loading Command Center...
          </span>
        </div>
      </div>
    );
  }

  const overdueDocs = allDocuments.filter(
    (d) => calculateDaysRemaining(d.dueDate) < 0
  );
  const due30Docs = allDocuments.filter((d) => {
    const days = calculateDaysRemaining(d.dueDate);
    return days >= 0 && days <= 30;
  });
  const due60Docs = allDocuments.filter((d) => {
    const days = calculateDaysRemaining(d.dueDate);
    return days > 30 && days <= 60;
  });
  const safeDocs = allDocuments.filter(
    (d) => calculateDaysRemaining(d.dueDate) > 60
  );

  const overdueCount = overdueDocs.length;
  const due30Count = due30Docs.length;
  const healthyCount = due60Docs.length + safeDocs.length;
  const urgentActionCount = overdueCount + due30Count;

  const totalPortfolioValue = allDocuments.reduce(
    (sum, d) => sum + (Number(d.cost) || 0),
    0
  );

  const averageReadiness =
    allDocuments.length > 0
      ? Math.round(
          allDocuments.reduce(
            (sum, d) => sum + calculateReadinessScore(d),
            0
          ) / allDocuments.length
        )
      : 100;

  const riskPieData = [
    {
      name: isAr ? "متأخر (Overdue)" : "Overdue",
      value: overdueCount,
      color: "#ef4444",
    },
    {
      name: isAr ? "حرج (≤30 يوم)" : "Due ≤30d",
      value: due30Count,
      color: "#f59e0b",
    },
    {
      name: isAr ? "آمن (>30 يوم)" : "Safe >30d",
      value: healthyCount,
      color: "#10b981",
    },
  ].filter((item) => item.value > 0);

  const categories = ["Contract", "License", "Insurance", "Legal"];
  const categoryChartData = categories.map((cat) => {
    const items = allDocuments.filter((d) => d.type === cat);
    const exposure = items.reduce((s, d) => s + (Number(d.cost) || 0), 0);
    const avgScore =
      items.length > 0
        ? Math.round(
            items.reduce((s, d) => s + calculateReadinessScore(d), 0) /
              items.length
          )
        : 100;
    return {
      category: cat,
      count: items.length,
      exposure,
      avgScore,
    };
  });

  const timelineHorizonData = [
    {
      horizon: isAr ? "متأخر" : "Overdue",
      exposure: overdueDocs.reduce((s, d) => s + (Number(d.cost) || 0), 0),
      docs: overdueCount,
    },
    {
      horizon: isAr ? "0-30 يوم" : "0-30 Days",
      exposure: due30Docs.reduce((s, d) => s + (Number(d.cost) || 0), 0),
      docs: due30Count,
    },
    {
      horizon: isAr ? "31-60 يوم" : "31-60 Days",
      exposure: due60Docs.reduce((s, d) => s + (Number(d.cost) || 0), 0),
      docs: due60Docs.length,
    },
    {
      horizon: isAr ? "+60 يوم" : "60+ Days",
      exposure: safeDocs.reduce((s, d) => s + (Number(d.cost) || 0), 0),
      docs: safeDocs.length,
    },
  ];

  const displayedDocuments = documents.filter((doc) => {
    const days = calculateDaysRemaining(doc.dueDate);
    if (quickFilter === "OVERDUE") return days < 0;
    if (quickFilter === "URGENT_30") return days <= 30;
    if (quickFilter === "HEALTHY") return days > 30;
    return true;
  });

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (averageReadiness / 100) * circumference;

  return (
    <div className="flex h-screen bg-slate-100/80 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={session?.user} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-7">
            {/* 1. Premium Animated Midnight-Navy Executive Hero Banner */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-7 lg:p-8 shadow-xl border border-slate-800"
            >
              <div className="pointer-events-none absolute -top-24 -inset-e-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 inset-s-1/3 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

              <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>
                      {isAr
                        ? "مركز القيادة الذكي • تحليلات حية ومباشرة"
                        : "Real-Time Contract Intelligence & Risk Command"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                    {t.dashboard}
                  </h1>
                  <p className="text-sm text-slate-300 max-w-2xl">
                    {t.welcome}{" "}
                    <span className="font-semibold text-white">
                      {session?.user?.name}
                    </span>
                    . {t.overview}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs"
                  >
                    <Download className="w-3.5 h-3.5 me-1.5" />
                    {isAr ? "قالب CSV" : "CSV Template"}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700"
                  >
                    <Upload className="w-4 h-4 me-2" /> {t.importCsv}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      (window.location.href = "/api/documents/export")
                    }
                    className="rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700"
                  >
                    <FileText className="w-4 h-4 me-2" /> {t.exportCsv}
                  </Button>

                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={openAddModal}
                        className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 font-semibold"
                      >
                        <Plus className="w-4 h-4 me-1.5" /> {t.addDocument}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {isEditMode ? t.editRenewal : t.addNewRenewal}
                        </DialogTitle>
                        <DialogDescription>
                          {isEditMode ? t.modalDescEdit : t.modalDescAdd}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t.docNameLabel}</Label>
                          <Input
                            id="name"
                            required
                            placeholder="e.g., Commercial License"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="type">{t.categoryTypeLabel}</Label>
                            <Select
                              value={formData.type}
                              onValueChange={(val) =>
                                setFormData({ ...formData, type: val })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="License">License</SelectItem>
                                <SelectItem value="Contract">
                                  Contract
                                </SelectItem>
                                <SelectItem value="Insurance">
                                  Insurance
                                </SelectItem>
                                <SelectItem value="Legal">Legal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="status">{t.statusLabel}</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(val) =>
                                setFormData({ ...formData, status: val })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Expired">Expired</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="dueDate">{t.dueDateLabel}</Label>
                            <Input
                              id="dueDate"
                              type="date"
                              required
                              value={formData.dueDate}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  dueDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cost">{t.costLabel}</Label>
                            <Input
                              id="cost"
                              type="number"
                              required
                              placeholder="0"
                              value={formData.cost}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cost: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter className="pt-4">
                          <Button type="submit" className="w-full">
                            {isEditMode ? t.updateDoc : t.saveDoc}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </motion.div>

            {/* 2. Staggered Animated KPI Command Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  id: "ALL",
                  title: t.totalDocuments,
                  value: totalDocs,
                  sub: `${t.realTimeCount} • ${teamCount} op`,
                  icon: FileText,
                  accent: "from-blue-600 to-indigo-600",
                  textColor: "text-slate-900 dark:text-white",
                  onClick: () => setQuickFilter("ALL"),
                  active: quickFilter === "ALL",
                },
                {
                  id: "URGENT_30",
                  title: t.pendingRenewals,
                  value: urgentActionCount,
                  sub: `${overdueCount} overdue • ${due30Count} due ≤30d`,
                  icon: ShieldAlert,
                  accent: "from-red-600 to-rose-600",
                  textColor: "text-red-600",
                  onClick: () => setQuickFilter("URGENT_30"),
                  active: quickFilter === "URGENT_30",
                },
                {
                  id: "EXPOSURE",
                  title: isAr
                    ? "إجمالي الالتزامات المالية"
                    : "Total Financial Exposure",
                  value: `$${totalPortfolioValue.toLocaleString()}`,
                  sub: isAr
                    ? "اضغط للتقرير المالي التفصيلي ↗"
                    : "Open full financial report ↗",
                  icon: DollarSign,
                  accent: "from-emerald-600 to-teal-600",
                  textColor: "text-slate-900 dark:text-white",
                  onClick: () => router.push("/reports"),
                  active: false,
                },
                {
                  id: "HEALTHY",
                  title: isAr
                    ? "متوسط مؤشر الجاهزية"
                    : "Portfolio Readiness Score",
                  value: `${averageReadiness} / 100`,
                  sub: `${healthyCount} records in safe window`,
                  icon: Activity,
                  accent: "from-indigo-600 to-violet-600",
                  textColor: "text-indigo-600",
                  onClick: () => setQuickFilter("HEALTHY"),
                  active: quickFilter === "HEALTHY",
                },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
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
                      onClick={kpi.onClick}
                      className={`cursor-pointer rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all relative overflow-hidden ${
                        kpi.active
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

            {/* 3. Real Interactive Recharts & Animated Radial Gauge Suite */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="lg:col-span-5"
              >
                <Card className="rounded-2xl border-slate-200/90 shadow-sm h-full flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span>
                          {chartMode === "AREA"
                            ? isAr
                              ? "منحنى التدفقات المالية للاستحقاقات"
                              : "Financial Exposure Horizon ($)"
                            : isAr
                            ? "التكلفة المالية حسب التصنيف"
                            : "Exposure by Contract Category"}
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setChartMode("AREA")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            chartMode === "AREA"
                              ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-xs"
                              : "text-slate-500"
                          }`}
                        >
                          {isAr ? "منحنى" : "Area"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMode("BAR")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            chartMode === "BAR"
                              ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-xs"
                              : "text-slate-500"
                          }`}
                        >
                          {isAr ? "أعمدة" : "Bars"}
                        </button>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "مخطط تفاعلي حي من واقع عقودك الفعلية في PostgreSQL."
                        : "Interactive visualization computed from live database records."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="h-60 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartMode === "AREA" ? (
                          <AreaChart
                            data={timelineHorizonData}
                            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="exposureGrad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#2563eb"
                                  stopOpacity={0.45}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#2563eb"
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
                              dataKey="horizon"
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
                              dataKey="exposure"
                              stroke="#2563eb"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#exposureGrad)"
                            />
                          </AreaChart>
                        ) : (
                          <BarChart
                            data={categoryChartData}
                            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
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
                                border: "1px solid #334155",
                                fontSize: "12px",
                              }}
                            />
                            <Bar
                              dataKey="exposure"
                              fill="#3b82f6"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="lg:col-span-4"
              >
                <Card className="rounded-2xl border-slate-200/90 shadow-sm h-full flex flex-col justify-between">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4 text-rose-600" />
                        {isAr
                          ? "توزيع المخاطر التعاقدية"
                          : "Risk Segmentation Donut"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {allDocuments.length} {isAr ? "عقد" : "Docs"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "اضغط على الفلتر بالأسفل لعزل العقود الحرجة."
                        : "Interactive segmentation of overdue vs upcoming."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="h-44 w-full relative" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {riskPieData.map((entry, index) => (
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
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                          {allDocuments.length}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">
                          {isAr ? "إجمالي" : "Total"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickFilter("OVERDUE")}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          quickFilter === "OVERDUE"
                            ? "bg-red-50 border-red-400 ring-1 ring-red-400"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-[11px] font-bold text-red-600">
                          {isAr ? "متأخر" : "Overdue"}
                        </div>
                        <div className="text-lg font-extrabold">
                          {overdueCount}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQuickFilter("URGENT_30")}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          quickFilter === "URGENT_30"
                            ? "bg-amber-50 border-amber-400 ring-1 ring-amber-400"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-[11px] font-bold text-amber-600">
                          {isAr ? "≤30 يوم" : "≤30 Days"}
                        </div>
                        <div className="text-lg font-extrabold">
                          {due30Count}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQuickFilter("HEALTHY")}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          quickFilter === "HEALTHY"
                            ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-[11px] font-bold text-emerald-600">
                          {isAr ? "آمن" : "Safe"}
                        </div>
                        <div className="text-lg font-extrabold">
                          {healthyCount}
                        </div>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.35 }}
                className="lg:col-span-3"
              >
                <Card className="rounded-2xl border-slate-800 bg-slate-950 text-white shadow-lg h-full flex flex-col justify-between">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                      <Gauge className="h-4 w-4 text-emerald-400" />
                      {isAr
                        ? "عداد الجاهزية التعاقدية"
                        : "Live Readiness Gauge"}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {isAr
                        ? "مؤشر مركب من 0 إلى 100."
                        : "Composite health index (0–100)."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex flex-col items-center justify-center py-2">
                    <div className="relative h-36 w-36 flex items-center justify-center">
                      <svg
                        className="h-full w-full -rotate-90"
                        viewBox="0 0 140 140"
                      >
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          stroke="#1e293b"
                          strokeWidth="12"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="70"
                          cy="70"
                          r={radius}
                          stroke={
                            averageReadiness >= 75
                              ? "#10b981"
                              : averageReadiness >= 45
                              ? "#f59e0b"
                              : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          fill="transparent"
                          strokeDasharray={circumference}
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className="text-3xl font-extrabold text-white"
                          dir="ltr"
                        >
                          {averageReadiness}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          / 100 PTS
                        </span>
                      </div>
                    </div>

                    <div className="w-full mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>{isAr ? "حالة المخاطر:" : "Risk Level:"}</span>
                        <span
                          className={
                            averageReadiness >= 75
                              ? "text-emerald-400 font-bold"
                              : averageReadiness >= 45
                              ? "text-amber-400 font-bold"
                              : "text-red-400 font-bold"
                          }
                        >
                          {averageReadiness >= 75
                            ? isAr
                              ? "منخفضة (Optimal)"
                              : "Optimal"
                            : averageReadiness >= 45
                            ? isAr
                              ? "متوسطة (Moderate)"
                              : "Moderate"
                            : isAr
                            ? "حرجة (Action Needed)"
                            : "Action Needed"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/workflows")}
                        className="w-full h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800 mt-1"
                      >
                        {isAr
                          ? "فتح طابور الاعتمادات والمهام ↗"
                          : "Open Workflows Queue ↗"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* CSV Import Preview Modal */}
            <Dialog
              open={isImportPreviewOpen}
              onOpenChange={setIsImportPreviewOpen}
            >
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    {isAr
                      ? "معاينة وفحص ملف الـ CSV قبل الاستيراد"
                      : "CSV Import Validation & Preview"}
                  </DialogTitle>
                  <DialogDescription>
                    {isAr
                      ? `تم العثور على (${previewValidRows.length}) صفوف صالحة و (${previewErrorRows.length}) صفوف مرفوضة.`
                      : `Validated ${previewValidRows.length} valid rows and detected ${previewErrorRows.length} invalid rows.`}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-80 overflow-y-auto py-2">
                  {previewErrorRows.length > 0 && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        {isAr
                          ? "صفوف بها أخطاء (سيتم تخطيها):"
                          : "Row-level Validation Errors (will be skipped):"}
                      </div>
                      {previewErrorRows.map((err) => (
                        <div key={err.rowNumber}>
                          Row #{err.rowNumber}: {err.reason}
                        </div>
                      ))}
                    </div>
                  )}

                  {previewValidRows.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-start">
                            {t.colDocument}
                          </TableHead>
                          <TableHead className="text-start">
                            {t.colType}
                          </TableHead>
                          <TableHead className="text-start">
                            {t.dueDateLabel}
                          </TableHead>
                          <TableHead className="text-start">
                            {t.costLabel}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewValidRows.slice(0, 8).map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-start font-medium">
                              {r.name}
                            </TableCell>
                            <TableCell className="text-start">
                              {r.type}
                            </TableCell>
                            <TableCell className="text-start" dir="ltr">
                              {r.dueDate}
                            </TableCell>
                            <TableCell className="text-start">
                              ${r.cost}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsImportPreviewOpen(false)}
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    onClick={confirmCsvImport}
                    disabled={previewValidRows.length === 0 || isImporting}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isImporting
                      ? isAr
                        ? "جاري الاستيراد..."
                        : "Importing..."
                      : isAr
                      ? `تأكيد استيراد (${previewValidRows.length}) سجل`
                      : `Confirm Import (${previewValidRows.length})`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Explainable Readiness Score + Smart Renewal Playbook Modal */}
            <Dialog
              open={!!selectedDoc}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedDoc(null);
                  setWorkflowSuccessMsg("");
                }
              }}
            >
              <DialogContent className="sm:max-w-xl">
                {selectedDoc && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between gap-2">
                        <span className="truncate">{selectedDoc.name}</span>
                        <Badge variant="outline">{selectedDoc.type}</Badge>
                      </DialogTitle>
                      <DialogDescription>
                        {isAr
                          ? "تحليل مؤشر الجاهزية التعاقدية وخطة العمل الاستباقية للتجديد."
                          : "Explainable readiness breakdown & AI-assisted renewal negotiation playbook."}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-sm">
                      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950 text-white border border-slate-800">
                        <div>
                          <div className="text-[11px] text-slate-400">
                            {t.dueDateLabel}
                          </div>
                          <div className="font-bold mt-0.5" dir="ltr">
                            {formatDate(selectedDoc.dueDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">
                            {t.costLabel}
                          </div>
                          <div
                            className="font-bold mt-0.5 text-emerald-400"
                            dir="ltr"
                          >
                            ${Number(selectedDoc.cost || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">
                            {t.colReadiness}
                          </div>
                          <div
                            className="font-extrabold mt-0.5 text-blue-400"
                            dir="ltr"
                          >
                            {calculateReadinessScore(selectedDoc)} / 100
                          </div>
                        </div>
                      </div>

                      {/* Factor Breakdown */}
                      <div className="space-y-2">
                        <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                          {isAr
                            ? "تفسير معادلة مؤشر الجاهزية (Readiness Formula)"
                            : "Explainable Readiness Score Factors"}
                        </div>
                        <div className="space-y-2 text-xs border rounded-2xl p-3.5 bg-slate-50/70">
                          <div className="flex justify-between">
                            <span>
                              1.{" "}
                              {isAr
                                ? "عامل حالة السريان (Active = 40 نقطة)"
                                : "Lifecycle Status Factor (Active = 40 pts)"}
                            </span>
                            <span className="font-bold text-blue-600" dir="ltr">
                              {selectedDoc.status === "Active"
                                ? "+40 / 40"
                                : selectedDoc.status === "Pending"
                                ? "+20 / 40"
                                : "+0 / 40"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>
                              2.{" "}
                              {isAr
                                ? "عامل الهامش الزمني قبل الانتهاء (حتى 40 نقطة)"
                                : "Time Buffer Before Expiration (up to 40 pts)"}
                            </span>
                            <span className="font-bold text-blue-600" dir="ltr">
                              {calculateDaysRemaining(selectedDoc.dueDate) > 60
                                ? "+40 / 40"
                                : calculateDaysRemaining(selectedDoc.dueDate) >
                                  30
                                ? "+30 / 40"
                                : calculateDaysRemaining(selectedDoc.dueDate) >
                                  0
                                ? "+15 / 40"
                                : "+0 / 40"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>
                              3.{" "}
                              {isAr
                                ? "اكتمال البيانات الأساسية والتصنيف (20 نقطة)"
                                : "Metadata Completeness Factor (20 pts)"}
                            </span>
                            <span className="font-bold text-blue-600" dir="ltr">
                              +20 / 20
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Smart Renewal Playbook */}
                      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                          <Zap className="w-4 h-4 text-indigo-600" />
                          <span>
                            {isAr
                              ? "خطة العمل والتفاوض الذكية (Smart Renewal Playbook)"
                              : "Smart Renewal Action Playbook (90/60/30 Protocol)"}
                          </span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {getPlaybookSteps(selectedDoc).map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {workflowSuccessMsg && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{workflowSuccessMsg}</span>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          handleQuickDispatchToWorkflow(selectedDoc)
                        }
                        disabled={dispatchingWorkflow}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex-1"
                      >
                        <GitPullRequest className="w-4 h-4 me-1.5" />
                        {dispatchingWorkflow
                          ? isAr
                            ? "جاري الإرسال..."
                            : "Dispatching..."
                          : isAr
                          ? "إرسال لطابور الاعتمادات والمهام"
                          : "Send to Approval Workflow"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const doc = selectedDoc;
                          setSelectedDoc(null);
                          openEditModal(doc);
                        }}
                        className="rounded-xl"
                      >
                        <Pencil className="w-4 h-4 me-1.5" />
                        {t.edit}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* 4. Animated Contract & License Registry Table */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
            >
              <Card className="rounded-2xl border-slate-200/90 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold">
                        {t.recentRenewals}
                      </CardTitle>
                      {quickFilter !== "ALL" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickFilter("ALL")}
                          className="h-7 px-2.5 text-xs text-blue-600 rounded-xl"
                        >
                          {isAr ? "إلغاء التصفية ✕" : "Reset Filter ✕"}
                        </Button>
                      )}
                    </div>
                    <CardDescription>{t.trackDeadlines}</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute inset-s-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t.searchPlaceholder}
                      className="ps-9 rounded-xl bg-slate-50/80 dark:bg-zinc-900"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-start">
                          {t.colDocument}
                        </TableHead>
                        <TableHead className="text-start">
                          {t.colType}
                        </TableHead>
                        <TableHead className="text-start">
                          {t.colStatus}
                        </TableHead>
                        <TableHead className="text-start">
                          {t.colTimeline}
                        </TableHead>
                        <TableHead className="text-start">
                          {t.costLabel}
                        </TableHead>
                        <TableHead className="text-start">
                          {t.colReadiness}
                        </TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {displayedDocuments.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center text-muted-foreground py-10"
                            >
                              {t.noDocsFound}
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayedDocuments.map((doc, i) => {
                            const daysLeft = calculateDaysRemaining(
                              doc.dueDate
                            );
                            const score = calculateReadinessScore(doc);

                            return (
                              <motion.tr
                                key={doc.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25, delay: i * 0.04 }}
                                className="border-b hover:bg-blue-50/40 dark:hover:bg-zinc-900/50 transition-colors"
                              >
                                <TableCell className="font-semibold text-start">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDoc(doc)}
                                    className="hover:text-blue-600 hover:underline text-start"
                                  >
                                    {doc.name}
                                  </button>
                                </TableCell>
                                <TableCell className="text-start">
                                  <Badge
                                    variant="outline"
                                    className="font-medium rounded-lg"
                                  >
                                    {doc.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-start">
                                  <Badge
                                    variant={
                                      doc.status === "Active"
                                        ? "default"
                                        : doc.status === "Pending"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                  >
                                    {doc.status}
                                  </Badge>
                                </TableCell>

                                <TableCell className="text-start">
                                  <div className="flex flex-col">
                                    <span
                                      className="text-sm font-semibold"
                                      dir="ltr"
                                    >
                                      {formatDate(doc.dueDate)}
                                    </span>
                                    <span
                                      className={`text-xs font-medium mt-0.5 ${
                                        daysLeft < 0
                                          ? "text-red-600"
                                          : daysLeft <= 30
                                          ? "text-amber-600"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {daysLeft < 0
                                        ? `${t.overdueBy} ${Math.abs(
                                            daysLeft
                                          )} ${t.days}`
                                        : `${daysLeft} ${t.daysLeft}`}
                                    </span>
                                  </div>
                                </TableCell>

                                <TableCell
                                  className="text-start font-bold"
                                  dir="ltr"
                                >
                                  ${Number(doc.cost || 0).toLocaleString()}
                                </TableCell>

                                <TableCell className="text-start">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDoc(doc)}
                                      dir="ltr"
                                      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold transition-transform hover:scale-105 ${getScoreColor(
                                        score
                                      )}`}
                                    >
                                      {score} / 100
                                    </button>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                      onClick={() => setSelectedDoc(doc)}
                                      title="Smart Playbook & Readiness Breakdown"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => openEditModal(doc)}
                                          className="cursor-pointer"
                                        >
                                          <Pencil className="me-2 h-4 w-4" />{" "}
                                          {t.edit}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(doc.id)}
                                          className="cursor-pointer text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="me-2 h-4 w-4" />{" "}
                                          {t.delete}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            );
                          })
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between pt-6 border-t mt-4">
                    <p className="text-sm text-gray-500">
                      {t.showing} {(currentPage - 1) * 5 + 1} {t.to}{" "}
                      {Math.min(currentPage * 5, totalDocs)} {t.of} {totalDocs}{" "}
                      {t.entries}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 me-1" /> {t.previous}
                      </Button>
                      <span className="text-sm font-medium px-2">
                        {t.page} {currentPage} / {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={
                          currentPage === totalPages || totalPages === 0
                        }
                      >
                        {t.next} <ChevronRight className="h-4 w-4 ms-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}