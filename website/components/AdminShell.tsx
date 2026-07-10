import { AdminNav } from "@/components/AdminNav";

// One narrow rail, one content column. No collapse machinery — the rail is
// small enough that hiding it was never worth a button.
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:grid lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[13.5rem_minmax(0,1fr)]">
      <aside className="lg:border-r lg:border-[var(--color-line)] lg:bg-[var(--color-paper)]/80 lg:px-3 lg:pt-5">
        <AdminNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
