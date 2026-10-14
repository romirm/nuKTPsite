import * as firebaseDatabase from "firebase/database";
import * as firebaseStorage from "firebase/storage";
import { get, onValue, push, ref, remove, set, update } from "./database";
import { getDownloadURL, uploadBytes } from "./storage";
import { createReadOnlyFirebase } from "./readOnly";

jest.mock("./config", () => ({ isReadOnlyLivePortal: true, isLocalPortalDemo: false }));
jest.mock("firebase/database", () => ({
  ref: jest.fn(() => ({ live: true })), child: jest.fn(), get: jest.fn(async () => "live snapshot"),
  onValue: jest.fn(() => () => {}), set: jest.fn(), update: jest.fn(), remove: jest.fn(), push: jest.fn(),
}));
jest.mock("firebase/storage", () => ({ uploadBytes: jest.fn(), getDownloadURL: jest.fn(async () => "live file URL") }));

beforeEach(() => {
  (firebaseDatabase.ref as jest.Mock).mockReturnValue({ live: true });
  (firebaseDatabase.get as jest.Mock).mockResolvedValue("live snapshot");
  (firebaseDatabase.onValue as jest.Mock).mockReturnValue(() => {});
  (firebaseStorage.getDownloadURL as jest.Mock).mockResolvedValue("live file URL");
});

test("live database reads and subscriptions pass through", async () => {
  const reference = ref({}, "public_users");
  expect(await get(reference)).toBe("live snapshot");
  const listener = jest.fn();
  expect(typeof onValue(reference, listener)).toBe("function");
  expect(firebaseDatabase.get).toHaveBeenCalledWith(reference);
  expect(firebaseDatabase.onValue).toHaveBeenCalledWith(reference, listener);
});

test("every database mutation is stopped before calling Firebase", async () => {
  const reference = ref({}, "public_users");
  await expect(set(reference, {})).rejects.toThrow("read-only");
  await expect(update(reference, {})).rejects.toThrow("read-only");
  await expect(remove(reference)).rejects.toThrow("read-only");
  expect(() => push(reference)).toThrow("read-only");
  for (const method of [firebaseDatabase.set, firebaseDatabase.update, firebaseDatabase.remove, firebaseDatabase.push]) {
    expect(method).not.toHaveBeenCalled();
  }
});

test("storage reads work but uploads never reach Firebase", async () => {
  expect(await getDownloadURL({})).toBe("live file URL");
  await expect(uploadBytes({}, new Blob())).rejects.toThrow("read-only");
  expect(firebaseStorage.uploadBytes).not.toHaveBeenCalled();
});

test("authentication is forwarded while all callable functions are blocked", async () => {
  const auth = { currentUser: { uid: "existing-member" } };
  const firebase = { auth: jest.fn(() => auth), functions: jest.fn() };
  const readOnlyFirebase = createReadOnlyFirebase(firebase);
  expect(readOnlyFirebase.auth()).toBe(auth);
  await expect(readOnlyFirebase.functions().httpsCallable()()).rejects.toThrow("disabled");
  expect(firebase.functions).not.toHaveBeenCalled();
});
