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

    const { plan_id } = await request.json();

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

    const externalId = `cuanterus-${user.id}-${randomUUID().slice(0, 8)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cuanterus.vercel.app";

    // Handle product relation (could be object or array from join)
    const product = Array.isArray(plan.product) ? plan.product[0] : plan.product;
    const amount = Number(plan.price_idr);

    // Create Xendit invoice
    const invoice = await createInvoice({
      externalId,
      amount,
      payerEmail: user.email!,
      description: `${product?.name || "Cuanterus"} - ${plan.name}`,
      successRedirectUrl: `${baseUrl}/billing?payment=success`,
      failureRedirectUrl: `${baseUrl}/billing?payment=failed`,
    });

    // Store pending payment
    await admin.from("payments").insert({
      user_id: user.id,
      xendit_invoice_id: invoice.id,
      xendit_external_id: externalId,
      amount_idr: amount,
      status: "pending",
    });

    return NextResponse.json({ invoice_url: invoice.invoice_url });
  } catch (error: any) {
    console.error("Create invoice error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
