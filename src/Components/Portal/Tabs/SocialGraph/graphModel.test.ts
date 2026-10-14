import { buildMemberGraph, DEFAULT_FILTERS, filterGraph, overviewEdges, plainText, readMembers } from "./graphModel";
import { layoutGraph, layoutMemberCircle } from "./graphLayout";

test('structured majors and minors contribute separately without using stale legacy text', () => {
  const graph = buildMemberGraph({ a: { name: 'A', major: 'Economics', majors: ['Computer Science (BS)', 'African Studies'], minors: ['Psychology'] }, b: { name: 'B', majors: ['African Studies'], minors: ['Psychology'] }, c: { name: 'C', major: 'Economics' } });
  expect(graph.nodes[0].major).toBe('Computer Science (BS), African Studies');
  expect(graph.nodes[0].features.academics.map(f => f.label)).toEqual(expect.arrayContaining(['African Studies', 'Psychology']));
  expect(graph.edges.find(e => e.source === 'a' && e.target === 'b')?.reasons.map(r => r.label)).toEqual(expect.arrayContaining(['African Studies', 'Psychology']));
  expect(graph.edges.some(e => e.source === 'c' || e.target === 'c')).toBe(false);
});

test("valid named members, including isolated members and duplicate names, retain stable identities", () => {
  const graph = buildMemberGraph({ a: { name: "Same Name" }, b: { name: "Same Name" }, c: null, d: {}, e: { name: "Hidden", allowed: false }, f: { name: "  " } });
  expect(graph.nodes.map(n => n.id)).toEqual(["a", "b"]);
  expect(graph.edges).toEqual([]);
  expect(graph.excluded).toBe(4);
  expect(readMembers([])).toEqual([]);
  expect(readMembers(null)).toEqual([]);
});

test("missing data, placeholder internships, generic roles and misplaced year values never create matches", () => {
  const graph = buildMemberGraph({ a: { name: "A", role: "Member", major: "Sophomore", internships: "N/A" }, b: { name: "B", role: "Member", major: "Sophomore", internships: "None" } });
  expect(graph.edges).toHaveLength(0);
  expect(graph.nodes[0].features.academics).toEqual([]);
});

test("studies recognize combined degrees and aliases without substring matches", () => {
  const graph = buildMemberGraph({ a: { name: "A", major: "cs + math" }, b: { name: "B", major: "Computer Science & Mathematics" }, c: { name: "C", major: "Economics" }, d: { name: "D", major: "Computer Sciencce" } });
  const edge = graph.edges.find(e => e.source === "a" && e.target === "b");
  expect(edge?.score).toBe(30);
  expect(edge?.reasons.map(r => r.label)).toEqual(["Computer Science", "Mathematics"]);
  expect(graph.edges.some(e => e.source === "c" || e.target === "c")).toBe(false);
  expect(graph.nodes.find(n => n.id === "d")?.features.academics[0].label).toBe("Computer Science");
});

test("semantic topic matching maps related phrases to inspectable source text", () => {
  const graph = buildMemberGraph({ a: { name: "A", about: "I build ML projects and love bouldering." }, b: { name: "B", about: "Interested in machine learning and climbing." }, c: { name: "C", about: "I hike on trails." } });
  expect(graph.edges).toHaveLength(1);
  expect(graph.edges[0].reasons.map(r => r.label)).toEqual(["AI & machine learning", "Climbing"]);
  expect(graph.edges[0].reasons[0]).toMatchObject({ source: "I build ML projects and love bouldering.", target: "Interested in machine learning and climbing." });
});

test("experience matches normalized whole entries, never arbitrary substrings or blank strings", () => {
  const graph = buildMemberGraph({ a: { name: "A", internships: "SWE @ Google (2025), Meta" }, b: { name: "B", internships: "Google; Microsoft" }, c: { name: "C", internships: "Metaverse Labs" } });
  expect(graph.edges).toHaveLength(1);
  expect(graph.edges[0].reasons[0].label).toBe("Google");
  expect(graph.nodes[0].features.experience.map(f => f.key)).toEqual(["google", "meta"]);
});

