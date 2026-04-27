import { MISSION_CONTROL_HTML } from "@/lib/missionControlHtml";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <iframe
      title="Mission Control"
      srcDoc={MISSION_CONTROL_HTML}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      className="h-[calc(100vh-3.25rem)] w-full rounded-lg border border-white/10 bg-black"
    />
  );
}
