export type HometownPin = { id: string; name: string; latitude: number; longitude: number; city: string; country: string };
export type ProjectedPin = HometownPin & { x: number; y: number };
export function coordinate(value: unknown, limit: number): number | null {
  if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !value.trim())) return null;
  const result = Number(value);
  return Number.isFinite(result) && Math.abs(result) <= limit ? result : null;
}
export function readHometownPins(raw: unknown, directory: any): HometownPin[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return Object.entries(raw).flatMap(([id, value]) => {
    if (!value || typeof value !== "object") return [];
    const pin = value as any;
    const latitude = coordinate(pin.latitude ?? pin.lat, 90), longitude = coordinate(pin.longitude ?? pin.lng, 180);
    if (latitude === null || longitude === null) return [];
    const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
    const legacyLabel = text(pin.subtitle || pin.label), parts = legacyLabel.split(" - ");
    return [{ id, name: text(directory?.[id]?.name) || text(pin.name) || "Member", latitude, longitude,
      city: text(pin.city) || (parts.length > 1 ? parts[parts.length - 1] : ""),
      country: text(pin.country) || (parts.length > 1 ? parts.slice(0, -1).join(" - ") : legacyLabel) }];
  }).sort((a, b) => a.name.localeCompare(b.name));
}
/** Group nearby screen positions without changing saved geographic coordinates. */
export function clusterPins(pins: ProjectedPin[], distance = 22): ProjectedPin[][] {
  const clusters: ProjectedPin[][] = [];
  pins.forEach(pin => {
    const nearby = clusters.find(group => Math.hypot(group[0].x - pin.x, group[0].y - pin.y) < distance);
    if (nearby) nearby.push(pin); else clusters.push([pin]);
  });
  return clusters;
}
