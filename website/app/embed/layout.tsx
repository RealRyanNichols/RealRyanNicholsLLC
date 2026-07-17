// Layout for /embed/* — widgets that live inside OTHER people's sites via
// iframe. The client chrome (HeaderClient, PathPicker, RyanChat, mobile bar)
// gates itself off /embed by pathname; the server-rendered Footer can't, so
// this layout hides it with a route-scoped style. Keep embeds lean: no bands,
// no funnels — the widget IS the page.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl p-2">
      <style>{`footer { display: none } main { padding: 0 !important; margin: 0 !important }`}</style>
      {children}
    </div>
  );
}
