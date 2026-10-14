// Keep the portal's Firebase API; route only demo references to browser sample data.
import * as real from "firebase/database";
import { demoRef, demoSnapshot, demoWrite, demoSubscribe, isDemoReference } from "./runtime";
import { assertPortalWriteAllowed } from "./readOnly";

export const ref = (database: any, path = ""): any => isDemoReference(database) ? demoRef(path) : real.ref(database, path);
export const child = (reference: any, path: string): any => isDemoReference(reference) ? demoRef([reference.path, path].filter(Boolean).join("/")) : real.child(reference, path);
export const get = (reference: any): Promise<any> => isDemoReference(reference) ? Promise.resolve(demoSnapshot(reference)) : real.get(reference);
export const set = async (reference: any, value: any): Promise<void> => {
  assertPortalWriteAllowed();
  return isDemoReference(reference) ? demoWrite(reference, value) : real.set(reference, value);
};
export const update = async (reference: any, value: any): Promise<void> => {
  assertPortalWriteAllowed();
  return isDemoReference(reference) ? demoWrite(reference, value, true) : real.update(reference, value);
};
export const remove = async (reference: any): Promise<void> => {
  assertPortalWriteAllowed();
  return isDemoReference(reference) ? demoWrite(reference, null) : real.remove(reference);
};
export const push = (reference: any): any => {
  assertPortalWriteAllowed();
  return isDemoReference(reference) ? child(reference, `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`) : real.push(reference);
};
export const onValue = (reference: any, callback: (snapshot: any) => void, onError?: (error: Error) => void): (() => void) => isDemoReference(reference) ? demoSubscribe(reference, callback) : onError ? real.onValue(reference, callback, onError) : real.onValue(reference, callback);
