import { mergeMemberSnapshot } from "./memberSnapshot";
import { createSampleData, demoUid } from "./sampleData";

test("member copies retain directory fields while excluding private privileges and preserving the demo account", () => {
  const data = createSampleData();
  const demoBefore = JSON.stringify(data.users[demoUid]);
  expect(mergeMemberSnapshot(data, { public_users: {
    source: { name: "Directory Member", major: "Data Science", role: "Alumni", admin: true, phone: "private", email: "test@example.com", leetcode: { username: "test" } },
    malformed: null, unnamed: { major: "CS" },
  } })).toBe(1);
  expect(data.public_users["local-copy-source"]).toMatchObject({ name: "Directory Member", major: "Data Science", role: "Alumni", leetcode: { username: "test" } });
  expect(data.public_users["local-copy-source"].phone).toBeUndefined();
  expect(data.users["local-copy-source"].admin).toBe(false);
  expect(JSON.stringify(data.users[demoUid])).toBe(demoBefore);
  expect(data.allowed_users["local-copy-source"].role).toBe("Alumni");
});

test("reloading a snapshot preserves local edits and adds newly available members", () => {
  const data = createSampleData();
  mergeMemberSnapshot(data, { public_users: { first: { name: "Original Name" } } });
  data.public_users["local-copy-first"].name = "Local edit";
  expect(mergeMemberSnapshot(data, { public_users: { first: { name: "New Remote Name" }, second: { name: "Another Member" } } })).toBe(1);
  expect(data.public_users["local-copy-first"].name).toBe("Local edit");
  expect(data.public_users["local-copy-second"].name).toBe("Another Member");
  expect(() => mergeMemberSnapshot(data, {})).toThrow("Invalid local member snapshot");
});

test("a refreshed export replaces stale imported profiles and roles while preserving fictional accounts", () => {
  const data = createSampleData();
  mergeMemberSnapshot(data, { revision: "old", public_users: { first: { name: "Anjana", role: "Pledge" }, removed: { name: "Removed" } } });
  data.public_users["local-copy-first"].name = "Local edit";
  mergeMemberSnapshot(data, { revision: "new", public_users: { first: { name: "Anjana", role: "VP of Programming", internships_viewable: false, standing_viewable: false } } });
  expect(data.public_users["local-copy-first"]).toMatchObject({ name: "Anjana", role: "VP of Programming", internships_viewable: false, standing_viewable: false });
  expect(data.allowed_users["local-copy-first"].role).toBe("VP of Programming");
  expect(data.public_users["local-copy-removed"]).toBeUndefined();
  expect(data.users["local-copy-first"].admin).toBe(false);
  expect(data.users["local-copy-first"].standing_viewable).toBe(false);
  expect(data.public_users[demoUid].name).toBe("Alex Morgan");
  data.public_users["local-copy-first"].name = "Preserved on reload";
  mergeMemberSnapshot(data, { revision: "new", public_users: { first: { name: "Anjana", role: "VP of Programming" } } });
  expect(data.public_users["local-copy-first"].name).toBe("Preserved on reload");
});
