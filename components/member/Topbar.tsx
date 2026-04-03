"use client";

import { Menu } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { NotificationBell } from "@/components/member/NotificationBell";
import type { Profile } from "@/lib/types";

export function Topbar({
  profile,
  onMenuClick,
}: {
  profile: Profile | null;
  onMenuClick: () => void;
}) {
  return (
    <header className="h-16 border-b border-[#222229] bg-[#0A0A0F]/80 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <button
        className="md:hidden text-[#8B949E] hover:text-[#F0F0F5]"
        onClick={onMenuClick}
      >
        <Menu size={22} />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        {profile?.id && <NotificationBell userId={profile.id} />}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-[#F0F0F5]">
            {profile?.full_name || "Member"}
          </p>
          <p className="text-xs text-[#8B949E]">{profile?.email}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#96FC03]/10 flex items-center justify-center text-sm font-bold text-[#96FC03]">
          {getInitials(profile?.full_name ?? null)}
        </div>
      </div>
    </header>
  );
}
