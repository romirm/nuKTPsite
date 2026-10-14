import * as real from "firebase/storage";
import { isDemoReference } from "./runtime";
import { isLocalPortalDemo } from "./config";
import { assertPortalWriteAllowed } from "./readOnly";

const uploads = new Map<string, string>();
export const ref = (storage: any, path: string): any => isDemoReference(storage) ? { localPortalDemo: true, path } : real.ref(storage, path);
export async function uploadBytes(reference: any, file: Blob): Promise<any> {
  assertPortalWriteAllowed();
  if (!isDemoReference(reference)) return real.uploadBytes(reference, file);
  if (!isLocalPortalDemo) throw new Error("Local preview is disabled.");
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  uploads.set(reference.path, url);
  return { ref: reference };
}
export async function getDownloadURL(reference: any): Promise<string> {
  if (!isDemoReference(reference)) return real.getDownloadURL(reference);
  if (!isLocalPortalDemo) throw new Error("Local preview is disabled.");
  const url = uploads.get(reference.path);
  if (!url) throw new Error("Upload a sample file first.");
  return url;
}
