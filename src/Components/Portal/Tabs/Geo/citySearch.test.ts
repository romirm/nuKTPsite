import { readFileSync } from "fs";
import { resolve } from "path";
import { fuzzySearchCities, parseCityCsv, searchCities } from "./citySearch";

const fixture = '\ufeff"city","city_ascii","lat","lng","country","iso2","iso3","admin_name","capital","population","id"\r\n'
  + '"Chicago","Chicago","41.8375","-87.6866","United States","US","USA","Illinois","","8604203","chicago"\r\n'
  + '"Paris","Paris","48.8566","2.3522","France","FR","FRA","Île-de-France","primary","11000000","paris-fr"\r\n'
  + '"Paris","Paris","33.6609","-95.5555","United States","US","USA","Texas","","25000","paris-tx"\r\n'
  + '"São Paulo","Sao Paulo","-23.5504","-46.6339","Brazil","BR","BRA","São Paulo","","22000000","sao-paulo"\r\n'
  + '"Saint, \"\"Example\"\"","Saint Example","0","0","Example Country","EX","EXP","Region\nTwo","","","quoted"\r\n';
const cities = parseCityCsv(fixture);

test("CSV parsing preserves quoted commas, quotes, newlines, zero coordinates and distinct city IDs", () => {
  expect(cities).toHaveLength(5);
  expect(cities[4]).toMatchObject({ city: 'Saint, "Example"', region: "Region\nTwo", latitude: 0, longitude: 0 });
  expect(cities.filter(city => city.city === "Paris").map(city => city.id)).toEqual(["paris-fr", "paris-tx"]);
  expect(() => parseCityCsv('city,country\nParis,France')).toThrow("missing lat");
  expect(() => parseCityCsv('"unfinished')).toThrow("unfinished quoted");
});
test("fuzzy search handles transpositions, missing letters, prefixes, accents and location qualifiers", () => {
  for (const query of ["Chciago", "Chcago", "chic"]) expect(fuzzySearchCities(cities, query)[0].id).toBe("chicago");
  expect(fuzzySearchCities(cities, "sao paulo")[0].id).toBe("sao-paulo");
  expect(fuzzySearchCities(cities, "SãoPaulo")[0].id).toBe("sao-paulo");
  expect(fuzzySearchCities(cities, "Paris")[0].id).toBe("paris-fr");
  expect(fuzzySearchCities(cities, "Paris, Texas")[0].id).toBe("paris-tx");
  expect(fuzzySearchCities(cities, "Paris US")[0].id).toBe("paris-tx");
  expect(fuzzySearchCities(cities, "not-a-real-city-anywhere")).toEqual([]);
  expect(fuzzySearchCities(cities, " ")).toEqual([]);
});
test("the supplied catalogue supports real-city typos and returns the exact CSV coordinates", () => {
  const catalogue = parseCityCsv(readFileSync(resolve(process.cwd(), "public/data/worldcities.csv"), "utf8"));
  expect(catalogue.length).toBeGreaterThan(40000);
  const result = fuzzySearchCities(catalogue, "Chciago Illinois")[0];
  expect(result.city).toBe("Chicago");
  const source = catalogue.find(city => city.id === result.id)!;
  expect(result).toMatchObject({ latitude: source.latitude, longitude: source.longitude, region: source.region, country: source.country });
  expect(fuzzySearchCities(catalogue, "San Fransisco United States")[0].city).toBe("San Francisco");
  expect(fuzzySearchCities(catalogue, "Evanston Illinois")[0].city).toBe("Evanston");
  expect(fuzzySearchCities(catalogue, "Paris Texas")[0].region).toBe("Texas");
});
test("search loads only the project CSV once and cancellation never yields stale results", async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => fixture });
  const originalFetch = global.fetch; global.fetch = fetchMock;
  try {
    const controller = new AbortController();
    expect(await searchCities(" ", controller.signal)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await searchCities("Paris Texas", controller.signal))[0].id).toBe("paris-tx");
    expect((await searchCities("Chciago", controller.signal))[0].id).toBe("chicago");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/data\/worldcities\.csv$/);
    const cancelled = new AbortController(); cancelled.abort();
    await expect(searchCities("Paris", cancelled.signal)).rejects.toMatchObject({ name: "AbortError" });
  } finally { global.fetch = originalFetch; }
});
