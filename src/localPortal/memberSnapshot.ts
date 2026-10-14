import Logo from "../Assets/Images/Branding/Logo.png";

// Copy only portal directory fields. Never import private users/admin/auth data.
const profileFields = ["name", "email", "role", "year", "major", "majors", "minor", "minors", "internships", "graduation_year", "workplace", "about", "profile_pic_link", "pfp_thumb_link", "pfp_large_link", "banner_activity", "cover_page_link", "cover_resized_link", "resume_link", "resume_filename", "linkedin", "instagram", "leetcode", "pledge_tracker", "standing_viewable", "internships_viewable", "email_viewable", "allowed"];

export function mergeMemberSnapshot(data: any, snapshot: any): number {
  if (!snapshot?.public_users || typeof snapshot.public_users !== "object" || Array.isArray(snapshot.public_users)) throw new Error("Invalid local member snapshot");
  // A refreshed Firebase export replaces imported copies. Reopening the same revision preserves local edits.
  const revision = typeof snapshot.revision === "string" ? snapshot.revision : "";
  if (revision && revision !== data.localMemberSnapshotRevision) {
    for (const collection of [data.public_users, data.users, data.allowed_users]) {
      if (collection) for (const uid of Object.keys(collection)) if (uid.startsWith("local-copy-")) delete collection[uid];
    }
    data.localMemberSnapshotRevision = revision;
  }
  let count = 0;
  for (const [sourceId, value] of Object.entries(snapshot.public_users)) {
    const source: any = value;
    if (!source || typeof source !== "object" || typeof source.name !== "string" || !source.name.trim()) continue;
    // Reimporting the same snapshot preserves any local edits to its profiles.
    const uid = `local-copy-${sourceId}`;
    if (data.public_users[uid]) continue;
    const profile: any = {};
    for (const field of profileFields) if (source[field] !== undefined) profile[field] = JSON.parse(JSON.stringify(source[field]));
    profile.role = typeof profile.role === "string" ? profile.role : "Member";
    profile.profile_pic_link ||= Logo;
    profile.pfp_thumb_link ||= profile.profile_pic_link;
    profile.pfp_large_link ||= profile.profile_pic_link;
    profile.cover_page_link ||= "";
    profile.cover_resized_link ||= profile.cover_page_link;
    profile.signed_up = true;
    data.public_users[uid] = profile;
    data.users[uid] = { ...profile, Role: profile.role, admin: false, email_viewable: profile.email_viewable !== false, standing_viewable: profile.standing_viewable !== false, internships_viewable: profile.internships_viewable !== false };
    data.allowed_users[uid] = { role: profile.role };
    count++;
  }
  return count;
}
