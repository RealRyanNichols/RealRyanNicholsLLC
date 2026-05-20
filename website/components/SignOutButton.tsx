"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  async function onClick() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }
  return (
    <button
      onClick={onClick}
      className="text-sm underline text-[var(--color-accent)] hover:opacity-80"
    >
      Sign out
    </button>
  );
}
