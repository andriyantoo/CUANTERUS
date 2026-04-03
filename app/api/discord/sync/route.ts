import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/discord/sync
 * Syncs an admin's forum post/reply to the mapped Discord channel via webhook.
 * Only admins can trigger this.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { type, channel_id, title, body, thread_url } = await request.json();

    // Get the channel's Discord webhook URL
    const { data: channel } = await supabase
      .from("forum_channels")
      .select("discord_webhook_url, name, icon")
      .eq("id", channel_id)
      .single();

    if (!channel?.discord_webhook_url) {
      return NextResponse.json({ error: "No Discord webhook configured for this channel" }, { status: 400 });
    }

    // Build Discord embed
    const authorName = profile.full_name || "Admin";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cuanterus.vercel.app";

    let embed;

    if (type === "thread") {
      embed = {
        title: title,
        description: body.length > 2000 ? body.substring(0, 2000) + "..." : body,
        color: 0x96FC03, // lime green
        author: {
          name: `${authorName} (Mentor)`,
          icon_url: `${baseUrl}/favicon.ico`,
        },
        footer: {
          text: `${channel.icon || "#"} ${channel.name} • Cuanterus Forum`,
        },
        timestamp: new Date().toISOString(),
        ...(thread_url ? { url: `${baseUrl}${thread_url}` } : {}),
      };
    } else {
      // Reply
      embed = {
        description: body.length > 2000 ? body.substring(0, 2000) + "..." : body,
        color: 0x222229,
        author: {
          name: `${authorName} (Mentor) replied`,
          icon_url: `${baseUrl}/favicon.ico`,
        },
        footer: {
          text: `${channel.icon || "#"} ${channel.name} • Cuanterus Forum`,
        },
        timestamp: new Date().toISOString(),
        ...(thread_url ? { url: `${baseUrl}${thread_url}` } : {}),
      };
    }

    // Send to Discord webhook
    const discordRes = await fetch(channel.discord_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Cuanterus Forum",
        avatar_url: `${baseUrl}/favicon.ico`,
        embeds: [embed],
      }),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord webhook error:", errText);
      return NextResponse.json({ error: "Discord webhook failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Discord sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
