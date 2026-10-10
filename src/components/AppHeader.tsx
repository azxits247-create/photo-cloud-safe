import { Link, useNavigate } from "@tanstack/react-router";
import { Cloud, Images, Gem, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const link = "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground";
  const active = { className: "bg-card text-foreground shadow-soft" };
  return (
    <header className="sticky top-0 z-20 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/galeria"><Logo /></Link>
        <nav className="flex items-center gap-1">
          <Link to="/galeria" className={link} activeProps={active}><Images className="h-4 w-4" /><span className="hidden sm:inline">Fotos</span></Link>
          <Link to="/planos" className={link} activeProps={active}><Gem className="h-4 w-4" /><span className="hidden sm:inline">Planos</span></Link>
          <button
            className={link}
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            aria-label="Sair"
          ><LogOut className="h-4 w-4" /></button>
        </nav>
      </div>
    </header>
  );
}
