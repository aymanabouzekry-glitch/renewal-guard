"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Globe,
  Search,
  ChevronRight,
  FileText,
  Sparkles,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n/LanguageContext";

interface TenantVault {
  documents: any[];
  workflows: any[];
  team: any[];
  audit: any[];
  settings: {
    appName: string;
    primaryColor: string;
    contactEmail: string;
    integrations: {
      storage: { provider: string; configured: boolean };
      email: { provider: string; configured: boolean };
    };
  };
}

const DEMO_INVESTOR_EMAIL = "admin@renewalguard.com";

// مطابقة حرفية صارمة لإيميل المالك الأساسي فقط
function isOwnerAccount(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const envOwner = (process.env.NEXT_PUBLIC_OWNER_EMAIL || "").trim().toLowerCase();
  return envOwner !== "" && clean === envOwner;
}

function createInitialVault(email: string, name: string): TenantVault {
  const isDemo = email.toLowerCase() === DEMO_INVESTOR_EMAIL;
  const nowIso = new Date().toISOString();

  if (isDemo) {
    return {
      documents: [
        {
          id: "demo-doc-1",
          name: "Microsoft Azure Enterprise Cloud Commit",
          type: "Contract",
          status: "Active",
          dueDate: "2026-10-29",
          cost: 28500,
          createdAt: nowIso,
        },
        {
          id: "demo-doc-2",
          name: "Salesforce Global CRM Enterprise License",
          type: "License",
          status: "Active",
          dueDate: "2026-10-05",
          cost: 14200,
          createdAt: nowIso,
        },
        {
          id: "demo-doc-3",
          name: "Cyber Liability & Data Breach Policy",
          type: "Insurance",
          status: "Active",
          dueDate: "2026-11-12",
          cost: 9800,
          createdAt: nowIso,
        },
        {
          id: "demo-doc-4",
          name: "SOC 2 Type II & ISO 27001 Attestation",
          type: "Legal",
          status: "Active",
          dueDate: "2026-12-20",
          cost: 6500,
          createdAt: nowIso,
        },
        {
          id: "demo-doc-5",
          name: "Cloudflare Enterprise WAF & DDoS Shield",
          type: "Contract",
          status: "Pending",
          dueDate: "2026-10-22",
          cost: 5500,
          createdAt: nowIso,
        },
      ],
      workflows: [
        {
          id: "demo-wf-1",
          documentName: "Salesforce Global CRM Enterprise License",
          title: "Negotiate multi-year seat discount & SLA terms",
          assignee: DEMO_INVESTOR_EMAIL,
          priority: "Critical",
          status: "Pending Approval",
          dueDate: "2026-10-18",
          notes: "Demo investor sandbox workflow item",
          approvalDecision: "Pending",
          createdAt: nowIso,
        },
        {
          id: "demo-wf-2",
          documentName: "Microsoft Azure Enterprise Cloud Commit",
          title: "Approve annual reserved instance commitment",
          assignee: "finance@demo-enterprise.com",
          priority: "High",
          status: "Approved & Completed",
          dueDate: "2026-10-25",
          notes: "Verified in isolated demo sandbox",
          approvalDecision: "Approved",
          approvedBy: DEMO_INVESTOR_EMAIL,
          createdAt: nowIso,
        },
      ],
      team: [
        {
          id: "demo-tm-1",
          name: "Executive Buyer (Demo)",
          email: DEMO_INVESTOR_EMAIL,
          role: "System Admin",
          department: "Executive Operations",
          status: "Active",
          auditCount: 4,
          tasksCount: 1,
          lastActive: nowIso,
        },
        {
          id: "demo-tm-2",
          name: "Elena Rostova",
          email: "legal@demo-enterprise.com",
          role: "Legal Reviewer",
          department: "Legal & Compliance",
          status: "Active",
          auditCount: 2,
          tasksCount: 0,
          lastActive: nowIso,
        },
        {
          id: "demo-tm-3",
          name: "Marcus Vance",
          email: "finance@demo-enterprise.com",
          role: "Finance Approver",
          department: "Finance & Procurement",
          status: "Active",
          auditCount: 3,
          tasksCount: 1,
          lastActive: nowIso,
        },
      ],
      audit: [
        {
          id: "demo-aud-1",
          actorEmail: DEMO_INVESTOR_EMAIL,
          action: "SANDBOX_SESSION_INITIALIZED",
          targetType: "Security",
          targetName: "Isolated Investor Demo Sandbox Active",
          createdAt: nowIso,
        },
        {
          id: "demo-aud-2",
          actorEmail: "finance@demo-enterprise.com",
          action: "WORKFLOW_APPROVED",
          targetType: "Workflow",
          targetName: "Microsoft Azure Enterprise Cloud Commit",
          createdAt: nowIso,
        },
      ],
      settings: {
        appName: "RenewalGuard",
        primaryColor: "#2563eb",
        contactEmail: DEMO_INVESTOR_EMAIL,
        integrations: {
          storage: { provider: "DEMO_SANDBOX_VAULT", configured: true },
          email: { provider: "DEMO_NOTIFICATION_HUB", configured: true },
        },
      },
    };
  }

  // أي حساب جديد آخر يبدأ بمساحة عمل نظيفة وفارغة تماماً (أصفار)
  return {
    documents: [],
    workflows: [],
    team: [
      {
        id: "tenant-admin-1",
        name: name || email.split("@")[0],
        email,
        role: "System Admin",
        department: "Executive Operations",
        status: "Active",
        auditCount: 1,
        tasksCount: 0,
        lastActive: nowIso,
      },
    ],
    audit: [
      {
        id: `aud-${Date.now()}`,
        actorEmail: email,
        action: "TENANT_WORKSPACE_PROVISIONED",
        targetType: "Workspace",
        targetName: `Isolated Tenant Vault (${email})`,
        createdAt: nowIso,
      },
    ],
    settings: {
      appName: "RenewalGuard",
      primaryColor: "#2563eb",
      contactEmail: email,
      integrations: {
        storage: { provider: "ISOLATED_TENANT_VAULT", configured: false },
        email: { provider: "IN_APP_ALERT_ENGINE", configured: false },
      },
    },
  };
}