test("hidden fields do not affect scores, search, filter options, or connection evidence", () => {
  const graph = buildMemberGraph({ a: { name: "A", year: "Junior", standing_viewable: false, internships: "SecretCorp", internships_viewable: false }, b: { name: "B", year: "Junior", internships: "SecretCorp" } });
  expect(graph.edges).toHaveLength(0);
  expect(graph.nodes[0].year).toBe("");
  expect(graph.nodes[0].experience).toBe("");
  expect(filterGraph(graph, { ...DEFAULT_FILTERS, query: "SecretCorp" }).nodes.map(n => n.id)).toEqual(["b"]);
});

test("roles are normalized conservatively and unrecognized roles do not become executives", () => {
  const nodes = readMembers({ a: { name: "A", role: { role: "Member" } }, b: { name: "B", role: "Mebemr" }, c: { name: "C", role: "The Man, The Myth, The Legend" }, d: { name: "D", role: "VP of Technology" }, e: { name: "E", role: '"Member"' } });
  expect(nodes.map(n => n.roleGroup)).toEqual(["Member", "Member", "Other / unlisted", "Exec", "Member"]);
});

test("population follows the authoritative Alumni role, not a stale standing or graduation year", () => {
  const graph = buildMemberGraph({ a: { name: "A", year: "Alumnus", role: "Member" }, b: { name: "B", role: "Alumni" }, c: { name: "C", year: "Class of 2025" }, d: { name: "D" } });
  expect(filterGraph(graph, DEFAULT_FILTERS).nodes.map(n => n.id)).toEqual(["a", "c", "d"]);
  expect(filterGraph(graph, { ...DEFAULT_FILTERS, population: "all" }).nodes).toHaveLength(4);
  expect(filterGraph(graph, { ...DEFAULT_FILTERS, population: "alumni" }).nodes.map(n => n.id)).toEqual(["b"]);
});

test('alumni workplace replaces historical internships in connection matching', () => {
  const graph = buildMemberGraph({ a: { name: 'A', role: 'Alumni', workplace: 'Acme Labs', internships: 'Old Company' }, b: { name: 'B', role: 'Member', internships: 'Acme Labs' }, c: { name: 'C', role: 'Member', internships: 'Old Company' } });
  expect(graph.nodes[0].experience).toBe('Acme Labs');
  expect(graph.edges.some(e => e.source === 'a' && e.target === 'b')).toBe(true);
  expect(graph.edges.some(e => e.source === 'a' && e.target === 'c')).toBe(false);
});

test("connection filters recompute scores and retain members even with zero links", () => {
  const graph = buildMemberGraph({ a: { name: "A", major: "CS", year: "Junior", about: "I love skiing" }, b: { name: "B", major: "Computer Science", year: "Junior", about: "I love snowboarding" } });
  expect(graph.edges[0].score).toBe(67);
  const yearOnly = filterGraph(graph, { ...DEFAULT_FILTERS, kinds: ["year"] });
  expect(yearOnly.edges[0].score).toBe(7);
  expect(yearOnly.edges[0].reasons).toHaveLength(1);
  expect(filterGraph(graph, { ...DEFAULT_FILTERS, kinds: ["year"], minScore: 8 }).edges).toEqual([]);
  const none = filterGraph(graph, { ...DEFAULT_FILTERS, kinds: [] });
  expect(none.edges).toEqual([]);
  expect(none.nodes).toHaveLength(2);
});

test("all five categories total at most 100 without duplicate concept inflation", () => {
  const profile = { major: "CS, CS", about: "Machine learning ML AI", internships: "Google, Google", year: "Junior", role: "Pledge" };
  const graph = buildMemberGraph({ a: { name: "A", ...profile }, b: { name: "B", ...profile } });
  expect(graph.edges[0].score).toBe(100);
  expect(graph.edges[0].reasons).toHaveLength(5);
});

