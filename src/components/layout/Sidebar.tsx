"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  GitPullRequest,
  Users,
  Settings,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { t, locale } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [brand, setBrand] = useState({
    appName: "RenewalGuard",
    primaryColor: "#2563eb",
  });

  useEffect(() => {
    const savedCollapse =
      localStorage.getItem("rg_sidebar_collapsed") === "true";
    setCollapsed(savedCollapse);

    const fetchBrand = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setBrand({
            appName: data.appName || "RenewalGuard",
            primaryColor: data.primaryColor || "#2563eb",
          });
        }
      } catch (error) {
        console.error("Failed to load brand settings");
      }
    };
    fetchBrand();
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("rg_sidebar_collapsed", String(next));
  };

  const operationItems = [
    { key: "dashboard", name: t.dashboard, href: "/", icon: LayoutDashboard },
    {
      key: "documents",
      name: t.documents,
      href: "/reports",
      icon: CalendarRange,
    },
    {
      key: "workflows",
      name: locale === "ar" ? "المهام والاعتمادات" : "Workflows & Approvals",
      href: "/workflows",
      icon: GitPullRequest,
    },
  ];

  const governanceItems = [
    {
      key: "team",
      name:
        locale === "ar"
          ? "إدارة الفريق والصلاحيات"
          : "Team & Access Control",
      href: "/team",
      icon: Users,
    },
    { key: "settings", name: t.settings, href: "/settings", icon: Settings },
  ];

  const initials = brand.appName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-68"
      } transition-all duration-300 ease-in-out bg-slate-950 text-slate-200 border-e border-slate-800/80 flex flex-col select-none shrink-0`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0 ring-1 ring-white/15"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {initials || "RG"}
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-base text-white tracking-tight truncate">
                {brand.appName}
              </span>
              <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Enterprise Edition
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={toggleCollapse}
          title={collapsed ? t.expandSidebar : t.collapseSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        <div className="space-y-1.5">
          {!collapsed && (
            <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {t.navOperations}
            </div>
          )}
          {operationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center ${
                  collapsed ? "justify-center px-2" : "gap-3 px-3"
                } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30 shadow-xs"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-blue-400" : ""
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        <div className="space-y-1.5">
          {!collapsed && (
            <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {t.navGovernance}
            </div>
          )}
          {governanceItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center ${
                  collapsed ? "justify-center px-2" : "gap-3 px-3"
                } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30 shadow-xs"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-blue-400" : ""
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-800/80">
        {collapsed ? (
          <div
            className="flex justify-center py-1"
            title="OWASP ASVS & Audit Active"
          >
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                {locale === "ar" ? "حماية السيرفر نشطة" : "Audit & Auth Guard"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {locale === "ar"
                ? "جميع العمليات موثقة في سجل المراقبة الأمنية."
                : "All mutations verified & logged to immutable trail."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}