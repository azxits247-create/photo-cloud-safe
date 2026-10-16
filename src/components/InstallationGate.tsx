import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Download, ArrowUpRight, Cloud, Check, Share, PlusSquare, EllipsisVertical, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Logo } from "@/components/AppHeader";
import { PLANS, brl } from "@/lib/plans";
import { isInstalledMode, type InstallPromptEvent } from "@/lib/installation";
import cover from "@/assets/install-cover.jpg";

const InstalledContext = createContext(false);
export const useInstalledMode = () => useContext(InstalledContext);

export function InstallationGate({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("android");
  const [instructions, setInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(display-mode: standalone)");
    const syncMode = () => setInstalled(isInstalledMode(query.matches, (navigator as Navigator & { standalone?: boolean }).standalone));
    syncMode();
    query.addEventListener("change", syncMode);
    const ua = navigator.userAgent;
    setPlatform(/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(ua) ? "android" : "desktop");
    const beforeInstall = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    const afterInstall = () => { setPrompt(null); setInstructions(true); };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", afterInstall);
    return () => {
      query.removeEventListener("change", syncMode);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", afterInstall);
    };
  }, []);

  async function install() {
    if (!prompt) { setInstructions(true); return; }
    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstructions(true);
      setPrompt(null);
    } catch { setInstructions(true); }
    finally { setInstalling(false); }
  }

  if (installed) return <InstalledContext.Provider value={true}>{children}</InstalledContext.Provider>;

  return (
    <div className="install-page">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Cloud className="h-4 w-4 text-primary" /> Fotos na nuvem</span>
      </header>
      <main>
        <section className="install-hero mx-auto max-w-6xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-muted">
            <img src={cover} alt="Lago de águas claras entre montanhas, uma memória de viagem" width={1536} height={1024} className="install-cover w-full object-cover" />
            <div className="install-scrim absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-cover-foreground sm:p-12">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-cover-badge px-3 py-1.5 text-xs font-bold"><span className="h-1.5 w-1.5 rounded-full bg-success" /> 5 GB grátis</span>
              <h1 className="text-4xl font-bold leading-tight sm:text-6xl">Nimbo</h1>
              <p className="mt-2 max-w-sm text-lg leading-relaxed text-cover-foreground/90">Um lugar para todas<br className="sm:hidden" /> as suas memórias.</p>
              <Button size="lg" className="mt-6 h-12 rounded-full bg-card px-6 text-card-foreground shadow-soft hover:bg-card/90" onClick={install} disabled={installing}>
                <Download className="h-5 w-5" /> {installing ? "Aguarde…" : "Baixar o app"} <ArrowUpRight className="h-4 w-4" />
              </Button>
              <p className="mt-3 text-xs text-cover-foreground/80">Instale e abra pelo ícone para entrar.</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 py-5 text-xs font-medium text-muted-foreground"><Check className="h-4 w-4 text-success" /> Suas fotos na nuvem. Seu espaço, só seu.</div>
        </section>
        <section className="mx-auto max-w-6xl px-5 pb-12 pt-4 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Seu espaço</p><h2 className="mt-1 text-2xl font-bold">Pequenos momentos.<br className="sm:hidden" /> Grandes memórias.</h2></div>
            <Cloud className="hidden h-8 w-8 text-primary sm:block" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {PLANS.map(p => <div key={p.id} className="rounded-lg border border-border bg-card p-4 last:col-span-2 sm:last:col-span-1"><p className="font-display text-xl font-bold">{p.name}</p><p className="mt-2 text-sm text-muted-foreground">{p.price === 0 ? "Grátis" : <><span className="font-bold text-foreground">{brl(p.price)}</span><span className="block text-xs">por mês · PIX</span></>}</p></div>)}
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-6xl px-5 pb-8 text-xs text-muted-foreground sm:px-8">Nimbo · Fotos na nuvem</footer>
      <Dialog open={instructions} onOpenChange={setInstructions}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary"><Smartphone /></div><DialogTitle>Instale o Nimbo</DialogTitle><DialogDescription>Adicione à tela inicial e abra pelo ícone do Nimbo para entrar na sua conta. É necessário internet.</DialogDescription></DialogHeader>
          <ol className="space-y-4 py-2 text-sm">
            {platform === "ios" ? <>
              <li className="flex items-center gap-3"><span className="install-step">1</span> Abra este endereço no Safari.</li>
              <li className="flex items-center gap-3"><span className="install-step">2</span><span>Toque em <Share className="inline h-4 w-4 text-primary" /> Compartilhar.</span></li>
              <li className="flex items-center gap-3"><span className="install-step">3</span><span><PlusSquare className="inline h-4 w-4 text-primary" /> Adicionar à Tela de Início; mantenha “Abrir como App” ativado, se aparecer.</span></li>
            </> : platform === "android" ? <>
              <li className="flex items-center gap-3"><span className="install-step">1</span> Abra este endereço no Chrome.</li>
              <li className="flex items-center gap-3"><span className="install-step">2</span><span>Toque no menu <EllipsisVertical className="inline h-4 w-4 text-primary" /> e em “Adicionar à tela inicial”.</span></li>
              <li className="flex items-center gap-3"><span className="install-step">3</span> Escolha “Instalar” e abra o ícone Nimbo. Um atalho comum não libera o acesso.</li>
            </> : <>
              <li className="flex items-center gap-3"><span className="install-step">1</span> Abra no Chrome ou Edge.</li>
              <li className="flex items-center gap-3"><span className="install-step">2</span> No menu do navegador, escolha instalar esta página como aplicativo.</li>
              <li className="flex items-center gap-3"><span className="install-step">3</span> Abra o Nimbo pela lista de aplicativos.</li>
            </>}
          </ol>
          <p className="text-xs text-muted-foreground">Se a opção não aparecer, abra o endereço público em um navegador compatível, fora desta prévia.</p>
          <Button className="w-full rounded-full" onClick={() => setInstructions(false)}>Entendi</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}