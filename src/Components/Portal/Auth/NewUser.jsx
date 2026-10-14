import React from "react";
import ProfileEditorFields from "./ProfileEditorFields";
import { assignedBannerActivity } from "../Framework/majorBanner";
import { graduationYear } from "../Tabs/Directory/directoryModel";
import { loadAcademicCatalogues, initialAcademicSelection, validAcademicSelection } from "./academicCatalogue";
import Swal from "sweetalert2";
import { ref, child, get, update } from "../../../localPortal/database";
import { uploadBytes } from "../../../localPortal/storage";
import { ref as sRef, getDownloadURL } from "../../../localPortal/storage";

class NewUser extends React.Component {
  constructor(props) {
    super(props);
    this.user = null;
    this.submitButton = React.createRef();
    this.announcementLevel = 3;
    this.resumeAdded = false;
    this.photoAdded = false;
    this.visibility = { email_viewable: true, standing_viewable: true, internships_viewable: false };
    this.profileForm = React.createRef();
    this.initNewAcc = this.initNewAcc.bind(this);
    this.state = { existingLC: false, profileReady: false, uploading: false, resumeLink: "", resumeFilename: "", catalogues: null, catalogueError: false, majors: [], minors: [], majorQuery: "", minorQuery: "" };
  }

  initializeAcademics = () => {
    if (!this.state.catalogues || !this.loadedProfile) return;
    const major = initialAcademicSelection(this.loadedProfile.majors, this.loadedProfile.major, this.state.catalogues.majors);
    const minor = initialAcademicSelection(this.loadedProfile.minors, this.loadedProfile.minor, this.state.catalogues.minors);
    this.setState({ majors: major.selected, minors: minor.selected, majorQuery: major.query, minorQuery: minor.query });
  };

  loadAcademics = () => {
    this.setState({ catalogueError: false });
    loadAcademicCatalogues().then(catalogues => {
      if (this.mounted) this.setState({ catalogues }, this.initializeAcademics);
    }).catch(() => { if (this.mounted) this.setState({ catalogueError: true }); });
  };

  academicsValid = (majors = this.state.majors, minors = this.state.minors) => Boolean(this.state.catalogues && !this.state.majorQuery.trim() && validAcademicSelection(majors, this.state.catalogues.majors, true) && (this.props.alumni || (!this.state.minorQuery.trim() && validAcademicSelection(minors, this.state.catalogues.minors))));

  submitProfile = (event) => {
    event.preventDefault();
    if (!this.state.profileReady || this.state.uploading || !this.profileForm.current.reportValidity() || !this.academicsValid()) return;
    const value = (id) => document.getElementById(id)?.value.trim() || "";
    this.initNewAcc(this.props.database, {
      uid: this.user.uid,
      email: this.props.alumni ? this.loadedProfile?.email || "" : value("email-address"), name: value("last-name"), phone: this.props.alumni ? this.loadedProfile?.phone || "" : value("phone-number"),
      year: this.props.alumni ? "Alumni" : value("year"), major: this.state.majors.join(", "), minor: this.state.minors.join(", "), majors: [...this.state.majors], minors: [...this.state.minors], internships: this.props.alumni ? this.loadedProfile?.internships || "" : value("internships"),
      insta: value("instagram"), leetcode: this.props.alumni ? this.loadedProfile?.leetcode?.username || "" : value("leetcode"), linkedin: value("linkedin"),
      about: this.props.alumni ? this.loadedProfile?.about || "" : value("about"), ...this.visibility,
      ...(this.props.alumni ? { graduation_year: value("graduation-year"), workplace: value("workplace") } : {}),
    });
  };

