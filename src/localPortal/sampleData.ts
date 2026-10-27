import Logo from "../Assets/Images/Branding/Logo.png";

export const demoUid = "demo-member";

export function createSampleData(): any {
  const members = [
    [demoUid, "Alex Morgan", "Member", "Junior", "Computer Science"],
    ["demo-jamie", "Jamie Chen", "Pledge", "Sophomore", "Data Science"],
    ["demo-taylor", "Taylor Brooks", "Pledge", "Freshman", "Computer Engineering"],
    ["demo-sam", "Sam Rivera", "Alumni", "Class of 2025", "Computer Science"],
  ];
  const publicUsers: any = {};
  const users: any = {};
  const allowedUsers: any = {};
  members.forEach(([uid, name, role, year, major], i) => {
    const profile = {
      name, role, year, major, majors: [major],
      email: `${uid}@example.com`,
      about: "This is a fictional member for exploring the local KTP portal. I enjoy building projects, meeting fellow members, and learning new skills.",
      internships: "Sample software engineering internship",
      profile_pic_link: Logo, pfp_thumb_link: Logo, pfp_large_link: Logo,
      cover_page_link: "", cover_resized_link: "",
      leetcode: { username: uid, answers: { easySolved: 40 + i * 10, mediumSolved: 20 + i * 5, hardSolved: 3 + i, acceptanceRate: 72 } },
      pledge_tracker: { pledge_points: 100 + i * 15, coffee_chats_completed: i + 2, thank_you_notes_sent: i + 1, capstone_project_progress: [true, i > 1, false] },
      signed_up: true,
    };
    publicUsers[uid] = profile;
    users[uid] = { ...profile, Role: role, admin: uid === demoUid, phone: "555-0100", email_viewable: true, standing_viewable: true, internships_viewable: true };
    allowedUsers[uid] = { role };
  });
  const eventDate = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  return {
    public_users: publicUsers, users, allowed_users: allowedUsers,
    map_pins: { from: {
      "demo-member": { name: "Alex Morgan", city: "Chicago", country: "United States", latitude: 41.8781, longitude: -87.6298 },
      "demo-jamie": { name: "Jamie Chen", city: "London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278 },
      "demo-taylor": { name: "Taylor Brooks", city: "Mumbai", country: "India", latitude: 19.076, longitude: 72.8777 },
      "demo-sam": { name: "Sam Rivera", city: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
    } },
    calendar_events: {
      "demo-social": { Name: "Sample chapter hangout", Date: eventDate(2), Type: "Social", Group: "Everyone", Description: "Demo event — meet the chapter and share project ideas.", "Mandatory?": false },
      "demo-workshop": { Name: "Sample interview workshop", Date: eventDate(5), Type: "Professional", Group: "Everyone", Description: "Demo event — practice technical interviews together.", "Mandatory?": true },
    },
  };
}
