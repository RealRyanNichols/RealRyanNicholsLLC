import { redirect } from "next/navigation";

// Donations removed. Any old /support links now land on the feed —
// Ryan sells what he builds; he does not pass the hat.
export default function SupportPage() {
  redirect("/");
}
