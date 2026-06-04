"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COUNSEL_COOKIE, counselTokenForLogin } from "@/lib/counsel";

export async function counselLogin(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) redirect("/counsel?e=1");

  const token = await counselTokenForLogin(username, password);
  if (!token) redirect("/counsel?e=1");

  const jar = await cookies();
  jar.set(COUNSEL_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/counsel");
}
