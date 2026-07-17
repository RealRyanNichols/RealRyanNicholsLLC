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
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { trackEvent } from "@/lib/analytics";

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
type RawConnectorKind =
  | "source"
  | "court"
  | "docket_type"
  | "case_year"
  | "agency"
  | "facility"
  | "charge"
  | "person"
  | "pattern";
type RawConnectorNode = {
  id: string;
  type: "connector";
  label: string;
  connector_kind: RawConnectorKind;
  count: number;
};
type RawNode = RawDefendantNode | RawCaseNode | RawDocumentNode | RawConnectorNode;
type RawEdge = {
  source: string;
  target: string;
  kind:
    | "member_of"
    | "has_document"
    | "sourced_by"
    | "filed_in"
    | "filed_year"
    | "docket_type"
    | "shared_agency"
    | "shared_facility"
    | "shared_charge"
    | "connected_to";
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
  targetX?: number;
  targetY?: number;
};
type SimLink = SimulationLinkDatum<SimNode> & { kind: RawEdge["kind"] };

// ─── Constants ─────────────────────────────────────────────────────────
const W = 1180;
const H = 620;
const MAP_PADDING = 56;

// Node radius / color by type. Bigger = more important visually.
function nodeRadius(n: RawNode): number {
  if (n.type === "connector") {
    return 10 + Math.min(18, Math.sqrt(Math.max(1, n.count)) * 2.8);
  }
  if (n.type === "case") return 6 + Math.min(18, Math.sqrt(n.defendant_count) * 3.5);
  if (n.type === "defendant") return 5.5;
  return 3;
}
function nodeFill(n: RawNode): string {
  if (n.type === "connector") {
    if (n.connector_kind === "source") return "#e1bd5b";
    if (n.connector_kind === "court") return "#7fa9e3";
    if (n.connector_kind === "facility") return "#ffd166";
    if (n.connector_kind === "charge") return "#f08a8a";
    return "#d8c89e";
  }
  if (n.type === "case") return "#1f2f55";
  if (n.type === "defendant") {
    if (n.claim_status === "verified") return "#e1bd5b";
    if (n.claim_status === "pending") return "#ffd166";
    return "#e08658";
  }
  return "#7c8aa6";
}
function nodeStroke(n: RawNode, selected: boolean): string {
  if (selected) return "#ffffff";
  if (n.type === "connector") return "#d8e4f7";
  if (n.type === "case") return "#3a557c";
  if (n.type === "defendant" && n.claim_status === "verified") return "#3aa672";
  return "#0e1a36";
}

function connectorRank(kind: RawConnectorKind): number {
  switch (kind) {
    case "source": return 0;
    case "court": return 1;
    case "facility": return 2;
    case "agency": return 3;
    case "case_year": return 4;
    case "docket_type": return 5;
    case "charge": return 6;
    case "person": return 7;
    default: return 8;
  }
}

function linkStroke(kind: RawEdge["kind"]): string {
  if (kind === "has_document") return "#3a557c";
  if (kind === "member_of") return "#6389bd";
  if (kind === "sourced_by") return "#e1bd5b";
  if (kind === "filed_in") return "#7fa9e3";
  if (kind === "shared_facility") return "#ffd166";
  if (kind === "shared_charge") return "#f08a8a";
  return "#d8c89e";
}

function linkWidth(kind: RawEdge["kind"]): number {
  if (kind === "has_document") return 0.7;
  if (kind === "member_of") return 1.15;
  if (kind === "sourced_by" || kind === "filed_in") return 1.7;
  return 1.1;
}

function linkOpacity(kind: RawEdge["kind"], inFocus: boolean): number {
  if (!inFocus) return 0.08;
  if (kind === "has_document") return 0.42;
  if (kind === "member_of") return 0.68;
  return 0.82;
}

function linkNodeId(value: SimLink["source"] | SimLink["target"]): string {
  return typeof value === "string" ? value : (value as SimNode).node.id;
}

function hashNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function caseYearLabel(caseNumber: string): string | null {
  const match = caseNumber.match(/^\d{1,2}:(\d{2})-/);
  if (!match) return null;
  return `20${match[1]}`;
}

function docketTypeLabel(caseNumber: string): { id: string; label: string } | null {
  if (/-cr-/i.test(caseNumber)) {
    return { id: "criminal", label: "Criminal case filings" };
  }
  if (/-mj-/i.test(caseNumber)) {
    return { id: "magistrate", label: "Magistrate case filings" };
  }
  if (/-cv-/i.test(caseNumber)) {
    return { id: "civil", label: "Civil filings" };
  }
  return null;
}

function addConnector(
  nodes: Map<string, RawNode>,
  id: string,
  label: string,
  connector_kind: RawConnectorKind,
  increment = 1,
) {
  const existing = nodes.get(id);
  if (existing?.type === "connector") {
    existing.count += increment;
    return;
  }
  nodes.set(id, {
    id,
    type: "connector",
    label,
    connector_kind,
    count: increment,
  });
}

function addEdge(edges: Map<string, RawEdge>, edge: RawEdge) {
  const key = `${edge.source}::${edge.target}::${edge.kind}`;
  if (!edges.has(key)) edges.set(key, edge);
}

