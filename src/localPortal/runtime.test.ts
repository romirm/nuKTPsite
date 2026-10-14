jest.mock("./config", () => ({ isLocalPortalDemo: false }));
export {};

test("demo auth and data reject access when local demo mode is disabled", async () => {
  const { demoFirebase, demoRef } = await import("./runtime");
  expect(() => demoRef("users")).toThrow("only available in local development");
  expect(() => demoFirebase.auth().currentUser).toThrow("only available in local development");
  await expect(demoFirebase.functions().httpsCallable("setUserAdmin")({})).rejects.toThrow("only available in local development");
});
