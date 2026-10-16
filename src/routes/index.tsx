import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Baixar Nimbo — Fotos na nuvem" },
      { name: "description", content: "Instale o Nimbo e guarde suas fotos na nuvem com 5 GB grátis. Planos a partir de R$ 1,00 por mês via PIX." },
      { property: "og:title", content: "Baixar Nimbo — Fotos na nuvem" },
      { property: "og:description", content: "Instale o Nimbo para guardar suas memórias. 5 GB grátis e planos até 2 TB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => { void navigate({ to: "/galeria", replace: true }); }, [navigate]);
  return <p className="p-8 text-center text-muted-foreground">Abrindo Nimbo…</p>;
}
