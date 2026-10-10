import { createFileRoute } from "@tanstack/react-router";

function findIdentifier(body: any): string | null {
  const c = [body?.identifier, body?.data?.identifier, body?.data?.id, body?.id, body?.data?.reference_id];
  const v = c.find((x) => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x));
  return v ?? null;
}

export const Route = createFileRoute("/api/public/syncpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown = null;
        try { body = await request.json(); } catch { return new Response("bad", { status: 400 }); }
        const id = findIdentifier(body);
        if (!id) return new Response("ok");
        // Never trust the payload: confirm status directly with SyncPay before activating.
        const { getTransactionStatus, activatePayment } = await import("@/lib/syncpay.server");
        const status = await getTransactionStatus(id);
        if (status === "completed") await activatePayment(id);
        return new Response("ok");
      },
    },
  },
});
