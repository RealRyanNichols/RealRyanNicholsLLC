"use client";

import { useState } from "react";
import { AdminNav } from "@/components/AdminNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={[
        "lg:grid lg:min-h-[calc(100vh-4rem)] lg:transition-[grid-template-columns] lg:duration-300",
        collapsed
          ? "lg:grid-cols-[5.75rem_minmax(0,1fr)]"
          : "lg:grid-cols-[clamp(20rem,24vw,27rem)_minmax(0,1fr)]",
      ].join(" ")}
    >
      <aside className="lg:border-r lg:border-[var(--color-line)] lg:bg-[var(--color-paper)]/80 lg:px-5 lg:pt-6">
        <AdminNav collapsed={collapsed} onCollapsedChange={setCollapsed} />
      </aside>
      <div className="min-w-0 lg:border-l lg:border-[var(--color-line-soft)]/60">
        {children}
      </div>
    </div>
  );
}
