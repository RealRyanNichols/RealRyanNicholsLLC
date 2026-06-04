import { NextResponse } from "next/server";
import { COUNSEL_COOKIE } from "@/lib/counsel";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/counsel", request.url));
  res.cookies.set(COUNSEL_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
