import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendFollowUpEmail } from "@/lib/email-templates";

/**
 * GET /api/cron/follow-up
 * Called daily. Sends follow-up email to users who registered 3 days ago
 * but haven't purchased any subscription yet.
 *
 * Protected by CRON_SECRET header
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  let sent = 0;

  try {
    // Find users created ~3 days ago (between 3 and 4 days ago)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const { data: newUsers } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .gt("created_at", fourDaysAgo.toISOString())
      .lt("created_at", threeDaysAgo.toISOString());

    if (newUsers && newUsers.length > 0) {
      for (const user of newUsers) {
        // Check if user has any subscription (active or expired)
        const { data: subs } = await admin
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        // Only send follow-up if user has NEVER purchased
        if (!subs || subs.length === 0) {
          await sendFollowUpEmail(user.email, user.full_name || "");
          sent++;
        }
      }
    }

    return NextResponse.json({ success: true, sent, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Cron follow-up error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
