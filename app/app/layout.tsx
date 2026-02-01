import { AppShell } from "@/components/layout/AppShell";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export default async function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <AppShell role={null}>{children}</AppShell>;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user
    ? ((
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
      ).data?.role ?? null)
    : null;

  // Layout do /app assume autenticação (as páginas já protegem). Se não houver
  // user, deixamos o children lidar com redirect/erro.
  return <AppShell role={role}>{children}</AppShell>;
}
