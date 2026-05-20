import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";
import { HeaderClient } from "@/components/HeaderClient";

export async function Header() {
  const supabase = await getSupabaseServerClient();
  const [{ data }, settings] = await Promise.all([
    supabase.auth.getUser(),
    getSiteSettings(),
  ]);
  const user = data.user;
  let isAdmin = false;
  if (user) {
    const { data: adminCheck } = await supabase.rpc("is_admin", { uid: user.id });
    isAdmin = adminCheck === true;
  }

  return (
    <HeaderClient
      avatarUrl={settings.avatar_url}
      signedIn={!!user}
      isAdmin={isAdmin}
    />
  );
}