  async uploadRequiredAttachment(kind, input) {
    const file = input.files?.[0];
    if (!file || !this.user || this.state.uploading) return;
    const extension = file.name.split(".").pop().toLowerCase();
    const isResume = kind === "resume";
    if (!(isResume ? extension === "pdf" : ["jpeg", "jpg", "png"].includes(extension))) {
      input.value = "";
      Swal.fire({ icon: "error", title: isResume ? "Resume uploads must be in pdf format" : "Profile picture uploads must be in jpeg or png format" });
      return;
    }
    this.setState({ uploading: true });
    try {
      const storageRef = sRef(this.props.storage, `${isResume ? "resumes" : "pfps"}/${this.user.uid}.${extension}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      const field = isResume ? "resume_link" : "profile_pic_link";
      const attachment = isResume ? { [field]: downloadURL, resume_filename: file.name } : { [field]: downloadURL, pfp_thumb_link: "", pfp_large_link: "" };
      await Promise.all([
        update(ref(this.props.database, "users/" + this.user.uid), attachment),
        update(ref(this.props.database, "public_users/" + this.user.uid), attachment),
      ]);
      if (!this.mounted) return;
      if (isResume) {
        this.resumeAdded = true;
        this.setState({ resumeLink: downloadURL, resumeFilename: file.name });
      } else {
        this.photoAdded = true;
        document.getElementById("profPicImg").src = downloadURL;
      }
    } catch (err) {
      this.catchUploadException(err);
    } finally {
      if (this.mounted) this.setState({ uploading: false });
    }
  }

  catchUploadException(err) {
    Swal.fire({ icon: "error", title: "File upload failed", text: err?.message || String(err) });
  }

  initNewAcc(db, config) {
    if (!Array.isArray(config.majors) || !Array.isArray(config.minors) || !this.academicsValid(config.majors, config.minors)) {
      Swal.fire({ icon: "error", title: "Select your majors and minors from the listed options" });
      return;
    }
    config = { ...config, major: config.majors.join(", "), minor: config.minors.join(", ") };
    const bannerActivity = assignedBannerActivity(this.loadedProfile ? this.loadedProfile.major : config.major, this.loadedProfile?.banner_activity);
    let timerInterval;
    if (config.name.length == 0) {
      Swal.fire({
        icon: "error",
        title: "Name form not filled",
      });
    } else if (!this.props.alumni && config.email.length == 0) {
      Swal.fire({
        icon: "error",
        title: "Email form not filled",
      });
    } else if (config.year.length == 0) {
      Swal.fire({
        icon: "error",
        title: "Year not filled",
      });
    } else if (config.major.length == 0) {
      Swal.fire({
        icon: "error",
        title: "Major form not filled",
      });
    } else if (!this.props.alumni && config.phone.length == 0) {
      Swal.fire({
        icon: "error",
        title: "Phone input not filled in",
      });
    } else if (!this.props.alumni && config.about.length < 20) {
      Swal.fire({
        icon: "error",
        title: "About section must be at least 20 characters long",
      });
    } else if (!this.props.alumni && !this.resumeAdded) {
      Swal.fire({
        icon: "error",
        title: "All members are required to upload a resume",
      });
    } else if (!this.props.alumni && !this.photoAdded) {
      Swal.fire({ icon: "error", title: "All members are required to have a profile photo" });
    } else {
      update(ref(db, "users/" + config.uid), {
        ...(this.props.alumni ? { graduation_year: config.graduation_year, workplace: config.workplace } : {}),
        name: config.name,
        email: config.email,
        phone: config.phone,
        year: config.year,
        major: config.major,
        banner_activity: bannerActivity,
        majors: config.majors,
        ...(!this.props.alumni ? { minor: config.minor, minors: config.minors } : {}),
        internships: config.internships,
        instagram: config.insta,
        "leetcode/username": config.leetcode,
        linkedin: config.linkedin,
        about: config.about,
        signed_up: true,
        announcement_level: this.announcementLevel,
        email_viewable: config.email_viewable,
        standing_viewable: config.standing_viewable,
        internships_viewable: config.internships_viewable,
      });
      update(ref(db, "public_users/" + config.uid), {
        ...(this.props.alumni ? { graduation_year: config.graduation_year, workplace: config.workplace } : {}),
        name: config.name,
        email: config.email_viewable
          ? config.email
          : "",
        year: config.standing_viewable
          ? config.year
          : "",
        major: config.major,
        banner_activity: bannerActivity,
        majors: config.majors,
        ...(!this.props.alumni ? { minor: config.minor, minors: config.minors } : {}),
        internships: config.internships_viewable
          ? config.internships
          : "",
        "leetcode/username": config.leetcode,
        instagram: config.insta,
        linkedin: config.linkedin,
        about: config.about,
        signed_up: true,
      }).then((res) => {
        if (this.props.newuser) {
          Swal.fire({
            title: "Account successfully created!",
            icon: "success",
            text: "Processing account creation. Redirecting to the member portal...",
            timer: 1000,
            timerProgressBar: true,
            willClose: () => {
              clearInterval(timerInterval);
            },
            showCloseButton:false,
            showConfirmButton:false,
            allowOutsideClick:false,
            allowEnterKey:false,
            allowEscapeKey:false,
          }).then((result) => {
            localStorage.setItem("justSetup", "true");
            window.location.href = "/member";
          });
        } else {
          Swal.fire({
            title: "Account information updated!",
            icon: "success",
            text: "Redirecting to member directory...",
            timer: 1000,
            timerProgressBar: true,
            willClose: () => {
              clearInterval(timerInterval);
            },
          }).then((result) => {
            window.location.reload();
          });
        }
      });
    }
  }
  render() {
    return <ProfileEditorFields editor={this} />;
  }

  componentDidMount() {
    this.mounted = true;
    this.loadAcademics();
    this.unsubscribeAuth = this.props.firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.user = user;
        this.submitButton.current.classList.remove("hidden");
        if (this.props.newuser) {
          document.getElementById("last-name").value = user.displayName || sessionStorage.getItem("fullName") || "";
          document.getElementById("email-address").value = user.email || sessionStorage.getItem("emailAddress") || "";
          const photo = user.photoURL || sessionStorage.getItem("photoURL") || "";
          document.getElementById("profPicImg").src = photo;
          this.photoAdded = Boolean(photo);
          this.setState({ profileReady: true });
        } else {
          get(child(ref(this.props.database), "users/" + user.uid)).then((snapshot) => {
            if (!this.mounted) return;
            if (!snapshot.exists()) throw new Error("Member profile not found");
            const prof = snapshot.val();
            this.loadedProfile = prof;
            const values = {
              "last-name": prof.name, "email-address": prof.email, "phone-number": prof.phone,
              year: prof.year, internships: prof.internships,
              instagram: prof.instagram, linkedin: prof.linkedin, about: prof.about,
              leetcode: prof.leetcode?.username,
              "graduation-year": graduationYear(prof), workplace: prof.workplace,
            };
            Object.entries(values).forEach(([id, value]) => {
              const input = document.getElementById(id);
              if (input) input.value = typeof value === "string" || typeof value === "number" ? String(value) : "";
            });
            const photo = [prof.pfp_thumb_link, prof.profile_pic_link, prof.pfp_large_link].find((value) => typeof value === "string" && value.trim()) || "";
            document.getElementById("profPicImg").src = photo;
            this.photoAdded = Boolean(photo);
            this.resumeAdded = typeof prof.resume_link === "string" && prof.resume_link.trim().length > 0;
            this.visibility = {
              email_viewable: Boolean(prof.email_viewable),
              standing_viewable: Boolean(prof.standing_viewable),
              internships_viewable: Boolean(prof.internships_viewable),
            };
            if (typeof prof.announcement_level === "number") this.announcementLevel = prof.announcement_level;
            this.setState({ profileReady: true, existingLC: Boolean(prof.leetcode), resumeLink: this.resumeAdded ? prof.resume_link : "", resumeFilename: typeof prof.resume_filename === "string" ? prof.resume_filename : "" }, this.initializeAcademics);
          }).catch(() => {
            if (this.mounted) Swal.fire({ icon: "error", title: "Could not load your profile", text: "Please refresh and try again." });
          });
        }
      } else {
        if (window.location.hostname === "localhost") return;
        alert("Signed out!");
        window.location.href = "/";
      }
    });
  }

  componentWillUnmount() {
    this.mounted = false;
    this.unsubscribeAuth?.();
  }
}

export default NewUser;
