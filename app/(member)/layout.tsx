"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/member/Sidebar";
import { Topbar } from "@/components/member/Topbar";
import { useUser } from "@/hooks/useUser";
import { Toaster } from "sonner";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0F" }}>
        <div className="w-8 h-8 border-2 border-[#96FC03] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0A0A0F", color: "#F0F0F5" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar profile={profile} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster theme="dark" richColors position="top-right" />
    </div>
  );
}