function withPublicRecordConnectors(payload: GraphPayload): GraphPayload {
  const nodeMap = new Map<string, RawNode>(payload.nodes.map((node) => [node.id, node]));
  const edgeMap = new Map<string, RawEdge>(
    payload.edges.map((edge) => [`${edge.source}::${edge.target}::${edge.kind}`, edge]),
  );
  const cases = payload.nodes.filter(
    (node): node is RawCaseNode => node.type === "case",
  );
  if (cases.length === 0) return payload;

  const dojId = "connector:source:doj-usao-dc";
  const archiveId = "connector:source:salvaged-capitol-breach-record";
  const courtId = "connector:court:us-district-court-dc";
  addConnector(nodeMap, dojId, "DOJ / USAO-DC Capitol Breach Cases", "source", cases.length);
  addConnector(nodeMap, archiveId, "Salvaged Capitol Breach record", "source", cases.length);
  addConnector(nodeMap, courtId, "U.S. District Court for D.C.", "court", cases.length);

  for (const caseNode of cases) {
    addEdge(edgeMap, { source: caseNode.id, target: dojId, kind: "sourced_by" });
    addEdge(edgeMap, { source: caseNode.id, target: archiveId, kind: "sourced_by" });
    addEdge(edgeMap, { source: caseNode.id, target: courtId, kind: "filed_in" });

    const year = caseYearLabel(caseNode.label);
    if (year) {
      const yearId = `connector:year:${year}`;
      addConnector(nodeMap, yearId, `${year} filing year`, "case_year");
      addEdge(edgeMap, { source: caseNode.id, target: yearId, kind: "filed_year" });
    }

    const docket = docketTypeLabel(caseNode.label);
    if (docket) {
      const docketId = `connector:docket:${docket.id}`;
      addConnector(nodeMap, docketId, docket.label, "docket_type");
      addEdge(edgeMap, { source: caseNode.id, target: docketId, kind: "docket_type" });
    }
  }

  return {
    ...payload,
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  };
}

function readableCaseCenters(count: number): Array<{ x: number; y: number }> {
  if (count === 0) return [];
  const cols = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(count * 1.4))));
  const rows = Math.ceil(count / cols);
  const usableW = W - MAP_PADDING * 2;
  const usableH = H - MAP_PADDING * 2;
  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MAP_PADDING + (usableW * (col + 0.5)) / cols;
    const y = MAP_PADDING + (usableH * (row + 0.5)) / rows;
    return { x, y };
  });
}

function radialCaseCenter(index: number, count: number): { x: number; y: number } {
  const firstRingCount = Math.min(22, Math.max(8, Math.ceil(count * 0.58)));
  const ring = index < firstRingCount ? 0 : 1 + Math.floor((index - firstRingCount) / 26);
  const ringIndex = index < firstRingCount ? index : (index - firstRingCount) % 26;
  const countOnRing =
    ring === 0
      ? firstRingCount
      : Math.min(26, Math.max(1, count - firstRingCount - (ring - 1) * 26));
  const angle = (ringIndex / Math.max(1, countOnRing)) * Math.PI * 2 - Math.PI / 2;
  const radius = 178 + ring * 92;
  return {
    x: W / 2 + Math.cos(angle) * radius,
    y: H / 2 + Math.sin(angle) * Math.min(radius * 0.7, 238),
  };
}

