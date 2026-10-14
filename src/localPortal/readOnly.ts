import { isReadOnlyLivePortal } from "./config";

export function assertPortalWriteAllowed(): void {
  if (isReadOnlyLivePortal) {
    throw new Error("This local portal is read-only. Changes to deployed Firebase data are blocked.");
  }
}

// Only authentication is forwarded. No live Cloud Function can be called here.
export function createReadOnlyFirebase(firebase: any) {
  return {
    auth: () => firebase.auth(),
    functions: () => ({
      httpsCallable: () => async () => {
        throw new Error("Cloud Functions are disabled in the read-only local portal.");
      },
    }),
  };
}
