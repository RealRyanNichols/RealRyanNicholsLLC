import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const VERCEL_API = "https://api.vercel.com";
const PROJECT_ID = "prj_sP8kjwFhQ3FtstDx2sxY5uxMQjce";
const TEAM_ID = "team_2a0TrkWvu7Mv1IIMToSYyhER";

function teamQuery(extra?: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  params.set("teamId", TEAM_ID);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }
  }
  return params.toString();
}

async function vercelFetch(
  path: string,
  init: RequestInit,
  token: string,
): Promise<Response> {
  return fetch(`${VERCEL_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

async function listDeployments(token: string, limit: number) {
  const qs = teamQuery({ projectId: PROJECT_ID, limit });
  const r = await vercelFetch(`/v6/deployments?${qs}`, { method: "GET" }, token);
  if (!r.ok) {
    const text = await r.text();
    return { error: `Vercel ${r.status}: ${text}` };
  }
  const json = (await r.json()) as { deployments?: unknown[] };
  const deployments = Array.isArray(json.deployments)
    ? json.deployments.map((d) => {
        const dep = d as Record<string, unknown>;
        return {
          id: dep.uid ?? dep.id,
          uid: dep.uid,
          url: dep.url,
          state: dep.state ?? dep.readyState,
          readyState: dep.readyState,
          createdAt: dep.createdAt ?? dep.created,
          ready: dep.ready,
          target: dep.target,
        };
      })
    : [];
  return { deployments };
}

async function deployToVercel(token: string) {
  const latest = await listDeployments(token, 1);
  if ("error" in latest) return latest;
  const latestDep = latest.deployments[0] as
    | { uid?: string; id?: string }
    | undefined;
  const sourceId = latestDep?.uid ?? latestDep?.id;
  if (!sourceId) return { error: "No prior deployment to redeploy from" };

  const qs = teamQuery();
  const r = await vercelFetch(
    `/v13/deployments?${qs}`,
    {
      method: "POST",
      body: JSON.stringify({
        name: "realryannicholsllc",
        target: "production",
        deploymentId: sourceId,
      }),
    },
    token,
  );
  if (!r.ok) {
    const text = await r.text();
    return { error: `Vercel ${r.status}: ${text}` };
  }
  const json = (await r.json()) as Record<string, unknown>;
  return {
    id: json.id ?? json.uid,
    uid: json.uid,
    url: json.url,
    state: json.readyState ?? json.status,
  };
}

async function pingSite(rawUrl: string) {
  const allowed = /^https:\/\/(.+\.)?faretta\.legal\/?$/i;
  if (!allowed.test(rawUrl)) {
    return { ok: false, error: "URL not allowed" };
  }
  const t0 = Date.now();
  try {
    const r = await fetch(rawUrl, { method: "GET", cache: "no-store" });
    return {
      ok: r.ok,
      status: r.status,
      ms: Date.now() - t0,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data, error: userErr } = await supabase.auth.getUser();
  if (userErr || !data.user || !isAdminEmail(data.user.email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "VERCEL_TOKEN not configured" },
      { status: 500 },
    );
  }

  let body: { name?: string; args?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { name, args } = body;
  if (!name) {
    return NextResponse.json({ error: "missing tool name" }, { status: 400 });
  }

  if (name === "list_deployments") {
    const limit = Math.min(Number(args?.limit ?? 10) || 10, 50);
    const result = await listDeployments(token, limit);
    if ("error" in result) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  }

  if (name === "deploy_to_vercel") {
    const result = await deployToVercel(token);
    if ("error" in result) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  }

  if (name === "ping_site") {
    const url = String(args?.url ?? "https://faretta.legal");
    const result = await pingSite(url);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: `unknown tool: ${name}` }, { status: 400 });
}
