import { permanentRedirect } from "next/navigation";

// Builds are now delivered through LeadFlow Pro (theleadflowpro.com).
// This page retired the $250 "founder rate" offer; /services is the one
// canonical place to hire Ryan. Redirect keeps old shared links alive
// and kills the stale "today only" OG image that was still circulating.
export default function BuildPage() {
  permanentRedirect("/services");
}
