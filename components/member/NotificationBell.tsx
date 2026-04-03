"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import { Bell, X, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  info: "text-blue-400",
  success: "text-[#96FC03]",
  warning: "text-amber-400",
  error: "text-red-400",
};

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const supabase = createClient();

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    const notifs = (data ?? []) as Notification[];
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.is_read).length);
  }

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    fetchNotifications();
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-[#8B949E] hover:text-[#F0F0F5] hover:bg-[#131318] transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-sm z-50 rounded-xl bg-[#131318] border border-[#222229] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222229]">
              <h3 className="font-semibold text-sm text-[#F0F0F5]">Notifikasi</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#96FC03] hover:underline"
                  >
                    Tandai semua dibaca
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-[#8B949E]">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#8B949E]">
                  Belum ada notifikasi.
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = typeIcons[notif.type] || Info;
                  const color = typeColors[notif.type] || "text-[#8B949E]";
                  const content = (
                    <div
                      key={notif.id}
                      className={`flex gap-3 px-4 py-3 hover:bg-[#222229]/30 transition-colors cursor-pointer ${
                        !notif.is_read ? "bg-[#96FC03]/5" : ""
                      }`}
                      onClick={() => {
                        markRead(notif.id);
                        if (notif.link) setOpen(false);
                      }}
                    >
                      <Icon size={18} className={`${color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F0F0F5]">{notif.title}</p>
                        <p className="text-xs text-[#8B949E] mt-0.5 line-clamp-2">{notif.body}</p>
                        <p className="text-[10px] text-[#8B949E]/60 mt-1">
                          {formatRelative(notif.created_at)}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-[#96FC03] flex-shrink-0 mt-2" />
                      )}
                    </div>
                  );

                  return notif.link ? (
                    <Link key={notif.id} href={notif.link}>{content}</Link>
                  ) : (
                    <div key={notif.id}>{content}</div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
