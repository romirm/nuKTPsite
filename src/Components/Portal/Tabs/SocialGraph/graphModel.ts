/** Explainable, local profile similarity. No private fields, remote models or inferred friendships. */
import { isAlumniProfile } from '../Directory/directoryModel';
export type ConnectionKind = "interests" | "academics" | "experience" | "year" | "role";
export const CONNECTION_KINDS: { id: ConnectionKind; label: string; color: string; weight: number }[] = [
  { id: "interests", label: "Profile topics", color: "#8fe0cc", weight: 30 },
  { id: "academics", label: "Shared studies", color: "#c6adff", weight: 30 },
  { id: "experience", label: "Experience", color: "#ffc98b", weight: 30 },
  { id: "year", label: "Class standing", color: "#8dcaff", weight: 7 },
  { id: "role", label: "Chapter role", color: "#f3a9cf", weight: 3 },
];
export type Evidence = { key: string; label: string; source: string };
export type MemberNode = {
  id: string; name: string; image: string; major: string; year: string; role: string;
  roleGroup: string; alumni: boolean; about: string; experience: string;
  features: Record<ConnectionKind, Evidence[]>;
};
export type Reason = { kind: ConnectionKind; label: string; source: string; target: string };
export type MemberEdge = { id: string; source: string; target: string; score: number; reasons: Reason[]; points: Record<ConnectionKind, number> };
export type MemberGraph = { nodes: MemberNode[]; edges: MemberEdge[]; excluded: number };
export type GraphFilters = { query: string; population: "current" | "all" | "alumni"; major: string; year: string; role: string; kinds: ConnectionKind[]; minScore: number };
export const DEFAULT_FILTERS: GraphFilters = { query: "", population: "current", major: "", year: "", role: "", kinds: CONNECTION_KINDS.map(k => k.id), minScore: 1 };

