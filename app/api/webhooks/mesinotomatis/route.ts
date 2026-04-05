import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addMonths } from "date-fns";
import { syncRoles } from "@/lib/discord";
import { addSubscriber, MAILKETING_LIST_PAID } from "@/lib/mailketing";
import { sendPaymentSuccessEmail } from "@/lib/email-templates";

/**
 * POST /api/webhooks/mesinotomatis
 *
 * Receives mutation webhook from MesinOtomatis.
 * When a credit (K) mutation comes in, matches amount (including unique code)
 * with pending manual payments → auto approves subscription.
 *
 * Webhook fields:
 * - target: "mutation" | "balance"
 * - key: MD5 hash verification
 * - id: unique mutation ID
 * - bank: bank name (bca)
 * - account: account number
 * - amount: transfer amount
 * - type: "K" (credit) | "D" (debit)
 * - description: transfer note
 * - date, time
 */
export async function POST(request: Request) {
  try {
    // MesinOtomatis sends form-data (POST array)
    const formData = await request.formData();

    const target = formData.get("target") as string;
    const key = formData.get("key") as string;
    const mutationId = formData.get("id") as string;
    const bank = formData.get("bank") as string;
    const account = formData.get("account") as string;
    const amount = parseInt(formData.get("amount") as string || "0");
    const type = formData.get("type") as string;
    const description = (formData.get("description") as string) || "";
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;

    // Only process credit (incoming) mutations
    if (target !== "mutation" || type !== "K") {
      return NextResponse.json({ status: "ignored", reason: "not a credit mutation" });
    }

    // Verify webhook key (MD5 of webhook_url + account_number)
    // Optional: add verification if needed
    // const expectedKey = md5(process.env.MESINOTOMATIS_WEBHOOK_URL + account);

    console.log(`[MesinOtomatis] Credit mutation: ${bank} ${account} +${amount} "${description}"`);

    const admin = createAdminClient();

    // Find pending manual payment matching this exact amount (price + unique code)
    const { data: pendingPayments } = await admin
      .from("manual_payments")
      .select("*, plan:plans(*, product:products(*))")
      .eq("status", "pending")
      .eq("total_amount", amount)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(1);

    if (!pendingPayments || pendingPayments.length === 0) {
      console.log(`[MesinOtomatis] No matching pending payment for amount ${amount}`);
      return NextResponse.json({ status: "no_match", amount });
    }

    const mp = pendingPayments[0];
    const plan = Array.isArray(mp.plan) ? mp.plan[0] : mp.plan;
    const product = plan?.product ? (Array.isArray(plan.product) ? plan.product[0] : plan.product) : null;

    // Auto-approve: create subscription
    const now = new Date();
    const expiresAt = addMonths(now, plan.duration_months);

    await admin.from("subscriptions").insert({
      user_id: mp.user_id,
      plan_id: plan.id,
      product_id: plan.product_id,
      status: "active",
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    // Update manual payment status
    await admin
      .from("manual_payments")
      .update({
        status: "approved",
        admin_notes: `Auto-approved by MesinOtomatis. Mutation ID: ${mutationId}. ${description}`,
        approved_at: now.toISOString(),
      })
      .eq("id", mp.id);

    // Auto-assign Discord role
    const { data: profile } = await admin
      .from("profiles")
      .select("discord_id")
      .eq("id", mp.user_id)
      .single();

    if (profile?.discord_id) {
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
        await syncRoles(profile.discord_id, activeProductIds, mappings);
      }
    }

    // Notify member
    await admin.from("notifications").insert({
      user_id: mp.user_id,
      title: "Pembayaran Dikonfirmasi! ✅",
      body: `Transfer Rp ${amount.toLocaleString("id-ID")} untuk ${product?.name} - ${plan.name} sudah diverifikasi otomatis. Selamat belajar!`,
      type: "success",
      link: "/dashboard",
    });

    // Add paid member to Mailketing list (fire and forget)
    const { data: paidProfile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", mp.user_id)
      .single();

    if (paidProfile?.email) {
      addSubscriber({
        listId: MAILKETING_LIST_PAID,
        email: paidProfile.email,
        firstName: paidProfile.full_name || "",
      }).catch((err) => console.error("[Mailketing] MesinOtomatis webhook error:", err));

      sendPaymentSuccessEmail(
        paidProfile.email,
        paidProfile.full_name || "",
        product?.name || "Cuanterus",
        plan.name,
      ).catch((err) => console.error("[Email] Payment success email error:", err));
    }

    console.log(`[MesinOtomatis] Auto-approved payment ${mp.id} for user ${mp.user_id}`);

    return NextResponse.json({
      status: "approved",
      payment_id: mp.id,
      user_id: mp.user_id,
      amount,
    });
  } catch (error: any) {
    console.error("[MesinOtomatis] Webhook error:", error?.message || error);
    return NextResponse.json(
      { status: "error", message: error?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
