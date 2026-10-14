export type MajorBannerActivity = "software" | "data" | "quant" | "mechanical" | "electrical" | "chemical" | "biotech" | "neuroscience" | "physics" | "design" | "reading";

/** Keep an assigned scene independent of later academic profile edits. */
export function assignedBannerActivity(major: unknown, assigned: unknown): MajorBannerActivity {
  return typeof assigned === 'string' && ['software', 'data', 'quant', 'mechanical', 'electrical', 'chemical', 'biotech', 'neuroscience', 'physics', 'design', 'reading'].includes(assigned)
    ? assigned as MajorBannerActivity : majorBannerActivity(major);
}

/** Broad subject groups cover abbreviations and combined majors in member profiles. */
export function majorBannerActivity(major: unknown): MajorBannerActivity {
  const text = typeof major === "string"
    ? major.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    : "";
  // Every CS combination gets the coding scene, even alongside another subject.
  if (/computer\s*science|computing|compsci|\b(?:cs|cse|csci|eecs)\b|\bc s\b/.test(text)) return "software";
  if (/mechanical|aerospace|manufacturing|\b(?:me|mech e|made)\b/.test(text)) return "mechanical";
  if (/electrical|electronic|computer engineering|\b(?:ee|ece|ce)\b/.test(text)) return "electrical";
  if (/neuro|cognitive|psychology|\bpsych\b/.test(text)) return "neuroscience";
  if (/chemical|chemistry|materials science|\bchem\b/.test(text)) return "chemical";
  if (/biolog|biomed|biochem|biotech|medicine|medical|health|nursing|environmental|\b(?:bio|bme)\b/.test(text)) return "biotech";
  if (/physics|astronomy|astrophysics/.test(text)) return "physics";
  if (/data science|data analytics|statistics|statistical|industrial engineering|\b(?:ds|stats|iems|ie)\b/.test(text)) return "data";
  if (/math|econom|finance|business|accounting|\b(?:econ|mmss)\b/.test(text)) return "quant";
  if (/design|architect|\bart\b|\barts\b|film|animation/.test(text)) return "design";
  return "reading";
}