function getTenantVault(email: string, name: string): TenantVault {
  const key = `rg_isolated_vault_v2_${email.toLowerCase()}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Vault read error:", e);
  }
  const initial = createInitialVault(email, name);
  try {
    localStorage.setItem(key, JSON.stringify(initial));
  } catch (e) {
    console.error("Vault write error:", e);
  }
  return initial;
}

function saveTenantVault(email: string, vault: TenantVault) {
  const key = `rg_isolated_vault_v2_${email.toLowerCase()}`;
  try {
    localStorage.setItem(key, JSON.stringify(vault));
  } catch (e) {
    console.error("Vault save error:", e);
  }
}

function jsonResponse(payload: any, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function installGlobalTenantInterceptor(
  email?: string | null,
  name?: string | null
) {
  if (typeof window === "undefined") return;

  const w = window as any;
  if (!w.__rgOriginalFetch) {
    w.__rgOriginalFetch = window.fetch.bind(window);
  }

  if (email && email.trim()) {
    const clean = email.trim().toLowerCase();
    w.__rgActiveEmail = clean;
    localStorage.setItem("rg_active_user_email", clean);
  }
  if (name && name.trim()) {
    w.__rgActiveName = name.trim();
    localStorage.setItem("rg_active_user_name", name.trim());
  }

  // تحديث دالة fetch دائماً لضمان تطبيق أحدث قواعد العزل
  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    if (!rawUrl.includes("/api/") || rawUrl.includes("/api/auth")) {
      return w.__rgOriginalFetch(input, init);
    }

    const activeEmail: string = (
      w.__rgActiveEmail ||
      localStorage.getItem("rg_active_user_email") ||
      "guest@isolated.local"
    )
      .trim()
      .toLowerCase();

    const activeName: string =
      w.__rgActiveName ||
      localStorage.getItem("rg_active_user_name") ||
      activeEmail.split("@")[0];

    // فقط حساب المالك الحرفي يمر لقاعدة البيانات الأصلية
    if (isOwnerAccount(activeEmail)) {
      return w.__rgOriginalFetch(input, init);
    }

    const urlObj = new URL(rawUrl, window.location.origin);
    const path = urlObj.pathname;
    const method = (init?.method || "GET").toUpperCase();
    const vault = getTenantVault(activeEmail, activeName);

    const parseBody = () => {
      try {
        return init?.body ? JSON.parse(String(init.body)) : {};
      } catch {
        return {};
      }
    };

    // 1. عزل العقود والمستندات (/api/documents)
    if (path === "/api/documents" && method === "GET") {
      const page = Number(urlObj.searchParams.get("page") || 1);
      const limit = Number(urlObj.searchParams.get("limit") || 10);
      const search = (urlObj.searchParams.get("search") || "")
        .trim()
        .toLowerCase();

      const filtered = vault.documents.filter((d) => {
        if (!search) return true;
        return (
          String(d.name || "").toLowerCase().includes(search) ||
          String(d.type || "").toLowerCase().includes(search)
        );
      });

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return jsonResponse({
        data: paginated,
        pagination: { total, page, limit, totalPages },
        teamCount: vault.team.length,
      });
    }

    if (path === "/api/documents" && method === "POST") {
      const body = parseBody();
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: body.name || "Untitled Contract",
        type: body.type || "Contract",
        status: body.status || "Active",
        dueDate: body.dueDate || new Date().toISOString().split("T")[0],
        cost: Number(body.cost) || 0,
        createdAt: new Date().toISOString(),
      };
      vault.documents.unshift(newDoc);
      vault.audit.unshift({
        id: `aud-${Date.now()}`,
        actorEmail: activeEmail,
        action: "DOCUMENT_CREATED",
        targetType: newDoc.type,
        targetName: newDoc.name,
        createdAt: new Date().toISOString(),
      });
      saveTenantVault(activeEmail, vault);
      return jsonResponse(newDoc, 201);
    }

    if (path === "/api/documents/import" && method === "POST") {
      const body = parseBody();
      const records = Array.isArray(body.records) ? body.records : [];
      records.forEach((r: any, idx: number) => {
        vault.documents.unshift({
          id: `imp-${Date.now()}-${idx}`,
          name: r.name,
          type: r.type || "Contract",
          status: r.status || "Active",
          dueDate: r.dueDate,
          cost: Number(r.cost) || 0,
          createdAt: new Date().toISOString(),
        });
      });
      vault.audit.unshift({
        id: `aud-${Date.now()}`,
        actorEmail: activeEmail,
        action: "CSV_BULK_IMPORT",
        targetType: "Document",
        targetName: `Imported ${records.length} records`,
        createdAt: new Date().toISOString(),
      });
      saveTenantVault(activeEmail, vault);
      return jsonResponse({ imported: records.length }, 201);
    }

    if (path.startsWith("/api/documents/")) {
      const docId = path.replace("/api/documents/", "");
      if (method === "PUT") {
        const body = parseBody();
        vault.documents = vault.documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                name: body.name ?? d.name,
                type: body.type ?? d.type,
                status: body.status ?? d.status,
                dueDate: body.dueDate ?? d.dueDate,
                cost: body.cost !== undefined ? Number(body.cost) : d.cost,
              }
            : d
        );
        vault.audit.unshift({
          id: `aud-${Date.now()}`,
          actorEmail: activeEmail,
          action: "DOCUMENT_UPDATED",
          targetType: "Document",
          targetName: body.name || docId,
          createdAt: new Date().toISOString(),
        });
        saveTenantVault(activeEmail, vault);
        return jsonResponse({ ok: true });
      }

      if (method === "DELETE") {
        const target = vault.documents.find((d) => d.id === docId);
        vault.documents = vault.documents.filter((d) => d.id !== docId);
        vault.audit.unshift({
          id: `aud-${Date.now()}`,
          actorEmail: activeEmail,
          action: "DOCUMENT_DELETED",
          targetType: "Document",
          targetName: target?.name || docId,
          createdAt: new Date().toISOString(),
        });
        saveTenantVault(activeEmail, vault);
        return jsonResponse({ ok: true });
      }
    }

    // 2. عزل طابور المهام والاعتمادات (/api/workflows)
    if (path === "/api/workflows") {
      if (method === "GET") {
        return jsonResponse({ data: vault.workflows });
      }
      if (method === "POST") {
        const body = parseBody();
        const newTask = {
          id: `wf-${Date.now()}`,
          documentName: body.documentName || "General Contract",
          title: body.title || "Renewal Review",
          assignee: body.assignee || activeEmail,
          priority: body.priority || "High",
          status: body.status || "Pending Approval",
          dueDate: body.dueDate || new Date().toISOString().split("T")[0],
          notes: body.notes || "",
          approvalDecision: "Pending",
          createdAt: new Date().toISOString(),
        };
        vault.workflows.unshift(newTask);
        vault.audit.unshift({
          id: `aud-${Date.now()}`,
          actorEmail: activeEmail,
          action: "WORKFLOW_CREATED",
          targetType: "Workflow",
          targetName: newTask.title,
          createdAt: new Date().toISOString(),
        });
        saveTenantVault(activeEmail, vault);
        return jsonResponse(newTask, 201);
      }
      if (method === "PATCH") {
        const body = parseBody();
        vault.workflows = vault.workflows.map((wItem) =>
          wItem.id === body.id
            ? {
                ...wItem,
                approvalDecision: body.approvalDecision,
                status: body.status,
                approvedBy: activeEmail,
              }
            : wItem
        );
        vault.audit.unshift({
          id: `aud-${Date.now()}`,
          actorEmail: activeEmail,
          action: `WORKFLOW_${String(
            body.approvalDecision || "UPDATED"
          ).toUpperCase()}`,
          targetType: "Workflow",
          targetName: `Task #${body.id}`,
          createdAt: new Date().toISOString(),
        });
        saveTenantVault(activeEmail, vault);
        return jsonResponse({ ok: true });
      }
      if (method === "DELETE") {
        const id = urlObj.searchParams.get("id");
        vault.workflows = vault.workflows.filter((wItem) => wItem.id !== id);
        saveTenantVault(activeEmail, vault);
        return jsonResponse({ ok: true });
      }
    }

    // 3. عزل الفريق والصلاحيات (/api/team)
    if (path === "/api/team") {
      if (method === "GET") {
        return jsonResponse({ data: vault.team });
      }
      if (method === "POST") {
        const body = parseBody();
        const newMember = {
          id: `tm-${Date.now()}`,
          name: body.name,
          email: body.email,
          role: body.role || "Legal Reviewer",
          department: body.department || "Legal & Compliance",
          status: "Active",
          auditCount: 1,
          tasksCount: 0,
          lastActive: new Date().toISOString(),
        };
        vault.team.push(newMember);
        vault.audit.unshift({
          id: `aud-${Date.now()}`,
          actorEmail: activeEmail,
          action: "TEAM_MEMBER_INVITED",
          targetType: newMember.role,
          targetName: `${newMember.name} (${newMember.email})`,
          createdAt: new Date().toISOString(),
        });
        saveTenantVault(activeEmail, vault);
        return jsonResponse({ member: newMember }, 201);
      }
    }

    // 4. عزل السجل الأمني والإعدادات والإشعارات
    if (path === "/api/audit" && method === "GET") {
      return jsonResponse({ data: vault.audit });
    }

    if (path === "/api/settings") {
      if (method === "GET") {
        return jsonResponse(vault.settings);
      }
      if (method === "POST") {
        const body = parseBody();
        vault.settings = {
          ...vault.settings,
          appName: body.appName || vault.settings.appName,
          primaryColor: body.primaryColor || vault.settings.primaryColor,
          contactEmail: body.contactEmail || vault.settings.contactEmail,
        };
        vault.audit.unshift({
          id: `aud-${Date.now()}`,
          actorEmail: activeEmail,
          action: "BRANDING_UPDATED",
          targetType: "Settings",
          targetName: vault.settings.appName,
          createdAt: new Date().toISOString(),
        });
        saveTenantVault(activeEmail, vault);
        return jsonResponse(vault.settings);
      }
    }

    if (path === "/api/jobs/check-renewals") {
      return jsonResponse({ checked: vault.documents.length });
    }

    if (path === "/api/notifications") {
      const alerts = vault.documents
        .filter((d) => {
          const diff =
            (new Date(d.dueDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24);
          return diff <= 30;
        })
        .map((d, i) => ({
          id: `notif-${i}`,
          title: "Renewal Action Required",
          message: `${d.name} (${d.type}) requires renewal review — Due: ${d.dueDate}`,
          createdAt: new Date().toISOString(),
        }));
      return jsonResponse({ data: alerts });
    }

    return w.__rgOriginalFetch(input, init);
  };
}

