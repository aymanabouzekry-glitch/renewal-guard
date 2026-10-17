"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
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
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Activity,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export default function TeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { locale } = useTranslation();
  const isAr = locale === "ar";

  const [members, setMembers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Legal Reviewer",
    department: "Legal & Compliance",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (status === "authenticated") {
      fetchTeam();
    }
  }, [status, router]);

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const result = await res.json();
        setMembers(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          email: "",
          role: "Legal Reviewer",
          department: "Legal & Compliance",
        });
        fetchTeam();
      }
    } catch (error) {
      console.error("Error adding team member:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-400">
            Loading Team & RBAC Governance...
          </span>
        </div>
      </div>
    );
  }

  const totalActions = members.reduce(
    (sum, m) => sum + (Number(m.auditCount) || 0),
    0
  );
  const adminCount = members.filter((m) =>
    String(m.role).includes("Admin")
  ).length;
  const reviewerCount = members.filter(
    (m) => !String(m.role).includes("Admin")
  ).length;

  const filteredMembers = members.filter((m) => {
    if (roleFilter === "ALL") return true;
    return m.role === roleFilter;
  });

  const roleColors: Record<string, string> = {
    "System Admin": "#2563eb",
    "Legal Reviewer": "#8b5cf6",
    "Finance Approver": "#10b981",
    "Compliance Auditor": "#f59e0b",
    "Operations Lead": "#06b6d4",
  };

  const roleCountsMap: Record<string, number> = {};
  members.forEach((m) => {
    roleCountsMap[m.role] = (roleCountsMap[m.role] || 0) + 1;
  });

  const rolePieData = Object.entries(roleCountsMap).map(([name, value]) => ({
    name,
    value,
    color: roleColors[name] || "#3b82f6",
  }));

  return (
    <div className="flex h-screen bg-slate-100/80 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={session?.user} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-7">
            {/* 1. Midnight-Navy Animated Hero */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-7 lg:p-8 shadow-xl border border-slate-800"
            >
              <div className="pointer-events-none absolute -top-24 -inset-e-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 inset-s-1/3 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />

              <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>
                      {isAr
                        ? "إدارة الصلاحيات والأدوار الرقابية (RBAC)"
                        : "Enterprise Role-Based Access Control (RBAC)"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                    {isAr
                      ? "فريق العمليات ومصفوفة الصلاحيات"
                      : "Team Directory & Access Governance"}
                  </h1>
                  <p className="text-sm text-slate-300 max-w-2xl">
                    {isAr
                      ? "إدارة المشغلين والمراجعين القانونيين والماليين، ومراقبة نشاط كل عضو في سجل التدقيق الأمني."
                      : "Provision workspace operators, assign legal and financial approval roles, and audit operator activity."}
                  </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 font-semibold">
                      <UserPlus className="w-4 h-4 me-2" />
                      {isAr ? "إضافة عضو للفريق" : "Provision Team Member"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {isAr
                          ? "إضافة عضو جديد وتحديد صلاحياته"
                          : "Provision Workspace Operator"}
                      </DialogTitle>
                      <DialogDescription>
                        {isAr
                          ? "سيتم تسجيل العضو وصلاحياته فوراً في سجل المراقبة الأمنية."
                          : "Assign an enterprise RBAC role and department."}
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={handleInviteMember}
                      className="space-y-4 pt-3"
                    >
                      <div className="space-y-2">
                        <Label>{isAr ? "الاسم الكامل" : "Full Name"}</Label>
                        <Input
                          required
                          placeholder="e.g., Sarah Al-Mansour"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {isAr
                            ? "البريد الإلكتروني المؤسسي"
                            : "Corporate Email"}
                        </Label>
                        <Input
                          type="email"
                          required
                          dir="ltr"
                          placeholder="sarah@company.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>
                            {isAr ? "الدور الرقابي (Role)" : "RBAC Role"}
                          </Label>
                          <Select
                            value={formData.role}
                            onValueChange={(val) =>
                              setFormData({ ...formData, role: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="System Admin">
                                System Admin
                              </SelectItem>
                              <SelectItem value="Legal Reviewer">
                                Legal Reviewer
                              </SelectItem>
                              <SelectItem value="Finance Approver">
                                Finance Approver
                              </SelectItem>
                              <SelectItem value="Compliance Auditor">
                                Compliance Auditor
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{isAr ? "الإدارة / القسم" : "Department"}</Label>
                          <Select
                            value={formData.department}
                            onValueChange={(val) =>
                              setFormData({ ...formData, department: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Legal & Compliance">
                                Legal & Compliance
                              </SelectItem>
                              <SelectItem value="Finance & Procurement">
                                Finance & Procurement
                              </SelectItem>
                              <SelectItem value="IT & Cloud Ops">
                                IT & Cloud Ops
                              </SelectItem>
                              <SelectItem value="Executive Operations">
                                Executive Operations
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <DialogFooter className="pt-3">
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="w-full"
                        >
                          {submitting
                            ? isAr
                              ? "جاري التفعيل..."
                              : "Provisioning..."
                            : isAr
                            ? "تفعيل الصلاحية وتوثيق السجل"
                            : "Activate Role & Log Audit"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>

            {/* 2. Staggered KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  id: "total",
                  title: isAr ? "إجمالي أعضاء الفريق" : "Active Operators",
                  value: members.length,
                  sub: isAr
                    ? "مشغلين موثقين في مساحة العمل"
                    : "Verified workspace operators",
                  icon: Users,
                  accent: "from-blue-600 to-indigo-600",
                },
                {
                  id: "admins",
                  title: isAr
                    ? "مديرو النظام (System Admins)"
                    : "System Administrators",
                  value: adminCount,
                  sub: isAr
                    ? "صلاحيات كاملة لإدارة الحوكمة"
                    : "Full governance & security privileges",
                  icon: KeyRound,
                  accent: "from-indigo-600 to-violet-600",
                },
                {
                  id: "reviewers",
                  title: isAr
                    ? "المراجعون والمعتمدون"
                    : "Legal & Finance Reviewers",
                  value: reviewerCount,
                  sub: isAr
                    ? "مسؤولون عن مراجعة واعتماد العقود"
                    : "Assigned to workflow sign-offs",
                  icon: ShieldCheck,
                  accent: "from-emerald-600 to-teal-600",
                },
                {
                  id: "actions",
                  title: isAr
                    ? "العمليات الموثقة أمنياً"
                    : "Audited Operator Actions",
                  value: totalActions,
                  sub: isAr
                    ? "إجمالي الحركات المسجلة للفريق"
                    : "Logged in immutable audit trail",
                  icon: Activity,
                  accent: "from-amber-500 to-orange-600",
                },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                  >
                    <Card className="rounded-2xl border-slate-200/90 shadow-sm hover:shadow-xl transition-all bg-white dark:bg-zinc-900 overflow-hidden">
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
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
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

            {/* 3. Recharts Team Telemetry Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="lg:col-span-7"
              >
                <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900 h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      {isAr
                        ? "مؤشر نشاط المشغلين في السجل الأمني"
                        : "Operator Audit Activity & Assigned Workflows"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "مقارنة حية لعدد العمليات الموثقة والمهام المسندة لكل عضو."
                        : "Live comparison of verified audit events and workflow tasks per operator."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={members}
                          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="name"
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
                              borderRadius: "12px",
                              border: "none",
                              fontSize: "12px",
                            }}
                          />
                          <Bar
                            dataKey="auditCount"
                            name="Audit Events"
                            fill="#2563eb"
                            radius={[8, 8, 0, 0]}
                          />
                          <Bar
                            dataKey="tasksCount"
                            name="Assigned Tasks"
                            fill="#10b981"
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
                <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900 h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-indigo-600" />
                      {isAr
                        ? "توزيع الأدوار الرقابية (RBAC)"
                        : "RBAC Role Segmentation"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isAr
                        ? "توزيع الصلاحيات الإدارية والقانونية والمالية."
                        : "Distribution of access control tiers across the organization."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52 w-full relative" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={rolePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {rolePieData.map((entry, idx) => (
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
                          {members.length}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">
                          {isAr ? "عضو" : "Members"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* 4. Team Directory & RBAC Matrix Table */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
            >
              <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                      {isAr
                        ? "سجل المشغلين ومصفوفة الصلاحيات"
                        : "Enterprise Operator Directory & Access Matrix"}
                    </CardTitle>
                    <CardDescription>
                      {isAr
                        ? "قائمة حية لجميع أعضاء الفريق المسجلين وعدد المهام والعمليات الموثقة لكل منهم."
                        : "Verified directory of workspace operators with real-time audit and workflow telemetry."}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      "ALL",
                      "System Admin",
                      "Legal Reviewer",
                      "Finance Approver",
                    ].map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={roleFilter === r ? "default" : "outline"}
                        onClick={() => setRoleFilter(r)}
                        className="rounded-xl text-xs h-8"
                      >
                        {r === "ALL" ? (isAr ? "الكل" : "All Roles") : r}
                      </Button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-start">
                          {isAr ? "العضو / المشغل" : "Operator"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "الدور الرقابي (RBAC)" : "Assigned Role"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "القسم" : "Department"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "المهام المسندة" : "Assigned Workflows"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "العمليات الموثقة" : "Audited Actions"}
                        </TableHead>
                        <TableHead className="text-start">
                          {isAr ? "الحالة" : "Status"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredMembers.map((m, idx) => (
                          <motion.tr
                            key={m.email || idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.04 }}
                            className="border-b hover:bg-blue-50/40 transition-colors"
                          >
                            <TableCell className="text-start">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                                  {String(m.name || "U")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                                    {m.name}
                                  </div>
                                  <div
                                    className="text-xs text-slate-500"
                                    dir="ltr"
                                  >
                                    {m.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-start">
                              <Badge
                                variant="outline"
                                className="font-semibold rounded-lg"
                              >
                                {m.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-start text-xs font-medium text-slate-600">
                              {m.department}
                            </TableCell>
                            <TableCell
                              className="text-start font-bold text-sm"
                              dir="ltr"
                            >
                              {m.tasksCount}
                            </TableCell>
                            <TableCell
                              className="text-start font-bold text-sm text-blue-600"
                              dir="ltr"
                            >
                              {m.auditCount}
                            </TableCell>
                            <TableCell className="text-start">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {m.status}
                              </span>
                            </TableCell>
                          </motion.tr>
                        ))}
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