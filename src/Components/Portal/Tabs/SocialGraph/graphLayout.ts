import { MemberNode, MemberEdge } from "./graphModel";

export type LayoutMode = "connections" | "year" | "role";
export type Point = { x: number; y: number };
export type GraphLayout = { positions: Map<string, Point>; width: number; height: number; groups: { name: string; x: number; y: number; width: number; height: number }[] };
export const YEAR_COLORS: Record<string, string> = { Freshman: "#8fe0cc", Sophomore: "#8dcaff", Junior: "#c6adff", Senior: "#ffc98b", Alumni: "#f3a9cf", Unlisted: "#bdc3d5" };
export const memberColor = (node: MemberNode) => YEAR_COLORS[node.alumni ? "Alumni" : node.year] || YEAR_COLORS["Unlisted"];

/** An ego network: the selected member stays at the center; ranked peers occupy spacious rings. */
export function layoutMemberCircle(nodes: MemberNode[], centerId: string, edges: MemberEdge[]): GraphLayout {
  const scores = new Map<string, number>();
  edges.forEach(e => { if (e.source === centerId) scores.set(e.target, e.score); else if (e.target === centerId) scores.set(e.source, e.score); });
  const peers = nodes.filter(n => n.id !== centerId).sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const rings: MemberNode[][] = [];
  let offset = 0;
  while (offset < peers.length) { const count = rings.length === 0 ? 12 : 18 + (rings.length - 1) * 6; rings.push(peers.slice(offset, offset + count)); offset += count; }
  const radius = 255 + Math.max(0, rings.length - 1) * 155;
  const width = Math.max(760, radius * 2.24 + 180), height = Math.max(680, radius * 2 + 170);
  const positions = new Map<string, Point>();
  if (nodes.some(n => n.id === centerId)) positions.set(centerId, { x: width / 2, y: height / 2 });
  rings.forEach((ring, ri) => ring.forEach((node, i) => {
    const angle = -Math.PI / 2 + (i + (ri % 2 ? .5 : 0)) * Math.PI * 2 / ring.length;
    const r = 255 + ri * 155;
    positions.set(node.id, { x: width / 2 + Math.cos(angle) * r * 1.12, y: height / 2 + Math.sin(angle) * r });
  }));
  return { positions, width, height, groups: [] };
}

/** Deterministic placement, independent of Firebase object order and viewport size. */
export function layoutGraph(nodes: MemberNode[], edges: MemberEdge[], mode: LayoutMode): GraphLayout {
  const ordered = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const positions = new Map<string, Point>();
  if (mode !== "connections") {
    const buckets = new Map<string, MemberNode[]>();
    ordered.forEach(n => { const key = mode === "role" ? n.roleGroup : n.alumni ? "Alumni" : n.year || "Unlisted"; buckets.set(key, [...(buckets.get(key) || []), n]); });
    const order = mode === "role" ? ["Pledge", "Member", "Exec", "Alumni", "Other / unlisted"] : ["Freshman", "Sophomore", "Junior", "Senior", "Alumni", "Unlisted"];
    const entries = Array.from(buckets.entries()).sort(([a], [b]) => {
      const ai = order.indexOf(a), bi = order.indexOf(b); return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi) || a.localeCompare(b);
    });
    const groups: GraphLayout["groups"] = [];
    let x = 35, y = 45, rowHeight = 0, width = 900;
    entries.forEach(([name, members]) => {
      const columns = Math.max(3, Math.min(9, Math.ceil(Math.sqrt(members.length * 1.3))));
      const w = columns * 68 + 36, h = Math.ceil(members.length / columns) * 74 + 80;
      if (x > 35 && x + w > 1250) { x = 35; y += rowHeight + 35; rowHeight = 0; }
      groups.push({ name, x, y, width: w, height: h });
      [...members].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)).forEach((node, i) => positions.set(node.id, { x: x + 52 + i % columns * 68, y: y + 84 + Math.floor(i / columns) * 74 }));
      width = Math.max(width, x + w + 35); x += w + 35; rowHeight = Math.max(rowHeight, h);
    });
    return { positions, width, height: Math.max(600, y + rowHeight + 40), groups };
  }
  const width = Math.max(900, Math.sqrt(ordered.length) * 90), height = Math.max(620, width * .74);
  const points = ordered.map((node, i) => {
    const angle = i * 2.399963229728653, radius = Math.sqrt((i + .5) / Math.max(1, ordered.length)) * .43;
    return { id: node.id, x: width / 2 + Math.cos(angle) * width * radius, y: height / 2 + Math.sin(angle) * height * radius, vx: 0, vy: 0 };
  });
  const lookup = new Map(points.map(p => [p.id, p]));
  // A bounded, static force layout: settles once, never continuously animates 200 portraits.
  for (let tick = 0; tick < 160; tick++) {
    const cooling = 1 - tick / 180;
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
      const a = points[i], b = points[j]; let dx = b.x - a.x, dy = b.y - a.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      if (!dx && !dy) dx = 1;
      const force = Math.min(10, 500 / (distance * distance) + Math.max(0, 64 - distance) * .16) * cooling;
      dx = dx / distance * force; dy = dy / distance * force;
      a.vx -= dx; a.vy -= dy; b.vx += dx; b.vy += dy;
    }
    edges.forEach(edge => {
      const a = lookup.get(edge.source), b = lookup.get(edge.target); if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(1, Math.hypot(dx, dy));
      const force = (distance - 120) * .0025 * cooling;
      a.vx += dx / distance * force; a.vy += dy / distance * force; b.vx -= dx / distance * force; b.vy -= dy / distance * force;
    });
    points.forEach(p => {
      p.vx = (p.vx + (width / 2 - p.x) * .0008) * .72;
      p.vy = (p.vy + (height / 2 - p.y) * .0008) * .72;
      p.x = Math.max(44, Math.min(width - 44, p.x + p.vx)); p.y = Math.max(44, Math.min(height - 44, p.y + p.vy));
    });
  }
  // Resolve remaining portrait collisions without inventing extra graph links.
  for (let pass = 0; pass < 35; pass++) {
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
      const a = points[i], b = points[j], dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(.01, Math.hypot(dx, dy));
      if (distance < 55) { const move = (55 - distance) / 2; const ux = distance === .01 ? 1 : dx / distance, uy = dy / distance; a.x -= ux * move; a.y -= uy * move; b.x += ux * move; b.y += uy * move; }
    }
  }
  const minX = Math.min(...points.map(p => p.x)), minY = Math.min(...points.map(p => p.y));
  const maxX = Math.max(...points.map(p => p.x)), maxY = Math.max(...points.map(p => p.y));
  const scale = points.length > 12 ? Math.max(1, Math.min((width - 110) / Math.max(1, maxX - minX), (height - 150) / Math.max(1, maxY - minY))) : 1;
  points.forEach(p => positions.set(p.id, { x: width / 2 + (p.x - (minX + maxX) / 2) * scale, y: height / 2 + (p.y - (minY + maxY) / 2) * scale }));
  return { positions, width, height, groups: [] };
}