export function plainText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi, entity => ({ "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" }[entity.toLowerCase()] || " "))
    .replace(/&#(?:x([a-f0-9]+)|(\d+));/gi, (_, hex, dec) => { const n = parseInt(hex || dec, hex ? 16 : 10); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : " "; })
    .replace(/\s+/g, " ").trim();
}
export function normalize(value: unknown): string {
  return plainText(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
}
const emptyValue = /^(?:n\s*a|none|nil|null|no|not applicable|not yet|tbd|unknown|undecided|unavailable|nothing|no internships?|no experience|na)$/;
const usable = (value: string) => !!value && !emptyValue.test(normalize(value));

// Each alias has a boundary: CS does not match economics; AI does not match "hiking trails".
type Concept = [string, string];
const STUDIES: Concept[] = [
  ["Computer Science", "computer scienc+e|computer science|compsci|csci|cs"],
  ["Computer Engineering", "computer engineering|compe|comp e"],
  ["Data Science", "data science(?: and engineering)?|mlds|ds"],
  ["Mathematics", "mathematics|math|maths|applied mathematics|applied math"],
  ["Economics", "economics|econ"], ["Statistics", "statistics|stats|statistical science"],
  ["Industrial Engineering", "industrial engineering|iems"],
  ["Electrical Engineering", "electrical engineering|electrical|ee|ece"],
  ["Mechanical Engineering", "mechanical engineering|mechanical engineer|mech e"],
  ["Manufacturing & Design Engineering", "manufacturing and design engineering|made"],
  ["Biomedical Engineering", "biomedical engineering|bme"], ["Chemical Engineering", "chemical engineering|chem e"],
  ["Materials Science", "materials science(?: and engineering)?|matsci"],
  ["Biology", "biological sciences?|biology"], ["Chemistry", "chemistry"],
  ["Neuroscience", "neuroscience|neuro"], ["Cognitive Science", "cognitive science"],
  ["Psychology", "psychology|psych"], ["Physics", "physics"],
  ["MMSS", "mathematical methods in the social sciences|mmss"],
  ["Environmental Engineering", "environmental engineering"], ["Communication Studies", "communication studies"],
  ["Sociology", "sociology"], ["History", "history"], ["English / Writing", "english literature|english|creative writing"],
  ["Music", "music|harp performance|jazz"], ["Theatre", "theatre|theater"],
  ["Social Policy", "social policy"], ["Legal Studies", "legal studies"], ["Entrepreneurship", "entrepreneurship"],
];
const TOPICS: Concept[] = [
  ["AI & machine learning", "artificial intelligence|machine learning|deep learning|neural networks?|natural language processing|computer vision|large language models?|llms?|ai|ml"],
  ["Web development", "web development|web dev|frontend|front end|back end|backend|full stack|fullstack|react|javascript|typescript"],
  ["Software development", "software engineering|software development|swe|programming|coding"],
  ["Data & analytics", "data science|data analytics|data analysis|data engineering|analytics"],
  ["Systems & hardware", "low level|embedded systems?|operating systems?|hardware|fpgas?|asics?|semiconductors?|computer architecture"],
  ["Robotics", "robotics|robots?|mechatronics"], ["Cybersecurity", "cybersecurity|cyber security|information security|cryptography"],
  ["Quantitative finance", "quantitative finance|quantitative trading|quantitative research|quant|algorithmic trading"],
  ["Finance", "finance|investment banking|investing|financial markets"], ["Consulting", "consulting|consultant"],
  ["Product & design", "product management|product design|ux|ui|user experience|design thinking"],
  ["Startups", "startups?|entrepreneurship|entrepreneur|founding"], ["Game development", "game development|game dev|unity|unreal engine"],
  ["Health & biotech", "biotechnology|biotech|healthcare|health care|medical devices?|medicine"],
  ["Sustainability", "sustainability|renewable energy|climate tech|clean energy|environmental"],
  ["Education & teaching", "education|edtech|teaching|tutoring"], ["Research", "research"],
  ["Python", "python"], ["C++", "c\\+\\+"], ["Java", "java"], ["Cloud computing", "cloud computing|aws|azure"],
  ["Basketball", "basketball|nba"], ["Soccer", "soccer|football"], ["Volleyball", "volleyball"],
  ["Tennis", "tennis"], ["Badminton", "badminton"], ["Pickleball", "pickleball"],
  ["Running", "running|jogging|marathons?"], ["Hiking", "hiking|hikes|backpacking"],
  ["Climbing", "climbing|bouldering"], ["Skiing & snowboarding", "skiing|snowboarding"],
  ["Swimming", "swimming"], ["Cycling", "cycling|biking"], ["Fitness", "fitness|weightlifting|lifting|gym|working out"],
  ["Music", "music|singing|piano|guitar|violin|cello|drums|jazz|concerts"],
  ["Cooking & baking", "cooking|baking"], ["Food", "food|restaurants|foodie"],
  ["Travel", "travel|traveling|travelling"], ["Photography", "photography|photographer"],
  ["Reading", "reading|books|novels"], ["Film & television", "movies|films|cinema|television"],
  ["Gaming", "gaming|video games|videogames"], ["Board games", "board games|chess"],
  ["Art", "painting|drawing|illustration|pottery"], ["Dance", "dance|dancing"],
];
function extractConcepts(text: string, concepts: Concept[]): Evidence[] {
  const normalized = normalize(text);
  return concepts.flatMap(([label, aliases]) => {
    const pattern = new RegExp(`(?:^|[^a-z0-9])(${aliases})(?=$|[^a-z0-9])`, "i");
    return pattern.test(normalized) ? [{ key: normalize(label), label, source: text }] : [];
  });
}
function studies(text: string): Evidence[] {
  if (!usable(text) || /^(freshman|sophomore|junior|juinior|senior|alumni|alumnus)$/.test(normalize(text))) return [];
  const known = extractConcepts(text, STUDIES);
  // Preserve an unrecognized declared discipline, but never invent a major from the biography.
  return known.length ? known : [{ key: normalize(text), label: text, source: text }];
}
function standing(text: string): string {
  const key = normalize(text);
  if (/^(freshman|first year|1st year)$/.test(key)) return "Freshman";
  if (/^(sophomore|second year|2nd year)$/.test(key)) return "Sophomore";
  if (/^(junior|juinior|third year|3rd year)$/.test(key)) return "Junior";
  if (/^(senior|fourth year|4th year)$/.test(key)) return "Senior";
  if (/^(alumni|alumnus|alumna|graduate|graduated)$/.test(key)) return "Alumni";
  return usable(text) ? text : "";
}
function chapterRole(value: unknown): { role: string; group: string } {
  const raw = value && typeof value === "object" && "role" in value ? (value as { role: unknown }).role : value;
  const role = plainText(raw).replace(/^['"]|['"]$/g, "");
  const key = normalize(role);
  if (/^(member|mebemr|active member|active)$/.test(key)) return { role: "Member", group: "Member" };
  if (/^(alumni|alumnus|alumna)$/.test(key)) return { role: "Alumni", group: "Alumni" };
  if (/^(pledge|new member)$/.test(key)) return { role: "Pledge", group: "Pledge" };
  if (/^(vp\b|vice president\b|president\b|co president\b|executive\b|exec\b|treasurer\b|secretary\b)/.test(key)) return { role, group: "Exec" };
  return { role: usable(role) ? role : "Role not listed", group: "Other / unlisted" };
}
function experienceFeatures(text: string): Evidence[] {
  // Match explicit experience entries, never substrings (e.g. Meta vs Metaverse Labs).
  const seen = new Set<string>();
  return text.split(/[,;\n|]+/).flatMap(entry => {
    let name = plainText(entry).replace(/\([^)]*\)/g, " ").trim();
    if (/@|\s+at\s+/i.test(name)) name = name.split(/@|\s+at\s+/i).pop() || "";
    name = name.replace(/\b(?:incoming|summer|winter|spring|fall|internship|intern|20\d{2}|full[- ]time)\b/gi, " ").replace(/\s+/g, " ").replace(/^[\s:—–-]+|[\s:—–-]+$/g, "");
    let key = normalize(name);
    const aliases: Record<string, string> = { "amazon web services": "amazon", "meta platforms": "meta", "facebook": "meta", "google llc": "google", "microsoft corporation": "microsoft" };
    key = aliases[key] || key;
    if (!usable(name) || key.length < 2 || seen.has(key) || /^(?:software engineer(?:ing)?|swe|research|research assistant|student|sample software engineering|engineer(?:ing)?)$/.test(key)) return [];
    seen.add(key);
    return [{ key, label: name, source: plainText(entry) }];
  });
}
function imageUrl(value: unknown): string { const url = typeof value === "string" ? value : ""; return /^(https?:\/\/|\/[^/]|data:image\/(?:png|jpeg|webp);base64,)/i.test(url) ? url : ""; }

export function readMembers(directory: unknown): MemberNode[] {
  if (!directory || typeof directory !== "object" || Array.isArray(directory)) return [];
  return Object.entries(directory).flatMap(([id, raw]) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const p = raw as Record<string, unknown>, name = plainText(p["name"]);
    if (!name || p["allowed"] === false) return [];
    const declaredMajor = Array.isArray(p["majors"]) ? p["majors"].map(plainText).filter(Boolean).join(", ") : plainText(p["major"]);
    const declaredMinor = Array.isArray(p["minors"]) ? p["minors"].map(plainText).filter(Boolean).join(", ") : plainText(p["minor"]);
    const subjects = [...(Array.isArray(p["majors"]) ? p["majors"].map(plainText) : [declaredMajor]), ...(Array.isArray(p["minors"]) ? p["minors"].map(plainText) : [declaredMinor])];
    const academicFeatures = Array.from(new Map(subjects.flatMap(studies).map(f => [f.key, f])).values());
    const major = academicFeatures.length ? declaredMajor : "", year = p["standing_viewable"] === false ? "" : standing(plainText(p["year"]));
    const { role, group } = chapterRole(p["role"]);
    const about = plainText(p["about"]);
    const alumni = isAlumniProfile(p);
    const experience = alumni ? plainText(p["workplace"]) : p["internships_viewable"] === false ? "" : plainText(p["internships"]);
    return [{ id, name, image: imageUrl(p["pfp_thumb_link"]) || imageUrl(p["profile_pic_link"]), major, year, role, roleGroup: group, alumni, about, experience,
      features: {
        academics: academicFeatures, interests: extractConcepts(about, TOPICS),
        experience: experience ? experienceFeatures(experience) : [],
        year: year && year !== "Alumni" ? [{ key: normalize(year), label: year, source: year }] : [],
        role: ["Exec", "Pledge"].includes(group) ? [{ key: group, label: group === "Exec" ? "Executive board" : "Pledge", source: role }] : [],
      } }];
  }).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export function buildMemberGraph(directory: unknown): MemberGraph {
  const nodes = readMembers(directory), edges: MemberEdge[] = [];
  const frequencies = new Map<string, number>();
  nodes.forEach(node => CONNECTION_KINDS.forEach(({ id }) => node.features[id].forEach(feature => {
    const key = `${id}:${feature.key}`; frequencies.set(key, (frequencies.get(key) || 0) + 1);
  })));
  // IDF-weighted Jaccard: rarer shared concepts contribute more within each category.
  const rarity = (kind: ConnectionKind, key: string) => 1 + Math.log((1 + nodes.length) / (1 + (frequencies.get(`${kind}:${key}`) || 0)));
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j];
    const reasons: Reason[] = [], points = { interests: 0, academics: 0, experience: 0, year: 0, role: 0 };
    CONNECTION_KINDS.forEach(({ id, weight }) => {
      const left = new Map(a.features[id].map(f => [f.key, f])), right = new Map(b.features[id].map(f => [f.key, f]));
      const union = Array.from(new Set([...Array.from(left.keys()), ...Array.from(right.keys())]));
      let shared = 0, total = 0;
      union.forEach(key => {
        const value = rarity(id, key); total += value;
        const x = left.get(key), y = right.get(key);
        if (x && y) { shared += value; reasons.push({ kind: id, label: x.label, source: x.source, target: y.source }); }
      });
      points[id] = total ? weight * shared / total : 0;
    });
    const score = Math.round(Object.values(points).reduce((sum, value) => sum + value, 0));
    if (reasons.length) edges.push({ id: JSON.stringify([a.id, b.id].sort()), source: a.id, target: b.id, score: Math.max(1, score), reasons, points });
  }
  edges.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const count = directory && typeof directory === "object" && !Array.isArray(directory) ? Object.keys(directory).length : 0;
  return { nodes, edges, excluded: count - nodes.length };
}

