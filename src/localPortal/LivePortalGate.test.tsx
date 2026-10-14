import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import LivePortalGate from "./LivePortalGate";
import { get } from "./database";

jest.mock("./database", () => ({ get: jest.fn(), ref: jest.fn() }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

async function mountGate(profile: any) {
  (get as jest.Mock).mockResolvedValue({ val: () => profile });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const unsubscribe = jest.fn();
  const firebase = { auth: () => ({ onAuthStateChanged: (callback: any) => {
    void callback({ uid: "existing-member" });
    return unsubscribe;
  } }) };
  await act(async () => {
    root.render(<LivePortalGate firebase={firebase} provider={{}} database={{}}><div>Live member directory</div></LivePortalGate>);
  });
  return { container, root, unsubscribe };
}

test("an existing authorized member can view the live portal", async () => {
  const { container, root, unsubscribe } = await mountGate({ allowed: true, signed_up: true });
  expect(container.textContent).toContain("Live member directory");
  act(() => root.unmount());
  expect(unsubscribe).toHaveBeenCalled();
  container.remove();
});

test("missing or unfinished profiles stay on sign-in without onboarding", async () => {
  for (const profile of [null, { allowed: true, signed_up: false }, { allowed: false, signed_up: true }]) {
    const { container, root } = await mountGate(profile);
    expect(container.textContent).toContain("existing, authorized KTP member account");
    expect(container.textContent).not.toContain("Live member directory");
    act(() => root.unmount());
    container.remove();
  }
});
