import { child, get, onValue, push, ref, remove, set, update } from "./database";
import { demoDatabase, demoFirebase } from "./runtime";

jest.mock("./config", () => ({ isLocalPortalDemo: true }));

test("sample auth and profiles use the same account", async () => {
  const user = demoFirebase.auth().currentUser;
  if (!user) throw new Error("Sample user did not sign in.");
  const profile = await get(child(ref(demoDatabase), `users/${user.uid}`));
  expect(profile.exists()).toBe(true);
  expect(profile.val().name).toBe(user.displayName);
  expect(profile.val().admin).toBe(true);
});

test("nested edits notify subscribers and persist only in demo session storage", async () => {
  const root = ref(demoDatabase, "test-preview");
  const listener = jest.fn();
  const unsubscribe = onValue(root, listener);
  await set(root, { keep: true });
  await update(root, { "nested/value": 42 });
  expect((await get(child(root, "nested"))).val()).toEqual({ value: 42 });
  expect((await get(root)).val().keep).toBe(true);
  const post = push(root);
  await set(post, { message: "Sample entry" });
  expect((await get(post)).exists()).toBe(true);
  await remove(post);
  expect((await get(post)).exists()).toBe(false);
  expect(JSON.parse(sessionStorage.getItem("ktp-local-portal-demo-v1")!).users).toBeDefined();
  unsubscribe();
  listener.mockClear();
  await set(root, { after: true });
  expect(listener).not.toHaveBeenCalled();
});

test("demo admin updates affect only sample accounts", async () => {
  await demoFirebase.functions().httpsCallable("setUserAdmin")({ targetUid: "demo-jamie", admin: true });
  expect((await get(ref(demoDatabase, "users/demo-jamie/admin"))).val()).toBe(true);
  await expect(demoFirebase.functions().httpsCallable("unknown")({})).rejects.toThrow("unavailable");
});
