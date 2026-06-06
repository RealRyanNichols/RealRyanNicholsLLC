import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export type BlueprintStats = {
  paidSales: number;
  grossCents: number;
  questionnaires: number;
  leads: number;
};

// Dashboard summary for the legal-tech blueprint. blueprint_orders /
// blueprint_intake are service-role only, so this runs with the service client.
export async function getBlueprintStats(): Promise<BlueprintStats> {
  const empty: BlueprintStats = {
    paidSales: 0,
    grossCents: 0,
    questionnaires: 0,
    leads: 0,
  };
  if (!isSupabaseServiceConfigured()) return empty;

  const service = getSupabaseServiceClient();
  const [ordersRes, subRes, leadRes] = await Promise.all([
    service.from("blueprint_orders").select("amount_paid, payment_status"),
    service
      .from("blueprint_intake")
      .select("id", { count: "exact", head: true })
      .neq("status", "lead"),
    service
      .from("blueprint_intake")
      .select("id", { count: "exact", head: true })
      .eq("status", "lead"),
  ]);

  const orders = (ordersRes.data ?? []) as {
    amount_paid: number | null;
    payment_status: string | null;
  }[];
  const paid = orders.filter((o) => o.payment_status === "paid");

  return {
    paidSales: paid.length,
    grossCents: paid.reduce((sum, o) => sum + (o.amount_paid ?? 0), 0),
    questionnaires: subRes.count ?? 0,
    leads: leadRes.count ?? 0,
  };
}
