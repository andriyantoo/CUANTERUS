import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookToken } from "@/lib/xendit";
import { syncRoles } from "@/lib/discord";
import { addMonths } from "date-fns";

export async function POST(request: Request) {
  try {
    // Verify webhook token
    const callbackToken = request.headers.get("x-callback-token");
    if (!callbackToken || !verifyWebhookToken(callbackToken)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { id: xenditInvoiceId, status, external_id: externalId, payment_method } = body;

    const admin = createAdminClient();

    // Find the payment record
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("*")
      .eq("xendit_invoice_id", xenditInvoiceId)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", xenditInvoiceId);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (status === "PAID") {
      // Update payment status
      await admin
        .from("payments")
        .update({
          status: "paid",
          payment_method: payment_method || null,
          paid_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Find which plan was purchased based on the amount
      const { data: plan } = await admin
        .from("plans")
        .select("*, product:products(*)")
        .eq("price_idr", payment.amount_idr)
        .eq("is_active", true)
        .single();

      if (plan) {
        const now = new Date();
        const expiresAt = addMonths(now, plan.duration_months);

        // Create subscription
        const { data: subscription } = await admin
          .from("subscriptions")
          .insert({
            user_id: payment.user_id,
            plan_id: plan.id,
            product_id: plan.product_id,
            status: "active",
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        // Link payment to subscription
        if (subscription) {
          await admin
            .from("payments")
            .update({ subscription_id: subscription.id })
            .eq("id", payment.id);
        }

        // Auto-assign Discord role
        const { data: profile } = await admin
          .from("profiles")
          .select("discord_id")
          .eq("id", payment.user_id)
          .single();

        if (profile?.discord_id) {
          const { data: allActiveSubs } = await admin
            .from("subscriptions")
            .select("product_id")
            .eq("user_id", payment.user_id)
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

        // Send notification
        await admin.from("notifications").insert({
          user_id: payment.user_id,
          title: "Pembayaran Berhasil!",
          body: `Paket ${plan.product.name} - ${plan.name} sudah aktif. Selamat belajar!`,
          type: "success",
          link: "/dashboard",
        });
      }
    } else if (status === "EXPIRED") {
      await admin
        .from("payments")
        .update({ status: "expired" })
        .eq("id", payment.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
