import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookToken } from "@/lib/xendit";
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
