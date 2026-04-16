import React, { RefObject } from "react";
import {
  UserPlusIcon,
  PaperAirplaneIcon,
  LinkIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  TrashIcon,
  CheckBadgeIcon,
} from "@heroicons/react/20/solid";
import { ref, set, get, child, update, remove } from "firebase/database";
import Swal, { SweetAlertResult } from "sweetalert2";
import { Tab } from "@headlessui/react";

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const PLACEHOLDER_PFP_URL = "https://via.placeholder.com/200";
const DEFAULT_PLEDGE_POINTS = 100;

const toSafeNumber = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
};

const parseCapstoneProgress = (rawValue: any): [boolean, boolean, boolean] => {
  if (Array.isArray(rawValue)) {
    return [Boolean(rawValue[0]), Boolean(rawValue[1]), Boolean(rawValue[2])];
  }

  const capstoneObj = rawValue && typeof rawValue === "object" ? rawValue : {};
  return [
    Boolean(capstoneObj.milestone_1 ?? capstoneObj.step_1 ?? capstoneObj.box_1 ?? capstoneObj.stage_1),
    Boolean(capstoneObj.milestone_2 ?? capstoneObj.step_2 ?? capstoneObj.box_2 ?? capstoneObj.stage_2),
    Boolean(capstoneObj.milestone_3 ?? capstoneObj.step_3 ?? capstoneObj.box_3 ?? capstoneObj.stage_3),
  ];
};

interface PledgeTrackerUserRow {
  uid: string;
  name: string;
  pictureLink: string;
  pledgePoints: number;
  coffeeChatsCompleted: number;
  thankYouNotesSent: number;
  capstoneProjectProgress: [boolean, boolean, boolean];
}

interface AdminUserRow {
  uid: string;
  name: string;
  currentRole: string;
  currentAdmin: boolean;
}

interface AdminPanelState {
  users: AdminUserRow[];
  loading: boolean;
  searchTerm: string;
  roleSelections: {[uid: string]: string}; // Track whether user selected Exec or Custom
  adminSavingByUid: {[uid: string]: boolean};
  selectedProfileUid: string;
  editYear: string;
  editMajor: string;
  editStandingViewable: boolean | null;
  editLoading: boolean;
  messageRecipientType: string;
  directMessageUid: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  eventMandatory: boolean;
  eventGroup: string;
  eventDescription: string;
  selectedTab: number;
  calendarEvents: Array<{id: string, Name: string, Date: string, Type: string, "Mandatory?": boolean, Group: string, Description: string}>;
  calendarLoading: boolean;
  pledgeTrackerRows: PledgeTrackerUserRow[];
  pledgeTrackerLoading: boolean;
  pledgeTrackerSavingUid: string;
}

class AdminPanel extends React.Component<{firebase:any,database:any}, AdminPanelState> {
  emailButton:RefObject<HTMLInputElement>;
  sendTextButton:RefObject<HTMLTextAreaElement>;
  whoToButton:RefObject<HTMLSelectElement>;
  messageTypeButton:RefObject<HTMLSelectElement>;
  typeOfMember:RefObject<HTMLSelectElement>;
  eventNameInput:RefObject<HTMLInputElement>;
  eventDateInput:RefObject<HTMLInputElement>;
  eventDescInput:RefObject<HTMLTextAreaElement>;
  constructor(props:{firebase:any,database:any}) {
    super(props);
    this.state = {
      users: [],
      loading: true,
      searchTerm: "",
      roleSelections: {},
      adminSavingByUid: {},
      selectedProfileUid: "",
      editYear: "",
      editMajor: "",
      editStandingViewable: null,
      editLoading: false,
      messageRecipientType: "Pledges",
      directMessageUid: "",
      eventName: "",
      eventDate: "",
      eventType: "Social",
      eventMandatory: false,
      eventGroup: "Everyone",
      eventDescription: "",
      selectedTab: 0,
      calendarEvents: [],
      calendarLoading: true,
      pledgeTrackerRows: [],
      pledgeTrackerLoading: true,
      pledgeTrackerSavingUid: "",
    };
    this.addNewUser = this.addNewUser.bind(this);
    this.sendText = this.sendText.bind(this);
    this.loadUsers = this.loadUsers.bind(this);
    this.updateUserRole = this.updateUserRole.bind(this);
    this.updateUserRoleCustom = this.updateUserRoleCustom.bind(this);
    this.updateUserAdminAccess = this.updateUserAdminAccess.bind(this);
    this.loadUserAcademicInfo = this.loadUserAcademicInfo.bind(this);
    this.updateUserAcademicInfo = this.updateUserAcademicInfo.bind(this);
    this.addCalendarEvent = this.addCalendarEvent.bind(this);
    this.loadCalendarEvents = this.loadCalendarEvents.bind(this);
    this.deleteCalendarEvent = this.deleteCalendarEvent.bind(this);
    this.updatePledgeTrackerNumber = this.updatePledgeTrackerNumber.bind(this);
    this.toggleCapstoneProgress = this.toggleCapstoneProgress.bind(this);
    this.saveAllPledgeTrackerRows = this.saveAllPledgeTrackerRows.bind(this);
    this.emailButton = React.createRef<HTMLInputElement>();
    this.sendTextButton = React.createRef<HTMLTextAreaElement>();
    this.whoToButton = React.createRef<HTMLSelectElement>();
    this.messageTypeButton = React.createRef<HTMLSelectElement>();
    this.typeOfMember = React.createRef<HTMLSelectElement>();
    this.eventNameInput = React.createRef<HTMLInputElement>();
    this.eventDateInput = React.createRef<HTMLInputElement>();
    this.eventDescInput = React.createRef<HTMLTextAreaElement>();
    //the backend only allows this if they are already set as admin
    //dw about the security, i set up all the database rules correctly - steve
  }

