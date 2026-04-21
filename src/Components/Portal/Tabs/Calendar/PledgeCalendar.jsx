import React from "react";
import request from "axios";
import { CalendarDaysIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { Tab } from "@headlessui/react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { ref, get, child, remove, onValue, set, update } from "firebase/database";
import Swal from "sweetalert2";

const localizer = momentLocalizer(moment);

// Custom Toolbar Component
const CustomToolbar = (toolbar) => {
  const goToToday = () => toolbar.onNavigate("TODAY");
  const goToBack = () => toolbar.onNavigate("PREV");
  const goToNext = () => toolbar.onNavigate("NEXT");

  return (
    <div className="rbc-toolbar-custom">
      <div className="rbc-btn-group">
        <button onClick={goToBack} className="rbc-toolbar-btn-nav">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button onClick={goToNext} className="rbc-toolbar-btn-nav">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <span className="rbc-toolbar-label">{toolbar.label}</span>

      <div className="rbc-btn-group">
        {toolbar.views.map((v) => (
          <button
            key={v}
            onClick={() => toolbar.onView(v)}
            className={`rbc-toolbar-btn-view ${toolbar.view === v ? "active" : ""}`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

class PledgeCalendar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // State of API call (true if cannot reach endpoint)
      loading: false,

      // Raw response from GET request to notion's API
      notionPageData: null,

      // List of columns for the calendar table
      notionCols: [],

      // List of dictionaries for each event, with the columns as keys and
      // the corresponding row's data points as each value
      notionEvents: [],

      // Same as notion events but does not contain past events (for Upcoming Events)
      notionEventsFuture: [],

      // Calendar UI data structure
      calEvents: [],

      // Hover tooltip state
      hoveredEvent: null,
      tooltipPosition: { x: 0, y: 0 },

      // Linked Google Calendar configuration
      googleCalendarLinkInput: "",
      googleCalendarEmbedUrl: "",
      googleCalendarPublicUrl: "",
      googleCalendarStatusMessage: "",
      isSavingGoogleCalendar: false,
      googleCalendarUpdatedAt: null,
      additionalCalendars: [],
    };

    // ID of notion page
    this.NOTION_ID = "97757d83c1bc42708c8a2cd51f96e9aa";
    this.GCAL_ID =
      "c82f1fdd31eb61e26a3646e34ebde02efff386dff751179c6733a9e372c61cda@group.calendar.google.com";
    this.API_KEY = "AIzaSyBj2UQzQuZJrqC4SI5MZ_tBL6jWD9z-sVE";
    this.DEFAULT_GCAL_PUBLIC_URL =
      "https://calendar.google.com/calendar/u/0?cid=0d50eaeb066499c78cb55207b8499ba6dbc9f06ab7e903f45c46eada3b947f5c@group.calendar.google.com";
    
    // Get admin status from props (defaults to false)
    this.isAdmin = props.admin || false;
    this.userRole = props.role || "Member";
  }

  filterOutPastEvents() {
    // If event is in the past, don't include it
    const today = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    this.setState((prevState) => {
      return {
        notionEventsFuture: prevState.notionEvents.filter((event) => {
          // Filter out past events
          const isUpcoming = today - new Date(Date.parse(event["Date"])) < millisecondsPerDay;
          
          if (!isUpcoming) return false;
          
          // Admin sees all events
          if (this.isAdmin) return true;
          
          // Non-admin users see events based on Group field
          const eventGroup = event["Group"] || "Everyone";
          
          // Show if event is for Everyone
          if (eventGroup === "Everyone") return true;
          
          // Show if event matches user role (checking for Pledges, Members, etc.)
          if (eventGroup === this.userRole + "s" || eventGroup === this.userRole) return true;
          
          return false;
        }),
      };
    });
  }

  createEventDates() {
    // Create calEvents DS in the correct form for
    // BigCalender with data from notionEvents
    this.setState({
      calEvents: this.state.notionEvents
        .filter((event) => {
          // Admin sees all events
          if (this.isAdmin) return true;
          
          // Non-admin users see events based on Group field
          const eventGroup = event["Group"] || "Everyone";
          
          // Show if event is for Everyone
          if (eventGroup === "Everyone") return true;
          
          // Show if event matches user role
          if (eventGroup === this.userRole + "s" || eventGroup === this.userRole) return true;
          
          return false;
        })
        .map((event, index) => {
        // Parse each event's fields
        let name = event["Name"];
        let date = new Date(Date.parse(event["Date"]));
        let type = event["Type"];
        let mand = event["Mandatory?"];
        let group = event["Group"];
        let desc = event["Description"];
        let source = event["source"];
        let firebaseId = event["firebaseId"];

        // Turn "Yes" for the mandatory field into
        // "Mandatory" or "Not Mandatory"
        let mandDesc = mand === "Yes" ? "Mandatory" : "Not Mandatory";

        // Add the type and whether or not the
        // event is mandatory to the description
        let fullDesc = `${type} Event (${mandDesc}): ${desc}`;

        // Create a new event
        let currEvent = {
          id: index,
          title: name,
          start: date,
          end: date,
          desc: fullDesc,
          type: type,
          source: source,
          firebaseId: firebaseId
        };

        return currEvent;
      }),
    });
  }

  componentDidMount() {
    this.loadNotionPage().then(() => {
      this.loadFirebaseEvents();
    });

    this.subscribeToGoogleCalendarConfig();
  }

  componentWillUnmount() {
    if (typeof this.unsubscribeGoogleCalendarConfig === "function") {
      this.unsubscribeGoogleCalendarConfig();
    }
  }

  normalizeGoogleCalendarLink(rawValue) {
    const trimmed = typeof rawValue === "string" ? rawValue.trim() : "";
    if (!trimmed) {
      return { embedUrl: "", publicUrl: "" };
    }

    const buildLinksFromId = (calendarId) => {
      const decodedId = decodeURIComponent(calendarId);
      const encodedId = encodeURIComponent(decodedId);

      return {
        embedUrl: `https://calendar.google.com/calendar/embed?src=${encodedId}&ctz=America%2FChicago`,
        publicUrl: `https://calendar.google.com/calendar/u/0?cid=${encodedId}`,
      };
    };

    if (trimmed.includes("@group.calendar.google.com")) {
      return buildLinksFromId(trimmed);
    }

    try {
      const parsedUrl = new URL(trimmed);
      const calendarId = parsedUrl.searchParams.get("cid") || parsedUrl.searchParams.get("src");

      if (calendarId) {
        return buildLinksFromId(calendarId);
      }

      if (
        parsedUrl.hostname.includes("calendar.google.com") &&
        parsedUrl.pathname.includes("/calendar/embed")
      ) {
        return {
          embedUrl: trimmed,
          publicUrl: this.DEFAULT_GCAL_PUBLIC_URL,
        };
      }
    } catch (error) {
      return { embedUrl: "", publicUrl: "" };
    }

    return { embedUrl: "", publicUrl: "" };
  }

  subscribeToGoogleCalendarConfig() {
    if (!this.props.database) {
      return;
    }

    const configRef = ref(this.props.database, "portal_config/google_calendar");
    this.unsubscribeGoogleCalendarConfig = onValue(configRef, (snapshot) => {
      const config = snapshot.exists() ? snapshot.val() : null;
      const savedLink =
        config && typeof config.link === "string" && config.link.trim().length > 0
          ? config.link.trim()
          : this.DEFAULT_GCAL_PUBLIC_URL;

      const normalizedLinks = this.normalizeGoogleCalendarLink(savedLink);
      const embedUrl =
        config && typeof config.embedUrl === "string" && config.embedUrl.trim().length > 0
          ? config.embedUrl.trim()
          : normalizedLinks.embedUrl;
      const publicUrl =
        config && typeof config.publicUrl === "string" && config.publicUrl.trim().length > 0
          ? config.publicUrl.trim()
          : normalizedLinks.publicUrl || this.DEFAULT_GCAL_PUBLIC_URL;

      const additionalCalendars =
        config && Array.isArray(config.additionalCalendars)
          ? config.additionalCalendars
              .map((calendarEntry, index) => {
                if (!calendarEntry || typeof calendarEntry !== "object") {
                  return null;
                }

                const rawName =
                  typeof calendarEntry.name === "string" && calendarEntry.name.trim().length > 0
                    ? calendarEntry.name.trim()
                    : `Calendar ${index + 1}`;

                const normalizedAdditional = this.normalizeGoogleCalendarLink(
                  typeof calendarEntry.link === "string" ? calendarEntry.link : ""
                );

                const additionalEmbedUrl =
                  typeof calendarEntry.embedUrl === "string" && calendarEntry.embedUrl.trim().length > 0
                    ? calendarEntry.embedUrl.trim()
                    : normalizedAdditional.embedUrl;
                const additionalPublicUrl =
                  typeof calendarEntry.publicUrl === "string" && calendarEntry.publicUrl.trim().length > 0
                    ? calendarEntry.publicUrl.trim()
                    : normalizedAdditional.publicUrl;

                if (!additionalEmbedUrl) {
                  return null;
                }

                return {
                  name: rawName,
                  embedUrl: additionalEmbedUrl,
                  publicUrl: additionalPublicUrl || additionalEmbedUrl,
                };
              })
              .filter(Boolean)
          : [];

      this.setState({
        googleCalendarLinkInput: savedLink,
        googleCalendarEmbedUrl: embedUrl,
        googleCalendarPublicUrl: publicUrl,
        googleCalendarUpdatedAt:
          config && typeof config.updatedAt === "number" ? config.updatedAt : null,
        additionalCalendars,
      });
    });
  }

  saveGoogleCalendarLink = async () => {
    if (!this.props.database || !this.isAdmin) {
      return;
    }

    const rawLink = this.state.googleCalendarLinkInput.trim();
    if (!rawLink) {
      this.setState({
        googleCalendarStatusMessage: "Paste a Google Calendar link before saving.",
      });
      return;
    }

    const normalizedLinks = this.normalizeGoogleCalendarLink(rawLink);
    if (!normalizedLinks.embedUrl || !normalizedLinks.publicUrl) {
      this.setState({
        googleCalendarStatusMessage:
          "That link does not look like a valid Google Calendar share link.",
      });
      return;
    }

    this.setState({
      isSavingGoogleCalendar: true,
      googleCalendarStatusMessage: "Saving calendar link...",
    });

    try {
      await update(ref(this.props.database, "portal_config/google_calendar"), {
        link: rawLink,
        embedUrl: normalizedLinks.embedUrl,
        publicUrl: normalizedLinks.publicUrl,
        updatedAt: Date.now(),
      });

      this.setState({
        googleCalendarStatusMessage: "Calendar link updated for all members.",
      });
    } catch (error) {
      console.error("Failed to save Google Calendar link", error);
      this.setState({
        googleCalendarStatusMessage: "Could not save calendar link. Please try again.",
      });
    } finally {
      this.setState({ isSavingGoogleCalendar: false });
    }
  };

  onEventMouseEnter = (event, e) => {
    const rect = e.target.getBoundingClientRect();
    this.setState({
      hoveredEvent: event,
      tooltipPosition: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
    });
  };

  onEventMouseLeave = () => {
    this.setState({ hoveredEvent: null });
  };

  // Delete event from Firebase
  deleteEvent = (eventId) => {
    Swal.fire({
      title: "Delete Event?",
      text: "Are you sure you want to delete this event? This action cannot be undone.",
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
            this.loadFirebaseEvents();
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
  };

  // Load events from Firebase
  async loadFirebaseEvents() {
    if (!this.props.database) {
      console.log("Database not available");
      return;
    }

    try {
      const dbRef = ref(this.props.database);
      const snapshot = await get(child(dbRef, "calendar_events"));
      
      if (snapshot.exists()) {
        const firebaseEvents = snapshot.val();
        const formattedEvents = [];

        for (let eventId in firebaseEvents) {
          const event = firebaseEvents[eventId];
          
          // Keep the date in a parseable format (YYYY-MM-DD or ISO string)
          let dateStr = event.Date;
          
          // Parse YYYY-MM-DD string as local date (not UTC) to avoid timezone offset issues
          let dateObj;
          if (dateStr && dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-');
            dateObj = new Date(year, month - 1, day);
          } else {
            dateObj = new Date(dateStr);
          }
          
          // Format to match Notion event structure with consistent date format
          const formattedEvent = {
            Name: event.Name,
            Date: dateObj.toLocaleDateString("en-US", { 
              month: "long", 
              day: "numeric", 
              year: "numeric" 
            }),
            Type: event.Type || "Social",
            "Mandatory?": event["Mandatory?"] ? "Yes" : "No",
            Group: event.Group || "Everyone",
            Description: event.Description || "",
            source: "firebase",
            firebaseId: eventId // Store the Firebase ID for deletion
          };

          formattedEvents.push(formattedEvent);
        }

        // Merge with existing Notion events
        this.setState((prevState) => {
          const mergedEvents = [...prevState.notionEvents, ...formattedEvents];
          
          // Sort by date
          mergedEvents.sort((a, b) => {
            let a_date = new Date(Date.parse(a["Date"]));
            let b_date = new Date(Date.parse(b["Date"]));
            return a_date - b_date;
          });

          return { notionEvents: mergedEvents };
        }, () => {
          // Re-filter and recreate calendar after merging
          this.filterOutPastEvents();
          this.createEventDates();
        });
      } else {
        // No events yet - just proceed with empty list
        this.setState({}, () => {
          this.filterOutPastEvents();
          this.createEventDates();
        });
      }
    } catch (error) {
      console.error("Error loading Firebase events:", error);
    }
  }

  // Parse data from notion
  async loadNotionPage() {
    try {
      const res = await this.fetchNotionContent(this.NOTION_ID);
      
      return new Promise((resolve) => {
        this.setState({ notionPageData: res.data }, () => {
          if (this.state.notionPageData && this.state.notionPageData.length > 0) {
            // Set the keys of the data to the notionCols, except the "id" column
            this.setState(
              {
                notionCols: Object.keys(this.state.notionPageData[0]).filter(
                  (col) => col !== "id"
                ),
              },
              () => {
                // Order of the columns to display
                let sortedCols = [
                  "Name",
                  "Date",
                  "Type",
                  "Mandatory?",
                  "Group",
                  "Description",
                ];

                // Update the notionCols
                this.setState({ notionCols: sortedCols }, () => {
                  // For each data point (row) from the API, put each respective
                  // data point into each column in the notionEvents list
                  let newNotionEvents = this.state.notionPageData.map(
                    (event) => {
                      let newEvent = {};
                      this.state.notionCols.forEach((col) => {
                        // The 'Type' key has a value that is an array for some reason
                        if (col === "Type") {
                          newEvent[col] = event[col][0];
                        } else {
                          // The 'Mandatory?' field is a boolean, so map it to a string
                          if (col === "Mandatory?") {
                            newEvent[col] = event[col] ? "Yes" : "No";

                            // Format the "Date" field
                          } else if (col === "Date") {
                            // Correct the timezone for CST
                            let dateStr = event[col] + "T12:00:00.000-0600";

                            // Convert date field to more readable format
                            let eventDate = new Date(dateStr);
                            newEvent[col] = eventDate.toLocaleDateString(
                              "en-US",
                              { month: "long", day: "numeric", year: "numeric" }
                            );

                            // Every other field is a 1-to-1 mapping
                          }
                          else if (col === "Group") {
                            newEvent[col] = event[col] ? event[col] : "Everyone";
                          }
                          else {
                            newEvent[col] = event[col];
                          }
                        }
                      });

                      // Necessitate Name, Date, and Type categories. Otherwise,
                      // don't add the row to the list
                      let necessaryCols = {
                        Name: undefined,
                        Date: "Invalid Date",
                        Type: "",
                        Group: "",
                      };
                      for (const key of Object.keys(necessaryCols)) {
                        if (
                          !newEvent.hasOwnProperty(key) ||
                          newEvent[key] === necessaryCols[key]
                        ) {
                          console.log(
                            key,
                            "field is not inputted for a row in Notion."
                          );
                          newEvent = {};
                        }
                      }

                      // If the event is valid, add it to the list
                      // of events from Notion
                      return newEvent;
                    }
                  );

                  // Remove empty events from ones that had empty notion data
                  newNotionEvents = newNotionEvents.filter(
                    (event) => Object.keys(event).length !== 0
                  );

                  // Sort the events by date (oldest to newest)
                  newNotionEvents.sort((a, b) => {
                    let a_date = new Date(Date.parse(a["Date"]));
                    let b_date = new Date(Date.parse(b["Date"]));
                    return a_date - b_date;
                  });

                  // Make notionEvents equal to the temporary one we just created
                  this.setState({ notionEvents: newNotionEvents }, () => {
                    // Remove empty events caused by them having passed
                    this.filterOutPastEvents();

                    // After notionEvents is created, add them to the UI
                    this.createEventDates();
                    
                    // Notion API fetch is no longer in progress
                    this.setState({ loading: false });
                    resolve();
                  });
                });
              }
            );
          } else {
            // Even if Notion has no events, set the default columns so Firebase events can display
            let sortedCols = [
              "Name",
              "Date",
              "Type",
              "Mandatory?",
              "Group",
              "Description",
            ];
            this.setState({ notionCols: sortedCols, loading: false }, () => {
              resolve();
            });
          }
        });
      });
    } catch (err) {
      console.log(err);
      this.setState({ loading: false });
    }
  }

  // Fetch data from Notion's API endpoint
  fetchNotionContent = (pageId) => {
    const apiCompletionPromise = request({
      method: "GET",
      url: "https://notion-api.splitbee.io/v1/table/" + pageId,
    });
    return apiCompletionPromise;
  };

  classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  eventStyleGetter = (event) => {
    let newStyle = {};

    // Rush, Social, Pledge Task, Briefing, Capstone, and Professional
    switch (event.type) {
      case 'Rush':
        newStyle.backgroundColor = '#2563eb'; // Blue-600
        newStyle.color = '#ffffff';
        break;
      case 'Social':
        newStyle.backgroundColor = '#2563eb'; // Blue-600 (matching site theme)
        newStyle.color = '#ffffff';
        break;
      case 'Pledge Task':
        newStyle.backgroundColor = '#dc2626'; // Red-600
        newStyle.color = '#ffffff';
        break;
      case 'Briefing':
        newStyle.backgroundColor = '#7c3aed'; // Violet-600
        newStyle.color = '#ffffff';
        break;
      case 'Capstone':
        newStyle.backgroundColor = '#059669'; // Emerald-600
        newStyle.color = '#ffffff';
        break;
      case 'Professional':
        newStyle.backgroundColor = '#f59e0b'; // Amber-500
        newStyle.color = '#ffffff';
        break;
      default:
        newStyle.backgroundColor = '#2563eb'; // Blue-600 (matching site theme)
        newStyle.color = '#ffffff';
        break;
    }

    // Prevent cursor from appearing clickable
    newStyle.cursor = 'default';

    return {
      style: newStyle,
      className: 'event-no-selection'
    };
  }

  render() {
    return (
      <>
        <div className="overflow-y-auto m-8">
          {/* Header */}
          <div className="mb-6">
            {/* Icon and Title */}
            <div className="flex items-center pb-2">
              {/* Calendar Icon */}
              <div className="flex justify-center items-center">
                <CalendarDaysIcon className="text-blue-600 mr-3 h-8 w-8" />
              </div>

              {/* Title */}
              <div className="text-3xl font-bold tracking-tight text-gray-900">
                KTP Calendar
              </div>
            </div>

            {/* Subtitle */}
            <div className="mt-2 text-sm text-gray-600">
              View the shared Google Calendar for KTP.
            </div>
          </div>

          <div className="mb-6 flex justify-end">
              <a
                href={this.state.googleCalendarPublicUrl || this.DEFAULT_GCAL_PUBLIC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                <span>Add to Google Calendar</span>
                <ArrowTopRightOnSquareIcon
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </a>

          </div>

          <Tab.Group defaultIndex={2}>
            <Tab.List className="sr-only">
              <Tab>Upcoming Events</Tab>
              <Tab>Calendar View</Tab>
              <Tab>Linked Google Calendar</Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                {this.state.notionCols.length > 0 ? (
                  <div className="w-full">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                            {/* Render columns */}
                            <tr>
                              {this.state.notionCols.map((column, index) => (
                                <th 
                                  key={index} 
                                  className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider"
                                >
                                  {column}
                                </th>
                              ))}
                              {this.isAdmin && (
                                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                  Actions
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {/* Render rows */}
                            {this.state.notionEventsFuture.map(
                              (event, index) => (
                                <tr 
                                  key={index}
                                  className="hover:bg-blue-50 transition-colors duration-150"
                                >
                                  {/* Render each point in each row - only display defined columns */}
                                  {this.state.notionCols.map((column, cellIndex) => {
                                    const value = event[column];
                                    return (
                                      <td 
                                        key={cellIndex}
                                        className="px-6 py-3 whitespace-nowrap text-sm text-gray-900"
                                      >
                                        {column === "Type" ? (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {value}
                                          </span>
                                        ) : column === "Mandatory?" ? (
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            value === "Yes" 
                                              ? "bg-red-100 text-red-800" 
                                              : "bg-green-100 text-green-800"
                                          }`}>
                                            {value === "Yes" ? "Required" : "Optional"}
                                          </span>
                                        ) : (
                                          value
                                        )}
                                      </td>
                                    );
                                  })}
                                  {this.isAdmin && event.source === "firebase" && (
                                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                                      <button
                                        onClick={() => this.deleteEvent(event.firebaseId)}
                                        className="inline-flex items-center justify-center rounded-md bg-red-100 text-red-800 p-2 hover:bg-red-200 transition-colors"
                                        title="Delete event"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              )
                            )}
                            {this.state.notionEventsFuture.length === 0 && (
                              <tr>
                                <td colSpan={this.state.notionCols.length + (this.isAdmin ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                                  No upcoming events
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="inline-block">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2 text-gray-600">Loading events...</p>
                  </div>
                )}
              </Tab.Panel>
              <Tab.Panel className="h-[72vh] relative">
                <style>{`
                  .rbc-event.rbc-selected {
                    background-color: inherit !important;
                  }
                  .rbc-event:hover {
                    opacity: 0.9;
                  }
                  .rbc-event {
                    cursor: default !important;
                  }
                `}</style>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
                  <BigCalendar
                    localizer={localizer}
                    events={this.state.calEvents}
                    defaultView="month"
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    selectable={false}
                    eventPropGetter={this.eventStyleGetter}
                    onSelectEvent={() => false}
                    components={{ 
                      toolbar: CustomToolbar,
                      event: ({ event }) => (
                        <div 
                          onMouseEnter={(e) => this.onEventMouseEnter(event, e)}
                          onMouseLeave={this.onEventMouseLeave}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
                          style={{ 
                            height: '100%', 
                            width: '100%',
                            overflow: 'hidden', 
                            cursor: 'default', 
                            userSelect: 'none',
                            padding: '2px 4px'
                          }}
                        >
                          {event.title}
                        </div>
                      )
                    }}
                  />
                </div>
                {/* Hover Tooltip */}
                {this.state.hoveredEvent && (
                  <div 
                    style={{
                      position: 'fixed',
                      left: `${this.state.tooltipPosition.x}px`,
                      top: `${this.state.tooltipPosition.y}px`,
                      transform: 'translate(-50%, -100%)',
                      zIndex: 9999,
                    }}
                    className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 pointer-events-auto"
                  >
                    <div className="min-w-[250px] max-w-[350px]">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-bold text-gray-900 pr-2">
                          {this.state.hoveredEvent.title}
                        </h3>
                        {this.isAdmin && this.state.hoveredEvent.source === "firebase" && (
                          <button
                            onClick={() => this.deleteEvent(this.state.hoveredEvent.firebaseId)}
                            className="flex-shrink-0 inline-flex items-center justify-center rounded-md bg-red-100 text-red-800 p-1.5 hover:bg-red-200 transition-colors"
                            title="Delete event"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
                        {this.state.hoveredEvent.type}
                      </span>
                      <div className="space-y-2 text-sm text-gray-700 border-t pt-3">
                        <p>
                          <span className="font-semibold text-gray-900">Date:</span>{" "}
                          {this.state.hoveredEvent.start.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </p>
                        <p className="text-gray-600 bg-gray-50 p-2 rounded text-xs">
                          {this.state.hoveredEvent.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Tab.Panel>

              <Tab.Panel>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Linked Google Calendar</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        This is the shared Google Calendar shown to all members.
                      </p>
                    </div>

                    <a
                      href={this.state.googleCalendarPublicUrl || this.DEFAULT_GCAL_PUBLIC_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <span>Open in Google Calendar</span>
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>

                  {this.state.googleCalendarEmbedUrl ? (
                    <div className="mt-4 h-[72vh] overflow-hidden rounded-lg border border-gray-200">
                      <iframe
                        title="KTP Google Calendar"
                        src={this.state.googleCalendarEmbedUrl}
                        className="h-full w-full"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      No Google Calendar link has been configured yet.
                    </div>
                  )}

                  {this.isAdmin && (
                    <div className="mt-5 rounded-md border border-blue-100 bg-blue-50/60 p-4">
                      <label className="block text-sm font-semibold text-slate-900">
                        Google Calendar Share Link
                      </label>
                      <input
                        type="text"
                        value={this.state.googleCalendarLinkInput}
                        onChange={(event) =>
                          this.setState({
                            googleCalendarLinkInput: event.target.value,
                          })
                        }
                        placeholder="https://calendar.google.com/calendar/u/0?cid=..."
                        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
                      />

                      <p className="mt-2 text-xs text-slate-600">
                        Paste a Google Calendar link containing cid=... or src=... and click save.
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={this.saveGoogleCalendarLink}
                          disabled={this.state.isSavingGoogleCalendar}
                          className={`rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 ${
                            this.state.isSavingGoogleCalendar ? "cursor-not-allowed opacity-60" : ""
                          }`}
                        >
                          {this.state.isSavingGoogleCalendar ? "Saving..." : "Save Calendar Link"}
                        </button>

                        {this.state.googleCalendarUpdatedAt && (
                          <span className="text-xs text-slate-600">
                            Last updated {new Date(this.state.googleCalendarUpdatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {this.state.googleCalendarStatusMessage.length > 0 && (
                        <p className="mt-2 text-sm text-blue-700">
                          {this.state.googleCalendarStatusMessage}
                        </p>
                      )}
                    </div>
                  )}

                  {this.state.additionalCalendars.length > 0 && (
                    <div className="mt-8 space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Additional Calendars</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          More shared KTP calendars available in the portal.
                        </p>
                      </div>

                      {this.state.additionalCalendars.map((calendar, index) => (
                        <div
                          key={`${calendar.name}-${index}`}
                          className="rounded-lg border border-gray-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-base font-semibold text-gray-900">{calendar.name}</h4>

                            <a
                              href={calendar.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                            >
                              <span>Open in Google Calendar</span>
                              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </div>

                          <div className="mt-4 h-[72vh] overflow-hidden rounded-lg border border-gray-200 bg-white">
                            <iframe
                              title={`${calendar.name} Google Calendar`}
                              src={calendar.embedUrl}
                              className="h-full w-full"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </>
    );
  }
}

export default PledgeCalendar;
