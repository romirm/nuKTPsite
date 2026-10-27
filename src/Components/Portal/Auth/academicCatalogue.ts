export type AcademicProgram = { name: string; option: string; school: string; url: string };
export type AcademicCatalogues = { majors: AcademicProgram[]; minors: AcademicProgram[] };

export function parseAcademicCsv(text: string): AcademicProgram[] {
  const rows: string[][] = []; let row: string[] = [], value = "", quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') { if (quoted && source[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(value); value = ""; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && source[i + 1] === '\n') i++; row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = ""; }
    else value += c;
  }
  if (quoted) throw new Error("Invalid academic CSV");
  if (value || row.length) { row.push(value); rows.push(row); }
  if (rows.shift()?.join(',') !== 'name,option,school,url') throw new Error("Invalid academic catalog headers");
  return rows.map(r => { if (r.length !== 4 || !r[0]) throw new Error("Invalid academic catalog row"); return { name: r[0], option: r[1], school: r[2], url: r[3] }; });
}
let pending: Promise<AcademicCatalogues> | undefined;
export function loadAcademicCatalogues(): Promise<AcademicCatalogues> {
  if (!pending) pending = Promise.all(['majors', 'minors'].map(async kind => {
    const response = await fetch(`${process.env['PUBLIC_URL'] || ''}/data/${kind}.csv`);
    if (!response.ok) throw new Error("Could not load academic options");
    const programs = parseAcademicCsv(await response.text());
    if (!programs.length || programs.some(p => kind === 'majors' ? !/major/i.test(p.option) : p.option !== 'Minor')) throw new Error("Invalid academic options");
    return programs;
  })).then(([majors, minors]) => ({ majors, minors })).catch(error => { pending = undefined; throw error; });
  return pending;
}
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aliases: Record<string, string> = { cs: 'computer science', ds: 'data science', bme: 'biomedical engineering', compe: 'computer engineering', ee: 'electrical engineering', mmss: 'mathematical methods in the social sciences', made: 'manufacturing and design engineering', psych: 'psychology', econ: 'economics' };
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => i ? (j ? 0 : i) : j));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
export function searchAcademicPrograms(options: AcademicProgram[], query: string): AcademicProgram[] {
  const raw = normalize(query), q = aliases[raw] || raw;
  if (!q) return options;
  return options.map(p => {
    const n = normalize(p.name);
    let score = n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : 100;
    if (score === 100) {
      const tokens = q.split(' '), words = n.split(' ');
      const errors = tokens.map(t => Math.min(...words.map(w => w.startsWith(t) ? 0 : distance(t, w))));
      if (errors.every((e, i) => e <= (tokens[i].length < 4 ? 0 : Math.max(1, Math.floor(tokens[i].length / 4))))) score = 3 + errors.reduce((a, b) => a + b, 0);
    }
    return { p, score };
  }).filter(r => r.score < 100).sort((a, b) => a.score - b.score || a.p.name.localeCompare(b.p.name)).map(r => r.p);
}
export function initialAcademicSelection(array: unknown, legacy: unknown, options: AcademicProgram[]) {
  const values = Array.isArray(array) ? array.filter(v => typeof v === 'string') : typeof legacy === 'string' && legacy.trim() ? [legacy.trim()] : [];
  const selected: string[] = [], unresolved: string[] = [];
  values.forEach(value => { const canonical = /^computer science\s*(?:\(bs\)|ba-cs)$/i.test(value.trim()) ? 'Computer Science' : value; const match = options.find(p => normalize(p.name) === normalize(canonical)); if (match) { if (!selected.includes(match.name)) selected.push(match.name); } else unresolved.push(value); });
  return { selected, query: unresolved.join(', ') };
}
export function validAcademicSelection(values: string[], options: AcademicProgram[], required = false): boolean {
  return Array.isArray(values) && (!required || values.length > 0) && new Set(values).size === values.length && values.every(v => options.some(p => p.name === v));
}
