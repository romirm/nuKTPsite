import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MemberPage from "@portal/AppContainer";
import MemberLogin from "@auth/GoogleRedirect";
import SignUp from "@auth/SignUp";
import NewUserCont from "@auth/NewUserCont";
import LandingPage from "@landing/LandingPage";
import Maintenance from "@landing/Maintenance";

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/functions";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";import { getStorage, connectStorageEmulator } from "firebase/storage";
import { isLocalPortalDemo, isReadOnlyLivePortal } from "./localPortal/config";
import { demoFirebase, demoDatabase, demoStorage, loadLocalMemberSnapshot } from "./localPortal/runtime";
import { createReadOnlyFirebase } from "./localPortal/readOnly";
import LivePortalGate from "./localPortal/LivePortalGate";

const firebaseConfig = {
  apiKey: "AIzaSyBY_olTq-IJkQs1-VXTCgxIUzlD7_-3MXQ",
  authDomain: isReadOnlyLivePortal ? "ktp-site.firebaseapp.com" : "www.ktpnu.com",
  projectId: "ktp-site",
  storageBucket: "ktp-site.appspot.com",
  messagingSenderId: "239929865580",
  appId: "1:239929865580:web:8871c4295a78dc93076f49",
  measurementId: "G-K67BS563H9",
  databaseURL: "https://ktp-site-default-rtdb.firebaseio.com/",
};

const app = firebase.initializeApp(firebaseConfig);
var provider = new firebase.auth.GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
if (isReadOnlyLivePortal) provider.setCustomParameters({ prompt: "select_account" });
var database: any;
var storage: any;

if (isLocalPortalDemo) {
  database = demoDatabase;
  storage = demoStorage;
} else if (!isReadOnlyLivePortal && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) {
  database = getDatabase();
  storage = getStorage();
  connectDatabaseEmulator(database, "localhost", 9000);
  connectStorageEmulator(storage, "localhost", 9199);
  firebase.functions().useEmulator("localhost", 5001);
  firebase.auth().useEmulator("http://localhost:9099");
  if (!sessionStorage.getItem("givenWarning")) {
    alert(
      "Initializing in emulator mode. If you aren't a developer, contact support@ktpnu.com immediately."
    );
    sessionStorage.setItem("givenWarning", "true");
  }
} else {
  storage = getStorage(app);
  database = getDatabase(app);
}

const maintenance = false;
const portalFirebase = isLocalPortalDemo ? demoFirebase : isReadOnlyLivePortal ? createReadOnlyFirebase(firebase) : firebase;
const localPortalAccess = isLocalPortalDemo || isReadOnlyLivePortal;
const memberPage = <MemberPage firebase={portalFirebase} database={database} storage={storage} />;

class Full extends React.Component {
  render() {
    return (
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage maintenance={maintenance} />
            }
          ></Route>
          <Route
            path="/member"
            element={
              isReadOnlyLivePortal ? (
                <LivePortalGate firebase={portalFirebase} provider={provider} database={database}>
                  {memberPage}
                </LivePortalGate>
              ) : memberPage
            }
          ></Route>
          <Route
            path="/login"
            element={
              localPortalAccess ? <Navigate to="/member" replace /> : <MemberLogin
                firebase={firebase}
                provider={provider}
                database={database}
              />
            }
          ></Route>
          <Route
            path="/signup"
            element={
              localPortalAccess ? <Navigate to="/member" replace /> : <SignUp
                firebase={firebase}
                database={database}
                provider={provider}
              />
            }
          ></Route>

          <Route
            path="/newuser"
            element={
              localPortalAccess ? <Navigate to="/member" replace /> : <NewUserCont
                firebase={firebase}
                provider={provider}
                database={database}
                storage={storage}
              />
            }
          ></Route>
          <Route path="/maintenance" element={<Maintenance />}></Route>
        </Routes>
      </Router>
    );
  }
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
async function renderApplication() {
  if (isLocalPortalDemo) await loadLocalMemberSnapshot();
  root.render(<Full />);
}
void renderApplication();