// تفعيل حارس العزل فور تحميل الملف وقبل أي طلب شبكة في الصفحة
if (typeof window !== "undefined") {
  installGlobalTenantInterceptor();
}

export default function Navbar({ user }: { user?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, toggleLanguage } = useTranslation();
  const isAr = locale === "ar";

  installGlobalTenantInterceptor(user?.email, user?.name);

  const effectiveEmail = (
    user?.email ||
    (typeof window !== "undefined"
      ? localStorage.getItem("rg_active_user_email")
      : "") ||
    ""
  )
    .trim()
    .toLowerCase();

  const effectiveName =
    user?.name ||
    (typeof window !== "undefined"
      ? localStorage.getItem("rg_active_user_name")
      : "") ||
    (effectiveEmail ? effectiveEmail.split("@")[0] : "Operator");

  const isDemoMode = effectiveEmail === DEMO_INVESTOR_EMAIL;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [quickResults, setQuickResults] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, [effectiveEmail]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/documents?page=1&limit=8&search=${encodeURIComponent(
            quickQuery
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          setQuickResults(data.data || []);
        }
      } catch (e) {
        console.error("Global search error:", e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [quickQuery, searchOpen]);

  const fetchNotifications = async () => {
    try {
      await fetch("/api/jobs/check-renewals", { method: "POST" });
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const result = await res.json();
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
          ? result.data
          : [];
        setNotifications(list);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("rg_active_user_email");
    localStorage.removeItem("rg_active_user_name");
    await signOut({ callbackUrl: "/register" });
  };

  const currentPageLabel =
    pathname === "/reports"
      ? t.documents
      : pathname === "/workflows"
      ? isAr
        ? "المهام والاعتمادات"
        : "Workflows & Approvals"
      : pathname === "/team"
      ? isAr
        ? "إدارة الفريق والصلاحيات"
        : "Team & Access Control"
      : pathname === "/settings"
      ? t.settings
      : t.dashboard;

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-medium hidden sm:inline">
          {t.workspaceHome}
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300 hidden sm:inline rtl:rotate-180" />
        <span className="font-semibold text-slate-900">{currentPageLabel}</span>

        {isDemoMode ? (
          <Badge className="ms-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px] font-bold hidden lg:inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            {isAr
              ? "بيئة معاينة معزولة للمستثمر"
              : "Isolated Investor Sandbox"}
          </Badge>
        ) : (
          <Badge className="ms-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-[10px] font-bold hidden lg:inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            {isAr ? "مساحة عمل خاصة ومعزولة" : "Private Isolated Vault"}
          </Badge>
        )}
      </div>

      <div className="flex-1 max-w-md hidden md:block">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-500 hover:border-blue-400 hover:bg-white transition-all"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            {t.globalSearch}
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-200/70 text-slate-600 rounded">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchOpen(true)}
          className="md:hidden"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 text-xs font-medium rounded-xl"
        >
          <Globe className="h-3.5 w-3.5" />
          {locale === "en" ? "العربية" : "English"}
        </Button>

        {/* Notification Center Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="h-5 w-5 text-slate-700" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -inset-e-0.5 h-4 min-w-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-88 bg-white text-slate-900 border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50"
          >
            <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
              <span className="font-bold text-sm text-slate-900">
                {t.notifications}
              </span>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none text-xs">
                {notifications.length}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {t.noNotifications}
                </div>
              ) : (
                notifications.slice(0, 8).map((n: any, idx: number) => {
                  const itemTitle =
                    n.title ||
                    n.type ||
                    (isAr
                      ? "تنبيه استحقاق وتجديد"
                      : "Renewal Deadline Alert");
                  const itemMessage =
                    n.message ||
                    n.text ||
                    n.documentName ||
                    n.name ||
                    (isAr
                      ? "يوجد مستند يتطلب مراجعة التجديد فوراً."
                      : "A contract or license requires renewal review.");

                  return (
                    <DropdownMenuItem
                      key={n.id || idx}
                      onClick={() => router.push("/reports")}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50 text-slate-900"
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {itemTitle}
                        </span>
                        <span className="text-xs text-slate-600 leading-snug wrap-break-word">
                          {itemMessage}
                        </span>
                        {n.createdAt && (
                          <span
                            className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"
                            dir="ltr"
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(n.createdAt).toISOString().split("T")[0]}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-100"
            >
              <div className="h-7 w-7 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {effectiveName?.[0]?.toUpperCase() || "A"}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-28 truncate">
                {effectiveName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white text-slate-900 border border-slate-200 shadow-lg rounded-xl"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  {effectiveName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {effectiveEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 cursor-pointer font-medium"
            >
              <LogOut className="me-2 h-4 w-4" />
              {t.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Global Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              {t.globalSearchTitle}
            </DialogTitle>
            <DialogDescription>{t.globalSearchDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="absolute inset-s-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                autoFocus
                placeholder={t.searchPlaceholder}
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto divide-y border rounded-xl">
              {quickResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {t.noDocsFound}
                </div>
              ) : (
                quickResults.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      router.push("/reports");
                    }}
                    className="w-full p-3 flex items-center justify-between hover:bg-slate-50 text-start transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {doc.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {doc.type} •{" "}
                          <span dir="ltr">
                            {new Date(doc.dueDate).toISOString().split("T")[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {doc.status}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}