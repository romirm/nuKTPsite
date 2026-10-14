import { useEffect, useId, useRef, useState } from "react";
import { ArrowsPointingOutIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { CONNECTION_KINDS, initials, MemberEdge, MemberNode } from "./graphModel";
import { GraphLayout, memberColor } from "./graphLayout";

type Props = { nodes: MemberNode[]; edges: MemberEdge[]; layout: GraphLayout; selected: string; compared: string; uid: string; centered: boolean; onSelect: (id: string) => void; onEdge: (edge: MemberEdge) => void };
export default function GraphCanvas({ nodes, edges, layout, selected, compared, uid, centered, onSelect, onEdge }: Props) {
  const svg = useRef<SVGSVGElement>(null), id = useId().replace(/:/g, "");
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [hovered, setHovered] = useState("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const drag = useRef<{ pointer: number; x: number; y: number; cameraX: number; cameraY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const positionKey = Array.from(layout.positions).map(([key, p]) => `${key}:${p.x.toFixed(2)},${p.y.toFixed(2)}`).join("|");
  useEffect(() => { setCamera({ x: 0, y: 0, zoom: 1 }); setHovered(""); }, [positionKey, layout.width, layout.height]);
  const width = layout.width / camera.zoom, height = layout.height / camera.zoom;
  const left = (layout.width - width) / 2 + camera.x, top = (layout.height - height) / 2 + camera.y;
  const connected = new Set(edges.filter(e => e.source === selected || e.target === selected).flatMap(e => [e.source, e.target]));
  const renderedEdges = selected ? edges.filter(e => e.source === selected || e.target === selected) : edges;
  function zoomBy(factor: number) { setCamera(c => ({ ...c, zoom: Math.max(.65, Math.min(5, c.zoom * factor)) })); }
  function point(clientX: number, clientY: number) {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix || !svg.current) return { x: clientX, y: clientY };
    const p = svg.current.createSVGPoint(); p.x = clientX; p.y = clientY;
    return p.matrixTransform(matrix.inverse());
  }
  return <div className="social-map">
    <svg ref={svg} className="social-canvas" viewBox={`${left} ${top} ${width} ${height}`} role="group" aria-label="Interactive member graph. Select a member, or use the member list. Drag empty space to pan. Use the zoom buttons to explore."
      tabIndex={0} onKeyDown={e => {
        const shifts: Record<string, [number, number]> = { ArrowLeft: [-50, 0], ArrowRight: [50, 0], ArrowUp: [0, -50], ArrowDown: [0, 50] };
        if (e.target !== e.currentTarget) return;
        if (shifts[e.key]) { e.preventDefault(); const [x, y] = shifts[e.key]; setCamera(c => ({ ...c, x: c.x + x / c.zoom, y: c.y + y / c.zoom })); }
        if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(1.25); }
        if (e.key === "-") { e.preventDefault(); zoomBy(.8); }
        if (e.key === "Home") { e.preventDefault(); setCamera({ x: 0, y: 0, zoom: 1 }); }
      }} onPointerDown={e => {
        if (e.button !== 0 || (e.target as Element).closest("[data-graph-interactive]")) return;
        const p = point(e.clientX, e.clientY); suppressClick.current = false;
        drag.current = { pointer: e.pointerId, x: p.x, y: p.y, cameraX: camera.x, cameraY: camera.y, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
      }} onPointerMove={e => {
        const d = drag.current; if (!d || d.pointer !== e.pointerId) return;
        const p = point(e.clientX, e.clientY), dx = p.x - d.x, dy = p.y - d.y;
        if (Math.hypot(dx, dy) > 3) d.moved = true;
        if (d.moved) { setCamera(c => ({ ...c, x: c.x - dx, y: c.y - dy })); }
      }} onPointerUp={e => {
        if (drag.current?.pointer !== e.pointerId) return;
        suppressClick.current = drag.current.moved; drag.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      }} onPointerCancel={() => { drag.current = null; }} onClick={e => {
        if (!suppressClick.current && !(e.target as Element).closest("[data-graph-interactive]")) onSelect("");
        suppressClick.current = false;
      }}>
      <defs>
        <pattern id={`${id}-grid`} width="38" height="38" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".9" fill="#c6adff" opacity=".18" /></pattern>
        <clipPath id={`${id}-portrait`}><rect x="-20" y="-20" width="40" height="40" rx="12" /></clipPath>
      </defs>
      <rect x={left} y={top} width={width} height={height} fill={`url(#${id}-grid)`} />
      {centered && <g className="social-orbits" pointerEvents="none"><circle cx={layout.width / 2} cy={layout.height / 2} r="70" /></g>}
      {layout.groups.map(g => <g key={g.name} className="social-map-group" pointerEvents="none">
        <rect x={g.x} y={g.y} width={g.width} height={g.height} rx="10" />
        <text x={g.x + 20} y={g.y + 31}>{g.name.toUpperCase()}</text>
      </g>)}
      <g className="social-edges">{renderedEdges.map(edge => {
        const a = layout.positions.get(edge.source), b = layout.positions.get(edge.target); if (!a || !b) return null;
        const kind = CONNECTION_KINDS.find(k => k.id === edge.reasons[0]?.kind);
        const active = selected && (edge.source === compared || edge.target === compared);
        return <g key={edge.id} data-graph-interactive="edge" onClick={e => { e.stopPropagation(); onEdge(edge); }} className="social-edge">
          <title>{`${nodes.find(n => n.id === edge.source)?.name} + ${nodes.find(n => n.id === edge.target)?.name}: ${edge.reasons.map(r => r.label).join(", ")}`}</title>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={kind?.color || "#c6adff"} strokeWidth={active ? 3 : selected ? 1.8 : .8 + edge.score / 60} opacity={active ? 1 : selected ? .5 : .16} />
          {selected && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="12" />}
          {centered && nodes.length <= 25 && <g className="social-edge-score" transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}><rect x="-20" y="-14" width="40" height="28" rx="7" /><text textAnchor="middle" y="5">{edge.score}</text></g>}
        </g>;
      })}</g>
      {nodes.map(node => {
        const p = layout.positions.get(node.id); if (!p) return null;
        const active = node.id === selected, hover = node.id === hovered, peer = node.id === compared;
        const muted = !!selected && !active && !connected.has(node.id);
        const label = active || hover || peer || camera.zoom > 1.5 || nodes.length <= 32;
        return <g key={node.id} transform={`translate(${p.x} ${p.y}) scale(${centered ? active ? 1.5 : 1.16 : 1})`} className={`social-node${active ? " is-selected" : ""}`} role="button" tabIndex={0}
          aria-label={`${node.name}, ${node.year || "standing unlisted"}${node.id === uid ? ", you" : ""}. Explore connections`} aria-pressed={active} data-graph-interactive="node"
          onPointerEnter={() => setHovered(node.id)} onPointerLeave={() => setHovered("")} onFocus={() => setHovered(node.id)} onBlur={() => setHovered("")}
          onClick={e => { e.stopPropagation(); onSelect(node.id); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(node.id); } }} opacity={muted && !hover ? .28 : 1}>
          <title>{node.name}{node.major ? ` · ${node.major}` : ""}</title>
          {centered && <circle r="43" fill="transparent" />}
          {(active || hover || peer) && <rect x="-28" y="-28" width="56" height="56" rx="16" fill={memberColor(node)} fillOpacity=".12" stroke={memberColor(node)} strokeDasharray={active ? undefined : "3 4"} />}
          <rect className="social-node-frame" x="-23" y="-23" width="46" height="46" rx="14" fill="#302044" stroke={memberColor(node)} strokeWidth={active ? 3 : 1.5} />
          {(!node.image || failedImages.has(node.image)) && <text className="social-node-initials" textAnchor="middle" y="5" fill={memberColor(node)}>{initials(node.name)}</text>}
          {node.image && !failedImages.has(node.image) && <image href={node.image} x="-20" y="-20" width="40" height="40" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-portrait)`} onError={() => setFailedImages(old => new Set([...Array.from(old), node.image]))} />}
          {node.id === uid && <path d="M16 -26h8v8h-8z" fill="#fff3ba" stroke="#302044" strokeWidth="2" />}
          {label && <text className="social-node-label" textAnchor="middle" y="42">{active || hover || peer ? node.name : node.name.split(" ")[0]}</text>}
        </g>;
      })}
    </svg>
    <div className="social-map-controls" aria-label="Graph view controls">
      <button type="button" aria-label="Zoom out" disabled={camera.zoom <= .65} onClick={() => zoomBy(.8)}><MinusIcon /></button>
      <span aria-live="polite">{Math.round(camera.zoom * 100)}%</span>
      <button type="button" aria-label="Zoom in" disabled={camera.zoom >= 5} onClick={() => zoomBy(1.25)}><PlusIcon /></button>
      <button type="button" aria-label="Fit graph" onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}><ArrowsPointingOutIcon /></button>
    </div>
  </div>;
}
