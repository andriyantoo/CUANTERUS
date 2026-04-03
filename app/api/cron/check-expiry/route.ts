import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncRoles } from "@/lib/discord";

/**
 * GET /api/cron/check-expiry
 * Called daily by Vercel Cron or external cron service.
 * - Expires active subscriptions past their expiry date
 * - Removes Discord roles from expired members
 * - Sends expiry warning notifications (7 days before)
 *
 * Protected by CRON_SECRET header
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const results = { expired: 0, rolesRemoved: 0, warnings: 0 };

  try {
    // 1. Find and expire active subscriptions past their expiry date
    const { data: expiredSubs } = await admin
      .from("subscriptions")
      .select("id, user_id, product_id, expires_at")
      .eq("status", "active")
      .lt("expires_at", now);

    if (expiredSubs && expiredSubs.length > 0) {
      // Mark as expired
      const expiredIds = expiredSubs.map((s) => s.id);
      await admin
        .from("subscriptions")
        .update({ status: "expired" })
        .in("id", expiredIds);

      results.expired = expiredSubs.length;

      // Get role mappings
      const { data: mappings } = await admin
        .from("discord_role_mappings")
        .select("product_id, discord_role_id");

      // For each expired user, sync Discord roles
      const userIds = Array.from(new Set(expiredSubs.map((s) => s.user_id)));

      for (const userId of userIds) {
        // Get user's remaining active subscriptions
        const { data: activeSubs } = await admin
          .from("subscriptions")
          .select("product_id")
          .eq("user_id", userId)
          .eq("status", "active")
          .gt("expires_at", now);

        const activeProductIds = (activeSubs ?? []).map((s) => s.product_id);

        // Get user's Discord ID
        const { data: profile } = await admin
          .from("profiles")
          .select("discord_id")
          .eq("id", userId)
          .single();

        if (profile?.discord_id && mappings) {
          const { removed } = await syncRoles(profile.discord_id, activeProductIds, mappings);
          results.rolesRemoved += removed.length;
        }

        // Send expiry notification
        await admin.from("notifications").insert({
          user_id: userId,
          title: "Membership Expired",
          body: "Membership kamu sudah berakhir. Role Discord sudah dicopot otomatis. Perpanjang untuk tetap akses semua fitur.",
          type: "warning",
          link: "/billing",
        });
      }
    }

    // 2. Send warning notifications for subscriptions expiring in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString();

    // Find subs expiring between now and 7 days from now
    const { data: warningSubs } = await admin
      .from("subscriptions")
      .select("id, user_id, expires_at")
      .eq("status", "active")
      .gt("expires_at", now)
      .lt("expires_at", sevenDaysStr);

    if (warningSubs && warningSubs.length > 0) {
      for (const sub of warningSubs) {
        // Check if we already sent a warning for this subscription
        const { data: existing } = await admin
          .from("notifications")
          .select("id")
          .eq("user_id", sub.user_id)
          .like("title", "%Segera Berakhir%")
          .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!existing || existing.length === 0) {
          const daysLeft = Math.ceil(
            (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          await admin.from("notifications").insert({
            user_id: sub.user_id,
            title: "Membership Segera Berakhir",
            body: `Membership kamu akan berakhir dalam ${daysLeft} hari. Perpanjang sekarang agar tidak kehilangan akses dan role Discord.`,
            type: "warning",
            link: "/billing",
          });

          results.warnings++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now,
    });
  } catch (error) {
    console.error("Cron check-expiry error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
