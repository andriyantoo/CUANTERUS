"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  BarChart3,
  FileText,
  MessageSquare,
  BarChart2,
  Activity,
  User,
  CreditCard,
  LogOut,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Kursus", icon: BookOpen },
  { href: "/signals", label: "Sinyal", icon: TrendingUp },
  { href: "/market-outlook", label: "Market Outlook", icon: BarChart3 },
  { href: "/market-insight", label: "Market Insight", icon: FileText },
  { href: "/analisa", label: "Analisa", icon: BarChart2 },
  { href: "/indicator", label: "Golden Trap", icon: Activity },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-[#96FC03] text-[#0A0A0F]">
              C
            </div>
            <span className="font-bold text-[#F0F0F5]">cuanterus</span>
          </Link>
          <button className="md:hidden text-[#8B949E]" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
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

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8B949E] hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
