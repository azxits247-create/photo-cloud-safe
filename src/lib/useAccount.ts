import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { effectivePlan } from "./plans";

export function useAccount() {
  return useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const [{ data: profile }, { data: sizes }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).single(),
        supabase.from("photos").select("size_bytes").eq("user_id", uid),
      ]);
      const used = (sizes ?? []).reduce((a, r) => a + Number(r.size_bytes), 0);
      const plan = effectivePlan(profile?.plan ?? "free", profile?.plan_expires_at ?? null);
      return { uid, profile, used, plan };
    },
  });
}
