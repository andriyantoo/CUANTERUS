const MAILKETING_API_URL = "https://api.mailketing.co.id/api/v1";
const MAILKETING_API_TOKEN = process.env.MAILKETING_API_TOKEN!;

/** Default list IDs — set these in .env */
export const MAILKETING_LIST_REGISTER = process.env.MAILKETING_LIST_REGISTER || "";
export const MAILKETING_LIST_PAID = process.env.MAILKETING_LIST_PAID || "";

interface AddSubscriberParams {
  listId: string;
  email: string;
  firstName: string;
}

interface SendEmailParams {
  fromName: string;
  fromEmail: string;
  recipient: string;
  subject: string;
  content: string;
}

interface MailketingList {
  list_id: string;
  list_name: string;
}

/**
 * Add a subscriber to a Mailketing list.
 * Silently fails (logs error) so it never blocks the main flow.
 */
export async function addSubscriber({ listId, email, firstName }: AddSubscriberParams) {
  if (!MAILKETING_API_TOKEN || !listId) {
    console.warn("[Mailketing] Skipped addSubscriber — missing API token or list ID");
    return null;
  }

  try {
    const res = await fetch(`${MAILKETING_API_URL}/addsubtolist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_token: MAILKETING_API_TOKEN,
        list_id: listId,
        email,
        first_name: firstName,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Mailketing] addSubscriber error:", data);
      return null;
    }

    console.log(`[Mailketing] Subscriber added: ${email} → list ${listId}`);
    return data;
  } catch (err) {
    console.error("[Mailketing] addSubscriber failed:", err);
    return null;
  }
}

/**
 * Send an email via Mailketing API.
 */
export async function sendEmail({ fromName, fromEmail, recipient, subject, content }: SendEmailParams) {
  if (!MAILKETING_API_TOKEN) {
    console.warn("[Mailketing] Skipped sendEmail — missing API token");
    return null;
  }

  try {
    const res = await fetch(`${MAILKETING_API_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_token: MAILKETING_API_TOKEN,
        from_name: fromName,
        from_email: fromEmail,
        recipient,
        subject,
        content,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Mailketing] sendEmail error:", data);
      return null;
    }

    console.log(`[Mailketing] Email sent to ${recipient}: "${subject}"`);
    return data;
  } catch (err) {
    console.error("[Mailketing] sendEmail failed:", err);
    return null;
  }
}

/**
 * Get all lists from Mailketing account.
 */
export async function getAllLists(): Promise<MailketingList[]> {
  if (!MAILKETING_API_TOKEN) {
    throw new Error("Missing MAILKETING_API_TOKEN");
  }

  const res = await fetch(`${MAILKETING_API_URL}/viewlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_token: MAILKETING_API_TOKEN }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch Mailketing lists");
  }

  return res.json();
}
