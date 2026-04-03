"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useUser } from "@/hooks/useUser";
import { Toaster } from "sonner";
import { Shield, Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0F" }}>
        <div className="w-8 h-8 border-2 border-[#96FC03] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0F", color: "#F0F0F5" }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Shield size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-[#8B949E]">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#96FC03] text-[#0A0A0F] font-semibold text-sm hover:brightness-110 transition-all"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0A0A0F", color: "#F0F0F5" }}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-[#222229] flex items-center justify-between px-4 md:px-6">
          <button
            className="md:hidden text-[#8B949E] hover:text-[#F0F0F5]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#8B949E] bg-[#222229] px-2.5 py-1 rounded-md">ADMIN</span>
            <span className="text-sm text-[#F0F0F5]">{profile.full_name || profile.email}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster theme="dark" richColors position="top-right" />
    </div>
  );
}
