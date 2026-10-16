import { Link, useNavigate } from "@tanstack/react-router";
import { Cloud, Images, Gem, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-xl font-bold">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
        <Cloud className="h-5 w-5" />
      </span>
      Nimbo
    </span>
  );
}

export function AppHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/galeria"><Logo /></Link>
        <span className="text-xs font-semibold text-muted-foreground">Seu espaço na nuvem</span>
        <nav aria-label="Navegação do app" className="app-pill-nav">
          <Button asChild variant="ghost" className="h-12 rounded-full px-5"><Link to="/galeria" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" }}><Images className="h-5 w-5" />Fotos</Link></Button>
          <Button asChild variant="ghost" className="h-12 rounded-full px-5"><Link to="/planos" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" }}><Gem className="h-5 w-5" />Planos</Link></Button>
          <span className="mx-1 h-6 w-px bg-border" />
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-muted-foreground" title="Sair da conta" aria-label="Sair da conta" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}><LogOut className="h-5 w-5" /></Button>
        </nav>
      </div>
    </header>
  );
}
