import { useEffect, useState } from "react";
import { ref, child, get } from "../../localPortal/database";
import { isLocalPortalDemo, isReadOnlyLivePortal } from "../../localPortal/config";
import { localMemberCopyCount, resetDemoData } from "../../localPortal/runtime";
import { subscribeMemberDirectory } from "../../localPortal/memberDirectory";
import LcLeaderboard from "@tabs/LcLeaderboard/LcLeaderboard";
import PledgeTracker from "@tabs/PledgeTracker/PledgeTracker";
import DirectoryContainer from "@tabs/Directory/DirectoryContainer";
import { isAlumniProfile } from "@tabs/Directory/directoryModel";
import NewUser from "@auth/NewUser";
import PledgeCalendar from "@tabs/Calendar/PledgeCalendar";
import MemberMapHub from "@tabs/Geo/MemberMapHub";
import SocialGraph from "@tabs/SocialGraph/SocialGraph";
import Logo from "@/Assets/Images/Branding/Logo.png";
import AdminPanel from "@tabs/Admin/AdminPanel";
import DesktopSidebar from "@portal/Framework/DesktopSidebar";
import MobileSidebar from "@portal/Framework/MobileSidebar";
import PortalBackdrop from "@portal/Framework/PortalBackdrop";
import Swal from "sweetalert2";
import { ActiveProfileContext } from "@portal/Framework/ActiveProfileContext";
import "./portal.css";
import "./portal-world.css";
import {
  Bars3Icon,
  CogIcon,
  MagnifyingGlassCircleIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  AcademicCapIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  GlobeAltIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
const defaultUser = {
  name: "Loading",
  imageUrl:
    "data:image/jpeg;base64,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",
};
const navigation = {
  Members: {
    name: "Members",
    icon: MagnifyingGlassCircleIcon,
    secondary: false,
    adminonly: false,
    pledgeonly: false,
  },
  PledgeTracker: {
    name: "Pledges",
    icon: ClipboardDocumentListIcon,
    secondary: false,
    adminonly: false,
    pledgeonly: false,
  },
  Calendar: {
    name: "Calendar",
    icon: CalendarIcon,
    secondary: false,
    adminonly: false,
    pledgeonly: false,
  },
  Leaderboard: {
    name: "Leetcode",
    icon: BoltIcon,
    secondary: false,
    adminonly: false,
    pledgeonly: false,
  },
  SocialGraph: {
    name: "Connections",
    icon: ShareIcon,
    secondary: false,
    adminonly: false,
    pledgeonly: false,
  },
  Maps: {
    name: "Maps",
    icon: GlobeAltIcon,
    secondary: false,
    adminonly: false,
    pledgeonly: false,
  },
  Alumni: {
    name: "Alumni", icon: AcademicCapIcon, current: false,
    secondary: false, adminonly: false, pledgeonly: false,
  },
  Admin: {
    name: "Admin",
    icon: WrenchScrewdriverIcon,
    secondary: true,
    adminonly: true,
    pledgeonly: false,
  },
  Profile: {
    name: "Edit Profile",
    icon: CogIcon,
    secondary: true,
    adminonly: false,
    pledgeonly: false,
  },

};

export default function AppContainer(props: { firebase: any, database: any, storage: any }) {
  /* Used by App container/sidebars exclusively */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [pledge, setPledge] = useState(false);
  const [user, setUser] = useState(defaultUser);
  const [currTab, setCurrTab] = useState("Members");
  const [directoryTarget, setDirectoryTarget] = useState("");

  /* Used by tabs */
  const [currUserUid, setCurrUserUid] = useState("");
  const [fullPubDir, setFullPubDir] = useState({});
  const [activeProfile, setActiveProfile] = useState(currUserUid);
  const value: any = { activeProfile, setActiveProfile };

  useEffect(() => {
    if (localStorage.getItem("justSetup") === "true") {
      localStorage.setItem("justSetup", "false");
    }
    let stopDirectory = () => {};
    const stopAuth = props.firebase.auth().onAuthStateChanged((user: any) => {
      stopDirectory();
      if (user) {
        var newUser: any = {};
        const dbRef = ref(props.database);
        setCurrUserUid(user.uid);

        const handleDirectoryError = (error: Error) => {
            console.error("Error loading user profile:", error);

            Swal.fire({
              icon: "error",
              title: "Error loading profile",
              text: "There was an error loading your profile. Please try signing in again or contact support@ktpnu.com if the issue persists.",
            }).then(() => {
              props.firebase.auth().signOut();
              window.location.href = "/signup";
            });
        };
        let initialDirectory = true;
        stopDirectory = subscribeMemberDirectory(props.database, (dir) => {
            const currProfile = dir[user.uid];
            if (!currProfile || typeof currProfile !== "object") {
              handleDirectoryError(new Error("User profile not found in public_users"));
              return;
            }
            newUser.name =
              typeof currProfile["name"] === "string" && currProfile["name"].trim().length > 0
                ? currProfile["name"].trim()
                : user.displayName || "Member";
            newUser.imageUrl =
              currProfile["pfp_thumb_link"] ||
              currProfile["profile_pic_link"] ||
              user.photoURL ||
              defaultUser.imageUrl;

            setUser({ ...newUser });
            setFullPubDir(dir);
            setPledge(currProfile.role === "Pledge");
            if (initialDirectory && isAlumniProfile(currProfile)) setCurrTab("Alumni");
            initialDirectory = false;
          }, handleDirectoryError);
        get(child(dbRef, "users/" + user.uid))
          .then((snapshot) => {
            if (!snapshot.exists()) {
              console.warn("Private user data not found");
              return;
            }
            const prof = snapshot.val();
            setAdmin(Boolean(prof["admin"]));
          })
          .catch((error) => {
            console.error("Error loading user permissions:", error);
          });
      } else {
        let timerInterval: any;
        Swal.fire({
          title: "You are signed out. Redirecting to login...",
          icon: "info",
          timer: 2000,
          timerProgressBar: true,
          willClose: () => {
            clearInterval(timerInterval);
          },
        }).then(() => {
          window.location.href = "/signup";
        });
      }
    });
    return () => { stopAuth(); stopDirectory(); };
  }, []);

  //When sidebar tab is clicked, change the navigation state to reflect the new tab
  function onTabClick(nextButton: string) {
    setDirectoryTarget("");
    setCurrTab(nextButton === "MyProfile" ? (isAlumniProfile((fullPubDir as any)[currUserUid]) ? "Alumni" : "Members") : nextButton);
    if (nextButton === "MyProfile") { setDirectoryTarget(currUserUid); setActiveProfile(currUserUid); }
    setSidebarOpen(false);
  }

  const args: SideBarArgsType = {
    Logo: Logo,
    Navigation: navigation as any,
    CurrTab: currTab,
    ImageUrl: user.imageUrl,
    CurrentUserName: user.name,
    Admin: admin,
    Pledge: pledge,
    uid: currUserUid,
    onTabClick: onTabClick,
  };

  function renderCurrentTab() {
    switch (currTab) {
      case "Members":
      case "Alumni":
        return (
          <ActiveProfileContext.Provider value={value}>
            <DirectoryContainer key={currTab} population={currTab === "Alumni" ? "alumni" : "members"} fullPubDir={fullPubDir} uid={currUserUid} initialProfileUid={directoryTarget} />
          </ActiveProfileContext.Provider>
        );
      case "SocialGraph":
        return <SocialGraph fullPubDir={fullPubDir} uid={currUserUid} onOpenProfile={(id) => {
          setDirectoryTarget(id);
          setActiveProfile(id);
          setCurrTab(isAlumniProfile((fullPubDir as any)[id]) ? "Alumni" : "Members");
        }} />;
      case "Profile":
        return (
          <NewUser
            key={isAlumniProfile((fullPubDir as any)[currUserUid]) ? "alumni-editor" : "member-editor"}
            firebase={props.firebase}
            database={props.database}
            storage={props.storage}
            newuser={false}
            alumni={isAlumniProfile((fullPubDir as any)[currUserUid])}
          />
        );
      case "Calendar":
        return (
          <div className="overflow-y-auto">
            <PledgeCalendar
              firebase={props.firebase}
              database={props.database}
              admin={admin}
              role={pledge ? "Pledge" : "Member"}
            />
          </div>
        );
      case "Admin":
        if (!admin) {
          return null;
        }
        return <AdminPanel firebase={props.firebase} database={props.database} />;
      case "Leaderboard":
        return (
          <div className="h-full">
            <LcLeaderboard fullPubDir={fullPubDir} />
          </div>
        );
      case "PledgeTracker":
        return (
          <div className="h-full">
            <PledgeTracker fullPubDir={fullPubDir} />
          </div>
        );
      case "Maps":
        return (
          <div className="h-full">
            <MemberMapHub
              fullPubDir={fullPubDir}
              database={props.database}
              uid={currUserUid}
            />
          </div>
        );
      default:
        return (
          <ActiveProfileContext.Provider value={value}>
            <DirectoryContainer fullPubDir={fullPubDir} uid={currUserUid} />
          </ActiveProfileContext.Provider>
        );
    }
  }

  return (
    <div className="ktp-portal portal-app">
      <ActiveProfileContext.Provider value={value}>

        <MobileSidebar
          args={args}
          sideBarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <DesktopSidebar args={args} />
      </ActiveProfileContext.Provider>

      <div className="portal-workspace" data-portal-view={currTab}>
        <PortalBackdrop />
        {isReadOnlyLivePortal && (
          <div className="portal-preview-banner portal-preview-live">
            <span><strong>Live Firebase · Read-only</strong> · Database edits, uploads, and admin actions are blocked</span>
            <button type="button" className="font-semibold underline" onClick={() => props.firebase.auth().signOut()}>Sign out</button>
          </div>
        )}
        {isLocalPortalDemo && (
          <div className="portal-preview-banner">
            <span><strong>Local demo</strong> · Sample admin account{localMemberCopyCount() > 0 ? ` · ${localMemberCopyCount()} member profile copies` : ""} · Changes stay in this browser session</span>
            <button type="button" className="font-semibold underline" onClick={resetDemoData}>Reset sample data</button>
          </div>
        )}
        <header className="portal-topbar">
          <div className="portal-topbar-title">
            <button type="button" className="portal-menu-button lg:hidden" onClick={() => setSidebarOpen(true)}>
              <span className="sr-only">Open sidebar</span><Bars3Icon aria-hidden="true" />
            </button>
            <h1>{currTab === "PledgeTracker" ? "Pledge Tracker" : currTab === "Leaderboard" ? "Leetcode Leaderboard" : navigation[currTab as keyof typeof navigation].name}</h1>
          </div>
          <button type="button" className="portal-topbar-profile" onClick={() => { onTabClick("MyProfile"); setActiveProfile(currUserUid); }}>
            <span>{user.name}</span><img src={user.imageUrl} alt="" />
          </button>
        </header>
        <div key={currTab} className="portal-tab-region" data-portal-tab={currTab}>{renderCurrentTab()}</div>
      </div>
    </div>
  );
}
