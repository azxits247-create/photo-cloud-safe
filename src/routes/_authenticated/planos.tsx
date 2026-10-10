import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Check, Copy, Loader2, PartyPopper } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAccount } from "@/lib/useAccount";
import { PLANS, brl, type PlanId } from "@/lib/plans";
import { createPixCharge, checkPayment } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({ meta: [{ title: "Planos — Nimbo" }, { name: "description", content: "Aumente seu espaço na nuvem com pagamento via PIX." }] }),
  component: Plans,
});

type Charge = { id: string; pix_code: string | null; amount: number; plan: string };

function Plans() {
  const account = useAccount();
  const qc = useQueryClient();
  const create = useServerFn(createPixCharge);
  const check = useServerFn(checkPayment);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [charge, setCharge] = useState<Charge | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!charge || paid) return;
    const t = setInterval(async () => {
      try {
        const r = await check({ data: { id: charge.id } });
        if (r.status === "paid") { setPaid(true); qc.invalidateQueries({ queryKey: ["account"] }); }
      } catch { /* keep polling */ }
    }, 5000);
    return () => clearInterval(t);
  }, [charge, paid]);

  async function buy(id: PlanId) {
    setLoadingPlan(id);
    try {
      const c = await create({ data: { plan: id as "gb20" } });
      setPaid(false);
      setCharge({ ...c, amount: Number(c.amount) });
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível gerar o PIX");
    } finally { setLoadingPlan(null); }
  }

  const a = account.data;
  const expires = a?.profile?.plan_expires_at && a.plan.id !== "free" ? new Date(a.profile.plan_expires_at).toLocaleDateString("pt-BR") : null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold">Escolha seu espaço</h1>
        <p className="mt-1 text-muted-foreground">
          Plano atual: <b className="text-foreground">{a?.plan.name ?? "…"}</b>{expires && ` · válido até ${expires}`}. Pagamento mensal via PIX, liberado na hora.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const current = a?.plan.id === p.id;
            return (
              <div key={p.id} className={`flex flex-col rounded-3xl bg-card p-6 shadow-soft ${current ? "ring-2 ring-primary" : ""}`}>
                <p className="font-display text-3xl font-bold">{p.name}</p>
                <p className="mt-2 text-muted-foreground">{p.price === 0 ? "Grátis" : <><b className="text-2xl text-foreground">{brl(p.price)}</b> / mês</>}</p>
                <div className="mt-auto pt-6">
                  {p.price === 0 ? (
                    <Button variant="secondary" className="w-full" disabled>{current ? "Plano atual" : "Incluso"}</Button>
                  ) : (
                    <Button className="w-full" disabled={!!loadingPlan} onClick={() => buy(p.id)}>
                      {loadingPlan === p.id ? <Loader2 className="animate-spin" /> : null}
                      {current ? "Renovar +30 dias" : "Assinar com PIX"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Dialog open={!!charge} onOpenChange={(o) => !o && setCharge(null)}>
        <DialogContent className="max-w-sm">
          {paid ? (
            <div className="py-6 text-center">
              <PartyPopper className="mx-auto h-12 w-12 text-success" />
              <h2 className="mt-3 text-xl font-bold">Pagamento confirmado!</h2>
              <p className="text-muted-foreground">Seu novo espaço já está liberado.</p>
              <Button className="mt-5 w-full" onClick={() => setCharge(null)}>Fechar</Button>
            </div>
          ) : charge && (
            <>
              <DialogHeader>
                <DialogTitle>Pague {brl(charge.amount)} com PIX</DialogTitle>
                <DialogDescription>Escaneie o QR code ou copie o código. A liberação é automática.</DialogDescription>
              </DialogHeader>
              {charge.pix_code && (
                <div className="mx-auto rounded-2xl bg-card p-3"><QRCodeSVG value={charge.pix_code} size={210} /></div>
              )}
              <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(charge.pix_code ?? ""); toast.success("Código copiado"); }}>
                <Copy /> Copiar código PIX
              </Button>
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Aguardando pagamento…</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
