import React, { RefObject } from "react";
import {
  UserPlusIcon,
  PaperAirplaneIcon,
  LinkIcon,
  CalendarDaysIcon,
} from "@heroicons/react/20/solid";
import { ref, set, get, child } from "firebase/database";
import Swal, { SweetAlertResult } from "sweetalert2";

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

interface AdminPanelState {
  users: Array<{uid: string, name: string, currentRole: string}>;
  loading: boolean;
  searchTerm: string;
  roleSelections: {[uid: string]: string}; // Track whether user selected Exec or Custom
  messageRecipientType: string;
  directMessageUid: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  eventMandatory: boolean;
  eventGroup: string;
  eventDescription: string;
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
      messageRecipientType: "Pledges",
      directMessageUid: "",
      eventName: "",
      eventDate: "",
      eventType: "Social",
      eventMandatory: false,
      eventGroup: "Everyone",
      eventDescription: ""
    };
    this.addNewUser = this.addNewUser.bind(this);
    this.sendText = this.sendText.bind(this);
    this.loadUsers = this.loadUsers.bind(this);
    this.updateUserRole = this.updateUserRole.bind(this);
    this.updateUserRoleCustom = this.updateUserRoleCustom.bind(this);
    this.addCalendarEvent = this.addCalendarEvent.bind(this);
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
      const dbRef = ref(this.props.database);
      const [publicSnapshot, allowedSnapshot] = await Promise.all([
        get(child(dbRef, "public_users")),
        get(child(dbRef, "allowed_users"))
      ]);

      const publicUsers = publicSnapshot.val() || {};
      const allowedUsers = allowedSnapshot.val() || {};

      const usersList = Object.keys(publicUsers)
        .map(uid => ({
          uid,
          name: publicUsers[uid].name || "Unknown",
          currentRole: allowedUsers[uid]?.role || publicUsers[uid].role || "No Role"
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      this.setState({ users: usersList, loading: false });
    } catch (error) {
      console.error("Error loading users:", error);
      Swal.fire({
        icon: "error",
        title: "Error loading users",
        text: "Could not load user list. Check console for details."
      });
      this.setState({ loading: false });
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

    // Create event object
    const newEvent = {
      Name: eventName,
      Date: eventDate,
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
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Failed to Add Event",
          text: error.message
        });
      });
  }

  render() {
    const execRoles = ["President", "VP of Technology", "VP of Programming", "VP of Recruitment", "VP of External Affairs", "VP of Internal Experience", "VP of Marketing", "VP of Finance", "VP of DEI", "VP of Pledge Experience"];
    
    const filteredUsers = this.state.users.filter(user => 
      user.name.toLowerCase().includes(this.state.searchTerm.toLowerCase()) ||
      user.currentRole.toLowerCase().includes(this.state.searchTerm.toLowerCase())
    );

    return (
      <div className="">
        {/* Role Management Section */}
        <div className="mt-4 px-4 w-full">
          <div className="bg-gray-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Manage User Roles
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Update member roles. Select Member/Pledge/Alumni, or choose Exec for leadership positions, or Custom to type your own.</p>
              </div>
              
              {/* Search bar */}
              <div className="mt-4 mb-4">
                <input
                  type="text"
                  placeholder="Search by name or role..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={this.state.searchTerm}
                  onChange={(e) => this.setState({ searchTerm: e.target.value })}
                />
              </div>

              {/* User list */}
              {this.state.loading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <div className="mt-4 max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-indigo-600 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white tracking-wider">
                          Current Role
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white tracking-wider">
                          Update Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.uid} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {user.currentRole}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <select
                                  className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                    className="block w-56 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                    className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Showing {filteredUsers.length} of {this.state.users.length} users
              </div>
            </div>
          </div>
        </div>

        {/* Send a text section */}
        <div className="mt-4 px-4 w-full">
          <div className="bg-gray-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Send a text
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Enter the message you'd like to send to the members</p>
              </div>
              <form className="mt-5 flex flex-col sm:flex-row items-center">
                <div className="flex flex-row items-center">
                  <div className="w-full sm:max-w-sm mb-0">
                    <label htmlFor="email" className="sr-only">
                      Message
                    </label>
                    <textarea
                      name="text"
                      id="text"
                      className="block w-full sm:min-w-[13rem] min-h-[2.5rem] h-[2.5rem] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Pledge meeting tonight @ 7:00..."
                      ref={this.sendTextButton}
                    />
                  </div>
                  <div className="sm:ml-1 sm:mr-1 relative bottom-[2px] my-2 sm:my-0">
                    <select
                      id="who-to-text"
                      name="who-to-text"
                      className="mt-1 block min-w-[7rem] w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
                    <div className="sm:ml-1 sm:mr-1 relative bottom-[2px] my-2 sm:my-0">
                      <select
                        id="direct-recipient"
                        name="direct-recipient"
                        className="mt-1 block min-w-[10rem] w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
                  <div className="relative bottom-[2px] my-2 sm:my-0">
                    <select
                      id="event-type"
                      name="event-type"
                      className="mt-1 block w-full min-w-[7rem] rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
                  className="relative bottom-[1px] min-w-[157px] inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="mt-4 px-4 w-full">
          <div className="bg-gray-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Add new user
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Enter the email of the user you want to add</p>
              </div>
              <form className="mt-5 flex flex-col sm:flex-row items-center">
                <div className="flex flex-row items-center w-full sm:w-[297px]">
                  <div className="w-full sm:max-w-xs">
                    <label htmlFor="email" className="sr-only">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="person@u.northwestern.edu"
                      ref={this.emailButton}
                    />
                  </div>
                  <div className="sm:ml-1 sm:mr-1 relative bottom-[2px] my-2 sm:my-0">
                    <select
                      id="type-of-user"
                      name="type-of-user"
                      className="mt-1 block min-w-[7rem] w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      defaultValue="Member"
                      ref={this.typeOfMember}
                    >
                      <option>Pledge</option>
                      <option>Member</option>
                      <option>Alumni</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={this.addNewUser}
                  className="inline-flex min-w-[121px] w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Add User
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Add Calendar Event Section */}
        <div className="mt-4 px-4 w-full">
          <div className="bg-gray-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Add Calendar Event
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Create a new event that will appear in the member calendar.</p>
              </div>
              
              <div className="mt-5 space-y-4">
                {/* Event Name */}
                <div>
                  <label htmlFor="event-name" className="block text-sm font-medium text-gray-700">
                    Event Name *
                  </label>
                  <input
                    ref={this.eventNameInput}
                    type="text"
                    id="event-name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Weekly Meeting"
                    value={this.state.eventName}
                    onChange={(e) => this.setState({ eventName: e.target.value })}
                  />
                </div>

                {/* Event Date */}
                <div>
                  <label htmlFor="event-date" className="block text-sm font-medium text-gray-700">
                    Event Date *
                  </label>
                  <input
                    ref={this.eventDateInput}
                    type="date"
                    id="event-date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={this.state.eventDate}
                    onChange={(e) => this.setState({ eventDate: e.target.value })}
                  />
                </div>

                {/* Event Type and Group Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="event-type" className="block text-sm font-medium text-gray-700">
                      Event Type
                    </label>
                    <select
                      id="event-type"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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

                  <div>
                    <label htmlFor="event-group" className="block text-sm font-medium text-gray-700">
                      Group
                    </label>
                    <select
                      id="event-group"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={this.state.eventGroup}
                      onChange={(e) => this.setState({ eventGroup: e.target.value })}
                    >
                      <option value="Everyone">Everyone</option>
                      <option value="Members">Members</option>
                      <option value="Pledges">Pledges</option>
                      <option value="Exec">Exec</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center h-10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        checked={this.state.eventMandatory}
                        onChange={(e) => this.setState({ eventMandatory: e.target.checked })}
                      />
                      <span className="ml-2 text-sm text-gray-700">Mandatory</span>
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
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Event details, location, etc..."
                    value={this.state.eventDescription}
                    onChange={(e) => this.setState({ eventDescription: e.target.value })}
                  />
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="button"
                    onClick={this.addCalendarEvent}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                  >
                    <CalendarDaysIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Event to Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 px-4 w-full">
          <div className="bg-gray-100 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Notion Links
              </h3>
              <div className="sm:flex sm:flex-row sm:gap-2">
                <form className="sm:mt-5 min-w-[85px] sm:flex sm:items-center">
                  <a
                    target="_blank"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    href="https://www.notion.so/97757d83c1bc42708c8a2cd51f96e9aa?v=542627b9c9d4412b8aec5711552f4bb9"
                  >
                    <LinkIcon className="-ml-1 mr-2 h-5 w-5" />
                    Pledge Calendar
                  </a>
                </form>
                <form className="sm:mt-5 min-w-[85px] sm:flex sm:items-center">
                  <a
                    target="_blank"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    href="https://www.notion.so/d1fe9440ad2e489299f645134a2bf7a9?v=1909dd71e41f40c0b23c6be525c7a8a6"
                  >
                    <LinkIcon className="-ml-1 mr-2 h-5 w-5" />
                    Sprint
                  </a>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  componentDidMount() {
    this.loadUsers();
  }
}

export default AdminPanel;
