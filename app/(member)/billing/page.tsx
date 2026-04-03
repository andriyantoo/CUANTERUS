"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PRODUCT_NAMES, PRODUCT_COLORS } from "@/lib/constants";
import { formatDate, formatCurrency, daysUntil } from "@/lib/utils";
import type { Payment } from "@/lib/types";
import {
  CreditCard,
  Clock,
  AlertTriangle,
  ExternalLink,
  Receipt,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "lime" | "blue" | "amber" | "red" | "gray" }
> = {
  paid: { label: "Lunas", variant: "lime" },
  pending: { label: "Menunggu", variant: "amber" },
  expired: { label: "Kedaluwarsa", variant: "gray" },
  failed: { label: "Gagal", variant: "red" },
};

function PaymentStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return <CheckCircle2 size={16} className="text-[#96FC03]" />;
    case "pending":
      return <Loader2 size={16} className="text-amber-400 animate-spin" />;
    case "failed":
      return <XCircle size={16} className="text-red-400" />;
    default:
      return <Clock size={16} className="text-[#8B949E]" />;
  }
}

export default function BillingPage() {
  const { user } = useUser();
  const { subscriptions, activeSubscription, loading: subLoading } = useSubscription(user?.id);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const daysLeft = activeSubscription ? daysUntil(activeSubscription.expires_at) : 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 14;

  useEffect(() => {
    async function fetchPayments() {
      if (!user) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPayments((data ?? []) as Payment[]);
      setLoading(false);
    }

    fetchPayments();
  }, [user]);

  if (subLoading || loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0F5]">Langganan & Billing</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Kelola paket langganan dan riwayat pembayaranmu.
        </p>
      </div>

      {/* Current Subscription */}
      {activeSubscription ? (
        <Card
          className={
            isExpiringSoon
              ? "border-amber-500/20 bg-amber-500/5"
              : "border-[#96FC03]/20 bg-[#96FC03]/5"
          }
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#96FC03]/10 flex items-center justify-center text-[#96FC03]">
              <CreditCard size={20} />
            </div>
            <div>
              <CardTitle>Paket Aktif</CardTitle>
              <p className="text-xs text-[#8B949E]">
                Langganan kamu saat ini
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="lime">Aktif</Badge>
              {(() => {
                const slug = activeSubscription.product?.slug ?? "";
                const color = PRODUCT_COLORS[slug] ?? "#96FC03";
                return (
                  <Badge
                    className="text-[10px]"
                    style={{
                      background: `${color}15`,
                      color,
                      borderColor: `${color}40`,
                    } as React.CSSProperties}
                  >
                    {PRODUCT_NAMES[slug] ?? "Plan"}
                  </Badge>
                );
              })()}
              {activeSubscription.plan?.name && (
                <Badge variant="gray">{activeSubscription.plan.name}</Badge>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[#8B949E] text-xs">Mulai</p>
                <p className="text-[#F0F0F5] font-medium">
                  {formatDate(activeSubscription.starts_at)}
                </p>
              </div>
              <div>
                <p className="text-[#8B949E] text-xs">Berakhir</p>
                <p className="text-[#F0F0F5] font-medium flex items-center gap-1.5">
                  {formatDate(activeSubscription.expires_at)}
                  {isExpiringSoon && (
                    <span className="text-amber-400 text-xs flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {daysLeft} hari lagi
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/#pricing">
                <Button size="sm" variant={isExpiringSoon ? "primary" : "secondary"}>
                  <ExternalLink size={16} className="mr-1.5" />
                  Perpanjang Langganan
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-400 flex items-center gap-2">
                <AlertTriangle size={16} />
                Belum ada paket aktif
              </p>
              <p className="text-sm text-[#8B949E] mt-1">
                Pilih paket untuk mulai mengakses semua fitur premium.
              </p>
            </div>
            <Link href="/#pricing">
              <Button size="sm">
                <ExternalLink size={16} className="mr-1.5" />
                Pilih Paket
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* All Subscriptions Summary */}
      {subscriptions.length > 1 && (
        <Card>
          <CardTitle className="mb-4">Riwayat Langganan</CardTitle>
          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const slug = sub.product?.slug ?? "";
              const color = PRODUCT_COLORS[slug] ?? "#96FC03";
              const isActive =
                sub.status === "active" && new Date(sub.expires_at) > new Date();

              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-[#222229] last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <Badge
                      className="text-[10px]"
                      style={{
                        background: `${color}15`,
                        color,
                        borderColor: `${color}40`,
                      } as React.CSSProperties}
                    >
                      {PRODUCT_NAMES[slug] ?? slug}
                    </Badge>
                    <span className="text-sm text-[#F0F0F5]">
                      {sub.plan?.name ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#8B949E]">
                      {formatDate(sub.starts_at)} - {formatDate(sub.expires_at)}
                    </span>
                    <Badge variant={isActive ? "lime" : "gray"}>
                      {isActive ? "Aktif" : sub.status === "cancelled" ? "Dibatalkan" : "Berakhir"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#222229] flex items-center justify-center text-[#8B949E]">
            <Receipt size={20} />
          </div>
          <CardTitle>Riwayat Pembayaran</CardTitle>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <Receipt size={32} className="mx-auto text-[#222229] mb-3" />
            <p className="text-sm text-[#8B949E]">Belum ada riwayat pembayaran.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222229]">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                    Tanggal
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                    Jumlah
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                    Metode
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-[#8B949E] uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const config = PAYMENT_STATUS_CONFIG[payment.status] ?? {
                    label: payment.status,
                    variant: "gray" as const,
                  };
                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-[#222229]/50 last:border-0"
                    >
                      <td className="py-3 px-2 text-[#F0F0F5]">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="py-3 px-2 text-[#F0F0F5] font-mono">
                        Rp {formatCurrency(payment.amount_idr)}
                      </td>
                      <td className="py-3 px-2 text-[#8B949E]">
                        {payment.payment_method ?? "-"}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <PaymentStatusIcon status={payment.status} />
                          <Badge variant={config.variant}>
                            {config.label}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
