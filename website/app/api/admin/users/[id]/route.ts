import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

// Delete a PENDING account — the ghost signups that never finished a
// profile. Deliberately refuses anything already active/verified/banned:
// those have history (comments, claims) and should be handled from the
// users queue, not a dashboard swipe.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (auth.user.id === id) {
    return NextResponse.json(
      { error: "You can't delete your own account from here." },
      { status: 400 },
    );
  }
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Service role not configured." },
      { status: 503 },
    );
  }

  const svc = getSupabaseServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  if (profile.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending accounts can be deleted here. Use the users queue for the rest." },
      { status: 409 },
    );
  }

  // Remove the auth user (profile row follows via cascade; delete it
  // explicitly too in case the FK isn't cascading).
  const { error: authError } = await svc.auth.admin.deleteUser(id);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }
  await svc.from("profiles").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
