import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, X, Download, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAccount } from "@/lib/useAccount";
import { formatBytes } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/galeria")({
  head: () => ({ meta: [{ title: "Minhas fotos — Nimbo" }, { name: "description", content: "Sua galeria de fotos na nuvem." }, { property: "og:title", content: "Minhas fotos — Nimbo" }, { property: "og:description", content: "Suas memórias em uma galeria privada na nuvem." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Gallery,
});

type Photo = { id: string; path: string; name: string; size_bytes: number; url?: string };

function Gallery() {
  const qc = useQueryClient();
  const account = useAccount();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [viewer, setViewer] = useState<Photo | null>(null);

  const photos = useQuery({
    queryKey: ["photos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("photos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      if (!data.length) return [] as Photo[];
      const { data: signed } = await supabase.storage.from("photos").createSignedUrls(data.map((p) => p.path), 3600);
      return data.map((p, i) => ({ ...p, url: signed?.[i]?.signedUrl })) as Photo[];
    },
  });

  async function onFiles(files: FileList | null) {
    if (!files?.length || !account.data) return;
    const { uid, used, plan } = account.data;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    let free = plan.bytes - used;
    setUploading({ done: 0, total: list.length });
    let ok = 0;
    for (const f of list) {
      if (f.size > free) { toast.error(`Sem espaço para "${f.name}". Faça upgrade do plano.`); break; }
      const path = `${uid}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("photos").upload(path, f, { contentType: f.type });
      if (up.error) { toast.error(`Falha ao enviar "${f.name}"`); continue; }
      const ins = await supabase.from("photos").insert({ user_id: uid, path, name: f.name, size_bytes: f.size });
      if (ins.error) {
        await supabase.storage.from("photos").remove([path]);
        toast.error(ins.error.message.includes("QUOTA") ? "Espaço esgotado. Faça upgrade do plano." : `Falha ao salvar "${f.name}"`);
        break;
      }
      free -= f.size; ok++;
      setUploading({ done: ok, total: list.length });
    }
    setUploading(null);
    if (ok) toast.success(`${ok} foto(s) enviada(s)`);
    qc.invalidateQueries({ queryKey: ["photos"] });
    qc.invalidateQueries({ queryKey: ["account"] });
    if (input.current) input.current.value = "";
  }

  async function remove(p: Photo) {
    await supabase.storage.from("photos").remove([p.path]);
    await supabase.from("photos").delete().eq("id", p.id);
    setViewer(null);
    qc.invalidateQueries({ queryKey: ["photos"] });
    qc.invalidateQueries({ queryKey: ["account"] });
  }

  const a = account.data;
  const pct = a ? Math.min(100, (a.used / a.plan.bytes) * 100) : 0;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Olá, <b className="text-foreground">{a?.profile?.username}</b> · Plano {a?.plan.name}</p>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={pct} className="h-2.5 flex-1" />
              <span className="whitespace-nowrap text-sm font-semibold">{a ? `${formatBytes(a.used)} de ${a.plan.name}` : "…"}</span>
            </div>
            {pct > 80 && <Link to="/planos" className="mt-1 inline-block text-sm font-semibold text-primary">Precisa de mais espaço? Ver planos</Link>}
          </div>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <Button size="lg" className="rounded-full" disabled={!!uploading || !a} onClick={() => input.current?.click()}>
            <Upload /> {uploading ? `Enviando ${uploading.done}/${uploading.total}` : "Enviar fotos"}
          </Button>
        </div>

        {photos.isLoading ? (
          <p className="mt-10 text-center text-muted-foreground">Carregando…</p>
        ) : !photos.data?.length ? (
          <div className="mt-16 flex flex-col items-center text-center text-muted-foreground">
            <ImageOff className="h-12 w-12" />
            <p className="mt-3">Nenhuma foto ainda. Envie a primeira!</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
            {photos.data.map((p) => (
              <button key={p.id} onClick={() => setViewer(p)} className="aspect-square overflow-hidden rounded-xl bg-muted">
                {p.url && <img src={p.url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-105" />}
              </button>
            ))}
          </div>
        )}
      </main>

      {viewer && (
        <div className="fixed inset-0 z-50 flex flex-col bg-foreground/95" onClick={() => setViewer(null)}>
          <div className="flex justify-end gap-2 p-3" onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="icon" asChild><a href={viewer.url} download={viewer.name} target="_blank" rel="noreferrer"><Download /></a></Button>
            <Button variant="destructive" size="icon" onClick={() => remove(viewer)}><Trash2 /></Button>
            <Button variant="secondary" size="icon" onClick={() => setViewer(null)}><X /></Button>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <img src={viewer.url} alt={viewer.name} className="max-h-full max-w-full rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
