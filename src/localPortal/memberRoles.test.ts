import { mergeDirectoryRoles, resolveMemberRole } from "./memberRoles.mjs";

test("UID role assignments override stale public profile roles", () => {
  expect(resolveMemberRole("uid", { role: "Pledge", email: "anjana@u.northwestern.edu" }, { uid: { role: "VP of Programming" } })).toBe("VP of Programming");
});
test("Northwestern username assignments work when no UID assignment exists", () => {
  expect(resolveMemberRole("uid", { role: "Pledge", email: " Anjana@u.northwestern.edu " }, { anjana: { role: "VP of Programming" } })).toBe("VP of Programming");
  expect(resolveMemberRole("uid", { role: "Member", email: "anjana@northwestern.edu" }, { anjana: "VP of Programming" })).toBe("VP of Programming");
});
test("explicit UID admin edits take priority over admission-time username roles", () => {
  expect(resolveMemberRole("uid", { email: "anjana@u.northwestern.edu" }, { uid: { role: "VP of Programming" }, anjana: { role: "Pledge" } })).toBe("VP of Programming");
});
test("blank and malformed assignments fall back without trusting another email domain", () => {
  expect(resolveMemberRole("uid", { email: "anjana@example.com", role: "Member" }, { anjana: "VP of Programming", uid: { role: {} } })).toBe("Member");
  expect(resolveMemberRole("uid", { email: "anjana@u.northwestern.edu", role: "Member" }, { uid: { role: " " }, anjana: "VP of Programming" })).toBe("VP of Programming");
  expect(resolveMemberRole("uid", { role: { role: "Member" } }, null)).toBe("Member");
  expect(resolveMemberRole("uid", null, [])).toBe("");
});
test("merging preserves profile data and does not mutate the Firebase snapshot", () => {
  const directory = { uid: { name: "Anjana", major: "Math", role: "Pledge" }, invalid: null };
  expect(mergeDirectoryRoles(directory, { uid: { role: "VP of Programming" } })).toEqual({ uid: { name: "Anjana", major: "Math", role: "VP of Programming" }, invalid: null });
  expect(directory.uid.role).toBe("Pledge");
});
