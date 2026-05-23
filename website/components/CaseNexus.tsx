"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, type ZoomBehavior } from "d3-zoom";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

// ─── Wire types straight from the SQL RPCs ─────────────────────────────
type RawDefendantNode = {
  id: string;
  type: "defendant";
  label: string;
  slug: string;
  claim_status: string;
  has_sentence: boolean;
  has_charges: boolean;
  case_number: string | null;
};
type RawCaseNode = {
  id: string;
  type: "case";
  label: string;
  defendant_count: number;
};
type RawDocumentNode = {
  id: string;
  type: "document";
  label: string;
  doc_url: string;
};
type RawNode = RawDefendantNode | RawCaseNode | RawDocumentNode;
type RawEdge = {
  source: string;
  target: string;
  kind: "member_of" | "has_document";
};
type GraphPayload = {
  nodes: RawNode[];
  edges: RawEdge[];
  seed?: { cases: number; defendants: number };
};

type SearchHit = {
  id: string;
  label: string;
  type: "defendant" | "case";
  sub: string;
};

// ─── Simulation node — the live position-bearing copy ──────────────────
type SimNode = SimulationNodeDatum & {
  node: RawNode;
};
type SimLink = SimulationLinkDatum<SimNode> & { kind: RawEdge["kind"] };

// ─── Constants ─────────────────────────────────────────────────────────
const W = 1100;
const H = 650;

// Node radius / color by type. Bigger = more important visually.
function nodeRadius(n: RawNode): number {
  if (n.type === "case") return 6 + Math.min(18, Math.sqrt(n.defendant_count) * 3.5);
  if (n.type === "defendant") return 5.5;
  return 3;
}
function nodeFill(n: RawNode): string {
  if (n.type === "case") return "#1f2f55";
  if (n.type === "defendant") {
    if (n.claim_status === "verified") return "#7fe3a9";
    if (n.claim_status === "pending") return "#ffd166";
    return "#e08658";
  }
  return "#7c8aa6";
}
function nodeStroke(n: RawNode, selected: boolean): string {
  if (selected) return "#ffffff";
  if (n.type === "case") return "#3a557c";
  if (n.type === "defendant" && n.claim_status === "verified") return "#3aa672";
  return "#0e1a36";
}

