const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const BASE_URL = "https://api.xendit.co";

function getAuthHeader() {
  return "Basic " + Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64");
}

interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}

interface XenditInvoice {
  id: string;
  external_id: string;
  amount: number;
  status: string;
  invoice_url: string;
  expiry_date: string;
}

export async function createInvoice(params: CreateInvoiceParams): Promise<XenditInvoice> {
  const res = await fetch(`${BASE_URL}/v2/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      payer_email: params.payerEmail,
      description: params.description,
      success_redirect_url: params.successRedirectUrl,
      failure_redirect_url: params.failureRedirectUrl,
      currency: "IDR",
      invoice_duration: 86400, // 24 hours
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create Xendit invoice");
  }

  return res.json();
}

export function verifyWebhookToken(token: string): boolean {
  return token === process.env.XENDIT_CALLBACK_TOKEN;
}
