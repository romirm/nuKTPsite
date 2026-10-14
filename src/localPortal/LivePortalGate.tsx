import { ReactNode, useEffect, useState } from "react";
import { get, ref } from "./database";
import Logo from "../Assets/Images/Branding/Logo.png";

function signInError(error: any): string {
  if (error?.code === "auth/unauthorized-domain") {
    return "Firebase has not authorized localhost for sign-in. Add localhost in Firebase Console → Authentication → Settings → Authorized domains, then try again.";
  }
  if (error?.code === "auth/popup-blocked") return "Your browser blocked the Google sign-in popup. Allow popups for localhost and try again.";
  if (error?.code === "auth/popup-closed-by-user") return "Sign-in was closed. Try again when you are ready.";
  return error?.message || "Could not sign in. Please try again.";
}

export default function LivePortalGate({ firebase, provider, database, children }: {
  firebase: any; provider: any; database: any; children: ReactNode;
}) {
  const [checking, setChecking] = useState(true);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let revision = 0;
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user: any) => {
      const request = ++revision;
      setApproved(false);
      setError("");
      if (!user) { setChecking(false); return; }
      setChecking(true);
      try {
        const snapshot = await get(ref(database, `users/${user.uid}`));
        if (request !== revision) return;
        const profile = snapshot.val();
        if (!profile || profile.signed_up !== true || (profile.allowed !== true && profile.authorized !== true)) {
          setError("This preview requires an existing, authorized KTP member account. Sign in with the Northwestern account you use on the deployed portal.");
        } else {
          setApproved(true);
        }
      } catch (failure) {
        if (request === revision) setError(signInError(failure));
      } finally {
        if (request === revision) setChecking(false);
      }
    });
    return () => { revision++; unsubscribe(); };
  }, [firebase, database]);

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      await firebase.auth().setPersistence("session");
      await firebase.auth().signInWithPopup(provider);
    } catch (failure) {
      setError(signInError(failure));
    } finally {
      setBusy(false);
    }
  }

  if (approved) return <>{children}</>;
  return (
    <main className="ktp-portal portal-auth flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <img src={Logo} alt="Kappa Theta Pi" className="mb-8 h-12 w-auto" />
        <p className="mb-2 text-sm font-semibold text-indigo-700">LOCAL · READ-ONLY LIVE DATA</p>
        <h1 className="text-2xl font-bold text-slate-900">Preview the member portal</h1>
        <p className="mt-4 text-slate-600">Sign in with your existing KTP Northwestern account to view the deployed Firebase data.</p>
        <p className="mt-3 text-sm text-slate-500">Database edits, uploads, and admin actions are blocked in this local preview.</p>
        {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        <button type="button" disabled={checking || busy} onClick={signIn} className="mt-8 w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-50">
          {checking ? "Checking member access…" : busy ? "Opening Google sign-in…" : "Sign in with Google"}
        </button>
        <a href="http://localhost:3001/member" className="mt-5 block text-center text-sm text-indigo-700 underline">Open sample-data demo</a>
      </div>
    </main>
  );
}
