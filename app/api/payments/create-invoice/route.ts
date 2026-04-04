import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvoice } from "@/lib/xendit";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan_id, coupon_code } = await request.json();

    if (!plan_id) {
      return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch plan with product info
    const { data: plan, error: planError } = await admin
      .from("plans")
      .select("*, product:products(*)")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const product = Array.isArray(plan.product) ? plan.product[0] : plan.product;
    let amount = Number(plan.price_idr);
    let couponId: string | null = null;

    // Apply coupon if provided
    if (coupon_code) {
      const { data: coupon } = await admin
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        // Validate coupon
        const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        const maxedOut = coupon.max_uses && coupon.used_count >= coupon.max_uses;

        const { data: usedBefore } = await admin
          .from("coupon_uses")
          .select("id")
          .eq("coupon_id", coupon.id)
          .eq("user_id", user.id)
          .maybeSingle();

        const productMismatch = coupon.product_id && plan.product_id !== coupon.product_id;

        if (!expired && !maxedOut && !usedBefore && !productMismatch) {
          // Calculate discount
          let discount = 0;
          if (coupon.discount_type === "percent") {
            discount = Math.floor(amount * Number(coupon.discount_value) / 100);
          } else {
            discount = Number(coupon.discount_value);
          }
          amount = Math.max(amount - discount, 0);
          couponId = coupon.id;
        }
      }
    }

    const externalId = `cuanterus-${user.id}-${randomUUID().slice(0, 8)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cuanterus.vercel.app";

    // Create Xendit invoice
    const invoice = await createInvoice({
      externalId,
      amount,
      payerEmail: user.email!,
      description: `${product?.name || "Cuanterus"} - ${plan.name}${couponId ? " (Diskon)" : ""}`,
      successRedirectUrl: `${baseUrl}/billing?payment=success`,
      failureRedirectUrl: `${baseUrl}/billing?payment=failed`,
    });

    // Store pending payment (with plan_id for webhook to find correct plan)
    await admin.from("payments").insert({
      user_id: user.id,
      plan_id: plan_id,
      xendit_invoice_id: invoice.id,
      xendit_external_id: externalId,
      amount_idr: amount,
      status: "pending",
    });

    // Record coupon usage + increment counter
    if (couponId) {
      await admin.from("coupon_uses").insert({
        coupon_id: couponId,
        user_id: user.id,
      });
      await admin.rpc("increment_coupon_count", { coupon_id_input: couponId }).catch(() => {
        // Fallback: manual increment
        admin.from("coupons").update({ used_count: admin.rpc("", {}) as any }).eq("id", couponId);
      });
      // Simple increment
      const { data: c } = await admin.from("coupons").select("used_count").eq("id", couponId).single();
      if (c) {
        await admin.from("coupons").update({ used_count: c.used_count + 1 }).eq("id", couponId);
      }
    }

    return NextResponse.json({ invoice_url: invoice.invoice_url });
  } catch (error: any) {
    console.error("Create invoice error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
