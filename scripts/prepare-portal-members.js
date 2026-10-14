const fs = require("fs");
const path = require("path");
async function prepareMembers() {
  const { resolveMemberRole } = await import("../src/localPortal/memberRoles.mjs");

  const directory = path.resolve(__dirname, "../.local-portal");
  const source = JSON.parse(fs.readFileSync(path.join(directory, "source-public-users.json"), "utf8"));
  const allowedPath = path.join(directory, "source-allowed-users.json");
  const allowedUsers = fs.existsSync(allowedPath) ? JSON.parse(fs.readFileSync(allowedPath, "utf8")) : {};
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Expected a Firebase public_users export.");
  const fields = ["name", "email", "role", "year", "major", "majors", "minor", "minors", "internships", "graduation_year", "workplace", "about", "profile_pic_link", "pfp_thumb_link", "pfp_large_link", "banner_activity", "cover_page_link", "cover_resized_link", "resume_link", "resume_filename", "linkedin", "instagram", "leetcode", "pledge_tracker", "standing_viewable", "internships_viewable", "email_viewable", "allowed"];
  const publicUsers = {};
  for (const [uid, profile] of Object.entries(source)) {
    if (!profile || typeof profile.name !== "string" || !profile.name.trim()) continue;
    publicUsers[uid] = Object.fromEntries(fields.filter(field => profile[field] !== undefined).map(field => [field, profile[field]]));
    publicUsers[uid].role = resolveMemberRole(uid, profile, allowedUsers);
  }
  if (!Object.keys(publicUsers).length) throw new Error("The export contains no named member profiles.");
  const revision = require("crypto").createHash("sha256").update(JSON.stringify(publicUsers)).digest("hex");
  fs.writeFileSync(path.join(directory, "member-snapshot.json"), JSON.stringify({ revision, capturedAt: new Date().toISOString(), public_users: publicUsers }));
  console.log(`Prepared ${Object.keys(publicUsers).length} member profiles for the localhost demo.`);
}
prepareMembers().catch(error => { console.error(error.message); process.exitCode = 1; });
