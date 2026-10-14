import { coordinate } from "./globePins";

export type CityResult = { id: string; city: string; country: string; region: string; latitude: number; longitude: number };
type IndexedCity = CityResult & { names: string[]; qualifiers: string[]; population: number };
let catalogue: Promise<IndexedCity[]> | null = null;

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\u00c0-\uffff]+/g, " ").trim();
}

/** Quoted commas, escaped quotes, embedded newlines, CRLF and BOM are supported. */
function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && char === ",") { row.push(field); field = ""; }
    else if (!quoted && (char === "\n" || char === "\r")) {
      row.push(field); if (row.some(value => value.length)) rows.push(row);
      row = []; field = ""; if (char === "\r" && text[i + 1] === "\n") i++;
    } else field += char;
  }
  if (quoted) throw new Error("City CSV contains an unfinished quoted field");
  row.push(field); if (row.some(value => value.length)) rows.push(row);
  return rows;
}

export function parseCityCsv(text: string): IndexedCity[] {
  const rows = csvRows(text.replace(/^\ufeff/, ""));
  const headers = rows.shift()?.map(value => value.trim()) || [];
  const columns = Object.fromEntries(headers.map((name, index) => [name, index]));
  for (const required of ["city", "lat", "lng", "country", "id"]) {
    if (!(required in columns)) throw new Error(`City CSV is missing ${required}`);
  }
  const cities: IndexedCity[] = [];
  for (const row of rows) {
    const value = (name: string) => (row[columns[name]] || "").trim();
    const city = value("city"), country = value("country"), id = value("id");
    const latitude = coordinate(value("lat"), 90), longitude = coordinate(value("lng"), 180);
    if (!city || !country || !id || latitude === null || longitude === null) continue;
    cities.push({ id, city, country, region: value("admin_name"), latitude, longitude,
      names: Array.from(new Set([normalize(city), normalize(value("city_ascii"))].filter(Boolean))),
      qualifiers: normalize([country, value("admin_name"), value("iso2"), value("iso3")].join(" ")).split(" "),
      population: Number(value("population")) || 0,
    });
  }
  if (!cities.length) throw new Error("City CSV contains no valid city coordinates");
  return cities;
}

/** Bounded edit distance with adjacent transpositions, e.g. Chciago -> Chicago. */
function distance(a: string, b: string, limit: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i), beforePrevious = previous;
  for (let i = 1; i <= a.length; i++) {
    const current = Array<number>(b.length + 1).fill(limit + 1); current[0] = i;
    let minimum = i <= limit ? i : limit + 1;
    for (let j = Math.max(1, i - limit); j <= Math.min(b.length, i + limit); j++) {
      let cost = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cost = Math.min(cost, beforePrevious[j - 2] + 1);
      current[j] = cost; minimum = Math.min(minimum, cost);
    }
    if (minimum > limit) return limit + 1;
    beforePrevious = previous; previous = current;
  }
  return previous[b.length];
}

function nameScore(name: string, query: string): number {
  if (name === query || name.replace(/ /g, "") === query.replace(/ /g, "")) return 0;
  if (name.startsWith(query)) return 10 + Math.min(10, name.length - query.length) / 10;
  if (query.length >= 3 && name.split(" ").some(word => word.startsWith(query))) return 25;
  if (query.length < 4) return Infinity;
  const limit = query.length < 6 ? 1 : query.length < 11 ? 2 : 3;
  const edits = distance(query, name, limit);
  if (edits <= limit) return 40 + edits * 8;
  const prefixEdits = distance(query, name.slice(0, query.length), limit);
  return prefixEdits <= limit ? 65 + prefixEdits * 8 : Infinity;
}

export function fuzzySearchCities(cities: IndexedCity[], query: string, limit = 6): CityResult[] {
  const words = normalize(query.slice(0, 120)).split(" ");
  if (words.join(" ").length < 2) return [];
  const matches: { city: IndexedCity; score: number }[] = [];
  for (const city of cities) {
    let best = Infinity;
    for (let split = words.length; split >= 1; split--) {
      const qualifiers = words.slice(split);
      if (!qualifiers.every(word => city.qualifiers.some(token => token === word || token.startsWith(word) || (word.length >= 4 && distance(word, token.slice(0, word.length), 1) <= 1)))) continue;
      const name = words.slice(0, split).join(" ");
      for (const alias of city.names) best = Math.min(best, nameScore(alias, name));
    }
    if (Number.isFinite(best)) matches.push({ city, score: best });
  }
  return matches.sort((a, b) => a.score - b.score || b.city.population - a.city.population || a.city.city.localeCompare(b.city.city) || a.city.id.localeCompare(b.city.id))
    .slice(0, limit).map(({ city }) => ({ id: city.id, city: city.city, country: city.country, region: city.region, latitude: city.latitude, longitude: city.longitude }));
}

export async function searchCities(query: string, signal: AbortSignal): Promise<CityResult[]> {
  if (query.trim().length < 2) return [];
  if (signal.aborted) throw new DOMException("Search cancelled", "AbortError");
  // Load the project asset once. Shared loading is independent of individual cancelled searches.
  if (!catalogue) catalogue = fetch(`${process.env["PUBLIC_URL"] || ""}/data/worldcities.csv`, { credentials: "same-origin" })
    .then(async response => { if (!response.ok) throw new Error("City CSV could not be loaded"); return parseCityCsv(await response.text()); })
    .catch(error => { catalogue = null; throw error; });
  const cities = await catalogue;
  if (signal.aborted) throw new DOMException("Search cancelled", "AbortError");
  return fuzzySearchCities(cities, query);
}
