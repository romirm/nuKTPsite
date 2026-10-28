const constellations: [number, number][][] = [
  [[14, 23], [35, 44], [60, 22], [84, 58]],
  [[12, 64], [32, 25], [58, 54], [85, 22]],
  [[16, 38], [40, 19], [62, 66], [84, 36]],
  [[10, 23], [30, 66], [62, 32], [87, 72]],
  [[17, 72], [36, 40], [65, 18], [84, 55]],
  [[12, 42], [34, 71], [61, 36], [88, 18]],
  [[18, 18], [38, 58], [63, 72], [86, 31]],
  [[10, 58], [36, 20], [58, 42], [87, 68]],
];

/** Stable constellations vary by member without jumping when a profile rerenders. */
export default function PortalAsciiSky({ comet = false, name }: { comet?: boolean; name?: string | undefined }) {
  const nameCharacters = Array.from((name || "").toLocaleUpperCase()).filter((char) => !/\s/.test(char));
  const characters = nameCharacters.length ? nameCharacters : ["+", "·", "*", ".", "0", "1", "✦", ":", "×"];
  const seed = Array.from(name || "KTP").reduce((hash, char) => (Math.imul(hash, 31) + char.codePointAt(0)!) >>> 0, 2166136261);
  const pattern = constellations[seed % constellations.length];
  const random = (index: number, salt: number) => {
    let value = (seed ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
    value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
    value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  };
  const stars: { x: number; y: number; character: string }[] = [];
  for (let i = 0; i < 16; i++) {
    const center = pattern[i % pattern.length];
    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = random(i, 20 + attempt * 2) * Math.PI * 2;
      const radius = Math.sqrt(random(i, 21 + attempt * 2));
      const x = Math.max(2, Math.min(97, center[0] + Math.cos(angle) * radius * 25));
      const y = Math.max(2, Math.min(96, center[1] + Math.sin(angle) * radius * 28));
      if (stars.some((star) => Math.hypot((star.x - x) * 1.2, star.y - y) < 14)) continue;
      const nearby = stars.filter((star) => Math.hypot((star.x - x) * 1.2, star.y - y) < 28);
      const character = characters.find((candidate, offset) => offset >= i % characters.length && !nearby.some((star) => star.character === candidate))
        || characters.find((candidate) => !nearby.some((star) => star.character === candidate))
        || characters[i % characters.length];
      stars.push({ x, y, character });
      break;
    }
  }
  return <div className="portal-ascii-sky" aria-hidden="true">
    {stars.map((star, i) => {
      return <span key={i} style={{
        left: `${star.x}%`,
        top: `${star.y}%`,
        animationDelay: `${-random(i, 5) * 8}s`,
        animationDuration: `${3 + random(i, 6) * 3}s`,
      }}>{star.character}</span>;
    })}
    {comet && <i className="portal-ascii-comet">· . + *</i>}
  </div>;
}
