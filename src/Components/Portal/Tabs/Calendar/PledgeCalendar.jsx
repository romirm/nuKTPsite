import React from "react";
import request from "axios";
import { CalendarDaysIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { Tab } from "@headlessui/react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import Modal from "react-modal";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { ref, get, child, remove } from "firebase/database";
import Swal from "sweetalert2";

const tabNames = ["Upcoming Events", "Calendar View"];

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

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #dbeafe",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
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

      // Modal
      showModal: false,
      selectedEvent: null,
      selectedEventData: null, // Store original event data for deletion
    };

    // ID of notion page
    this.NOTION_ID = "97757d83c1bc42708c8a2cd51f96e9aa";
    this.GCAL_ID =
      "c82f1fdd31eb61e26a3646e34ebde02efff386dff751179c6733a9e372c61cda@group.calendar.google.com";
    this.API_KEY = "AIzaSyBj2UQzQuZJrqC4SI5MZ_tBL6jWD9z-sVE";
  }

  filterOutPastEvents() {
    // If event is in the past, don't include it (return null,
    // then remove the null elements later)
    const today = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    this.setState((prevState) => {
      return {
        notionEventsFuture: prevState.notionEvents.filter((event) => {
          return (
            today - new Date(Date.parse(event["Date"])) < millisecondsPerDay
          );
        }),
      };
    });
  }

  createEventDates() {
    // Create calEvents DS in the correct form for
    // BigCalender with data from notionEvents
    this.setState({
      calEvents: this.state.notionEvents.map((event, index) => {
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

  onSelectEvent = (event) => {
    // Find the original event data to check if it's from Firebase
    const originalEvent = this.state.notionEvents.find(e => e.Name === event.title);
    this.setState({ 
      showModal: true, 
      selectedEvent: event,
      selectedEventData: originalEvent 
    });
  };

  deleteEvent = async () => {
    const { selectedEventData } = this.state;
    
    if (!selectedEventData || selectedEventData.source !== "firebase") {
      Swal.fire({
        icon: "error",
        title: "Cannot Delete",
        text: "Only events added through the admin panel can be deleted."
      });
      return;
    }

    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Delete Event?",
      text: `Are you sure you want to delete "${selectedEventData.Name}"? This cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it"
    });

    if (!confirmed.isConfirmed) return;

    try {
      await remove(ref(this.props.database, `calendar_events/${selectedEventData.firebaseId}`));
      
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Event has been removed from the calendar."
      });

      // Reload events
      this.setState({ showModal: false, selectedEvent: null, selectedEventData: null });
      this.loadFirebaseEvents();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: error.message || "Could not delete the event."
      });
    }
  };

  closeModal = () => {
    this.setState({ showModal: false, selectedEvent: null, selectedEventData: null });
  };

  componentDidMount() {
    this.loadNotionPage();
    this.loadFirebaseEvents();
  }

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
          
          // If it's already a Date object or ISO string, parse it
          // If it's YYYY-MM-DD format from input, keep it as is
          let dateObj = new Date(dateStr);
          
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
  loadNotionPage() {
    this.fetchNotionContent(this.NOTION_ID)
      .then((res) => {
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
                    // this.setState({ notionEventsFuture: this.state.notionEvents.filter(event => Object.keys(event).length !== 0) }, () => {
                    this.filterOutPastEvents();

                    // After notionEvents is created, add them to the UI
                    this.createEventDates();
                  });
                });
              }
            );
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });

    // Notion API fetch is no longer in progress
    this.setState({ loading: false });
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
        newStyle.backgroundColor = '#0ea5e9'; // Cyan-500
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
        newStyle.backgroundColor = '#6b7280'; // Gray-500
        newStyle.color = '#ffffff';
        break;
    }

    return {
      style: newStyle
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
              View upcoming events and add them to your Google Calendar
            </div>
          </div>

          <Tab.Group>
            <Tab.List className="flex flex-wrap gap-2 mb-6">
              {/* Render tabs */}
              {Object.values(tabNames).map((tabName) => (
                <Tab
                  key={tabName}
                  className={({ selected }) =>
                    this.classNames(
                      "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                      "focus:outline-none",
                      selected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:text-blue-700"
                    )
                  }
                >
                  {tabName}
                </Tab>
              ))}
              <a
                href="https://calendar.google.com/calendar/u/0?cid=0d50eaeb066499c78cb55207b8499ba6dbc9f06ab7e903f45c46eada3b947f5c@group.calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors duration-200 ml-auto"
              >
                <span>Add to Google Calendar</span>
                <ArrowTopRightOnSquareIcon
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </a>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                {this.state.notionPageData ? (
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
                                  {/* Render each point in each row */}
                                  {Object.entries(event).map(([key, value], cellIndex) => (
                                    <td 
                                      key={cellIndex}
                                      className="px-6 py-3 whitespace-nowrap text-sm text-gray-900"
                                    >
                                      {key === "Type" ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          {value}
                                        </span>
                                      ) : key === "Mandatory?" ? (
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
                                  ))}
                                </tr>
                              )
                            )}
                            {this.state.notionEventsFuture.length === 0 && (
                              <tr>
                                <td colSpan={this.state.notionCols.length} className="px-6 py-8 text-center text-gray-500">
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
              <Tab.Panel className="h-[72vh]">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
                  <BigCalendar
                    localizer={localizer}
                    events={this.state.calEvents}
                    defaultView="month"
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    selectable
                    onSelectEvent={this.onSelectEvent}
                    eventPropGetter={this.eventStyleGetter}
                    components={{ toolbar: CustomToolbar }}
                  />
                </div>
                <Modal
                  isOpen={this.state.showModal}
                  onRequestClose={this.closeModal}
                  style={customStyles}
                  contentLabel="Event Details"
                  portalClassName="modal-portal"
                >
                  {this.state.selectedEvent && (
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {this.state.selectedEvent.title}
                          </h3>
                          <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {this.state.selectedEvent.type}
                          </span>
                        </div>
                        {this.state.selectedEventData?.source === "firebase" && (
                          <button
                            onClick={this.deleteEvent}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete event"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3 text-sm text-gray-700 border-t pt-4">
                        <p>
                          <span className="font-semibold text-gray-900">Date:</span>{" "}
                          {this.state.selectedEvent.start.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900">Details:</span>
                        </p>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded">
                          {this.state.selectedEvent.desc}
                        </p>
                      </div>
                      <button
                        onClick={this.closeModal}
                        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </Modal>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </>
    );
  }
}

export default PledgeCalendar;
