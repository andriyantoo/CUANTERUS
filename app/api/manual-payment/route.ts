import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addMonths, addHours } from "date-fns";
import { syncRoles } from "@/lib/discord";
import { sendPaymentSuccessEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, plan_id, manual_payment_id, proof_url, admin_notes } = await request.json();
    const admin = createAdminClient();

    // CREATE: member creates manual payment request
    if (action === "create") {
      if (!plan_id) return NextResponse.json({ error: "plan_id required" }, { status: 400 });

      const { data: plan } = await admin
        .from("plans")
        .select("*, product:products(*)")
        .eq("id", plan_id)
        .single();

      if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

      // Generate unique code (3 digits)
      const uniqueCode = Math.floor(Math.random() * 900) + 100;
      const amount = Number(plan.price_idr);
      const totalAmount = amount + uniqueCode;

      const { data: mp, error } = await admin
        .from("manual_payments")
        .insert({
          user_id: user.id,
          plan_id,
          amount_idr: amount,
          unique_code: uniqueCode,
          total_amount: totalAmount,
          status: "pending",
          expires_at: addHours(new Date(), 24).toISOString(),
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const product = Array.isArray(plan.product) ? plan.product[0] : plan.product;

      return NextResponse.json({
        id: mp.id,
        bank: "BCA",
        account_number: "1802002828",
        account_name: "Eko Nur Andriyanto",
        amount: amount,
        unique_code: uniqueCode,
        total_amount: totalAmount,
        description: `${product?.name || "Cuanterus"} - ${plan.name}`,
        expires_at: mp.expires_at,
      });
    }

    // UPLOAD PROOF: member uploads payment proof
    if (action === "upload_proof") {
      if (!manual_payment_id || !proof_url) {
        return NextResponse.json({ error: "manual_payment_id and proof_url required" }, { status: 400 });
      }

      await admin
        .from("manual_payments")
        .update({ proof_url })
        .eq("id", manual_payment_id)
        .eq("user_id", user.id);

      return NextResponse.json({ success: true });
    }

    // APPROVE: admin approves manual payment
    if (action === "approve") {
      // Check admin
      const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

      const { data: mp } = await admin
        .from("manual_payments")
        .select("*, plan:plans(*, product:products(*))")
        .eq("id", manual_payment_id)
        .single();

      if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const plan = mp.plan;
      const product = Array.isArray(plan.product) ? plan.product[0] : plan.product;
      const now = new Date();
      const expiresAt = addMonths(now, plan.duration_months);

      // Create subscription
      await admin.from("subscriptions").insert({
        user_id: mp.user_id,
        plan_id: plan.id,
        product_id: plan.product_id,
        status: "active",
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      // Update manual payment
      await admin
        .from("manual_payments")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: now.toISOString(),
          admin_notes: admin_notes || null,
        })
        .eq("id", manual_payment_id);

      // Auto-assign Discord role
      const { data: mpProfile } = await admin
        .from("profiles")
        .select("discord_id")
        .eq("id", mp.user_id)
        .single();

      if (mpProfile?.discord_id) {
        const { data: allActiveSubs } = await admin
          .from("subscriptions")
          .select("product_id")
          .eq("user_id", mp.user_id)
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString());

        const activeProductIds = (allActiveSubs ?? []).map((s) => s.product_id);

        const { data: mappings } = await admin
          .from("discord_role_mappings")
          .select("product_id, discord_role_id");

        if (mappings) {
          await syncRoles(mpProfile.discord_id, activeProductIds, mappings);
        }
      }

      // Notify member
      await admin.from("notifications").insert({
        user_id: mp.user_id,
        title: "Pembayaran Disetujui!",
        body: `Transfer manual untuk ${product?.name} - ${plan.name} sudah diverifikasi. Selamat belajar!`,
        type: "success",
        link: "/dashboard",
      });

      // Send payment success email
      const { data: mpProfile } = await admin
        .from("profiles")
        .select("email, full_name")
        .eq("id", mp.user_id)
        .single();

      if (mpProfile?.email) {
        sendPaymentSuccessEmail(
          mpProfile.email,
          mpProfile.full_name || "",
          product?.name || "Cuanterus",
          plan.name,
        ).catch((err) => console.error("[Email] Manual payment email error:", err));
      }

      return NextResponse.json({ success: true });
    }

    // REJECT: admin rejects
    if (action === "reject") {
      const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

      await admin
        .from("manual_payments")
        .update({ status: "rejected", admin_notes: admin_notes || "Bukti transfer tidak valid" })
        .eq("id", manual_payment_id);

      const { data: mp } = await admin.from("manual_payments").select("user_id").eq("id", manual_payment_id).single();
      if (mp) {
        await admin.from("notifications").insert({
          user_id: mp.user_id,
          title: "Pembayaran Ditolak",
          body: admin_notes || "Bukti transfer tidak valid. Silakan coba lagi atau hubungi admin.",
          type: "error",
          link: "/billing",
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