export function filterGraph(graph: MemberGraph, filters: GraphFilters): { nodes: MemberNode[]; edges: MemberEdge[] } {
  const query = normalize(filters.query);
  const searchAliases: Record<string, string> = { cs: "computer science", compe: "computer engineering", bme: "biomedical engineering", iems: "industrial engineering", math: "mathematics", econ: "economics", stats: "statistics", ml: "ai machine learning", ai: "ai machine learning" };
  const terms = (searchAliases[query] || query).split(/\s+/).filter(Boolean);
  const nodes = graph.nodes.filter(n => {
    if (filters.population === "current" && n.alumni) return false;
    if (filters.population === "alumni" && !n.alumni) return false;
    if (filters.major && !n.features.academics.some(f => f.key === filters.major)) return false;
    if (filters.year && (n.year || "Unlisted") !== filters.year) return false;
    if (filters.role && n.roleGroup !== filters.role) return false;
    const haystack = normalize([n.name, n.major, n.year, n.role, n.about, n.experience, ...n.features.academics.map(f => f.label), ...n.features.interests.map(f => f.label)].join(" "));
    return terms.every(term => haystack.includes(term));
  });
  const ids = new Set(nodes.map(n => n.id));
  const edges = graph.edges.flatMap(edge => {
    if (!ids.has(edge.source) || !ids.has(edge.target)) return [];
    const reasons = edge.reasons.filter(r => filters.kinds.includes(r.kind));
    const score = Math.max(1, Math.round(filters.kinds.reduce((sum, kind) => sum + edge.points[kind], 0)));
    return reasons.length && score >= filters.minScore ? [{ ...edge, score, reasons }] : [];
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return { nodes, edges };
}

/** A union of each member's strongest N links. No member is removed by edge thinning. */
export function overviewEdges(nodes: MemberNode[], edges: MemberEdge[], perMember = 2): MemberEdge[] {
  const counts = new Map(nodes.map(n => [n.id, 0]));
  return [...edges].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).filter(edge => {
    if (!counts.has(edge.source) || !counts.has(edge.target)) return false;
    const a = counts.get(edge.source) || 0, b = counts.get(edge.target) || 0;
    counts.set(edge.source, a + 1); counts.set(edge.target, b + 1);
    return a < perMember || b < perMember;
  });
}
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase();