// ─── Component ─────────────────────────────────────────────────────────
export function CaseNexus({ initial }: { initial: GraphPayload }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);

  // Authoritative graph state — we keep these in refs (NOT React state)
  // so we don't re-render on every tick. React only re-renders on
  // structural changes (added nodes) and selection changes.
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);

  const [version, setVersion] = useState(0); // bumps when the graph grows
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingExpand, setLoadingExpand] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // Seed the graph on mount.
  useEffect(() => {
    mergePayload(initial, /* center */ true);
    setVersion((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mergePayload: dedupe nodes by id, dedupe edges by source/target.
  // New defendant nodes are placed near their case node so the layout
  // doesn't ricochet on expand. (If the case is already laid out, new
  // members appear right where they belong.)
  function mergePayload(p: GraphPayload, center: boolean) {
    const existingById = new Map(nodesRef.current.map((n) => [n.node.id, n]));
    for (const rn of p.nodes) {
      if (existingById.has(rn.id)) {
        // Keep position. Optionally upgrade the node (e.g. claim_status).
        existingById.get(rn.id)!.node = rn;
      } else {
        // Place new defendant near its case node if we know it.
        let x = W / 2;
        let y = H / 2;
        if (rn.type === "defendant" && rn.case_number) {
          const caseNode = existingById.get("case:" + rn.case_number);
          if (caseNode?.x != null && caseNode?.y != null) {
            x = caseNode.x + (Math.random() - 0.5) * 40;
            y = caseNode.y + (Math.random() - 0.5) * 40;
          } else if (!center) {
            x = W / 2 + (Math.random() - 0.5) * 80;
            y = H / 2 + (Math.random() - 0.5) * 80;
          }
        } else if (rn.type === "document") {
          // Documents anchor to their defendant later via the link force.
          x = W / 2 + (Math.random() - 0.5) * 80;
          y = H / 2 + (Math.random() - 0.5) * 80;
        }
        const sn: SimNode = { node: rn, x, y };
        nodesRef.current.push(sn);
        existingById.set(rn.id, sn);
      }
    }

    const existingLinkKey = new Set(
      linksRef.current.map((l) => {
        const s = typeof l.source === "string" ? l.source : (l.source as SimNode).node.id;
        const t = typeof l.target === "string" ? l.target : (l.target as SimNode).node.id;
        return `${s}::${t}::${l.kind}`;
      }),
    );
    for (const e of p.edges) {
      const k = `${e.source}::${e.target}::${e.kind}`;
      if (existingLinkKey.has(k)) continue;
      const sNode = existingById.get(e.source);
      const tNode = existingById.get(e.target);
      if (!sNode || !tNode) continue;
      linksRef.current.push({ source: sNode, target: tNode, kind: e.kind });
      existingLinkKey.add(k);
    }
  }

  // Run / restart the force simulation whenever the graph grows.
  useEffect(() => {
    if (simRef.current) simRef.current.stop();
    const sim = forceSimulation<SimNode>(nodesRef.current)
      .force(
        "link",
        forceLink<SimNode, SimLink>(linksRef.current)
          .id((d) => d.node.id)
          .distance((l) => (l.kind === "has_document" ? 30 : 60))
          .strength((l) => (l.kind === "has_document" ? 0.4 : 0.7)),
      )
      .force("charge", forceManyBody().strength(-110))
      .force("center", forceCenter(W / 2, H / 2).strength(0.04))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => nodeRadius(d.node) + 2),
      )
      .alpha(0.9)
      .alphaDecay(0.035)
      .on("tick", tick);

    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [version]);

  // Direct-to-DOM tick: update the SVG circles + lines from the
  // simulation's mutated x/y, no React state churn.
  function tick() {
    const g = gRef.current;
    if (!g) return;
    const circles = g.querySelectorAll<SVGCircleElement>("circle[data-nid]");
    circles.forEach((c) => {
      const id = c.getAttribute("data-nid")!;
      const n = nodesRef.current.find((nn) => nn.node.id === id);
      if (!n) return;
      c.setAttribute("cx", String(n.x ?? 0));
      c.setAttribute("cy", String(n.y ?? 0));
    });
    const labels = g.querySelectorAll<SVGTextElement>("text[data-nid]");
    labels.forEach((t) => {
      const id = t.getAttribute("data-nid")!;
      const n = nodesRef.current.find((nn) => nn.node.id === id);
      if (!n) return;
      t.setAttribute("x", String(n.x ?? 0));
      t.setAttribute("y", String((n.y ?? 0) - nodeRadius(n.node) - 4));
    });
    const lines = g.querySelectorAll<SVGLineElement>("line[data-eid]");
    lines.forEach((ln) => {
      const sId = ln.getAttribute("data-source")!;
      const tId = ln.getAttribute("data-target")!;
      const sN = nodesRef.current.find((nn) => nn.node.id === sId);
      const tN = nodesRef.current.find((nn) => nn.node.id === tId);
      if (!sN || !tN) return;
      ln.setAttribute("x1", String(sN.x ?? 0));
      ln.setAttribute("y1", String(sN.y ?? 0));
      ln.setAttribute("x2", String(tN.x ?? 0));
      ln.setAttribute("y2", String(tN.y ?? 0));
    });
  }

  // Pan + zoom via d3-zoom on the SVG root. Applies transform to the
  // top-level <g> so all children scale together.
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);
    const z: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(z);
    return () => {
      svg.on(".zoom", null);
    };
  }, []);

  const selectedNode = useMemo<RawNode | null>(
    () =>
      selectedId
        ? nodesRef.current.find((n) => n.node.id === selectedId)?.node ?? null
        : null,
    // version dep so we re-resolve when the graph mutates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedId, version],
  );

  // Expand: pull the 1-hop neighborhood of the selected node and merge.
  const expandSelected = useCallback(async () => {
    if (!selectedNode) return;
    setLoadingExpand(true);
    try {
      const [typ, ...rest] = selectedNode.id.split(":");
      const id = rest.join(":");
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.rpc("nexus_neighbors", {
        p_node_type: typ,
        p_node_id: id,
      });
      if (data) {
        mergePayload(data as GraphPayload, false);
        setVersion((v) => v + 1);
      }
    } finally {
      setLoadingExpand(false);
    }
  }, [selectedNode]);

  // Debounced search.
  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.rpc("nexus_search", { q: query.trim() });
      setHits((data as SearchHit[]) ?? []);
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  // Picking a search result: fetch its 1-hop, merge, focus.
  async function pickHit(h: SearchHit) {
    setSearchOpen(false);
    setQuery(h.label);
    const [typ, ...rest] = h.id.split(":");
    const id = rest.join(":");
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.rpc("nexus_neighbors", {
      p_node_type: typ,
      p_node_id: id,
    });
    if (data) {
      mergePayload(data as GraphPayload, false);
      setVersion((v) => v + 1);
      setSelectedId(h.id);
    }
  }

  const totalNodes = nodesRef.current.length;
  const totalDefendants = nodesRef.current.filter(
    (n) => n.node.type === "defendant",
  ).length;
  const totalCases = nodesRef.current.filter((n) => n.node.type === "case").length;
  const totalDocs = nodesRef.current.filter(
    (n) => n.node.type === "document",
  ).length;

  return (
    <div className="relative">
      <div className="rounded-2xl overflow-hidden border-2 border-[var(--color-blue)] bg-[#0a1429]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full h-auto cursor-grab active:cursor-grabbing select-none"
          role="img"
          aria-label="Interactive knowledge graph of January 6 defendants, cases, and documents. Pan with drag, zoom with wheel, click a node to see its details and expand its connections."
        >
          <g ref={gRef}>
            {/* Edges first so they sit behind nodes */}
            {linksRef.current.map((l, i) => {
              const s = typeof l.source === "string" ? null : (l.source as SimNode);
              const t = typeof l.target === "string" ? null : (l.target as SimNode);
              const sId = s?.node.id ?? (l.source as unknown as string);
              const tId = t?.node.id ?? (l.target as unknown as string);
              return (
                <line
                  key={`${sId}-${tId}-${i}`}
                  data-eid={i}
                  data-source={sId}
                  data-target={tId}
                  stroke={l.kind === "has_document" ? "#3a557c" : "#5a7aa6"}
                  strokeWidth={l.kind === "has_document" ? 0.6 : 1}
                  strokeOpacity={l.kind === "has_document" ? 0.5 : 0.7}
                />
              );
            })}
            {/* Nodes */}
            {nodesRef.current.map((sn) => {
              const isSelected = selectedId === sn.node.id;
              return (
                <g key={sn.node.id}>
                  <circle
                    data-nid={sn.node.id}
                    r={nodeRadius(sn.node) + (isSelected ? 2 : 0)}
                    fill={nodeFill(sn.node)}
                    stroke={nodeStroke(sn.node, isSelected)}
                    strokeWidth={isSelected ? 2.5 : 1}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(sn.node.id);
                    }}
                  >
                    <title>{nodeTitle(sn.node)}</title>
                  </circle>
                  {sn.node.type === "case" ? (
                    <text
                      data-nid={sn.node.id}
                      className="pointer-events-none select-none"
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="ui-monospace, monospace"
                      fontWeight="bold"
                      fill="#cfd9ea"
                    >
                      {sn.node.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Top-left: live counts + legend */}
        <div className="absolute top-3 left-3 z-10 max-w-[14rem]">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7fe3a9] flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#7fe3a9] animate-pulse" />
            Case Nexus · live
          </div>
          <div className="mt-1.5 text-[11px] font-mono text-[#a9b7d0] leading-tight">
            {totalCases} cases · {totalDefendants} defendants
            {totalDocs > 0 ? ` · ${totalDocs} docs` : null}
          </div>
          <div className="mt-2 space-y-0.5 text-[10px] font-mono text-[#7c8aa6]">
            <LegendDot color="#1f2f55" stroke="#3a557c">case (sized by # defendants)</LegendDot>
            <LegendDot color="#7fe3a9" stroke="#3aa672">verified defendant</LegendDot>
            <LegendDot color="#ffd166" stroke="#0e1a36">claim pending</LegendDot>
            <LegendDot color="#e08658" stroke="#0e1a36">unclaimed</LegendDot>
            <LegendDot color="#7c8aa6" stroke="#0e1a36">document</LegendDot>
          </div>
        </div>

        {/* Top-right: search */}
        <div className="absolute top-3 right-3 z-10 w-[20rem] max-w-[60vw]">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
              placeholder="Search a name or case number…"
              className="w-full rounded-md border border-[#3a557c] bg-[#0e1a36] px-3 py-2 text-[12px] font-mono text-[var(--color-paper)] placeholder:text-[#7c8aa6] focus:border-[#7fe3a9] focus:outline-none"
              aria-label="Search the graph"
            />
            {searchOpen && hits.length > 0 ? (
              <ul className="absolute top-full mt-1 left-0 right-0 bg-[#0e1a36] border border-[#3a557c] rounded-md shadow-lg max-h-80 overflow-auto z-20">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickHit(h)}
                      className="w-full text-left px-3 py-2 hover:bg-[#1c2a4a] flex items-baseline justify-between gap-3"
                    >
                      <span className="text-[12px] text-[var(--color-paper)] truncate">
                        <span
                          className={
                            h.type === "case"
                              ? "text-[#7fa9e3]"
                              : "text-[#e08658]"
                          }
                        >
                          {h.type === "case" ? "case" : "def."}
                        </span>{" "}
                        {h.label}
                      </span>
                      <span className="text-[10px] text-[#7c8aa6] font-mono whitespace-nowrap">
                        {h.sub}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* Bottom hint */}
        <p className="absolute bottom-2 left-3 text-[9px] text-[#7c8aa6] font-mono uppercase tracking-wider z-10 select-none pointer-events-none">
          drag · scroll · click a node
        </p>
      </div>

      {/* Detail drawer */}
      {selectedNode ? (
        <div className="mt-3 rounded-2xl border-2 border-[#7fe3a9] bg-[#0e1a36] text-[#cfd9ea] p-5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
            <h3 className="text-lg font-bold tracking-tight text-[var(--color-paper)]">
              {nodeHeadline(selectedNode)}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-[10px] uppercase tracking-wider text-[#7c8aa6] hover:text-[var(--color-paper)] font-bold"
            >
              Close ×
            </button>
          </div>

          <NodeDetail node={selectedNode} />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={expandSelected}
              disabled={loadingExpand}
              className="rounded-full border-2 border-[#7fe3a9] bg-[#7fe3a9]/15 px-4 py-1.5 text-xs font-bold text-[#7fe3a9] hover:bg-[#7fe3a9]/25 disabled:opacity-50 transition"
            >
              {loadingExpand ? "Expanding…" : "Expand connections →"}
            </button>
            {selectedNode.type === "defendant" ? (
              <Link
                href={`/case/people/${selectedNode.slug}`}
                className="rounded-full border border-[#3a557c] bg-[#0a1429] px-4 py-1.5 text-xs font-bold text-[#cfd9ea] hover:border-[#7fe3a9] hover:text-[#7fe3a9] transition"
              >
                Open profile →
              </Link>
            ) : null}
            {selectedNode.type === "document" ? (
              <a
                href={
                  selectedNode.doc_url.startsWith("http")
                    ? selectedNode.doc_url
                    : `https://web.archive.org/web/2023*/https://www.justice.gov${selectedNode.doc_url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#3a557c] bg-[#0a1429] px-4 py-1.5 text-xs font-bold text-[#cfd9ea] hover:border-[#7fe3a9] hover:text-[#7fe3a9] transition"
              >
                Open document (Wayback) →
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function nodeTitle(n: RawNode): string {
  if (n.type === "case") return `Case ${n.label} · ${n.defendant_count} defendants`;
  if (n.type === "defendant")
    return `${n.label} (${n.claim_status})${n.case_number ? ` · ${n.case_number}` : ""}`;
  return n.label;
}

function nodeHeadline(n: RawNode): string {
  if (n.type === "case") return `Case ${n.label}`;
  return n.label;
}

function NodeDetail({ node }: { node: RawNode }) {
  if (node.type === "case") {
    return (
      <p className="text-xs text-[#a9b7d0] font-mono">
        Co-defendant cluster · {node.defendant_count} defendants on this case
        number. Click expand to pull every defendant + their archived
        documents into the graph.
      </p>
    );
  }
  if (node.type === "defendant") {
    return (
      <div className="space-y-1.5 text-xs text-[#a9b7d0] font-mono">
        <p>
          Status:{" "}
          <span className="text-[var(--color-paper)]">
            {node.claim_status === "verified"
              ? "verified by defendant"
              : node.claim_status === "pending"
                ? "claim pending review"
                : "unclaimed (free for the defendant to claim)"}
          </span>
        </p>
        {node.case_number ? (
          <p>
            Case: <span className="text-[var(--color-paper)]">{node.case_number}</span>
          </p>
        ) : null}
        <p className="text-[#7c8aa6]">
          {node.has_charges ? "Charges on file. " : "No charges parsed yet. "}
          {node.has_sentence ? "Sentence on file." : "No sentence on file."}
        </p>
      </div>
    );
  }
  return (
    <p className="text-xs text-[#a9b7d0] font-mono break-all">
      {node.doc_url}
    </p>
  );
}

function LegendDot({
  color,
  stroke,
  children,
}: {
  color: string;
  stroke: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ background: color, boxShadow: `inset 0 0 0 1px ${stroke}` }}
        aria-hidden
      />
      <span>{children}</span>
    </div>
  );
}
