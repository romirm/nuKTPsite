import { isLocalPortalDemo } from "./config";
import { createSampleData, demoUid } from "./sampleData";
import { mergeMemberSnapshot } from "./memberSnapshot";

const storageKey = "ktp-local-portal-demo-v1";
let data: any;
const listeners = new Set<() => void>();
const authListeners = new Set<(user: any) => void>();

function assertDemo() {
  if (!isLocalPortalDemo) throw new Error("Sample portal access is only available in local development demo mode.");
}

function readData() {
  assertDemo();
  if (!data) {
    try { data = JSON.parse(sessionStorage.getItem(storageKey) || "null"); } catch { /* Reset invalid preview data. */ }
    if (!data || !data.users?.[demoUid]) data = createSampleData();
    // Add fictional globe pins to older preview sessions without resetting their edits.
    if (!data.map_pins) data.map_pins = createSampleData().map_pins;
  }
  return data;
}

export const demoDatabase = { localPortalDemo: true };
export const demoStorage = { localPortalDemo: true };
export const isDemoReference = (reference: any) => reference?.localPortalDemo === true;
export async function loadLocalMemberSnapshot(): Promise<void> {
  assertDemo();
  try {
    const response = await fetch("/__local-portal/member-snapshot", { credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (response.status === 204 || response.status === 404) return;
    if (!response.ok) throw new Error("Local member snapshot unavailable");
    if (mergeMemberSnapshot(readData(), await response.json())) sessionStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    console.warn("Local member snapshot could not be loaded; using existing demo profiles.");
  }
}
export function localMemberCopyCount(): number {
  assertDemo();
  return Object.keys(readData().public_users).filter(uid => uid.startsWith("local-copy-")).length;
}
export function localLeetcodeRefreshTime(): string | null {
  return isLocalPortalDemo && typeof readData().localMemberLeetcodeRefreshAt === "string" ? readData().localMemberLeetcodeRefreshAt : null;
}
export function demoRef(path = ""): any {
  assertDemo();
  return { localPortalDemo: true, path: path.split("/").filter(Boolean).join("/"), key: path.split("/").filter(Boolean).pop() || null };
}

export function demoSnapshot(reference: any): any {
  const value = reference.path.split("/").filter(Boolean).reduce((node: any, key: string) => node?.[key], readData());
  const copy = value == null ? null : JSON.parse(JSON.stringify(value));
  return { key: reference.key, exists: () => copy !== null, val: () => copy };
}

function write(path: string, value: any) {
  const parts = path.split("/").filter(Boolean);
  if (!parts.length) { data = value; return; }
  let node = readData();
  parts.slice(0, -1).forEach(key => { node[key] = node[key] || {}; node = node[key]; });
  if (value == null) delete node[parts[parts.length - 1]];
  else node[parts[parts.length - 1]] = value;
}

export async function demoWrite(reference: any, value: any, merge = false): Promise<void> {
  assertDemo();
  if (merge) Object.entries(value).forEach(([key, entry]) => write([reference.path, key].filter(Boolean).join("/"), entry));
  else write(reference.path, value);
  sessionStorage.setItem(storageKey, JSON.stringify(data));
  listeners.forEach(listener => listener());
}

export function demoSubscribe(reference: any, callback: (snapshot: any) => void): () => void {
  assertDemo();
  const listener = () => callback(demoSnapshot(reference));
  listeners.add(listener);
  queueMicrotask(() => { if (listeners.has(listener)) listener(); });
  return () => { listeners.delete(listener); };
}

export function resetDemoData() {
  assertDemo();
  sessionStorage.removeItem(storageKey);
  window.location.reload();
}

function currentUser() {
  const profile = readData().users[demoUid];
  return { uid: demoUid, displayName: profile.name, email: profile.email, photoURL: profile.profile_pic_link };
}
let signedOut = false;
const demoAuth = {
  get currentUser() { return signedOut ? null : currentUser(); },
  onAuthStateChanged(callback: (user: any) => void) {
    assertDemo();
    authListeners.add(callback);
    queueMicrotask(() => { if (authListeners.has(callback)) callback(demoAuth.currentUser); });
    return () => { authListeners.delete(callback); };
  },
  async signInWithPopup() {
    assertDemo(); signedOut = false;
    authListeners.forEach(callback => callback(currentUser()));
    return { user: currentUser() };
  },
  async signOut() {
    assertDemo(); signedOut = true;
    authListeners.forEach(callback => callback(null));
  },
};
export const demoFirebase = {
  auth: () => demoAuth,
  functions: () => ({ httpsCallable: (name: string) => async (args: any) => {
    assertDemo();
    if (name !== "setUserAdmin") throw new Error(`${name} is unavailable in the local preview.`);
    await demoWrite(demoRef(`users/${args.targetUid}/admin`), Boolean(args.admin));
    return { data: { success: true } };
  } }),
};