  async loadUsers() {
    try {
      this.setState({ loading: true, pledgeTrackerLoading: true });
      const dbRef = ref(this.props.database);
      const [publicResult, allowedResult] = await Promise.allSettled([
        get(child(dbRef, "public_users")),
        get(child(dbRef, "allowed_users"))
      ]);

      if (publicResult.status !== "fulfilled") {
        throw publicResult.reason;
      }

      const publicUsers = publicResult.value.val() || {};
      const allowedUsers =
        allowedResult.status === "fulfilled"
          ? allowedResult.value.val() || {}
          : {};
      const adminByUid: {[uid: string]: boolean} = {};

      // Reading /users directly is denied by rules. Read each admin flag separately.
      await Promise.all(
        Object.keys(publicUsers).map(async (uid) => {
          try {
            const adminSnapshot = await get(child(dbRef, `users/${uid}/admin`));
            adminByUid[uid] = adminSnapshot.val() === true;
          } catch (error) {
            adminByUid[uid] = false;
          }
        })
      );

      const usersList: AdminUserRow[] = Object.keys(publicUsers)
        .map(uid => ({
          uid,
          name: publicUsers[uid].name || "Unknown",
          currentRole: allowedUsers[uid]?.role || publicUsers[uid].role || "No Role",
          currentAdmin: Boolean(adminByUid[uid])
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const pledgeRows: PledgeTrackerUserRow[] = [];
      Object.keys(publicUsers).forEach((uid) => {
        const user = publicUsers[uid] || {};
        const mergedRole = String(allowedUsers[uid]?.role || user.role || "").trim().toLowerCase();

        if (mergedRole !== "pledge") {
          return;
        }

        const pledgeTracker = user.pledge_tracker || user.pledgeTracker || {};
        pledgeRows.push({
          uid,
          name: user.name || "Unknown",
          pictureLink:
            user.pfp_large_link ||
            user.profile_pic_link ||
            user.pfp_thumb_link ||
            PLACEHOLDER_PFP_URL,
          pledgePoints: toSafeNumber(
            pledgeTracker.pledge_points ??
              pledgeTracker.pledgePoints ??
              DEFAULT_PLEDGE_POINTS
          ),
          coffeeChatsCompleted: toSafeNumber(
            pledgeTracker.coffee_chats_completed ??
              pledgeTracker.coffeeChatsCompleted
          ),
          thankYouNotesSent: toSafeNumber(
            pledgeTracker.thank_you_notes_sent ?? pledgeTracker.thankYouNotesSent
          ),
          capstoneProjectProgress: parseCapstoneProgress(
            pledgeTracker.capstone_project_progress ??
              pledgeTracker.capstoneProjectProgress
          ),
        });
      });

      pledgeRows.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

      this.setState({
        users: usersList,
        loading: false,
        pledgeTrackerRows: pledgeRows,
        pledgeTrackerLoading: false,
      });
    } catch (error) {
      console.error("Error loading users:", error);
      Swal.fire({
        icon: "error",
        title: "Error loading users",
        text: "Could not load user list. Check console for details."
      });
      this.setState({ loading: false, pledgeTrackerLoading: false });
    }
  }

  updateUserRole(uid: string, newRole: string) {
    const user = this.state.users.find(u => u.uid === uid);
    if (!user || !newRole) return;

    // Update immediately without confirmation
    set(ref(this.props.database, `allowed_users/${uid}/role`), newRole)
      .then(() => {
        // Update local state
        this.setState({
          users: this.state.users.map(u => 
            u.uid === uid ? { ...u, currentRole: newRole } : u
          )
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Update failed",
          text: error.message
        });
      });
  }

  updateUserRoleCustom(uid: string, customRole: string) {
    if (!customRole.trim()) {
      Swal.fire({
        icon: "error",
        title: "Empty role",
        text: "Please enter a role name"
      });
      return;
    }
    this.updateUserRole(uid, customRole.trim());
  }

  updateUserAdminAccess(uid: string, nextAdminValue: boolean) {
    this.setState((prevState) => ({
      adminSavingByUid: {
        ...prevState.adminSavingByUid,
        [uid]: true,
      },
    }));

    this.props.firebase
      .functions()
      .httpsCallable("setUserAdmin")({
        targetUid: uid,
        admin: nextAdminValue,
      })
      .then(() => {
        this.setState((prevState) => ({
          users: prevState.users.map((u) =>
            u.uid === uid ? { ...u, currentAdmin: nextAdminValue } : u
          ),
        }));
        Swal.fire({
          icon: "success",
          title: nextAdminValue ? "Admin granted" : "Admin removed",
          text: nextAdminValue
            ? "This user now has admin access."
            : "This user no longer has admin access.",
        });
      })
      .catch((error: any) => {
        Swal.fire({
          icon: "error",
          title: "Admin update failed",
          text: error?.message || "Could not update admin access.",
        });
      })
      .finally(() => {
        this.setState((prevState) => ({
          adminSavingByUid: {
            ...prevState.adminSavingByUid,
            [uid]: false,
          },
        }));
      });
  }

  async loadUserAcademicInfo(uid: string) {
    if (!uid) {
      this.setState({ editYear: "", editMajor: "", editStandingViewable: null });
      return;
    }

    this.setState({ editLoading: true });
    try {
      const dbRef = ref(this.props.database);
      const snapshot = await get(child(dbRef, `users/${uid}`));
      if (!snapshot.exists()) {
        Swal.fire({
          icon: "error",
          title: "User not found",
          text: "Could not load academic info for this member."
        });
        this.setState({ editLoading: false });
        return;
      }

      const userData = snapshot.val() || {};
      this.setState({
        editYear: userData.year || "",
        editMajor: userData.major || "",
        editStandingViewable: !!userData.standing_viewable,
        editLoading: false
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load",
        text: "Could not load year/major for this member."
      });
      this.setState({ editLoading: false });
    }
  }

  async updateUserAcademicInfo() {
    const { selectedProfileUid, editYear, editMajor, editStandingViewable } = this.state;
    if (!selectedProfileUid) {
      Swal.fire({
        icon: "error",
        title: "Select a member",
        text: "Please choose a member to update."
      });
      return;
    }

    if (!editYear.trim() && !editMajor.trim()) {
      Swal.fire({
        icon: "error",
        title: "Missing info",
        text: "Enter a year or major to update."
      });
      return;
    }

    this.setState({ editLoading: true });
    try {
      const yearValue = editYear.trim();
      const majorValue = editMajor.trim();
      let standingViewable = editStandingViewable;

      if (standingViewable === null) {
        const dbRef = ref(this.props.database);
        const snapshot = await get(child(dbRef, `users/${selectedProfileUid}`));
        standingViewable = !!snapshot.val()?.standing_viewable;
      }

      const publicYear = standingViewable ? yearValue : "";

      await Promise.all([
        update(ref(this.props.database, `users/${selectedProfileUid}`), {
          year: yearValue,
          major: majorValue
        }),
        update(ref(this.props.database, `public_users/${selectedProfileUid}`), {
          year: publicYear,
          major: majorValue
        })
      ]);

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Year/major updated successfully."
      });
    } catch (error:any) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: error.message || "Could not update year/major."
      });
    } finally {
      this.setState({ editLoading: false });
    }
  }

  sendText() {
    if(!(this.sendTextButton.current)) { //TODO: make sure this works lol
      return;
    }
    if(!(this.whoToButton.current)) {
      return;
    }
    if(!(this.messageTypeButton.current)) {
      return;
    }
    const text = this.sendTextButton.current.value;
    if (text.length < 5) {
      Swal.fire({
        icon: "error",
        text: "Message too short",
      });
    } else {
      const whoTo = this.whoToButton.current.value;
      const whatType = this.messageTypeButton.current.value;
      let targetUid = "";
      let targetName = "";

      if (whoTo === "Individual") {
        targetUid = this.state.directMessageUid;
        if (!targetUid) {
          Swal.fire({
            icon: "error",
            title: "Select a recipient",
            text: "Please choose a member to message directly."
          });
          return;
        }
        const targetUser = this.state.users.find((user) => user.uid === targetUid);
        targetName = targetUser ? targetUser.name : "Selected member";
      }
      Swal.fire({
        title: "Is this correct?",
        text: whoTo === "Individual" ? `${text} (Recipient: ${targetName})` : text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, send the text",
      }).then((res:SweetAlertResult) => {
        if (res["isConfirmed"]) {
          Swal.fire({
            title: "Are you sure?",
            text: "Once you send this text, you can't unsend it." + (whoTo === "Individual" ? " Recipient: " + targetName + "." : "") + " Text: " + text,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, send the text",
          }).then((res:SweetAlertResult) => {
            if (res["isConfirmed"]) {
              this.props.firebase
                .functions()
                .httpsCallable("sendText")({
                  message: text,
                  whoTo: whoTo,
                  type: whatType,
                  targetUid: whoTo === "Individual" ? targetUid : "",
                })
                .then((res:any) => {
                  if (res["data"]["status"] === "Success") {
                    Swal.fire({
                      title: "Success!",
                      icon: "success",
                      text:
                        whoTo === "Individual"
                          ? "Sent message to " + targetName + "."
                          : "Sent message to " +
                            whoTo.toLowerCase() +
                            " (total of " +
                            String(res["data"]["amount"]) +
                            " people).",
                    });
                  } else {
                    Swal.fire({
                      title: "Message send failure",
                      text: "Do not attempt to resend the message. Contact Steve.",
                      icon: "error",
                    });
                  }
                });
            }
          });
        }
      });
    }
  }

  addNewUser() {
    if(!(this.emailButton.current)) {
      alert("Email button not found\n");
      return;
    }
    const newEmail = this.emailButton.current.value.toLowerCase();
    this.emailButton.current.value = "";
    if (!newEmail.includes("@u.northwestern.edu")) {
      Swal.fire({
        icon: "error",
        title: "Invalid email",
        text: "Email must be a u.northwestern.edu email.",
      });
    } else if (!validateEmail(newEmail)) {
      Swal.fire({ icon: "error", title: "Invalid email" });
    } else {
      const formattedEmail = newEmail.substring(0, newEmail.length - 19);
      Swal.fire({
        title: "Is this correct?",
        text: "Do you want to add " + newEmail + " to the system?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, add them as a member",
      }).then((result) => {
        if (result.isConfirmed) {
          if(!(this.typeOfMember.current)) {
            alert("Type of member selector not found\n");
            return;
          }
          var typeOfUser = this.typeOfMember.current.value;
          set(
            ref(this.props.database, "allowed_users/" + formattedEmail + "/role"),
            typeOfUser
          )
            .then(() => {
              Swal.fire({
                icon: "success",
                title: "Successfully added!",
                text: "Successfully added " + newEmail,
              });
              // Reload the user list to show the new user
              this.loadUsers();
            })
            .catch((err) => {
              Swal.fire({
                icon: "error",
                title: "Couldn't add " + newEmail,
                text: err,
              });
            });
        }
      });
    }
  }

  addCalendarEvent() {
    const { eventName, eventDate, eventType, eventMandatory, eventGroup, eventDescription } = this.state;

    // Validation
    if (!eventName || !eventDate) {
      Swal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please provide at least an event name and date."
      });
      return;
    }

    // Create event object with properly formatted date
    const newEvent = {
      Name: eventName,
      Date: eventDate, // Keep in YYYY-MM-DD format from input
      Type: eventType,
      "Mandatory?": eventMandatory,
      Group: eventGroup,
      Description: eventDescription,
      createdAt: new Date().toISOString()
    };

    // Generate unique ID for the event
    const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save to Firebase
    set(ref(this.props.database, `calendar_events/${eventId}`), newEvent)
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Event Added!",
          text: `Successfully added "${eventName}" to the calendar.`
        });
        
        // Reset form
        this.setState({
          eventName: "",
          eventDate: "",
          eventType: "Social",
          eventMandatory: false,
          eventGroup: "Everyone",
          eventDescription: ""
        });
        
        // Clear input refs
        if (this.eventNameInput.current) this.eventNameInput.current.value = "";
        if (this.eventDateInput.current) this.eventDateInput.current.value = "";
        if (this.eventDescInput.current) this.eventDescInput.current.value = "";
        
        // Reload calendar events
        this.loadCalendarEvents();
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Failed to Add Event",
          text: error.message
        });
      });
  }

  async loadCalendarEvents() {
    try {
      this.setState({ calendarLoading: true });
      const dbRef = ref(this.props.database);
      const snapshot = await get(child(dbRef, "calendar_events"));
      
      if (snapshot.exists()) {
        const firebaseEvents = snapshot.val();
        const formattedEvents = [];

        for (let eventId in firebaseEvents) {
          const event = firebaseEvents[eventId];
          
          // Parse date to ensure proper formatting
          let dateStr = event.Date;
          let dateObj;
          if (dateStr && dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-');
            dateObj = new Date(year, month - 1, day);
          } else {
            dateObj = new Date(dateStr);
          }
          
          const formattedEvent = {
            id: eventId,
            Name: event.Name,
            Date: dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            Type: event.Type || "Social",
            "Mandatory?": event["Mandatory?"],
            Group: event.Group || "Everyone",
            Description: event.Description || ""
          };

          formattedEvents.push(formattedEvent);
        }

        // Sort by date
        formattedEvents.sort((a, b) => {
          let a_date = new Date(Date.parse(a.Date));
          let b_date = new Date(Date.parse(b.Date));
          return a_date.getTime() - b_date.getTime();
        });

        this.setState({ calendarEvents: formattedEvents, calendarLoading: false });
      } else {
        this.setState({ calendarEvents: [], calendarLoading: false });
      }
    } catch (error) {
      console.error("Error loading calendar events:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Load Events",
        text: "Could not load calendar events. Check console for details."
      });
      this.setState({ calendarLoading: false });
    }
  }

  deleteCalendarEvent(eventId: string, eventName: string) {
    Swal.fire({
      title: "Delete Event?",
      text: `Are you sure you want to delete "${eventName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        remove(ref(this.props.database, `calendar_events/${eventId}`))
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Event Deleted!",
              text: "The event has been removed from the calendar."
            });
            // Reload events
            this.loadCalendarEvents();
          })
          .catch((error) => {
            Swal.fire({
              icon: "error",
              title: "Failed to Delete Event",
              text: error.message
            });
          });
      }
    });
  }

  updatePledgeTrackerNumber(
    uid: string,
    field: "pledgePoints" | "coffeeChatsCompleted" | "thankYouNotesSent",
    value: string
  ) {
    const sanitizedValue = value === "" ? 0 : toSafeNumber(value);

    this.setState((prevState) => ({
      pledgeTrackerRows: prevState.pledgeTrackerRows.map((row) => {
        if (row.uid !== uid) {
          return row;
        }

        return {
          ...row,
          pledgePoints:
            field === "pledgePoints" ? sanitizedValue : row.pledgePoints,
          coffeeChatsCompleted:
            field === "coffeeChatsCompleted"
              ? sanitizedValue
              : row.coffeeChatsCompleted,
          thankYouNotesSent:
            field === "thankYouNotesSent"
              ? sanitizedValue
              : row.thankYouNotesSent,
        };
      }),
    }));
  }

  toggleCapstoneProgress(uid: string, index: 0 | 1 | 2) {
    this.setState((prevState) => ({
      pledgeTrackerRows: prevState.pledgeTrackerRows.map((row) => {
        if (row.uid !== uid) {
          return row;
        }

        const nextProgress: [boolean, boolean, boolean] = [
          row.capstoneProjectProgress[0],
          row.capstoneProjectProgress[1],
          row.capstoneProjectProgress[2],
        ];
        nextProgress[index] = !nextProgress[index];

        return {
          ...row,
          capstoneProjectProgress: nextProgress,
        };
      }),
    }));
  }

  async saveAllPledgeTrackerRows() {
    const rows = this.state.pledgeTrackerRows;
    if (rows.length === 0) {
      return;
    }

    const updatesMap: { [path: string]: any } = {};
    rows.forEach((row) => {
      updatesMap[`public_users/${row.uid}/pledge_tracker`] = {
        pledge_points: toSafeNumber(row.pledgePoints),
        coffee_chats_completed: toSafeNumber(row.coffeeChatsCompleted),
        thank_you_notes_sent: toSafeNumber(row.thankYouNotesSent),
        capstone_project_progress: {
          milestone_1: Boolean(row.capstoneProjectProgress[0]),
          milestone_2: Boolean(row.capstoneProjectProgress[1]),
          milestone_3: Boolean(row.capstoneProjectProgress[2]),
        },
      };
    });

    this.setState({ pledgeTrackerSavingUid: "ALL" });
    try {
      await update(ref(this.props.database), updatesMap);
      Swal.fire({
        icon: "success",
        title: "Pledge tracker updated",
        text: `Saved pledge tracker fields for ${rows.length} pledge${rows.length === 1 ? "" : "s"}.`,
      });
    } catch (error:any) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: error.message || "Could not update pledge tracker fields.",
      });
    } finally {
      this.setState({ pledgeTrackerSavingUid: "" });
    }
  }

  render() {
    const execRoles = ["President", "VP of Technology", "VP of Programming", "VP of Recruitment", "VP of External Affairs", "VP of Internal Experience", "VP of Marketing", "VP of Finance", "VP of DEI", "VP of Pledge Experience"];
    
    const filteredUsers = this.state.users.filter(user => 
      user.name.toLowerCase().includes(this.state.searchTerm.toLowerCase()) ||
      user.currentRole.toLowerCase().includes(this.state.searchTerm.toLowerCase())
    );

    const tabNames = ["Member Management", "User Roles", "Academic Info", "Calendar", "Messaging", "Pledge Tracker", "Quick Links"];

    return (
      <div className="h-full flex flex-col">
        <Tab.Group selectedIndex={this.state.selectedTab} onChange={(index) => this.setState({ selectedTab: index })}>
          <div className="px-4 pt-4">
            <Tab.List className="flex space-x-1 rounded-lg bg-blue-50 border border-blue-100 p-1">
              {tabNames.map((tabName) => (
                <Tab
                  key={tabName}
                  className={({ selected }) =>
                    `flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-blue-100"
                    }`
                  }
                >
                  {tabName}
                </Tab>
              ))}
            </Tab.List>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <Tab.Panels>
              {/* Tab 1: Member Management */}
              <Tab.Panel>
                <div className="mt-6 px-4 w-full">
          <div className="flex items-center mb-4">
            <UserPlusIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Add Member</h2>
          </div>
        </div>

        {/* Add new user section */}
        <div className="mt-2 px-4 w-full">
          <div className="bg-gradient-to-r from-blue-50 to-transparent border border-blue-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-semibold leading-6 text-blue-900">
                Add New Member
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-600">
                <p>Add a new member to the system using their Northwestern email.</p>
              </div>
              <form className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="new-member-email" className="block text-sm font-medium text-gray-700">
                      Northwestern Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="new-member-email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="person@u.northwestern.edu"
                      ref={this.emailButton}
                    />
                  </div>
                  <div>
                    <label htmlFor="member-type" className="block text-sm font-medium text-gray-700">
                      Member Type
                    </label>
                    <select
                      id="member-type"
                      name="member-type"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      defaultValue="Member"
                      ref={this.typeOfMember}
                    >
                      <option>Pledge</option>
                      <option>Member</option>
                      <option>Alumni</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                      type="button"
                      onClick={this.addNewUser}
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors sm:text-sm"
                  >
                <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Member
          </button>
            </div>
              </form>
            </div>
          </div>
        </div>
              </Tab.Panel>

              {/* Tab 2: User Roles */}
              <Tab.Panel>
                <div className="mt-6 px-4 w-full">
          <div className="flex items-center mb-4">
            <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Role Management</h2>
          </div>
        </div>

        <div className="mt-2 px-4 w-full">
          <div className="bg-gradient-to-r from-blue-50 to-transparent border border-blue-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-semibold leading-6 text-blue-900">
                Manage User Roles
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-600">
                <p>Select Member/Pledge/Alumni, or choose Exec for leadership or Custom.</p>
              </div>
              
              {/* Search bar */}
              <div className="mt-4 mb-4">
                <label htmlFor="search-users" className="sr-only">Search users</label>
                <input
                  id="search-users"
                  type="text"
                  placeholder="Search by name or role..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={this.state.searchTerm}
                  onChange={(e) => this.setState({ searchTerm: e.target.value })}
                />
              </div>

              {/* User list */}
              {this.state.loading ? (
                <div className="text-center py-4 text-gray-600">Loading users...</div>
              ) : (
                <div className="mt-4 max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Current Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Update Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Admin Access
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.uid} className="hover:bg-blue-50 transition-colors duration-150">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {user.currentRole}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex flex-wrap gap-2">
                                <select
                                  className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  value={this.state.roleSelections[user.uid] || ""}
                                  onChange={(e) => {
                                    const selection = e.target.value;
                                    if (selection === "Member" || selection === "Pledge" || selection === "Alumni") {
                                      this.updateUserRole(user.uid, selection);
                                      this.setState({
                                        roleSelections: { ...this.state.roleSelections, [user.uid]: "" }
                                      });
                                    } else {
                                      this.setState({
                                        roleSelections: { ...this.state.roleSelections, [user.uid]: selection }
                                      });
                                    }
                                  }}
                                >
                                  <option value="">Select Role Type</option>
                                  <option value="Member">Member</option>
                                  <option value="Pledge">Pledge</option>
                                  <option value="Alumni">Alumni</option>
                                  <option value="Exec">Exec</option>
                                  <option value="Custom">Custom</option>
                                </select>
                                
                                {/* Show exec dropdown if Exec is selected */}
                                {this.state.roleSelections[user.uid] === "Exec" && (
                                  <select
                                    className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        this.updateUserRole(user.uid, e.target.value);
                                        this.setState({
                                          roleSelections: { ...this.state.roleSelections, [user.uid]: "" }
                                        });
                                      }
                                    }}
                                    defaultValue=""
                                  >
                                    <option value="">Select Exec Position</option>
                                    {execRoles.map(role => (
                                      <option key={role} value={role}>{role}</option>
                                    ))}
                                  </select>
                                )}
                                
                                {/* Show custom input if Custom is selected */}
                                {this.state.roleSelections[user.uid] === "Custom" && (
                                  <input
                                    type="text"
                                    placeholder="Type custom role and press Enter"
                                    className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        this.updateUserRoleCustom(user.uid, e.currentTarget.value);
                                        e.currentTarget.value = '';
                                        this.setState({
                                          roleSelections: { ...this.state.roleSelections, [user.uid]: "" }
                                        });
                                      }
                                    }}
                                    autoFocus
                                  />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                type="button"
                                onClick={() =>
                                  this.updateUserAdminAccess(
                                    user.uid,
                                    !user.currentAdmin
                                  )
                                }
                                disabled={Boolean(this.state.adminSavingByUid[user.uid])}
                                className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 ${
                                  user.currentAdmin
                                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                                    : "bg-green-100 text-green-800 hover:bg-green-200"
                                }`}
                              >
                                {this.state.adminSavingByUid[user.uid]
                                  ? "Saving..."
                                  : user.currentAdmin
                                  ? "Revoke Admin"
                                  : "Grant Admin"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                Showing {filteredUsers.length} of {this.state.users.length} users
              </div>
            </div>
          </div>
        </div>
              </Tab.Panel>

              {/* Tab 3: Academic Info */}
              <Tab.Panel>
                <div className="mt-6 px-4 w-full">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Academic Info</h2>
          </div>
        </div>

        <div className="mt-2 px-4 w-full">
          <div className="bg-gradient-to-r from-blue-50 to-transparent border border-blue-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-semibold leading-6 text-blue-900">
                Update Year/Major
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-600">
                <p>Fix a member's class standing or major. Year visibility respects their profile settings.</p>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="academic-member" className="block text-sm font-medium text-gray-700">
                    Select Member
                  </label>
                  <select
                    id="academic-member"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={this.state.selectedProfileUid}
                    onChange={(e) => {
                      const uid = e.target.value;
                      this.setState({ selectedProfileUid: uid });
                      this.loadUserAcademicInfo(uid);
                    }}
                  >
                    <option value="">Select member</option>
                    {this.state.users.map((user) => (
                      <option key={user.uid} value={user.uid}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="academic-year" className="block text-sm font-medium text-gray-700">
                      Class Standing
                    </label>
                    <input
                      id="academic-year"
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., Junior"
                      value={this.state.editYear}
                      onChange={(e) => this.setState({ editYear: e.target.value })}
                      disabled={this.state.editLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="academic-major" className="block text-sm font-medium text-gray-700">
                      Major
                    </label>
                    <input
                      id="academic-major"
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., Computer Science"
                      value={this.state.editMajor}
                      onChange={(e) => this.setState({ editMajor: e.target.value })}
                      disabled={this.state.editLoading}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={this.updateUserAcademicInfo}
                    disabled={this.state.editLoading || !this.state.selectedProfileUid}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors sm:text-sm"
                  >
                    Update Academic Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
              </Tab.Panel>

              {/* Tab 4: Calendar */}
              <Tab.Panel>
                <div className="mt-6 px-4 w-full">
          <div className="flex items-center mb-4">
            <CalendarDaysIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Calendar Tools</h2>
          </div>
        </div>

        <div className="mt-2 px-4 w-full">
          <div className="bg-gradient-to-r from-blue-50 to-transparent border border-blue-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-semibold leading-6 text-blue-900">
                Create New Event
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-600">
                <p>Add events to the calendar that will be visible to all members.</p>
              </div>
              
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Event Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="event-name" className="block text-sm font-medium text-gray-700">
                      Event Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={this.eventNameInput}
                      type="text"
                      id="event-name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., Weekly Meeting, Fundraiser"
                      value={this.state.eventName}
                      onChange={(e) => this.setState({ eventName: e.target.value })}
                    />
                  </div>

                  {/* Event Date */}
                  <div>
                    <label htmlFor="event-date" className="block text-sm font-medium text-gray-700">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={this.eventDateInput}
                      type="date"
                      id="event-date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={this.state.eventDate}
                      onChange={(e) => this.setState({ eventDate: e.target.value })}
                    />
                  </div>

                  {/* Event Type */}
                  <div>
                    <label htmlFor="event-type" className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      id="event-type"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={this.state.eventType}
                      onChange={(e) => this.setState({ eventType: e.target.value })}
                    >
                      <option value="Social">Social</option>
                      <option value="Professional">Professional</option>
                      <option value="Rush">Rush</option>
                      <option value="Pledge Task">Pledge Task</option>
                      <option value="Briefing">Briefing</option>
                      <option value="Capstone">Capstone</option>
                    </select>
                  </div>

                  {/* Event Group */}
                  <div>
                    <label htmlFor="event-group" className="block text-sm font-medium text-gray-700">
                      For
                    </label>
                    <select
                      id="event-group"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={this.state.eventGroup}
                      onChange={(e) => this.setState({ eventGroup: e.target.value })}
                    >
                      <option value="Everyone">Everyone</option>
                      <option value="Members">Members Only</option>
                      <option value="Pledges">Pledges Only</option>
                      <option value="Exec">Exec Only</option>
                    </select>
                  </div>

                  {/* Mandatory Checkbox */}
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="event-mandatory"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      checked={this.state.eventMandatory}
                      onChange={(e) => this.setState({ eventMandatory: e.target.checked })}
                    />
                    <label htmlFor="event-mandatory" className="ml-2 text-sm text-gray-700">
                      Mandatory Event
                    </label>
                  </div>
                </div>

                {/* Event Description */}
                <div>
                  <label htmlFor="event-desc" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    ref={this.eventDescInput}
                    id="event-desc"
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Location, time details, or additional info..."
                    value={this.state.eventDescription}
                    onChange={(e) => this.setState({ eventDescription: e.target.value })}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={this.addCalendarEvent}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors sm:text-sm"
                  >
                    <CalendarDaysIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add to Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Events Section */}
        <div className="mt-6 px-4 w-full">
          <div className="bg-gradient-to-r from-blue-50 to-transparent border border-blue-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-semibold leading-6 text-blue-900 mb-4">
                Manage Events
              </h3>
              
              {this.state.calendarLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="ml-2 text-gray-600">Loading events...</p>
                </div>
              ) : this.state.calendarEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Required
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          For
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {this.state.calendarEvents.map((event, index) => (
                        <tr key={index} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                            {event.Name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {event.Date}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {event.Type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              event["Mandatory?"] 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {event["Mandatory?"] ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {event.Group}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <button
                              onClick={() => this.deleteCalendarEvent(event.id, event.Name)}
                              className="inline-flex items-center justify-center rounded-md bg-red-100 text-red-800 p-2 hover:bg-red-200 transition-colors"
                              title="Delete event"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 py-8 text-center">No calendar events yet. Create one using the form above.</p>
              )}
            </div>
          </div>
        </div>
              </Tab.Panel>

              {/* Tab 5: Messaging */}
              <Tab.Panel>
                <div className="mt-6 px-4 w-full">
          <div className="flex items-center mb-4">
            <PaperAirplaneIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Messaging</h2>
          </div>
        </div>

        {/* Send a text section */}
        <div className="mt-2 px-4 w-full">
          <div className="bg-gradient-to-r from-blue-50 to-transparent border border-blue-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-semibold leading-6 text-blue-900 mb-2">
                Send a Message
              </h3>
              <div className="mb-5 text-sm text-gray-600">
                <p>Send text messages or announcements to members.</p>
              </div>
              
              {/* Message textarea - full width of container */}
              <div className="mb-4">
                <label htmlFor="message-text" className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="text"
                  id="message-text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none"
                  placeholder="Pledge meeting tonight @ 7:00..."
                  ref={this.sendTextButton}
                  rows={5}
                />
              </div>

              {/* Send To, Type fields (left) and Send Message button (right) on same line */}
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <label htmlFor="who-to-text" className="block text-sm font-medium text-gray-700 mb-2">
                      Send To
                    </label>
                    <select
                      id="who-to-text"
                      name="who-to-text"
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      style={{ minWidth: "160px" }}
                      value={this.state.messageRecipientType}
                      onChange={(e) => this.setState({ messageRecipientType: e.target.value, directMessageUid: "" })}
                      ref={this.whoToButton}
                    >
                      <option>Pledges</option>
                      <option>Members</option>
                      <option>Everyone</option>
                      <option>Individual</option>
                    </select>
                  </div>

                  {this.state.messageRecipientType === "Individual" && (
                    <div>
                      <label htmlFor="direct-recipient" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Member
                      </label>
                      <select
                        id="direct-recipient"
                        name="direct-recipient"
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        style={{ minWidth: "200px" }}
                        value={this.state.directMessageUid}
                        onChange={(e) => this.setState({ directMessageUid: e.target.value })}
                      >
                        <option value="">Select member</option>
                        {this.state.users.map((user) => (
                          <option key={user.uid} value={user.uid}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="message-type" className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      id="message-type"
                      name="message-type"
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      style={{ minWidth: "160px" }}
                      defaultValue="Event"
                      ref={this.messageTypeButton}
                    >
                      <option>Event</option>
                      <option>Announcement</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={this.sendText}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
              </Tab.Panel>

              {/* Tab 6: Pledge Tracker */}
              <Tab.Panel>
                <div className="mt-6 px-4 w-full">
                  <div className="flex items-center mb-4">
                    <CheckBadgeIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-bold text-gray-900">Pledge Tracker</h2>
                  </div>
                </div>

                <div className="mt-2 px-4 w-full">
                  <div className="bg-gradient-to-r from-blue-50 to-transparent border border-blue-100 shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold leading-6 text-blue-900">
                            Update Pledge Progress
                          </h3>
                          <div className="mt-2 max-w-2xl text-sm text-gray-600">
                            <p>
                              Edit pledge points, coffee chats, thank you notes, and check off capstone progress boxes.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={this.saveAllPledgeTrackerRows}
                          disabled={
                            this.state.pledgeTrackerLoading ||
                            this.state.pledgeTrackerRows.length === 0 ||
                            this.state.pledgeTrackerSavingUid === "ALL"
                          }
                          className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors sm:text-sm"
                        >
                          {this.state.pledgeTrackerSavingUid === "ALL"
                            ? "Saving All..."
                            : "Save All"}
                        </button>
                      </div>

                      {this.state.pledgeTrackerLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="ml-2 text-gray-600">Loading pledge tracker entries...</p>
                        </div>
                      ) : this.state.pledgeTrackerRows.length === 0 ? (
                        <p className="text-gray-600 py-8 text-center">
                          No pledges found. Assign users the Pledge role first.
                        </p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {this.state.pledgeTrackerRows.map((row) => (
                            <div
                              key={row.uid}
                              className="rounded-lg border border-gray-200 bg-white p-4"
                            >
                              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
                                <div className="lg:col-span-3 flex items-center gap-3">
                                  <img
                                    className="h-12 w-12 rounded-full object-cover border border-gray-200"
                                    src={row.pictureLink}
                                    alt={row.name}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = PLACEHOLDER_PFP_URL;
                                    }}
                                  />
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {row.name}
                                    </p>
                                    <p className="text-xs text-gray-500">Pledge</p>
                                  </div>
                                </div>

                                <div className="lg:col-span-9 grid grid-cols-1 gap-3 sm:grid-cols-4">
                                  <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                                      Pledge Points
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.pledgePoints}
                                      onChange={(e) =>
                                        this.updatePledgeTrackerNumber(
                                          row.uid,
                                          "pledgePoints",
                                          e.target.value
                                        )
                                      }
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                                      Coffee Chats
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.coffeeChatsCompleted}
                                      onChange={(e) =>
                                        this.updatePledgeTrackerNumber(
                                          row.uid,
                                          "coffeeChatsCompleted",
                                          e.target.value
                                        )
                                      }
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                                      Thank You Notes Sent
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.thankYouNotesSent}
                                      onChange={(e) =>
                                        this.updatePledgeTrackerNumber(
                                          row.uid,
                                          "thankYouNotesSent",
                                          e.target.value
                                        )
                                      }
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                                      Capstone Progress
                                    </label>
                                    <div className="mt-1 flex gap-2">
                                      {([0, 1, 2] as const).map((boxIndex) => (
                                        <button
                                          key={`${row.uid}-capstone-${boxIndex}`}
                                          type="button"
                                          aria-pressed={row.capstoneProjectProgress[boxIndex]}
                                          onClick={() =>
                                            this.toggleCapstoneProgress(
                                              row.uid,
                                              boxIndex
                                            )
                                          }
                                          className={`flex h-9 w-9 items-center justify-center rounded border text-sm font-semibold transition-colors ${
                                            row.capstoneProjectProgress[boxIndex]
                                              ? "border-blue-600 bg-blue-600 text-white"
                                              : "border-blue-200 bg-white text-blue-500 hover:border-blue-400"
                                          }`}
                                        >
                                          {row.capstoneProjectProgress[boxIndex]
                                            ? "X"
                                            : boxIndex + 1}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* Tab 7: Quick Links */}
              <Tab.Panel>
                <div className="mt-4 px-4 w-full">
          <div className="bg-gradient-to-r from-blue-50 to-transparent border border-blue-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-semibold leading-6 text-blue-900">
                Quick Links
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-600">
                <p>Access frequently used Notion pages and external resources.</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors sm:text-sm"
                  href="https://www.notion.so/97757d83c1bc42708c8a2cd51f96e9aa?v=542627b9c9d4412b8aec5711552f4bb9"
                >
                  <LinkIcon className="-ml-1 mr-2 h-5 w-5" />
                  Pledge Calendar
                </a>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors sm:text-sm"
                  href="https://www.notion.so/d1fe9440ad2e489299f645134a2bf7a9?v=1909dd71e41f40c0b23c6be525c7a8a6"
                >
                  <LinkIcon className="-ml-1 mr-2 h-5 w-5" />
                  Sprint
                </a>
              </div>
            </div>
          </div>
        </div>
              </Tab.Panel>
            </Tab.Panels>
          </div>
        </Tab.Group>
      </div>
    );
  }
  componentDidMount() {
    this.loadUsers();
    this.loadCalendarEvents();
  }
}

export default AdminPanel;
