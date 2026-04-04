"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PRODUCT_NAMES } from "@/lib/constants";
import { formatDate, formatCurrency, daysUntil } from "@/lib/utils";
import type { Payment, Plan, Product } from "@/lib/types";
import {
  CreditCard,
  Clock,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingCart,
  Check,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";

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

interface PlanWithProduct extends Plan {
  product: Product;
}

function BillingContent() {
  const { user, subscription: activeSubscription } = useUser();
  const searchParams = useSearchParams();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<PlanWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponValid, setCouponValid] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [validating, setValidating] = useState(false);
  const [selectedPlanForCoupon, setSelectedPlanForCoupon] = useState<string | null>(null);

  const daysLeft = activeSubscription ? daysUntil(activeSubscription.expires_at) : 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 14;

  // Show success/failed toast from redirect
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Pembayaran berhasil! Subscription kamu sudah aktif.");
    } else if (payment === "failed") {
      toast.error("Pembayaran gagal atau dibatalkan.");
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      if (!user) { setLoading(false); return; }

      const supabase = createClient();
      const [paymentsRes, plansRes] = await Promise.all([
        supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("plans")
          .select("*, product:products(*)")
          .eq("is_active", true)
          .order("price_idr"),
      ]);

      setPayments((paymentsRes.data ?? []) as Payment[]);
      setPlans((plansRes.data ?? []) as PlanWithProduct[]);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  async function validateCoupon(planId: string) {
    if (!couponCode.trim()) return;
    setValidating(true);
    setCouponError("");
    setCouponValid(null);
    setSelectedPlanForCoupon(planId);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, plan_id: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error);
      } else {
        setCouponValid(data);
        toast.success(`Kupon "${data.code}" berlaku! Diskon Rp ${formatCurrency(data.discount_amount)}`);
      }
    } catch {
      setCouponError("Gagal validasi kupon");
    }
    setValidating(false);
  }

  async function handlePurchase(planId: string) {
    setPurchasing(planId);
    try {
      const body: any = { plan_id: planId };
      if (couponValid && selectedPlanForCoupon === planId) {
        body.coupon_code = couponCode;
      }

      const res = await fetch("/api/payments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal membuat pembayaran");
        setPurchasing(null);
        return;
      }

      // Redirect to Xendit payment page
      window.location.href = data.invoice_url;
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
      setPurchasing(null);
    }
  }

  // Group plans by product
  const plansByProduct: Record<string, PlanWithProduct[]> = {};
  plans.forEach((plan) => {
    const key = plan.product?.slug ?? "other";
    if (!plansByProduct[key]) plansByProduct[key] = [];
    plansByProduct[key].push(plan);
  });

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0F5]">Langganan & Billing</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Kelola paket langganan dan pembayaran.
        </p>
      </div>

      {/* Current Subscription */}
      {activeSubscription ? (
        <Card className={isExpiringSoon ? "border-amber-500/20 bg-amber-500/5" : "border-[#96FC03]/20 bg-[#96FC03]/5"}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#96FC03]/10 flex items-center justify-center text-[#96FC03]">
              <CreditCard size={20} />
            </div>
            <div>
              <CardTitle>Paket Aktif</CardTitle>
              <p className="text-xs text-[#8B949E]">Langganan kamu saat ini</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="lime">Aktif</Badge>
              <Badge variant="gray">{PRODUCT_NAMES[activeSubscription.product?.slug ?? ""] ?? "Plan"}</Badge>
              {activeSubscription.plan?.name && <Badge variant="gray">{activeSubscription.plan.name}</Badge>}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[#8B949E] text-xs">Mulai</p>
                <p className="text-[#F0F0F5] font-medium">{formatDate(activeSubscription.starts_at)}</p>
              </div>
              <div>
                <p className="text-[#8B949E] text-xs">Berakhir</p>
                <p className="text-[#F0F0F5] font-medium flex items-center gap-1.5">
                  {formatDate(activeSubscription.expires_at)}
                  {isExpiringSoon && (
                    <span className="text-amber-400 text-xs flex items-center gap-1">
                      <AlertTriangle size={12} />{daysLeft} hari lagi
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Button size="sm" variant={isExpiringSoon ? "primary" : "secondary"} onClick={() => setShowPlans(!showPlans)}>
                <ShoppingCart size={16} className="mr-1.5" />
                {isExpiringSoon ? "Perpanjang Sekarang" : "Perpanjang / Upgrade"}
              </Button>
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
              <p className="text-sm text-[#8B949E] mt-1">Pilih paket untuk mulai mengakses semua fitur.</p>
            </div>
            <Button size="sm" onClick={() => setShowPlans(!showPlans)}>
              <ShoppingCart size={16} className="mr-1.5" />
              Pilih Paket
            </Button>
          </div>
        </Card>
      )}

      {/* Plan Selection (Checkout) */}
      {(showPlans || !activeSubscription) && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-[#F0F0F5]">Pilih Paket</h2>

          {/* Coupon Input */}
          <Card className="p-4">
            <p className="text-sm font-medium text-[#F0F0F5] mb-2">Punya kode kupon?</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan kode kupon"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponValid(null);
                  setCouponError("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 uppercase"
              />
            </div>
            {couponError && <p className="text-xs text-red-400 mt-2">{couponError}</p>}
            {couponValid && (
              <div className="mt-2 p-2 rounded-lg bg-[#96FC03]/10 border border-[#96FC03]/20">
                <p className="text-xs text-[#96FC03] font-medium">
                  ✅ {couponValid.code} — Diskon {couponValid.discount_type === "percent" ? `${couponValid.discount_value}%` : `Rp ${formatCurrency(couponValid.discount_value)}`}
                  {couponValid.description && ` — ${couponValid.description}`}
                </p>
              </div>
            )}
          </Card>

          {Object.entries(plansByProduct).map(([slug, productPlans]) => (
            <div key={slug}>
              <h3 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-3">
                {PRODUCT_NAMES[slug] ?? slug}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {productPlans.map((plan) => {
                  const isCurrentPlan = activeSubscription?.plan_id === plan.id;
                  return (
                    <Card
                      key={plan.id}
                      className={`relative ${isCurrentPlan ? "border-[#96FC03]/30" : ""}`}
                    >
                      {isCurrentPlan && (
                        <div className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#96FC03] text-[#0A0A0F]">
                          Paket Saat Ini
                        </div>
                      )}
                      <h4 className="font-bold text-[#F0F0F5] mb-1">{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mb-3">
                        {plan.original_price_idr && (
                          <span className="text-xs line-through text-red-400">
                            Rp {formatCurrency(plan.original_price_idr)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-xs text-[#8B949E]">Rp</span>
                        <span className="text-2xl font-extrabold font-mono text-[#F0F0F5]">
                          {formatCurrency(plan.price_idr)}
                        </span>
                      </div>
                      {couponCode.trim() && !couponValid && (
                        <Button
                          className="w-full mb-2"
                          size="sm"
                          variant="secondary"
                          loading={validating}
                          onClick={() => validateCoupon(plan.id)}
                        >
                          Cek Kupon
                        </Button>
                      )}
                      {couponValid && selectedPlanForCoupon === plan.id && (
                        <p className="text-xs text-[#96FC03] mb-2 text-center">
                          Harga setelah diskon: <strong>Rp {formatCurrency(couponValid.final_price)}</strong>
                        </p>
                      )}
                      <Button
                        className="w-full"
                        size="sm"
                        variant={isCurrentPlan ? "secondary" : "primary"}
                        loading={purchasing === plan.id}
                        disabled={!!purchasing}
                        onClick={() => {
                          if (couponCode.trim() && !couponValid) {
                            validateCoupon(plan.id).then(() => handlePurchase(plan.id));
                          } else {
                            handlePurchase(plan.id);
                          }
                        }}
                      >
                        {isCurrentPlan ? "Perpanjang" : "Beli Sekarang"}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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
                  <th className="text-left py-3 px-2 text-xs font-semibold text-[#8B949E]">Tanggal</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-[#8B949E]">Jumlah</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-[#8B949E]">Metode</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-[#8B949E]">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const config = PAYMENT_STATUS_CONFIG[payment.status] ?? { label: payment.status, variant: "gray" as const };
                  return (
                    <tr key={payment.id} className="border-b border-[#222229]/50 last:border-0">
                      <td className="py-3 px-2 text-[#F0F0F5]">{formatDate(payment.created_at)}</td>
                      <td className="py-3 px-2 text-[#F0F0F5] font-mono">Rp {formatCurrency(payment.amount_idr)}</td>
                      <td className="py-3 px-2 text-[#8B949E]">{payment.payment_method ?? "-"}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <PaymentStatusIcon status={payment.status} />
                          <Badge variant={config.variant}>{config.label}</Badge>
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

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