function applyReadableLayout(nodes: SimNode[], links: SimLink[]) {
  const byId = new Map(nodes.map((n) => [n.node.id, n]));
  const connectorNodes = nodes
    .filter((n): n is SimNode & { node: RawConnectorNode } => n.node.type === "connector")
    .sort(
      (a, b) =>
        connectorRank(a.node.connector_kind) - connectorRank(b.node.connector_kind) ||
        b.node.count - a.node.count ||
        a.node.label.localeCompare(b.node.label),
    );
  const centralConnectors = connectorNodes.filter((n) =>
    ["source", "court", "facility", "agency"].includes(n.node.connector_kind),
  );
  const outerConnectors = connectorNodes.filter((n) => !centralConnectors.includes(n));

  centralConnectors.forEach((node, index) => {
    const offsets = [
      { x: 0, y: 0 },
      { x: 0, y: 88 },
      { x: 0, y: -88 },
      { x: -118, y: 0 },
      { x: 118, y: 0 },
      { x: -118, y: 88 },
      { x: 118, y: 88 },
    ];
    const offset = offsets[index] ?? {
      x: Math.cos(index) * 150,
      y: Math.sin(index) * 120,
    };
    node.targetX = W / 2 + offset.x;
    node.targetY = H / 2 + offset.y;
  });

  outerConnectors.forEach((node, index) => {
    const ring = Math.floor(index / 14);
    const countOnRing = Math.min(14, Math.max(1, outerConnectors.length - ring * 14));
    const angle = ((index % 14) / countOnRing) * Math.PI * 2 - Math.PI / 2;
    const radius = 208 + ring * 58;
    node.targetX = W / 2 + Math.cos(angle) * radius;
    node.targetY = H / 2 + Math.sin(angle) * Math.min(radius * 0.68, 198);
  });

  const caseNodes = nodes
    .filter((n) => n.node.type === "case")
    .sort((a, b) => {
      const aCase = a.node as RawCaseNode;
      const bCase = b.node as RawCaseNode;
      return bCase.defendant_count - aCase.defendant_count || aCase.label.localeCompare(bCase.label);
    });
  const centers = readableCaseCenters(caseNodes.length);
  const caseCenterById = new Map<string, { x: number; y: number }>();

  caseNodes.forEach((node, index) => {
    const center =
      connectorNodes.length > 0
        ? radialCaseCenter(index, caseNodes.length)
        : centers[index] ?? { x: W / 2, y: H / 2 };
    node.targetX = center.x;
    node.targetY = center.y;
    caseCenterById.set(node.node.id, center);
  });

  const caseForDefendant = new Map<string, string>();
  for (const node of nodes) {
    if (node.node.type === "defendant" && node.node.case_number) {
      caseForDefendant.set(node.node.id, `case:${node.node.case_number}`);
    }
  }
  for (const link of links) {
    if (link.kind !== "member_of") continue;
    const sourceId = linkNodeId(link.source);
    const targetId = linkNodeId(link.target);
    const source = byId.get(sourceId)?.node;
    const target = byId.get(targetId)?.node;
    if (source?.type === "defendant" && target?.type === "case") {
      caseForDefendant.set(sourceId, targetId);
    } else if (source?.type === "case" && target?.type === "defendant") {
      caseForDefendant.set(targetId, sourceId);
    }
  }

  const membersByCase = new Map<string, SimNode[]>();
  for (const node of nodes) {
    if (node.node.type !== "defendant") continue;
    const caseId = caseForDefendant.get(node.node.id);
    if (!caseId) continue;
    const list = membersByCase.get(caseId) ?? [];
    list.push(node);
    membersByCase.set(caseId, list);
  }

  for (const [caseId, members] of membersByCase) {
    const center = caseCenterById.get(caseId) ?? { x: W / 2, y: H / 2 };
    members
      .sort((a, b) => a.node.label.localeCompare(b.node.label))
      .forEach((node, index) => {
        const ring = Math.floor(index / 16);
        const countOnRing = Math.min(16, Math.max(1, members.length - ring * 16));
        const angle = ((index % 16) / countOnRing) * Math.PI * 2 + ring * 0.38;
        const radius = 44 + ring * 24;
        node.targetX = center.x + Math.cos(angle) * radius;
        node.targetY = center.y + Math.sin(angle) * radius;
      });
  }

  const docCounts = new Map<string, number>();
  for (const link of links) {
    if (link.kind !== "has_document") continue;
    const sourceId = linkNodeId(link.source);
    const targetId = linkNodeId(link.target);
    const source = byId.get(sourceId);
    const target = byId.get(targetId);
    const defendant = source?.node.type === "defendant" ? source : target?.node.type === "defendant" ? target : null;
    const document = source?.node.type === "document" ? source : target?.node.type === "document" ? target : null;
    if (!defendant || !document) continue;
    const count = docCounts.get(defendant.node.id) ?? 0;
    docCounts.set(defendant.node.id, count + 1);
    const angle = (count / Math.max(4, count + 1)) * Math.PI * 2 + hashNumber(document.node.id) * 0.00001;
    document.targetX = (defendant.targetX ?? defendant.x ?? W / 2) + Math.cos(angle) * 24;
    document.targetY = (defendant.targetY ?? defendant.y ?? H / 2) + Math.sin(angle) * 24;
  }

  const looseNodes = nodes.filter((node) => node.targetX == null || node.targetY == null);
  looseNodes.forEach((node, index) => {
    const angle = (index / Math.max(1, looseNodes.length)) * Math.PI * 2;
    node.targetX = W / 2 + Math.cos(angle) * 210;
    node.targetY = H / 2 + Math.sin(angle) * 210;
  });

  for (const node of nodes) {
    const jitter = (hashNumber(node.node.id) % 17) - 8;
    if (node.x == null || node.y == null) {
      node.x = (node.targetX ?? W / 2) + jitter;
      node.y = (node.targetY ?? H / 2) - jitter;
    }
  }
}

