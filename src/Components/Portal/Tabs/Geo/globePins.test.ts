import { clusterPins, coordinate, readHometownPins } from "./globePins";

test("coordinates reject missing, non-numeric, and out-of-range values but accept zero", () => {
  [null, undefined, "", " ", false, {}, "NaN", Infinity, 91, -91].forEach(value => expect(coordinate(value, 90)).toBeNull());
  expect(coordinate(0, 90)).toBe(0);
  expect(coordinate("-87.6", 180)).toBe(-87.6);
  expect(coordinate(181, 180)).toBeNull();
});
test("existing pin formats survive while malformed records are ignored", () => {
  const pins = readHometownPins({ a: { name: "Old name", lat: 0, lng: 0, city: "Accra", country: "Ghana" }, b: { latitude: 200, longitude: 1 }, c: null }, { a: { name: "Current name" } });
  expect(pins).toEqual([{ id: "a", name: "Current name", latitude: 0, longitude: 0, city: "Accra", country: "Ghana" }]);
  expect(readHometownPins(null, {})).toEqual([]);
  expect(readHometownPins({ old: { lat: 51, lng: 0, label: "United Kingdom - London" } }, {})[0]).toMatchObject({ country: "United Kingdom", city: "London" });
});
test("nearby pins cluster without shifting their saved coordinates, then separate when zoomed", () => {
  const base = { name: "Member", latitude: 42, longitude: -87, city: "Chicago", country: "US" };
  const first = { ...base, id: "a", x: 100, y: 100 }, second = { ...base, id: "b", x: 110, y: 105 };
  expect(clusterPins([first, second])).toEqual([[first, second]]);
  expect(clusterPins([first, { ...second, x: 140 }])).toHaveLength(2);
  expect(second.latitude).toBe(42);
});
