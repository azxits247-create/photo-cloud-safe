import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/AppHeader";
import { usernameToEmail } from "@/lib/plans";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Nimbo" },
      { name: "description", content: "Entre ou crie sua conta Nimbo com nome de usuário e senha." },
      { property: "og:title", content: "Entrar — Nimbo" },
      { property: "og:description", content: "Entre ou crie sua conta Nimbo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,30}$/.test(u)) return toast.error("Use 3 a 30 letras, números, _ ou .");
    if (password.length < 6) return toast.error("A senha precisa de pelo menos 6 caracteres.");
    setLoading(true);
    const email = usernameToEmail(u);
    const { error } = mode === "up"
      ? await supabase.auth.signUp({ email, password, options: { data: { username: u } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const msg = error.message.includes("already") ? "Esse nome já está em uso." :
        error.message.includes("Invalid") ? "Nome ou senha incorretos." : error.message;
      return toast.error(msg);
    }
    return void navigate({ to: "/galeria" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl glass p-8 shadow-soft">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <h1 className="text-center text-2xl font-bold">{mode === "in" ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === "in" ? "Suas fotos estão te esperando." : "Ganhe 5 GB grátis na nuvem."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="u">Nome de usuário</Label>
            <Input id="u" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p">Senha</Label>
            <Input id="p" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <button className="mt-4 w-full text-center text-sm font-semibold text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
        {mode === "up" && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Guarde bem sua senha: sem e-mail, não é possível recuperá-la.</p>
        )}
      </div>
    </main>
  );
}
