export type PlanId = "free" | "gb10" | "gb20" | "tb1" | "tb2";

export const PLANS: { id: PlanId; name: string; bytes: number; price: number }[] = [
  { id: "free", name: "5 GB", bytes: 5 * 1024 ** 3, price: 0 },
  { id: "gb10", name: "10 GB", bytes: 10 * 1024 ** 3, price: 1.0 },
  { id: "gb20", name: "20 GB", bytes: 20 * 1024 ** 3, price: 2.0 },
  { id: "tb1", name: "1 TB", bytes: 1024 ** 4, price: 5.99 },
  { id: "tb2", name: "2 TB", bytes: 2 * 1024 ** 4, price: 7.99 },
];

export const getPlan = (id: string) => PLANS.find((p) => p.id === id) ?? PLANS[0]!;

export const effectivePlan = (plan: string, expires: string | null) =>
  plan !== "free" && expires && new Date(expires) > new Date() ? getPlan(plan) : PLANS[0]!;

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  const u = ["KB", "MB", "GB", "TB"];
  let i = -1;
  do { b /= 1024; i++; } while (b >= 1024 && i < u.length - 1);
  return `${b.toFixed(b < 10 ? 1 : 0)} ${u[i]}`;
}

export const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@nimbo.app`;
