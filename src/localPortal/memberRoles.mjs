// Shared by the authenticated portal and the localhost snapshot preparation script.
// Role records may be keyed by auth UID (admin edits) or Northwestern username (admissions).
function roleString(value) {
  if (typeof value === "string") return value.trim().replace(/^['"]|['"]$/g, "").trim();
  if (value && typeof value === "object" && !Array.isArray(value) && typeof value.role === "string") return roleString(value.role);
  return "";
}

/** @param {string} uid @param {any} profile @param {any} allowedUsers @returns {string} */
export function resolveMemberRole(uid, profile, allowedUsers) {
  const records = allowedUsers && typeof allowedUsers === "object" && !Array.isArray(allowedUsers) ? allowedUsers : {};
  const uidRole = Object.prototype.hasOwnProperty.call(records, uid) ? roleString(records[uid]) : "";
  if (uidRole) return uidRole;
  const email = typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : "";
  const match = /^([^@]+)@(?:[a-z0-9-]+\.)*northwestern\.edu$/.exec(email);
  if (match && Object.prototype.hasOwnProperty.call(records, match[1])) {
    const emailRole = roleString(records[match[1]]);
    if (emailRole) return emailRole;
  }
  return roleString(profile?.role);
}

/** @param {any} directory @param {any} allowedUsers @returns {Record<string, any>} */
export function mergeDirectoryRoles(directory, allowedUsers) {
  if (!directory || typeof directory !== "object" || Array.isArray(directory)) return {};
  return Object.fromEntries(Object.entries(directory).map(([uid, profile]) => [uid,
    profile && typeof profile === "object" && !Array.isArray(profile)
      ? { ...profile, role: resolveMemberRole(uid, profile, allowedUsers) }
      : profile,
  ]));
}
