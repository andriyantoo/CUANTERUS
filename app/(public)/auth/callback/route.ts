import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addSubscriber, MAILKETING_LIST_REGISTER } from "@/lib/mailketing";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Add new user to Mailketing register list (fire and forget)
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        addSubscriber({
          listId: MAILKETING_LIST_REGISTER,
          email: user.email,
          firstName: user.user_metadata?.full_name || "",
        }).catch((err) => console.error("[Mailketing] Auth callback error:", err));
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
