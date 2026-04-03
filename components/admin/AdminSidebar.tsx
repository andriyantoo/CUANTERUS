"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  FileText,
  MessageSquare,
  CreditCard,
  ArrowLeft,
  X,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/signals", label: "Signals", icon: TrendingUp },
  { href: "/admin/market-outlook", label: "Market Outlook", icon: BarChart3 },
  { href: "/admin/market-insight", label: "Market Insight", icon: FileText },
  { href: "/admin/forum", label: "Forum", icon: MessageSquare },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-[#0A0A0F] border-r border-[#222229] flex flex-col transition-transform duration-300",
          "md:translate-x-0 md:static md:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#222229]">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-[#96FC03] text-[#0A0A0F]">
              <Shield size={14} />
            </div>
            <span className="font-bold text-[#F0F0F5]">Admin Panel</span>
          </Link>
          <button className="md:hidden text-[#8B949E]" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#96FC03]/10 text-[#96FC03]"
                    : "text-[#8B949E] hover:text-[#F0F0F5] hover:bg-[#131318]"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to member area */}
        <div className="px-3 pb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8B949E] hover:text-[#F0F0F5] hover:bg-[#131318] transition-colors w-full"
          >
            <ArrowLeft size={18} />
            Kembali ke Member Area
          </Link>
        </div>
      </aside>
    </>
  );
}
