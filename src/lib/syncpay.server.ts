const BASE = "https://api.syncpayments.com.br/api/partner/v1";

async function getToken() {
  const client_id = process.env["SYNCPAY_CLIENT_ID"];
  const client_secret = process.env["SYNCPAY_CLIENT_SECRET"];
  if (!client_id || !client_secret) throw new Error("Pagamentos ainda não configurados.");
  const res = await fetch(`${BASE}/auth-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id, client_secret }),
  });
  if (!res.ok) throw new Error(`SyncPay auth falhou (${res.status})`);
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

export async function createCashIn(amount: number, description: string, webhookUrl: string) {
  const token = await getToken();
  const res = await fetch(`${BASE}/cash-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, description, webhook_url: webhookUrl }),
  });
  if (!res.ok) throw new Error(`SyncPay cobrança falhou (${res.status}): ${await res.text()}`);
  return (await res.json()) as { pix_code: string; identifier: string };
}

export async function getTransactionStatus(identifier: string) {
  const token = await getToken();
  const res = await fetch(`${BASE}/transaction/${encodeURIComponent(identifier)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { data?: { status?: string } };
  return j.data?.status ?? null;
}

/** Marks payment paid (idempotent) and extends the user's plan by 30 days. */
export async function activatePayment(identifier: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: pay } = await supabaseAdmin
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("identifier", identifier)
    .eq("status", "pending")
    .select()
    .maybeSingle();
  if (!pay) return false;
  const { data: prof } = await supabaseAdmin.from("profiles").select("plan, plan_expires_at").eq("id", pay.user_id).single();
  const now = Date.now();
  const cur = prof?.plan === pay.plan && prof.plan_expires_at ? new Date(prof.plan_expires_at).getTime() : 0;
  const expires = new Date(Math.max(now, cur) + 30 * 24 * 3600 * 1000).toISOString();
  await supabaseAdmin.from("profiles").update({ plan: pay.plan, plan_expires_at: expires }).eq("id", pay.user_id);
  return true;
}
