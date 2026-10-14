import { useMemo, useState } from "react";
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, AdjustmentsHorizontalIcon, MagnifyingGlassIcon, ShareIcon } from "@heroicons/react/24/outline";
import { buildMemberGraph, CONNECTION_KINDS, DEFAULT_FILTERS, filterGraph, GraphFilters, initials, MemberEdge, MemberNode, overviewEdges } from "./graphModel";
import { layoutGraph, layoutMemberCircle, LayoutMode, memberColor, YEAR_COLORS } from "./graphLayout";
import GraphCanvas from "./GraphCanvas";
import "./social-graph.css";

function Avatar({ member }: { member: MemberNode }) {
  const [failed, setFailed] = useState(false);
  return <span className="social-avatar" style={{ borderColor: memberColor(member), color: memberColor(member) }}>{member.image && !failed ? <img src={member.image} alt="" onError={() => setFailed(true)} /> : initials(member.name)}</span>;
}

export default function SocialGraph({ fullPubDir, uid, onOpenProfile }: { fullPubDir: unknown; uid: string; onOpenProfile: (id: string) => void }) {
  const graph = useMemo(() => buildMemberGraph(fullPubDir), [fullPubDir]);
  const [filters, setFilters] = useState<GraphFilters>(() => ({ ...DEFAULT_FILTERS, population: graph.nodes.find(n => n.id === uid)?.alumni ? "all" : "current" }));
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("connections");
  const [view, setView] = useState<"graph" | "list">("graph");
  const [selectedId, setSelectedId] = useState(uid);
  const [comparedId, setComparedId] = useState("");
  const [focus, setFocus] = useState(true);
  const [circleSize, setCircleSize] = useState(12);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const filtered = useMemo(() => filterGraph(graph, filters), [graph, filters]);
  const memberById = useMemo(() => new Map(graph.nodes.map(n => [n.id, n])), [graph.nodes]);
  const selected = filtered.nodes.find(n => n.id === selectedId);
  const connections = useMemo(() => selected ? filtered.edges.filter(e => e.source === selected.id || e.target === selected.id) : [], [filtered.edges, selected]);
  const peerId = (edge: MemberEdge) => edge.source === selected?.id ? edge.target : edge.source;
  const comparison = connections.find(e => peerId(e) === comparedId);
  const compared = comparison ? memberById.get(comparedId) : undefined;
  const circleConnections = useMemo(() => {
    const top = circleSize ? connections.slice(0, circleSize) : connections;
    return comparison && !top.some(e => e.id === comparison.id) ? [...top, comparison] : top;
  }, [connections, circleSize, comparison]);
  const focusIds = useMemo(() => new Set([selected?.id, ...circleConnections.flatMap(e => [e.source, e.target])]), [selected, circleConnections]);
  const nodes = useMemo(() => focus && selected ? filtered.nodes.filter(n => focusIds.has(n.id)) : filtered.nodes, [focus, selected, filtered.nodes, focusIds]);
  const sparseEdges = useMemo(() => overviewEdges(filtered.nodes, filtered.edges), [filtered]);
  const drawnEdges = selected ? focus ? circleConnections : connections : sparseEdges;
  const layout = useMemo(() => focus && selected ? layoutMemberCircle(nodes, selected.id, circleConnections) : layoutGraph(nodes, sparseEdges, layoutMode), [nodes, sparseEdges, layoutMode, focus, selected, circleConnections]);
  const degree = useMemo(() => { const counts = new Map<string, number>(); filtered.edges.forEach(e => { counts.set(e.source, (counts.get(e.source) || 0) + 1); counts.set(e.target, (counts.get(e.target) || 0) + 1); }); return counts; }, [filtered.edges]);
  const majors = useMemo(() => Array.from(new Map(graph.nodes.flatMap(n => n.features.academics.map(f => [f.key, f.label] as const)))).sort((a, b) => a[1].localeCompare(b[1])), [graph.nodes]);
  const years = useMemo(() => Array.from(new Set(graph.nodes.map(n => n.year || "Unlisted"))).sort(), [graph.nodes]);
  const roles = useMemo(() => Array.from(new Set(graph.nodes.map(n => n.roleGroup))).sort(), [graph.nodes]);
  const hasFilters = filters.query || filters.population !== "current" || filters.major || filters.year || filters.role || filters.kinds.length !== CONNECTION_KINDS.length || filters.minScore !== 1;
  function updateFilter<K extends keyof GraphFilters>(key: K, value: GraphFilters[K]) { setFilters(old => ({ ...old, [key]: value })); setComparedId(""); }
  function selectMember(id: string) { setSelectedId(id); setComparedId(""); setFocus(!!id); if (id) setFilters(old => old.query ? { ...old, query: "" } : old); }
  function reset() { setFilters({ ...DEFAULT_FILTERS, population: graph.nodes.find(n => n.id === uid)?.alumni ? "all" : "current" }); selectMember(uid); setCircleSize(12); }
  function findMe() { setFilters({ ...DEFAULT_FILTERS, population: memberById.get(uid)?.alumni ? "all" : "current" }); selectMember(uid); setCircleSize(12); setView("graph"); }

  return <section className="social-graph" aria-labelledby="social-heading">
    <h2 id="social-heading" className="sr-only">Connections</h2>
    <div className="social-toolbar">
      <label className="social-search"><MagnifyingGlassIcon aria-hidden="true" /><span className="sr-only">Search members, studies, or interests</span><input type="search" placeholder="Search members or interests" value={filters.query} onChange={e => { updateFilter("query", e.target.value); setFocus(false); setSelectedId(""); }} /></label>
      <label className="social-population"><span className="sr-only">Member population</span><select value={filters.population} onChange={e => updateFilter("population", e.target.value as GraphFilters["population"])}><option value="current">Current chapter</option><option value="all">Everyone + alumni</option><option value="alumni">Alumni</option></select></label>
      <button type="button" className={`social-button${expandedFilters ? " is-active" : ""}`} aria-expanded={expandedFilters} aria-controls="social-filter-panel" onClick={() => setExpandedFilters(v => !v)}><AdjustmentsHorizontalIcon />Filters{hasFilters ? <span className="social-filter-dot" /> : null}</button>
      <button type="button" className="social-button" disabled={!memberById.has(uid)} onClick={findMe}>Find me <span aria-hidden="true">↗</span></button>
    </div>
    {expandedFilters && <div className="social-filter-panel" id="social-filter-panel">
      <label>Field of study<select value={filters.major} onChange={e => updateFilter("major", e.target.value)}><option value="">All fields</option>{majors.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Class standing<select value={filters.year} onChange={e => updateFilter("year", e.target.value)}><option value="">All standings</option>{years.map(year => <option key={year}>{year}</option>)}</select></label>
      <label>Chapter role<select value={filters.role} onChange={e => updateFilter("role", e.target.value)}><option value="">All roles</option>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
      <label>Minimum similarity: {filters.minScore}<input aria-label="Minimum similarity" type="range" min="1" max="100" value={filters.minScore} onChange={e => updateFilter("minScore", Number(e.target.value))} /></label>
      <button type="button" className="social-text-button" onClick={reset}>Reset filters</button>
      <div className="social-kind-row"><span>Match by</span>{CONNECTION_KINDS.map(kind => <button key={kind.id} type="button" aria-pressed={filters.kinds.includes(kind.id)} onClick={() => updateFilter("kinds", filters.kinds.includes(kind.id) ? filters.kinds.filter(k => k !== kind.id) : [...filters.kinds, kind.id])}><i style={{ background: kind.color }} />{kind.label}</button>)}</div>
      <details className="social-method"><summary>About scores</summary><p>Profile similarity, from 0 to 100. Shared studies, experience, and profile topics contribute up to 30 points each; standing contributes 7 and chapter role 3. Missing fields contribute zero. Connections indicate shared profile information. Current chapter excludes profiles marked alumni.</p></details>
    </div>}
    <div className={`social-workbench${selected ? "" : " is-overview"}`}>
      <div className="social-explorer">
        <div className="social-explorer-bar">
          <div className="social-view-switch" aria-label="Display mode"><button type="button" aria-pressed={view === "graph"} onClick={() => setView("graph")}><ShareIcon />Graph</button><button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>Member list</button></div>
          {view === "graph" && (focus && selected ? <label className="social-layout"><span>Show</span><select aria-label="Connections in circle" value={circleSize} onChange={e => setCircleSize(Number(e.target.value))}><option value={12}>12 strongest</option><option value={24}>24 strongest</option><option value={0}>All connections</option></select></label> : <label className="social-layout"><span>Arrange</span><select aria-label="Graph arrangement" value={layoutMode} onChange={e => setLayoutMode(e.target.value as LayoutMode)}><option value="connections">By similarity</option><option value="year">By standing</option><option value="role">By role</option></select></label>)}
        </div>
        <div className="social-stage">
          {!nodes.length ? <div className="social-empty"><h3>{graph.nodes.length ? "No matching members" : "Directory loading"}</h3>{graph.nodes.length > 0 && <button type="button" className="social-button" onClick={reset}>Reset filters</button>}</div>
            : view === "graph" ? <GraphCanvas nodes={nodes} edges={drawnEdges} layout={layout} selected={selected?.id || ""} compared={compared?.id || ""} uid={uid} centered={focus && !!selected} onSelect={selectMember} onEdge={edge => { if (selected && (edge.source === selected.id || edge.target === selected.id)) setComparedId(peerId(edge)); else { setSelectedId(edge.source); setComparedId(edge.target); setFocus(true); } }} />
            : <div className="social-member-list" aria-label="Filtered members">{filtered.nodes.map(node => <button key={node.id} type="button" aria-pressed={selected?.id === node.id} onClick={() => selectMember(node.id)}><Avatar member={node} /><span><strong>{node.name}{node.id === uid && <small>YOU</small>}</strong><span>{node.year || "Standing unlisted"} · {node.role}</span><span>{node.major || "Study not listed"}</span></span><b>{degree.get(node.id) || 0}<small>connections</small></b></button>)}</div>}
          {!!nodes.length && view === "graph" && !drawnEdges.length && <div className="social-no-links">{!filters.kinds.length ? "Choose a connection type in Filters." : "No matching connections"}</div>}
        </div>
        <footer className="social-map-footer"><div className="social-year-legend" aria-label="Portrait border colors indicate class standing">{Object.entries(YEAR_COLORS).map(([year, color]) => <span key={year}><i style={{ background: color }} />{year === "Unlisted" ? "Unlisted" : year}</span>)}</div></footer>
      </div>
      <aside className="social-inspector" aria-label="Member connections">
        {selected ? <>
          <div className="social-panel-heading"><button type="button" className="social-text-button" onClick={() => selectMember("")}>Whole chapter</button></div>
          <div className="social-selected-member"><Avatar key={selected.id} member={selected} /><div><h3>{selected.name}</h3><p>{selected.year || "Standing unlisted"} · {selected.role}</p></div></div>
          <button type="button" className="social-profile-link" onClick={() => onOpenProfile(selected.id)}>View profile <ArrowTopRightOnSquareIcon /></button>
          <div className="social-connection-heading"><h4>{connections.length} connections</h4><span title="Profile similarity, 0–100">Similarity</span></div>
          {comparison && compared ? <div className="social-comparison">
            <button type="button" className="social-back" onClick={() => setComparedId("")}><ArrowLeftIcon />All connections</button>
            <div className="social-compare-person"><Avatar key={compared.id} member={compared} /><strong>{compared.name}</strong></div>
            <div className="social-similarity-score"><strong>{comparison.score}<small>/100</small></strong><span>Similarity</span></div>
            {comparison.reasons.map((reason, i) => <details className="social-reason" key={`${reason.kind}-${i}`}><summary><i style={{ background: CONNECTION_KINDS.find(k => k.id === reason.kind)?.color }} /><span>{reason.label}<small>{CONNECTION_KINDS.find(k => k.id === reason.kind)?.label}</small></span></summary><div><strong>{memberById.get(comparison.source)?.name}</strong><p>{reason.source}</p><strong>{memberById.get(comparison.target)?.name}</strong><p>{reason.target}</p></div></details>)}
            <button type="button" className="social-button social-full-button" onClick={() => selectMember(compared.id)}>View connections</button>
          </div> : <div className="social-connections-list">{connections.length ? connections.map(edge => {
            const peer = memberById.get(peerId(edge)); if (!peer) return null;
            return <button type="button" key={edge.id} className="social-connection" onClick={() => setComparedId(peer.id)}><Avatar member={peer} /><span><strong>{peer.name}</strong><span>{edge.reasons.slice(0, 2).map(r => r.label).join(" · ")}{edge.reasons.length > 2 ? ` +${edge.reasons.length - 2}` : ""}</span></span><b aria-label={`${edge.score} out of 100 similarity`}>{edge.score}</b></button>;
          }) : <div className="social-panel-empty">No matching connections</div>}</div>}
        </> : null}
      </aside>
    </div>
    <div className="social-status" role="status"><span>{view === "list" ? `${filtered.nodes.length} members` : selected ? `${drawnEdges.length} of ${connections.length} connections shown` : `${nodes.length} members · ${filtered.edges.length.toLocaleString()} matching pairs`}</span>{hasFilters && <button type="button" className="social-text-button" onClick={reset}>Reset filters</button>}</div>
  </section>;
}
