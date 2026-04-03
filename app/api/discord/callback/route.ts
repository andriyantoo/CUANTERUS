import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDiscordUser, addToGuild, syncRoles } from "@/lib/discord";

/**
 * GET /api/discord/callback
 * Discord OAuth callback — links Discord account + assigns roles
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  if (!code || !userId) {
    return NextResponse.redirect(`${baseUrl}/profile?discord=error`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${baseUrl}/api/discord/callback`,
      }),
    });

    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const { access_token } = await tokenRes.json();

    // Get Discord user info
    const discordUser = await getDiscordUser(access_token);
    if (!discordUser) throw new Error("Failed to get Discord user");

    const admin = createAdminClient();

    // Save Discord info to profile
    await admin
      .from("profiles")
      .update({
        discord_id: discordUser.id,
        discord_username: `${discordUser.username}`,
        discord_linked_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // Get user's active subscriptions
    const { data: subs } = await admin
      .from("subscriptions")
      .select("product_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());

    const activeProductIds = (subs ?? []).map((s) => s.product_id);

    // Get role mappings
    const { data: mappings } = await admin
      .from("discord_role_mappings")
      .select("product_id, discord_role_id");

    // Add user to guild + assign roles
    const roleIds = (mappings ?? [])
      .filter((m) => activeProductIds.includes(m.product_id))
      .map((m) => m.discord_role_id);

    await addToGuild(discordUser.id, access_token, roleIds);

    // Sync all roles
    if (mappings && mappings.length > 0) {
      await syncRoles(discordUser.id, activeProductIds, mappings);
    }

    // Create notification
    await admin.from("notifications").insert({
      user_id: userId,
      title: "Discord Terhubung!",
      body: `Akun Discord ${discordUser.username} berhasil terhubung. Role Discord kamu sudah diperbarui.`,
      type: "success",
      link: "/profile",
    });

    return NextResponse.redirect(`${baseUrl}/profile?discord=success`);
  } catch (error) {
    console.error("Discord callback error:", error);
    return NextResponse.redirect(`${baseUrl}/profile?discord=error`);
  }
}