test("combined filters remove dangling links and normalize accent-insensitive search", () => {
  const graph = buildMemberGraph({ a: { name: "Chloé Lee", major: "CS", year: "Junior" }, b: { name: "Jordan", major: "CS", year: "Senior" }, c: { name: "Alex", major: "Math", year: "Junior" } });
  const filtered = filterGraph(graph, { ...DEFAULT_FILTERS, query: "chloe", year: "Junior", major: "computer science" });
  expect(filtered.nodes.map(n => n.id)).toEqual(["a"]);
  expect(filtered.edges).toEqual([]);
});

test("search handles common academic and semantic topic abbreviations", () => {
  const graph = buildMemberGraph({ a: { name: "A", major: "Computer Science" }, b: { name: "B", major: "CS", about: "Interested in machine learning" }, c: { name: "C", major: "Economics" } });
  expect(filterGraph(graph, { ...DEFAULT_FILTERS, query: "CS" }).nodes.map(n => n.id)).toEqual(["a", "b"]);
  expect(filterGraph(graph, { ...DEFAULT_FILTERS, query: "ML" }).nodes.map(n => n.id)).toEqual(["b"]);
});

test("overview thinning preserves a strongest link for every connected member and is deterministic", () => {
  const entries = Array.from({ length: 10 }, (_, i) => [`id-${i}`, { name: `Member ${i}`, major: "CS" }]);
  const graph = buildMemberGraph(Object.fromEntries(entries));
  const reversed = buildMemberGraph(Object.fromEntries([...entries].reverse()));
  expect(graph).toEqual(reversed);
  const edges = overviewEdges(graph.nodes, graph.edges);
  expect(edges.length).toBeLessThan(graph.edges.length);
  expect(new Set(edges.flatMap(e => [e.source, e.target])).size).toBe(10);
});

test("layout includes every member with finite, stable coordinates and handles no members", () => {
  const graph = buildMemberGraph(Object.fromEntries(Array.from({ length: 90 }, (_, i) => [String(i), { name: `Member ${i}`, year: i % 2 ? "Junior" : "Senior", major: "CS" }])));
  const edges = overviewEdges(graph.nodes, graph.edges);
  (["connections", "year", "role"] as const).forEach(mode => {
    const layout = layoutGraph(graph.nodes, edges, mode);
    expect(layout.positions.size).toBe(90);
    layout.positions.forEach(p => { expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true); expect(p.x).toBeGreaterThan(0); expect(p.y).toBeGreaterThan(0); });
    expect(layout).toEqual(layoutGraph([...graph.nodes].reverse(), edges, mode));
  });
  expect(layoutGraph([], [], "connections").positions.size).toBe(0);
});

test("biography markup is converted to inert text before matching and rendering", () => {
  expect(plainText('<p>AI &amp; music</p><script>private()</script>')).toBe("AI & music");
  expect(plainText("&#x1F600; &#999999999999;")).toBe("😀");
});

test("member circles put the selected member at the exact center with separated concentric peers", () => {
  const graph = buildMemberGraph(Object.fromEntries(Array.from({ length: 150 }, (_, i) => [String(i), { name: `Member ${i}`, major: "CS" }])));
  const layout = layoutMemberCircle(graph.nodes, "0", graph.edges);
  expect(layout.positions.get("0")).toEqual({ x: layout.width / 2, y: layout.height / 2 });
  expect(layout.positions.size).toBe(150);
  const points = Array.from(layout.positions.values());
  points.forEach((p, i) => {
    expect(p.x).toBeGreaterThan(20); expect(p.x).toBeLessThan(layout.width - 20);
    expect(p.y).toBeGreaterThan(20); expect(p.y).toBeLessThan(layout.height - 20);
    points.slice(i + 1).forEach(q => expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(70));
  });
});
