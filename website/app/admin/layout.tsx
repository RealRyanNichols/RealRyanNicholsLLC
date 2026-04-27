import { ReactNode } from "react";
import AdminNav from "./AdminNav";

export const metadata = {
  title: "Admin | Faretta.Legal",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0e16] text-cyan-50">
      <AdminNav />
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}