// ─── Component ─────────────────────────────────────────────────────────
export function CaseNexus({
  initial,
  initialError = null,
}: {
  initial: GraphPayload;
  initialError?: string | null;
}) {
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
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(initialError);
  // Investigation filters — toggle whole entity classes and label clutter off
  // the board so you can isolate exactly what you're chasing.
  const [showDocs, setShowDocs] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const selectNode = useCallback(
    (id: string, origin: "graph" | "search") => {
      setSelectedId(id);
      trackEvent("nexus_node_select", {
        node_type: id.split(":")[0] || "unknown",
        origin,
      });
    },
    [],
  );

  // Seed the graph on mount.
  useEffect(() => {
    if (initialError) {
      setGraphError(initialError);
    }
    if (initial.nodes.length === 0) {
      setGraphError(
        initialError ??
          "The Case Nexus data feed is empty right now. The case archive is still available below.",
      );
      return;
    }
    mergePayload(initial);
    setVersion((v) => v + 1);
    trackEvent("nexus_loaded", {
      nodes: initial.nodes.length,
      edges: initial.edges.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mergePayload: dedupe nodes/edges, then re-apply a deterministic
  // investigation-map layout. The force engine only settles collisions;
  // it no longer gets to scatter the whole case across empty space.
  function mergePayload(p: GraphPayload) {
    const payload = withPublicRecordConnectors(p);
    const existingById = new Map(nodesRef.current.map((n) => [n.node.id, n]));
    for (const rn of payload.nodes) {
      if (existingById.has(rn.id)) {
        // Keep position. Optionally upgrade the node (e.g. claim_status).
        existingById.get(rn.id)!.node = rn;
      } else {
        const sn: SimNode = { node: rn };
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
    for (const e of payload.edges) {
      const k = `${e.source}::${e.target}::${e.kind}`;
      if (existingLinkKey.has(k)) continue;
      const sNode = existingById.get(e.source);
      const tNode = existingById.get(e.target);
      if (!sNode || !tNode) continue;
      linksRef.current.push({ source: sNode, target: tNode, kind: e.kind });
      existingLinkKey.add(k);
    }
    applyReadableLayout(nodesRef.current, linksRef.current);
  }

  // Run / restart the force simulation whenever the graph grows.
  useEffect(() => {
    if (simRef.current) simRef.current.stop();
    const sim = forceSimulation<SimNode>(nodesRef.current)
      .force(
        "link",
        forceLink<SimNode, SimLink>(linksRef.current)
          .id((d) => d.node.id)
          .distance((l) => {
            if (l.kind === "has_document") return 22;
            if (l.kind === "member_of") return 48;
            if (l.kind === "sourced_by" || l.kind === "filed_in") return 150;
            return 118;
          })
          .strength((l) => {
            if (l.kind === "has_document") return 0.35;
            if (l.kind === "member_of") return 0.48;
            if (l.kind === "sourced_by" || l.kind === "filed_in") return 0.82;
            return 0.55;
          }),
      )
      .force(
        "charge",
        forceManyBody<SimNode>().strength((d) => {
          if (d.node.type === "connector") return -170;
          if (d.node.type === "case") return -82;
          return -34;
        }),
      )
      .force("x", forceX<SimNode>((d) => d.targetX ?? W / 2).strength((d) => (d.node.type === "connector" ? 0.9 : d.node.type === "case" ? 0.68 : 0.22)))
      .force("y", forceY<SimNode>((d) => d.targetY ?? H / 2).strength((d) => (d.node.type === "connector" ? 0.9 : d.node.type === "case" ? 0.68 : 0.22)))
      .force("center", forceCenter(W / 2, H / 2).strength(0.025))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => nodeRadius(d.node) + 6),
      )
      .alpha(0.75)
      .alphaDecay(0.06)
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
  // top-level <g> so all children scale together. Crucially, this does
  // NOT hijack page scrolling:
  //   • plain mouse wheel  → the page scrolls (zoom needs ⌘/Ctrl)
  //   • single-finger touch → the page scrolls; two fingers pan/zoom
  //   • mouse drag (button 0) → pans the graph
  const zoomRef = useRef<{
    svg: ReturnType<typeof select<SVGSVGElement, unknown>>;
    z: ZoomBehavior<SVGSVGElement, unknown>;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = select<SVGSVGElement, unknown>(svgRef.current);
    const g = select(gRef.current);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .filter((event) => {
        const e = event as WheelEvent & TouchEvent & MouseEvent;
        if (e.type === "wheel") return e.ctrlKey || e.metaKey;
        if (e.type === "touchstart" || e.type === "touchmove")
          return (e.touches?.length ?? 0) >= 2;
        return !e.button;
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(z);
    zoomRef.current = { svg, z };
    return () => {
      svg.on(".zoom", null);
      zoomRef.current = null;
    };
  }, []);

  const zoomByFactor = useCallback((k: number) => {
    const r = zoomRef.current;
    if (r) r.z.scaleBy(r.svg, k);
  }, []);
  const resetZoom = useCallback(() => {
    const r = zoomRef.current;
    if (r) r.z.transform(r.svg, zoomIdentity);
  }, []);
  const fitMap = useCallback((ids?: Set<string>) => {
    const r = zoomRef.current;
    if (!r) return;
    const nodes = ids
      ? nodesRef.current.filter((n) => ids.has(n.node.id))
      : nodesRef.current;
    if (nodes.length === 0) return;
    const bounds = nodes.reduce(
      (acc, n) => {
        const radius = nodeRadius(n.node) + 24;
        const x = n.x ?? n.targetX ?? W / 2;
        const y = n.y ?? n.targetY ?? H / 2;
        return {
          minX: Math.min(acc.minX, x - radius),
          maxX: Math.max(acc.maxX, x + radius),
          minY: Math.min(acc.minY, y - radius),
          maxY: Math.max(acc.maxY, y + radius),
        };
      },
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      },
    );
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const scale = Math.max(0.4, Math.min(3.2, Math.min(W / width, H / height) * 0.92));
    const centerX = bounds.minX + width / 2;
    const centerY = bounds.minY + height / 2;
    r.z.transform(
      r.svg,
      zoomIdentity
        .translate(W / 2 - centerX * scale, H / 2 - centerY * scale)
        .scale(scale),
    );
  }, []);
  const centerNode = useCallback((id: string, scale = 2.2) => {
    const r = zoomRef.current;
    const node = nodesRef.current.find((n) => n.node.id === id);
    if (!r || !node) return;
    const x = node.x ?? node.targetX ?? W / 2;
    const y = node.y ?? node.targetY ?? H / 2;
    r.z.transform(
      r.svg,
      zoomIdentity.translate(W / 2 - x * scale, H / 2 - y * scale).scale(scale),
    );
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
  const selectedNeighborhood = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const ids = new Set<string>([selectedId]);
    for (const link of linksRef.current) {
      const sourceId = linkNodeId(link.source);
      const targetId = linkNodeId(link.target);
      if (sourceId === selectedId) ids.add(targetId);
      if (targetId === selectedId) ids.add(sourceId);
    }
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, version]);

  useEffect(() => {
    if (selectedId) return;
    if (nodesRef.current.length === 0) return;
    const timer = window.setTimeout(() => fitMap(), 320);
    return () => window.clearTimeout(timer);
  }, [fitMap, selectedId, version]);

  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => centerNode(selectedId), 120);
    return () => window.clearTimeout(timer);
  }, [centerNode, selectedId, version]);

  // Expand: pull the 1-hop neighborhood of the selected node and merge.
  const expandSelected = useCallback(async () => {
    if (!selectedNode) return;
    if (selectedNode.type === "connector") {
      fitMap(selectedNeighborhood);
      trackEvent("nexus_connector_focus", {
        connector_kind: selectedNode.connector_kind,
      });
      return;
    }
    setLoadingExpand(true);
    setGraphError(null);
    trackEvent("nexus_expand", { node_type: selectedNode.type });
    try {
      const [typ, ...rest] = selectedNode.id.split(":");
      const id = rest.join(":");
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("nexus_neighbors", {
        p_node_type: typ,
        p_node_id: id,
      });
      if (error) {
        setGraphError("The Nexus could not load those connections. Try another node or refresh.");
        trackEvent("nexus_expand_failed", { node_type: selectedNode.type });
      } else if (data) {
        const payload = data as GraphPayload;
        mergePayload(payload);
        setVersion((v) => v + 1);
        trackEvent("nexus_expand_loaded", {
          node_type: selectedNode.type,
          nodes: payload.nodes.length,
          edges: payload.edges.length,
        });
      }
    } finally {
      setLoadingExpand(false);
    }
  }, [fitMap, selectedNeighborhood, selectedNode]);

  // Debounced search.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    if (q.length < 2) {
      setHits([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);
    const t = setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("nexus_search", { q });
      if (cancelled) return;
      if (error) {
        setHits([]);
        setSearchError("Search is temporarily unavailable.");
        trackEvent("nexus_search_failed", { query_length: q.length });
      } else {
        const results = ((data as SearchHit[]) ?? []).slice(0, 15);
        setHits(results);
        trackEvent("nexus_search", {
          query_length: q.length,
          results: results.length,
        });
      }
      setSearchLoading(false);
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  // Picking a search result: fetch its 1-hop, merge, focus.
  async function pickHit(h: SearchHit) {
    setSearchOpen(false);
    setQuery(h.label);
    setGraphError(null);
    trackEvent("nexus_search_pick", { result_type: h.type });
    const [typ, ...rest] = h.id.split(":");
    const id = rest.join(":");
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.rpc("nexus_neighbors", {
      p_node_type: typ,
      p_node_id: id,
    });
    if (error) {
      setGraphError("The Nexus could not load that search result. Try another result or refresh.");
      trackEvent("nexus_search_pick_failed", { result_type: h.type });
    } else if (data) {
      mergePayload(data as GraphPayload);
      setVersion((v) => v + 1);
      selectNode(h.id, "search");
    }
  }

  const totalDefendants = nodesRef.current.filter(
    (n) => n.node.type === "defendant",
  ).length;
  const totalCases = nodesRef.current.filter((n) => n.node.type === "case").length;
  const totalDocs = nodesRef.current.filter(
    (n) => n.node.type === "document",
  ).length;
  const totalConnectors = nodesRef.current.filter(
    (n) => n.node.type === "connector",
  ).length;
  const hasGraphData = nodesRef.current.length > 0;
  const visibleConnectors = nodesRef.current
    .filter((n): n is SimNode & { node: RawConnectorNode } => n.node.type === "connector")
    .sort(
      (a, b) =>
        connectorRank(a.node.connector_kind) - connectorRank(b.node.connector_kind) ||
        b.node.count - a.node.count ||
        a.node.label.localeCompare(b.node.label),
    )
    .slice(0, 10);
  const visibleCases = nodesRef.current
    .filter((n): n is SimNode & { node: RawCaseNode } => n.node.type === "case")
    .sort((a, b) => b.node.defendant_count - a.node.defendant_count)
    .slice(0, 18);
  const focusCount = selectedNeighborhood.size;

  return (
    <div className="relative">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="relative min-w-0 overflow-hidden rounded-xl border-2 border-[var(--color-blue)] bg-[#071126]">
          <div className="min-w-0 overflow-hidden">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="block h-[320px] w-full max-w-full cursor-grab select-none active:cursor-grabbing sm:h-[44vh] sm:min-h-[320px] sm:max-h-[480px] xl:h-[min(44vh,480px)] 2xl:h-[min(48vh,520px)]"
              style={{ touchAction: "pan-y" }}
              role="img"
              aria-label="Interactive evidence graph of January 6 cases, defendants, documents, and visible connections."
            >
              <g ref={gRef}>
                {linksRef.current.map((l, i) => {
                  const sId = linkNodeId(l.source);
                  const tId = linkNodeId(l.target);
                  const sType = (l.source as SimNode).node?.type;
                  const tType = (l.target as SimNode).node?.type;
                  const linkHidden =
                    (!showDocs && (sType === "document" || tType === "document")) ||
                    (!showHubs && (sType === "connector" || tType === "connector"));
                  const inFocus =
                    !selectedId ||
                    (selectedNeighborhood.has(sId) && selectedNeighborhood.has(tId));
                  return (
                    <line
                      key={`${sId}-${tId}-${i}`}
                      data-eid={i}
                      data-source={sId}
                      data-target={tId}
                      x1={(l.source as SimNode).x ?? 0}
                      y1={(l.source as SimNode).y ?? 0}
                      x2={(l.target as SimNode).x ?? 0}
                      y2={(l.target as SimNode).y ?? 0}
                      stroke={linkStroke(l.kind)}
                      strokeWidth={linkWidth(l.kind)}
                      strokeOpacity={linkHidden ? 0 : linkOpacity(l.kind, inFocus)}
                    />
                  );
                })}
                {nodesRef.current.map((sn) => {
                  const nType = sn.node.type;
                  const nodeHidden =
                    (!showDocs && nType === "document") ||
                    (!showHubs && nType === "connector");
                  const isSelected = selectedId === sn.node.id;
                  const inFocus = !selectedId || selectedNeighborhood.has(sn.node.id);
                  const showLabel =
                    showLabels &&
                    !nodeHidden &&
                    (sn.node.type === "connector" ||
                      sn.node.type === "case" ||
                      isSelected ||
                      (selectedId && inFocus && sn.node.type === "defendant"));
                  return (
                    <g
                      key={sn.node.id}
                      opacity={nodeHidden ? 0 : inFocus ? 1 : 0.22}
                      style={nodeHidden ? { pointerEvents: "none" } : undefined}
                    >
                      <circle
                        data-nid={sn.node.id}
                        cx={sn.x ?? sn.targetX ?? 0}
                        cy={sn.y ?? sn.targetY ?? 0}
                        r={nodeRadius(sn.node) + (isSelected ? 3 : 0)}
                        fill={nodeFill(sn.node)}
                        stroke={nodeStroke(sn.node, isSelected)}
                        strokeWidth={isSelected ? 3 : 1.2}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectNode(sn.node.id, "graph");
                        }}
                      >
                        <title>{nodeTitle(sn.node)}</title>
                      </circle>
                      {showLabel ? (
                        <text
                          data-nid={sn.node.id}
                          x={sn.x ?? sn.targetX ?? 0}
                          y={(sn.y ?? sn.targetY ?? 0) - nodeRadius(sn.node) - 5}
                          className="pointer-events-none select-none"
                          textAnchor="middle"
                          fontSize={sn.node.type === "connector" ? "9" : sn.node.type === "case" ? "10" : "8"}
                          fontFamily="ui-monospace, monospace"
                          fontWeight={sn.node.type === "connector" || sn.node.type === "case" ? "800" : "600"}
                          fill={isSelected ? "#ffffff" : "#d8e4f7"}
                          paintOrder="stroke"
                          stroke="#071126"
                          strokeWidth="3"
                        >
                          {labelForMap(sn.node)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          <div className="absolute left-3 top-3 z-10 max-w-[15rem] rounded-md border border-[#203a64]/80 bg-[#071126]/88 px-3 py-2 backdrop-blur">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e1bd5b]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#e1bd5b]" />
              Evidence Nexus
            </div>
            <div className="mt-1 text-[11px] font-mono leading-tight text-[#a9b7d0]">
              {totalCases} cases · {totalDefendants} defendants
              {totalConnectors > 0 ? ` · ${totalConnectors} hubs` : null}
              {totalDocs > 0 ? ` · ${totalDocs} docs` : null}
              {selectedId ? ` · ${focusCount} in focus` : null}
            </div>
          </div>

          {/* Investigation filters — toggle whole classes off the board so you
              can isolate exactly what you're chasing. */}
          <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-1.5">
            <FilterChip on={showHubs} onClick={() => setShowHubs((v) => !v)}>
              Hubs
            </FilterChip>
            <FilterChip on={showDocs} onClick={() => setShowDocs((v) => !v)}>
              Docs
            </FilterChip>
            <FilterChip on={showLabels} onClick={() => setShowLabels((v) => !v)}>
              Labels
            </FilterChip>
          </div>

          <div className="absolute bottom-16 right-3 z-10 flex items-end gap-1.5 sm:bottom-3">
            <div className="flex gap-1.5">
              <MapActionButton label="Fit whole map" onClick={() => fitMap()}>
                Fit
              </MapActionButton>
              <MapActionButton
                label="Focus selected neighborhood"
                onClick={() => fitMap(selectedNeighborhood)}
                disabled={!selectedId}
              >
                Focus
              </MapActionButton>
            </div>
            <div className="flex flex-col gap-1.5">
              <ZoomButton label="Zoom in" onClick={() => zoomByFactor(1.35)}>
                +
              </ZoomButton>
              <ZoomButton label="Zoom out" onClick={() => zoomByFactor(1 / 1.35)}>
                -
              </ZoomButton>
              <ZoomButton label="Reset view" onClick={resetZoom}>
                0
              </ZoomButton>
            </div>
          </div>

          {!hasGraphData ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a1429]/90 px-6 text-center">
              <div className="max-w-md">
                <p className="text-sm font-bold text-[var(--color-paper)]">
                  Case Nexus data is temporarily unavailable.
                </p>
                <p className="mt-2 text-xs text-[#a9b7d0]">
                  The public case archive is still online while this graph feed
                  recovers.
                </p>
                <Link
                  href="/case"
                  className="mt-4 inline-flex rounded-full border border-[#e1bd5b] px-4 py-1.5 text-xs font-bold text-[#e1bd5b] hover:bg-[#e1bd5b]/10"
                >
                  Open case archive
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-xl border-2 border-[#203a64] bg-[#0e1a36] p-3 text-[#cfd9ea] sm:p-4 xl:max-h-[min(44vh,480px)] xl:overflow-auto 2xl:max-h-[min(48vh,520px)]">
          <div className="relative">
            <label
              htmlFor="case-nexus-search"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e1bd5b]"
            >
              Find a case or name
            </label>
            <input
              id="case-nexus-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search name or case number"
              className="mt-2 w-full rounded-md border border-[#3a557c] bg-[#071126] px-3 py-2 text-[12px] font-mono text-[var(--color-paper)] placeholder:text-[#7c8aa6] focus:border-[#e1bd5b] focus:outline-none"
            />
            {searchOpen && query.trim().length > 0 ? (
              <div className="mt-2 max-h-72 overflow-auto rounded-md border border-[#3a557c] bg-[#071126]">
                {searchLoading ? (
                  <p className="px-3 py-2 text-[12px] font-mono text-[#a9b7d0]">
                    Searching...
                  </p>
                ) : searchError ? (
                  <p className="px-3 py-2 text-[12px] font-mono text-[#ffd166]">
                    {searchError}
                  </p>
                ) : hits.length > 0 ? (
                  <ul>
                    {hits.map((h) => (
                      <li key={h.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickHit(h)}
                          className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-[#1c2a4a]"
                        >
                          <span className="truncate text-[12px] text-[var(--color-paper)]">
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
                          <span className="whitespace-nowrap text-[10px] font-mono text-[#7c8aa6]">
                            {h.sub}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : query.trim().length < 2 ? (
                  <p className="px-3 py-2 text-[12px] font-mono text-[#7c8aa6]">
                    Type at least two characters.
                  </p>
                ) : (
                  <p className="px-3 py-2 text-[12px] font-mono text-[#7c8aa6]">
                    No matching case or defendant.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-3 border-t border-[#203a64] pt-3">
            {selectedNode ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold tracking-tight text-[var(--color-paper)]">
                    {nodeHeadline(selectedNode)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      window.setTimeout(() => fitMap(), 30);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#7c8aa6] hover:text-[var(--color-paper)]"
                  >
                    Clear
                  </button>
                </div>

                <div className="mt-3">
                  <NodeDetail node={selectedNode} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={expandSelected}
                    disabled={loadingExpand}
                    className="rounded-full border-2 border-[#e1bd5b] bg-[#e1bd5b]/15 px-4 py-1.5 text-xs font-bold text-[#e1bd5b] transition hover:bg-[#e1bd5b]/25 disabled:opacity-50"
                  >
                    {loadingExpand ? "Expanding..." : "Expand links"}
                  </button>
                  <button
                    type="button"
                    onClick={() => fitMap(selectedNeighborhood)}
                    className="rounded-full border border-[#3a557c] bg-[#071126] px-4 py-1.5 text-xs font-bold text-[#cfd9ea] transition hover:border-[#e1bd5b] hover:text-[#e1bd5b]"
                  >
                    Fit focus
                  </button>
                  {selectedNode.type === "defendant" ? (
                    <Link
                      href={`/case/people/${selectedNode.slug}`}
                      className="rounded-full border border-[#3a557c] bg-[#071126] px-4 py-1.5 text-xs font-bold text-[#cfd9ea] transition hover:border-[#e1bd5b] hover:text-[#e1bd5b]"
                    >
                      Profile
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
                      className="rounded-full border border-[#3a557c] bg-[#071126] px-4 py-1.5 text-xs font-bold text-[#cfd9ea] transition hover:border-[#e1bd5b] hover:text-[#e1bd5b]"
                    >
                      Document
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e1bd5b]">
                  Connect the record
                </p>
                <p className="mt-2 text-xs font-mono leading-relaxed text-[#a9b7d0]">
                  {totalCases} case clusters orbit shared public-record hubs.
                  Pick a case, source hub, name, or document to see what it touches. Missing clue? Send
                  the document, statement, video, photo, date, URL, or witness
                  link that connects one case to another.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/submit"
                    className="rounded-md border border-[#e1bd5b] bg-[#e1bd5b]/15 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#e1bd5b] transition hover:bg-[#e1bd5b]/25"
                  >
                    Add clue
                  </Link>
                  <Link
                    href="/tell-your-story"
                    className="rounded-md border border-[#3a557c] bg-[#071126] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#cfd9ea] transition hover:border-[#e1bd5b] hover:text-[#e1bd5b]"
                  >
                    Tell story
                  </Link>
                </div>
              </div>
            )}
          </div>

          {visibleConnectors.length > 0 ? (
            <div className="mt-4 border-t border-[#203a64] pt-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e1bd5b]">
                  Shared hubs
                </p>
                <button
                  type="button"
                  onClick={() => fitMap(new Set(visibleConnectors.map((n) => n.node.id)))}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#7c8aa6] hover:text-[var(--color-paper)]"
                >
                  Fit hubs
                </button>
              </div>
              <div className="space-y-1">
                {visibleConnectors.map((connector) => {
                  const active = selectedId === connector.node.id;
                  return (
                    <button
                      key={connector.node.id}
                      type="button"
                      onClick={() => selectNode(connector.node.id, "graph")}
                      className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                        active
                          ? "border-[#e1bd5b] bg-[#e1bd5b]/10"
                          : "border-[#203a64] bg-[#071126] hover:border-[#3a557c]"
                      }`}
                    >
                      <span className="truncate text-[12px] font-bold text-[var(--color-paper)]">
                        {connector.node.label}
                      </span>
                      <span className="whitespace-nowrap text-[10px] font-mono uppercase text-[#7c8aa6]">
                        {connector.node.connector_kind.replace("_", " ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-3 border-t border-[#203a64] pt-3">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e1bd5b]">
                Case clusters
              </p>
              <button
                type="button"
                onClick={() => fitMap()}
                className="text-[10px] font-bold uppercase tracking-wider text-[#7c8aa6] hover:text-[var(--color-paper)]"
              >
                Fit all
              </button>
            </div>
            <div className="max-h-[16rem] space-y-1 overflow-auto pr-1 xl:max-h-[13rem] 2xl:max-h-[16rem]">
              {visibleCases.map((caseNode) => {
                const active = selectedId === caseNode.node.id;
                return (
                  <button
                    key={caseNode.node.id}
                    type="button"
                    onClick={() => selectNode(caseNode.node.id, "graph")}
                    className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                      active
                        ? "border-[#e1bd5b] bg-[#e1bd5b]/10"
                        : "border-[#203a64] bg-[#071126] hover:border-[#3a557c]"
                    }`}
                  >
                    <span className="truncate text-[12px] font-bold text-[var(--color-paper)]">
                      {caseNode.node.label}
                    </span>
                    <span className="whitespace-nowrap text-[10px] font-mono text-[#7c8aa6]">
                      {caseNode.node.defendant_count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 border-t border-[#203a64] pt-3 text-[10px] font-mono text-[#7c8aa6]">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e1bd5b]">
              What the lines mean
            </p>
            <p className="mb-3 text-[10px] leading-relaxed text-[#a9b7d0]">
              Blue lines are people tied to a case. Green/gold lines connect
              cases to shared public-record hubs like DOJ, D.D.C. court, filing
              year, and docket type. Reviewed tips can add jail, witness, photo,
              video, statement, and facility links.
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <LegendDot color="#e1bd5b" stroke="#d8e4f7">source hub</LegendDot>
              <LegendDot color="#7fa9e3" stroke="#d8e4f7">court hub</LegendDot>
              <LegendDot color="#1f2f55" stroke="#3a557c">case</LegendDot>
              <LegendDot color="#e1bd5b" stroke="#3aa672">verified</LegendDot>
              <LegendDot color="#ffd166" stroke="#0e1a36">pending</LegendDot>
              <LegendDot color="#e08658" stroke="#0e1a36">unclaimed</LegendDot>
              <LegendDot color="#7c8aa6" stroke="#0e1a36">document</LegendDot>
            </div>
          </div>
        </aside>
      </div>

      {graphError && hasGraphData ? (
        <p className="mt-3 rounded-md border border-[#ffd166]/50 bg-[#ffd166]/10 px-3 py-2 text-xs font-mono text-[#ffd166]">
          {graphError}
        </p>
      ) : null}
    </div>
  );
}

function FilterChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur transition ${
        on
          ? "border-[#e1bd5b] bg-[#e1bd5b]/15 text-[#e1bd5b]"
          : "border-[#203a64] bg-[#071126]/80 text-[#7c8aa6] hover:border-[#3a557c] hover:text-[#cfd9ea]"
      }`}
    >
      {on ? "● " : "○ "}
      {children}
    </button>
  );
}

function nodeTitle(n: RawNode): string {
  if (n.type === "connector") {
    return `${n.label} · ${n.count} visible connection${n.count === 1 ? "" : "s"}`;
  }
  if (n.type === "case") return `Case ${n.label} · ${n.defendant_count} defendants`;
  if (n.type === "defendant")
    return `${n.label} (${n.claim_status})${n.case_number ? ` · ${n.case_number}` : ""}`;
  return n.label;
}

function nodeHeadline(n: RawNode): string {
  if (n.type === "connector") return n.label;
  if (n.type === "case") return `Case ${n.label}`;
  return n.label;
}

function labelForMap(n: RawNode): string {
  if (n.type === "connector") {
    if (n.connector_kind === "source") return n.label.includes("DOJ") ? "DOJ" : "archive";
    if (n.connector_kind === "court") return "D.D.C.";
    if (n.connector_kind === "case_year") return n.label.replace(" filing year", "");
    if (n.connector_kind === "docket_type") return n.label.includes("Criminal") ? "CR" : "MJ";
    return n.label.slice(0, 16);
  }
  if (n.type === "case") return n.label;
  if (n.type === "defendant") {
    const parts = n.label.trim().split(/\s+/);
    if (parts.length <= 2) return n.label;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
  return "doc";
}

function NodeDetail({ node }: { node: RawNode }) {
  if (node.type === "connector") {
    return (
      <div className="space-y-2 text-xs text-[#a9b7d0] font-mono">
        <p>
          Shared hub:{" "}
          <span className="text-[var(--color-paper)]">
            {node.connector_kind.replace("_", " ")}
          </span>
        </p>
        <p>
          This hub currently touches {node.count} visible case
          {node.count === 1 ? "" : "s"} or record link
          {node.count === 1 ? "" : "s"}. It is the layer that keeps the graph
          from pretending every J6 case is isolated.
        </p>
        <p className="text-[#7c8aa6]">
          Facility, witness, photo, video, statement, and jail-interaction hubs
          should be added only when a reviewed submission or public record
          supports the link.
        </p>
      </div>
    );
  }
  if (node.type === "case") {
    return (
      <p className="text-xs text-[#a9b7d0] font-mono">
        Co-defendant cluster · {node.defendant_count} defendants on this case
        number. Click expand links to pull the visible neighborhood into the
        graph: defendants, archived documents, and any reviewed connectors the
        database can expose.
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
          {" "}Witness statements, videos, photos, and clue links can be
          submitted for review.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2 text-xs text-[#a9b7d0] font-mono">
      <p className="break-all">{node.doc_url}</p>
      <p className="text-[#7c8aa6]">
        Document link. A document can connect cases through names, dates,
        prosecutors, agencies, charges, locations, and repeated facts.
      </p>
    </div>
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

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="h-9 w-9 rounded-full border border-[#3a557c] bg-[#0e1a36]/90 text-[#cfd9ea] text-lg font-bold leading-none flex items-center justify-center hover:border-[#e1bd5b] hover:text-[#e1bd5b] transition"
    >
      {children}
    </button>
  );
}

function MapActionButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="h-9 rounded-full border border-[#3a557c] bg-[#0e1a36]/90 px-3 text-[11px] font-bold uppercase tracking-wider text-[#cfd9ea] transition hover:border-[#e1bd5b] hover:text-[#e1bd5b] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}
