"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CreditCard, Filter } from "lucide-react";
import type { Payment, PaymentStatus } from "@/lib/types";

const STATUS_BADGE: Record<PaymentStatus, "lime" | "amber" | "red" | "gray"> = {
  paid: "lime",
  pending: "amber",
  expired: "gray",
  failed: "red",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  expired: "Expired",
  failed: "Failed",
};

const ALL_STATUSES: PaymentStatus[] = ["paid", "pending", "expired", "failed"];

interface PaymentWithProfile extends Payment {
  profile?: {
    email: string;
    full_name: string | null;
  };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchPayments = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*, profile:profiles(email, full_name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPayments(data as PaymentWithProfile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filtered =
    filterStatus === "all"
      ? payments
      : payments.filter((p) => p.status === filterStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0F5]">Payments</h1>
        <p className="text-[#8B949E] text-sm mt-1">
          Riwayat pembayaran member (view only)
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[#8B949E]">
          <Filter size={16} />
          <span className="text-sm">Filter status:</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === "all"
                ? "bg-[#96FC03]/10 text-[#96FC03] border border-[#96FC03]/30"
                : "text-[#8B949E] border border-[#222229] hover:border-[#8B949E]/50"
            }`}
          >
            Semua ({payments.length})
          </button>
          {ALL_STATUSES.map((status) => {
            const count = payments.filter((p) => p.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-[#96FC03]/10 text-[#96FC03] border border-[#96FC03]/30"
                    : "text-[#8B949E] border border-[#222229] hover:border-[#8B949E]/50"
                }`}
              >
                {STATUS_LABELS[status]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222229]">
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Member
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Jumlah
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Metode
                </th>
                <th className="text-left px-6 py-4 text-[#8B949E] font-medium">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#222229]/50">
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                    </tr>
                  ))
                : filtered.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-[#222229]/50 hover:bg-[#131318]/50"
                    >
                      <td className="px-6 py-4 text-[#F0F0F5] font-medium">
                        {payment.profile?.full_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-[#8B949E]">
                        {payment.profile?.email || "-"}
                      </td>
                      <td className="px-6 py-4 text-[#F0F0F5] font-semibold font-mono">
                        Rp {formatCurrency(payment.amount_idr)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={STATUS_BADGE[payment.status]}>
                          {STATUS_LABELS[payment.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[#8B949E]">
                        {payment.payment_method || "-"}
                      </td>
                      <td className="px-6 py-4 text-[#8B949E] text-xs">
                        {formatDateTime(payment.created_at)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-[#8B949E]">
              {filterStatus === "all"
                ? "Belum ada data pembayaran."
                : `Tidak ada pembayaran dengan status "${STATUS_LABELS[filterStatus as PaymentStatus]}".`}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
