import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/discord/link
 * Redirects user to Discord OAuth to link their account
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL));
  }

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/discord/callback`,
    response_type: "code",
    scope: "identify guilds.join",
    state: user.id,
  });

  return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
}
