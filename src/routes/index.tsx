import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Zap, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/AppHeader";
import { PLANS, brl } from "@/lib/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nimbo — Suas fotos guardadas na nuvem" },
      { name: "description", content: "Guarde suas fotos na nuvem com 5 GB grátis. Planos de 20 GB, 1 TB e 2 TB pagos via PIX." },
      { property: "og:title", content: "Nimbo — Suas fotos guardadas na nuvem" },
      { property: "og:description", content: "5 GB grátis. Planos a partir de R$ 2,00 por mês via PIX." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button>
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-16 pt-12 text-center">
        <span className="inline-block rounded-full bg-accent/30 px-4 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">5 GB grátis para sempre</span>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
          Suas memórias,<br /><span className="bg-gradient-primary bg-clip-text text-transparent">seguras na nuvem.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Envie fotos do celular ou computador e acesse de qualquer lugar. Simples, privado e rápido.
        </p>
        <Button asChild size="lg" className="mt-8 h-12 rounded-full px-8 text-base shadow-soft"><Link to="/auth">Começar grátis</Link></Button>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[[ShieldCheck, "Privado", "Só você vê suas fotos"], [Zap, "Rápido", "Envio de várias fotos de uma vez"], [Smartphone, "Em qualquer lugar", "Celular ou computador"]].map(([I, t, d]: any) => (
            <div key={t} className="rounded-2xl glass p-5 text-left shadow-soft">
              <I className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-center text-3xl font-bold">Planos</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.id} className="rounded-3xl bg-card p-6 shadow-soft">
              <p className="font-display text-3xl font-bold">{p.name}</p>
              <p className="mt-2 text-muted-foreground">{p.price === 0 ? "Grátis" : <><b className="text-foreground">{brl(p.price)}</b> / mês</>}</p>
              <p className="mt-4 flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" /> Pagamento via PIX</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
