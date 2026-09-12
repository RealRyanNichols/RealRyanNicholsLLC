import type { Metadata } from "next";
import type { ReactNode } from "react";
import { withMainPageOg } from "@/lib/page-metadata";

export const metadata: Metadata = withMainPageOg("/login", {
  title: "Sign in",
  description: "Sign in to your RealRyanNichols.com account.",
});

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
