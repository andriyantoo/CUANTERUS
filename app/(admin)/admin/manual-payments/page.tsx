"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Check, X, Clock, Image } from "lucide-react";
import { toast } from "sonner";

interface ManualPayment {
  id: string;
  user_id: string;
  plan_id: string;
  amount_idr: number;
  unique_code: number;
  total_amount: number;
  proof_url: string | null;
  status: string;
  admin_notes: string | null;
  expires_at: string;
  created_at: string;
  profile?: { full_name: string; email: string };
  plan?: { name: string; product?: { name: string } };
}

export default function AdminManualPaymentsPage() {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function fetchData() {
    const supabase = createClient();
    const { data } = await supabase
      .from("manual_payments")
      .select("*, profile:profiles(full_name, email), plan:plans(name, product:products(name))")
      .order("created_at", { ascending: false });
    setPayments((data ?? []) as ManualPayment[]);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleAction(id: string, action: "approve" | "reject", notes?: string) {
    setProcessing(id);
    const res = await fetch("/api/manual-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, manual_payment_id: id, admin_notes: notes }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(action === "approve" ? "Pembayaran disetujui!" : "Pembayaran ditolak");
      fetchData();
    } else {
      toast.error(data.error || "Gagal");
    }
    setProcessing(null);
  }

  const statusConfig: Record<string, { label: string; variant: "lime" | "amber" | "red" | "gray" }> = {
    pending: { label: "Menunggu", variant: "amber" },
    approved: { label: "Disetujui", variant: "lime" },
    rejected: { label: "Ditolak", variant: "red" },
    expired: { label: "Kedaluwarsa", variant: "gray" },
  };

  if (loading) return <div className="space-y-4 max-w-4xl"><Skeleton className="h-10 w-48" />{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Transfer Manual</h1>
        <p className="text-sm text-[#8B949E] mt-1">Review dan approve pembayaran transfer manual.</p>
      </div>

      {payments.length === 0 ? (
        <Card className="text-center py-12">
          <Clock size={40} className="mx-auto text-[#222229] mb-3" />
          <p className="text-[#8B949E]">Belum ada pembayaran manual.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((mp) => {
            const config = statusConfig[mp.status] ?? { label: mp.status, variant: "gray" as const };
            const plan = Array.isArray(mp.plan) ? mp.plan[0] : mp.plan;
            const product = plan?.product ? (Array.isArray(plan.product) ? plan.product[0] : plan.product) : null;
            const profile = Array.isArray(mp.profile) ? mp.profile[0] : mp.profile;

            return (
              <Card key={mp.id}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant={config.variant}>{config.label}</Badge>
                      <span className="text-sm font-bold text-[#F0F0F5]">
                        {profile?.full_name || "Member"}
                      </span>
                      <span className="text-xs text-[#8B949E]">{profile?.email}</span>
                    </div>
                    <p className="text-sm text-[#8B949E] mb-2">
                      {product?.name} - {plan?.name}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-[#8B949E]">Harga: </span>
                        <span className="text-[#F0F0F5]">Rp {formatCurrency(mp.amount_idr)}</span>
                      </div>
                      <div>
                        <span className="text-[#8B949E]">Kode: </span>
                        <span className="text-amber-400">+{mp.unique_code}</span>
                      </div>
                      <div>
                        <span className="text-[#8B949E]">Total: </span>
                        <span className="text-[#96FC03] font-bold">Rp {formatCurrency(mp.total_amount)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#8B949E]">{formatDate(mp.created_at)}</p>
                    {mp.admin_notes && <p className="text-xs text-amber-400 mt-1">Note: {mp.admin_notes}</p>}
                  </div>

                  {mp.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" loading={processing === mp.id} onClick={() => handleAction(mp.id, "approve")}>
                        <Check size={14} className="mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="danger" loading={processing === mp.id} onClick={() => {
                        const notes = prompt("Alasan penolakan (opsional):");
                        handleAction(mp.id, "reject", notes || undefined);
                      }}>
                        <X size={14} className="mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
