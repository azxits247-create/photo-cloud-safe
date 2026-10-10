import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPlan } from "./plans";

export const createPixCharge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ plan: z.enum(["gb20", "tb1", "tb2"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const { createCashIn } = await import("./syncpay.server");
    const plan = getPlan(data.plan);
    const origin = new URL(getRequest().url).origin;
    const charge = await createCashIn(plan.price, `Nimbo ${plan.name} - 1 mês`, `${origin}/api/public/syncpay-webhook`);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("payments")
      .insert({ user_id: context.userId, plan: plan.id, amount: plan.price, identifier: charge.identifier, pix_code: charge.pix_code })
      .select("id, pix_code, amount, plan")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const checkPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: pay } = await context.supabase.from("payments").select("identifier, status").eq("id", data.id).single();
    if (!pay) throw new Error("Pagamento não encontrado");
    if (pay.status === "paid") return { status: "paid" };
    if (!pay.identifier) return { status: pay.status };
    const { getTransactionStatus, activatePayment } = await import("./syncpay.server");
    const s = await getTransactionStatus(pay.identifier);
    if (s === "completed") {
      await activatePayment(pay.identifier);
      return { status: "paid" };
    }
    return { status: "pending" };
  });
