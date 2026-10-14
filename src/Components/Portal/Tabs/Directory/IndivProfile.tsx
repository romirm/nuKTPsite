import "animate.css";
import { MouseEventHandler, useEffect, useRef } from "react";
import ProfileCover from "../../Framework/ProfileCover";
import PortalBackdrop from "../../Framework/PortalBackdrop";
import { alumniFacts } from "./directoryModel";
import {
  ChevronLeftIcon,
  EnvelopeIcon,
  DocumentTextIcon,
} from "@heroicons/react/20/solid";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function IndivProfile(props: {
  directory: any;
  activeProfile:string;
  dir_vis: boolean;
  handler: MouseEventHandler<HTMLElement>;
  loading: boolean;
  alumni?: boolean;
}) {
  const profileScrollRef = useRef<HTMLElement>(null);
  useEffect(() => {
    profileScrollRef.current?.scrollTo({ top: 0 });
  }, [props.activeProfile]);
  const currProfile =
    props.directory &&
    typeof props.directory === "object" &&
    props.directory[props.activeProfile] &&
    typeof props.directory[props.activeProfile] === "object"
      ? props.directory[props.activeProfile]
      : null;
  if(!currProfile) {
    return <div></div>;
  }
  const profileImage = asString(currProfile.pfp_large_link) || asString(currProfile.profile_pic_link);
  const profileName = asString(currProfile.name) || "Member";
  const profileEmail = props.alumni ? "" : asString(currProfile.email);
  const resumeLink = props.alumni ? "" : asString(currProfile.resume_link);
  const aboutHtml = asString(currProfile.about);
  const leetcodeUsername =
    currProfile.leetcode && typeof currProfile.leetcode === "object"
      ? asString(currProfile.leetcode.username)
      : "";
  var socials: Array<{ name: string; href: string; icon: any; className: string }> = [];
  if (asString(currProfile.instagram)) {
    socials.push({
      name: "Instagram",
      href: "https://instagram.com/" + asString(currProfile.instagram),
      className: "text-[#E1306C] hover:text-[#C13584]",
      icon: (props:any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    });
  }
  if (leetcodeUsername && !props.alumni) {
    socials.push({
      name: "Leetcode",
      href: "https://leetcode.com/" + leetcodeUsername,
      className: "text-yellow-400 hover:text-yellow-500",
      icon: (props:any) => (
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          {...props}
        >
          <path
            fill="currentColor"
            d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104a5.35 5.35 0 0 0-.125.513a5.527 5.527 0 0 0 .062 2.362a5.83 5.83 0 0 0 .349 1.017a5.938 5.938 0 0 0 1.271 1.818l4.277 4.193l.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019l-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523a2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382a1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382a1.38 1.38 0 0 0-1.38-1.382z"
          />
        </svg>
      ),
    });
  }
  if (asString(currProfile.linkedin)) {
    socials.push({
      name: "LinkedIn",
      href: "https://linkedin.com/in/" + asString(currProfile.linkedin),
      className: "text-[#0A66C2] hover:text-[#084C8C]",
      icon: (props:any) => (
        <svg fill="currentColor" viewBox="0 -1.3 28 28" {...props}>
          <path
            fillRule="evenodd"
            d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
            clipRule="evenodd"
          />
        </svg>
      ),
    });
  }
  var fields:any = {};
    if (asString(currProfile.year)) {
      fields["Class Standing"] = asString(currProfile.year);
    }
    const majors = Array.isArray(currProfile.majors) ? currProfile.majors.filter((v: unknown) => typeof v === "string").join(", ") : asString(currProfile.major);
    const minors = Array.isArray(currProfile.minors) ? currProfile.minors.filter((v: unknown) => typeof v === "string").join(", ") : asString(currProfile.minor);
    if (majors) fields["Majors"] = majors;
    if (minors) fields["Minors"] = minors;
    if (asString(currProfile.internships)) {
      fields["Relevant Internships"] = asString(currProfile.internships);
    }
    if (asString(currProfile.role)) {
      fields["Role"] = asString(currProfile.role);
    }
    if (props.alumni) fields = alumniFacts(currProfile);
  return (
    <div
      className={classNames(
        !props.dir_vis && !props.loading
          ? "order-first flex flex-col"
          : "hidden",
        props.loading ? "invisible" : "",
        "portal-member-profile relative flex-1 focus:outline-none xl:order-last xl:flex xl:flex-col xl:order-first"
      )}
    >

      <nav
        className="cursor-pointer flex items-start px-4 py-3 sm:px-6 lg:px-8 xl:hidden shadow"
        aria-label="Breadcrumb"
        onClick={props.handler}
      >
        <a
          href="#"
          className="inline-flex items-center space-x-3 text-sm font-medium text-gray-900"
        >
          <ChevronLeftIcon
            className="-ml-2 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
          <span className="select-none">Directory</span>
        </a>
      </nav>

      <main ref={profileScrollRef} className="overflow-y-scroll mobileProfHeight">
        <article className="pb-32 sm:pb-0">

          <div className="portal-profile-hero">
            <div>
              <ProfileCover major={currProfile.major} assigned={currProfile.banner_activity}/>
            </div>
            <div className="portal-profile-heading mx-auto max-w-5xl">
                <div className="portal-profile-avatar">
                  <img
                    className="rounded-full object-cover"
                    src={profileImage}
                    alt=""
                  />
                </div>
                <div className="portal-profile-identity">
                        <h1 className="text-2xl font-bold text-gray-900">
                      {profileName}
                    </h1>
                  <div className="portal-profile-actions">
                    {!props.alumni && <>
                    <button
                      onClick={() => {
                        window.location.href = "mailto:" + profileEmail;
                      }}
                      type="button"
                      className={classNames(
                        profileEmail ? "" : "hidden",
                        "inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                      )}
                    >
                      <EnvelopeIcon
                        className="-ml-1 mr-2 h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                        aria-hidden="true"
                      />
                      <span>Email</span>
                    </button>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={resumeLink}
                      className={classNames(
                        resumeLink ? "" : "hidden",
                        "inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                      )}
                    >
                      <DocumentTextIcon
                        className="-ml-1 mr-2 h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                        aria-hidden="true"
                      />
                      <span>Resume</span>
                    </a>
                    </>}
                    <div className="portal-profile-socials flex items-center">
                      {socials.map(
                        (item: { name: string; href: string; icon: any; className: string }) => (
                          <a
                            key={item.name}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className={classNames(
                              "transition-colors",
                              item.className || "text-slate-400 hover:text-blue-600"
                            )}
                          >
                            <span className="sr-only">{item.name}</span>
                            <item.icon className="h-6 w-6" aria-hidden="true" />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <div className="portal-profile-details mx-auto mt-6 max-w-5xl px-4 sm:px-6 lg:px-8">
            <PortalBackdrop profile />
            <div className={classNames("portal-profile-content", props.alumni ? "portal-alumni-content" : "")}>
              {!props.alumni && <section className="portal-profile-about" aria-labelledby="member-about-heading">
                <h2 id="member-about-heading">About</h2>
                <div
                  className="portal-profile-biography"
                  dangerouslySetInnerHTML={{ __html: aboutHtml }}
                />
              </section>}
              <dl className="portal-profile-facts">
                {Object.keys(fields).map((field) => (
                  <div key={field} className="portal-profile-field sm:col-span-1">
                    <dt className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      {field}
                    </dt>
                    <dd className="mt-2 text-sm text-slate-900">
                      {fields[field]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

export default IndivProfile;
