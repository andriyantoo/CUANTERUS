import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, plan_id } = await request.json();

    if (!code || !plan_id) {
      return NextResponse.json({ error: "Code dan plan_id diperlukan" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Find coupon
    const { data: coupon } = await admin
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .maybeSingle();

    if (!coupon) {
      return NextResponse.json({ error: "Kode kupon tidak valid" }, { status: 400 });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: "Kode kupon sudah kedaluwarsa" }, { status: 400 });
    }

    // Check max uses
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: "Kode kupon sudah habis digunakan" }, { status: 400 });
    }

    // Check if user already used this coupon
    const { data: existingUse } = await admin
      .from("coupon_uses")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingUse) {
      return NextResponse.json({ error: "Kamu sudah pernah menggunakan kupon ini" }, { status: 400 });
    }

    // Check product restriction
    if (coupon.product_id) {
      const { data: plan } = await admin
        .from("plans")
        .select("product_id")
        .eq("id", plan_id)
        .single();

      if (plan && plan.product_id !== coupon.product_id) {
        return NextResponse.json({ error: "Kupon tidak berlaku untuk produk ini" }, { status: 400 });
      }
    }

    // Get plan price for discount calculation
    const { data: plan } = await admin
      .from("plans")
      .select("price_idr")
      .eq("id", plan_id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan tidak ditemukan" }, { status: 404 });
    }

    const originalPrice = Number(plan.price_idr);

    // Check minimum amount
    if (coupon.min_amount && originalPrice < Number(coupon.min_amount)) {
      return NextResponse.json({
        error: `Minimum pembelian Rp ${Number(coupon.min_amount).toLocaleString("id-ID")} untuk kupon ini`,
      }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === "percent") {
      discount = Math.floor(originalPrice * Number(coupon.discount_value) / 100);
    } else {
      discount = Number(coupon.discount_value);
    }

    const finalPrice = Math.max(originalPrice - discount, 0);

    return NextResponse.json({
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      discount_amount: discount,
      original_price: originalPrice,
      final_price: finalPrice,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Validation failed" }, { status: 500 });
  }
}
