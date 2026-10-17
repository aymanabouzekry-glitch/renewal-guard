"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  GitPullRequest,
  ShieldCheck,
  Trash2,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  ListChecks,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export default function WorkflowsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    documentName: "",
    title: "",
    assignee: "",
    priority: "High",
    dueDate: "",
    notes: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (status === "authenticated") {
      fetchTasks();
      fetchDocsList();
    }
  }, [status, router]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/workflows");
      if (res.ok) {
        const result = await res.json();
        setTasks(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  const fetchDocsList = async () => {
    try {
      const res = await fetch("/api/documents?page=1&limit=50");
      if (res.ok) {
        const result = await res.json();
        setDocuments(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignee:
            formData.assignee || session?.user?.email || "Operations Lead",
          status: "Pending Approval",
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          documentName: "",
          title: "",
          assignee: "",
          priority: "High",
          dueDate: "",
          notes: "",
        });
        fetchTasks();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleDecision = async (
    id: string,
    decision: "Approved" | "Rejected",
    nextStatus: string
  ) => {
    try {
      const res = await fetch("/api/workflows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          approvalDecision: decision,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to record decision:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-400">
            Loading Workflows Engine...
          </span>
        </div>
      </div>
    );
  }

  const pendingApprovals = tasks.filter(
    (t) => t.approvalDecision === "Pending"
  ).length;
  const approvedCount = tasks.filter(
    (t) => t.approvalDecision === "Approved"
  ).length;
  const rejectedCount = tasks.filter(
    (t) => t.approvalDecision === "Rejected"
  ).length;

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.approvalDecision === statusFilter;
  });

  const uniqueDocNames = Array.from(
    new Set(documents.map((d) => String(d.name || "").trim()).filter(Boolean))
  );

  const decisionPieData = [
    {
      name: isAr ? "بانتظار الاعتماد" : "Pending",
      value: pendingApprovals,
      color: "#f59e0b",
    },
    {
      name: isAr ? "معتمد للتجديد" : "Approved",
      value: approvedCount,
      color: "#10b981",
    },
    {
      name: isAr ? "مرفوض / منتهي" : "Rejected",
      value: rejectedCount,
      color: "#ef4444",
    },
  ].filter((d) => d.value > 0);

  const priorityBarData = ["Critical", "High", "Medium"].map((prio) => ({
    priority: prio,
    count: tasks.filter((t) => t.priority === prio).length,
  }));

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
              <div className="pointer-events-none absolute -top-24 -inset-e-24 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 inset-s-1/3 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

              <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>
                      {isAr
                        ? "محرك سير العمل والاعتمادات الإدارية"
                        : "Enterprise Renewal Workflows & Approval Engine"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                    {isAr
                      ? "المهام التعاقدية وطلبات الاعتماد"
                      : "Tasks, Checklists & Approval Queue"}
                  </h1>
                  <p className="text-sm text-slate-300 max-w-2xl">
                    {isAr
                      ? "تعيين مسؤوليات التجديد، مراجعة العقود قبل الانتهاء، وتوثيق قرارات الاعتماد أو الإنهاء في سجل المراقبة."
                      : "Assign renewal preparation tasks, review expiring contracts, and record auditable sign-off decisions."}
                  </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 font-semibold">
                      <Plus className="w-4 h-4 me-1.5" />
                      {isAr
                        ? "إنشاء مهمة / طلب اعتماد"
                        : "New Renewal Workflow"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {isAr
                          ? "إنشاء مهمة تحضير وتجديد عقد"
                          : "Create Renewal Preparation Workflow"}
                      </DialogTitle>
                      <DialogDescription>
                        {isAr
                          ? "اربط المهمة بمستند حالي وحدد المسؤول وموعد المراجعة."
                          : "Link this workflow to a contract record and assign an owner."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4 pt-3">
                      <div className="space-y-2">
                        <Label>
                          {isAr
                            ? "عنوان المهمة أو الإجراء"
                            : "Workflow Task Title"}
                        </Label>
                        <Input
                          required
                          placeholder="e.g., Review SLA terms & approve budget"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {isAr
                            ? "المستند أو العقد المرتبط"
                            : "Target Contract / Document"}
                        </Label>
                        <Select
                          value={formData.documentName}
                          onValueChange={(val) =>
                            setFormData({ ...formData, documentName: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isAr
                                  ? "اختر من عقودك المسجلة..."
                                  : "Select existing document..."
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueDocNames.map((name, idx) => (
                              <SelectItem key={`doc-opt-${idx}`} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                            <SelectItem value="General Enterprise Contract">
                              General Enterprise Contract
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>
                            {isAr ? "المسؤول (Owner)" : "Assigned Owner"}
                          </Label>
                          <Input
                            placeholder={
                              session?.user?.email || "owner@company.com"
                            }
                            value={formData.assignee}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                assignee: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{isAr ? "الأولوية" : "Priority"}</Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(val) =>
                              setFormData({ ...formData, priority: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Critical">Critical</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {isAr ? "تاريخ استحقاق المراجعة" : "Review Deadline"}
                        </Label>
                        <Input
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
                        <Label>
                          {isAr ? "ملاحظات التحضير" : "Preparation Notes"}
                        </Label>
                        <Input
                          placeholder="Optional vendor negotiation notes..."
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                        />
                      </div>

                      <DialogFooter className="pt-3">
                        <Button type="submit" className="w-full">
                          {isAr
                            ? "إرسال للاعتماد والتنفيذ"
                            : "Submit to Approval Queue"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>

            {/* 2. Staggered Animated KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  id: "ALL",
                  title: isAr ? "إجمالي مهام سير العمل" : "Total Workflow Queue",
                  value: tasks.length,
                  sub: isAr
                    ? "مهام التحضير والمراجعة المسجلة"
                    : "Active preparation & sign-off items",
                  icon: ListChecks,
                  accent: "from-blue-600 to-indigo-600",
                  textColor: "text-slate-900 dark:text-white",
                },
                {
                  id: "Pending",
                  title: isAr
                    ? "بانتظار قرار الاعتماد"
                    : "Awaiting Approval Decision",
                  value: pendingApprovals,
                  sub: isAr
                    ? "تتطلب توقيع المدير المسؤول"
                    : "Workflows requiring sign-off",
                  icon: Clock,
                  accent: "from-amber-500 to-orange-600",
                  textColor: "text-amber-600",
                },
                {
                  id: "Approved",
                  title: isAr
                    ? "تجديدات معتمدة (Approved)"
                    : "Approved for Renewal",
                  value: approvedCount,
                  sub: isAr
                    ? "تم توثيق الموافقة في سجل المراقبة"
                    : "Verified & logged to audit trail",
                  icon: CheckCircle2,
                  accent: "from-emerald-600 to-teal-600",
                  textColor: "text-emerald-600",
                },
                {
                  id: "Rejected",
                  title: isAr
                    ? "مرفوضة / إنهاء عقد"
                    : "Terminated / Rejected",
                  value: rejectedCount,
                  sub: isAr
                    ? "عقود تقرر عدم تجديدها"
                    : "Flagged for non-renewal",
                  icon: XCircle,
                  accent: "from-red-600 to-rose-600",
                  textColor: "text-red-600",
                },
              ].map((card, idx) => {
                const Icon = card.icon;
                const active = statusFilter === card.id;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card
                      onClick={() => setStatusFilter(card.id)}
                      className={`cursor-pointer rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all relative overflow-hidden ${
                        active
                          ? "ring-2 ring-blue-600 border-blue-300"
                          : "border-slate-200/90 dark:border-zinc-800"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-full bg-linear-to-r ${card.accent}`}
                      />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {card.title}
                        </CardTitle>
                        <div
                          className={`h-10 w-10 rounded-xl bg-linear-to-br ${card.accent} flex items-center justify-center text-white shadow-md`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-3xl font-extrabold tracking-tight ${card.textColor}`}
                        >
                          {card.value}
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          {card.sub}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* 3. Interactive Recharts Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="lg:col-span-7"
              >
                <Card className="rounded-2xl border-slate-200/90 shadow-sm h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      {isAr
                        ? "توزيع المهام حسب درجة الأولوية"
                        : "Workflow Workload by Priority Level"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "تحليل حي لعبء العمل التعاقدي من قاعدة البيانات."
                        : "Real-time distribution of critical, high, and medium priority tasks."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={priorityBarData}
                          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="priority"
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
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
                            dataKey="count"
                            fill="#4f46e5"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="lg:col-span-5"
              >
                <Card className="rounded-2xl border-slate-200/90 shadow-sm h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-emerald-600" />
                      {isAr
                        ? "مؤشر قرارات الاعتماد"
                        : "Approval Decision Ratio"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "نسبة المهام المعتمدة مقابل قيد الانتظار والمرفوضة."
                        : "Breakdown of sign-off outcomes across the queue."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52 w-full relative" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={
                              decisionPieData.length > 0
                                ? decisionPieData
                                : [
                                    {
                                      name: "Empty",
                                      value: 1,
                                      color: "#cbd5e1",
                                    },
                                  ]
                            }
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {(decisionPieData.length > 0
                              ? decisionPieData
                              : [{ name: "Empty", value: 1, color: "#cbd5e1" }]
                            ).map((entry, idx) => (
                              <Cell key={`c-${idx}`} fill={entry.color} />
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
                          {tasks.length}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">
                          {isAr ? "مهمة" : "Tasks"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* 4. Animated Approval Queue Table */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
            >
              <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      {isAr
                        ? "طابور المهام والاعتمادات النشطة"
                        : "Active Renewal Tasks & Approval Queue"}
                    </CardTitle>
                    <CardDescription>
                      {isAr
                        ? "كل قرار اعتماد أو رفض يتم توثيقه تلقائياً باسم المعتمد والتوقيت في سجل المراقبة الأمنية."
                        : "Every approval or rejection is automatically recorded in the immutable security audit log."}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {["ALL", "Pending", "Approved", "Rejected"].map((f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={statusFilter === f ? "default" : "outline"}
                        onClick={() => setStatusFilter(f)}
                        className="rounded-xl text-xs"
                      >
                        {f === "ALL"
                          ? isAr
                            ? "الكل"
                            : "All"
                          : f === "Pending"
                          ? isAr
                            ? "قيد الانتظار"
                            : "Pending"
                          : f === "Approved"
                          ? isAr
                            ? "معتمد"
                            : "Approved"
                          : isAr
                          ? "مرفوض"
                          : "Rejected"}
                      </Button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-start">
                          {isAr ? "المهمة" : "Task / Action"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "المستند المرتبط" : "Document"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "المسؤول" : "Assignee"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "الأولوية" : "Priority"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "الاستحقاق" : "Due Date"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "قرار الاعتماد" : "Approval Decision"}
                        </TableHead>
                        <TableHead className="text-end">
                          {isAr ? "إجراءات الاعتماد" : "Actions"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredTasks.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center text-muted-foreground py-10"
                            >
                              {isAr
                                ? "لا توجد مهام مسجلة حالياً. اضغط على (إنشاء مهمة / طلب اعتماد) لإضافة أول سير عمل!"
                                : "No workflow tasks in queue. Click 'New Renewal Workflow' to create one."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTasks.map((task, idx) => (
                            <motion.tr
                              key={task.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.25, delay: idx * 0.04 }}
                              className="border-b hover:bg-blue-50/40 dark:hover:bg-zinc-900/50 transition-colors"
                            >
                              <TableCell className="font-semibold text-start">
                                <div>{task.title}</div>
                                {task.notes && (
                                  <div className="text-xs text-slate-500 font-normal">
                                    {task.notes}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-start font-medium">
                                {task.documentName}
                              </TableCell>
                              <TableCell
                                className="text-start text-xs"
                                dir="ltr"
                              >
                                {task.assignee}
                              </TableCell>
                              <TableCell className="text-start">
                                <Badge
                                  variant={
                                    task.priority === "Critical"
                                      ? "destructive"
                                      : task.priority === "High"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {task.priority}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className="text-start text-xs font-semibold"
                                dir="ltr"
                              >
                                {task.dueDate}
                              </TableCell>
                              <TableCell className="text-start">
                                <Badge
                                  variant={
                                    task.approvalDecision === "Approved"
                                      ? "default"
                                      : task.approvalDecision === "Rejected"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {task.approvalDecision}
                                </Badge>
                                {task.approvedBy && (
                                  <div
                                    className="text-[10px] text-slate-400 mt-0.5"
                                    dir="ltr"
                                  >
                                    by {task.approvedBy}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-end">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleDecision(
                                        task.id,
                                        "Approved",
                                        "Approved & Completed"
                                      )
                                    }
                                    className="h-7 px-2.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-lg"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                                    {isAr ? "اعتماد" : "Approve"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleDecision(
                                        task.id,
                                        "Rejected",
                                        "Terminated"
                                      )
                                    }
                                    className="h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                                  >
                                    <XCircle className="w-3.5 h-3.5 me-1" />
                                    {isAr ? "رفض" : "Reject"}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="h-7 w-7 text-slate-400 hover:text-red-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
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