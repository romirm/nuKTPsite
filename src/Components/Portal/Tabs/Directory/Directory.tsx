import React, { useEffect } from "react";
import { graduationYear } from "./directoryModel";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { Menu, Transition } from "@headlessui/react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function toSearchableString(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function toDisplayString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function Directory(props: any) {
  const alumni = props.population === "alumni";
  const [searchVal, setSearchVal] = React.useState("");
  const [showType, setShowType] = React.useState("Everyone");
  const [shownDirectory, setShownDirectory]:any = React.useState([{}, 0]); // [directory, amount of results]

  function searchBarChange(val: string) {
    setSearchVal(val.toLowerCase());
  }

  function funnelChange(val: string) {
    setShowType(val);
  }

  function profileIncludesSearch(profile: any, search_val: string) {
    if (alumni && graduationYear(profile).includes(search_val)) return true;
    const searches = alumni
      ? ["name", "major", "majors", "workplace", "graduation_year", "linkedin", "instagram"]
      : ["about", "email", "internships", "linkedin", "instagram", "major", "majors", "minor", "minors", "name", "role", "year"];
    for (var i = 0; i < searches.length; i++) {
      const searchableValue = toSearchableString(Array.isArray(profile[searches[i]]) ? profile[searches[i]].join(" ") : profile[searches[i]]);
      if (searchableValue.includes(search_val)) {
        return true;
      }
    }
    return false;
  }

  function profMatchesShowType(elem: any): boolean {
    if (alumni) return showType === "Everyone" || graduationYear(elem) === showType;
    const role = toDisplayString(elem?.role);
    if (showType === "Everyone") {
      return true;
    } else {
      return (
        role.length > 0 &&
        (role === showType ||
          (showType === "Member" && /^(VP of|President|Vice President|Co-President|Treasurer|Secretary)/i.test(role)))
      );
    }
  }

  function profileMatches(profile: any): boolean {
    if (searchVal === "" && showType === "Everyone") {
      return true;
    } else {
      return (
        profMatchesShowType(profile) &&
        profileIncludesSearch(profile, searchVal)
      );
    }
  }

  function generateVisibleDirectory(): void {
    var newDir: any = {};
    var total_results = 0;
    for (var letter in props.directory) {
      for (var uid in props.directory[letter]) {
        if (profileMatches(props.directory[letter][uid])) {
          if (!(letter in newDir)) {
            newDir[letter] = {};
          }
          newDir[letter][uid] = props.directory[letter][uid];
          total_results++;
        }
      }
    }
    setShownDirectory([newDir, total_results]);
  }

  useEffect(() => {
    generateVisibleDirectory();
  }, [searchVal, showType, props.directory]);

  return (
    <aside
      className={classNames(
        props.dir_vis && !props.loading
          ? "order-first flex flex-col"
          : "hidden",
        props.loading ? "" : "xl:order-first xl:flex xl:flex-col",
        "portal-directory-list w-full xl:w-96 flex-shrink-0 border-r border-gray-200"
      )}
    >

      <div
        className="cursor-pointer w-full flex bg-gray-50 shadow"
        onClick={props.handler}
      >
        <nav
          className="ml-auto flex items-start px-4 py-3 sm:px-6 lg:px-8 xl:hidden"
          aria-label="Breadcrumb"
        >
          <a className="cursor-pointer inline-flex items-center space-x-3 text-sm font-medium text-gray-900">
            <span className="select-none">Profile</span>
            <ChevronRightIcon
              className="-ml-2 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </a>
        </nav>
      </div>
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">{alumni ? "Alumni Directory" : "Member Directory"}</h2>
        {searchVal === "" && showType === "Everyone" && (
          <p className="mt-1 text-sm text-gray-600">
            Search directory of {shownDirectory[1]} {alumni ? "alumni" : "members"}
          </p>
        )}
        {!(searchVal === "" && showType === "Everyone") && (
          <p className="mt-1 text-sm text-gray-600">
            Showing {shownDirectory[1]} search result
            {shownDirectory[1] != 1 && "s"}
          </p>
        )}
        <form className="mt-6 flex" onSubmit={(event) => event.preventDefault()}>
          <div className="min-w-0 flex-1">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                type="search"
                name="search"
                id="search"
                onChange={(type) => {
                  searchBarChange(type.target.value);
                }}
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Search"
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
              />
            </div>
          </div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button aria-label={alumni ? "Filter alumni" : "Filter members"} className="portal-directory-filter inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <FunnelIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </Menu.Button>
            </div>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="z-[500] absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {(alumni ? ["Everyone", ...Array.from(new Set(Object.values(props.directory).flatMap((group: any) => Object.values(group).map(graduationYear)).filter(Boolean))).sort().reverse()] : ["Everyone", "Member", "Pledge"]).map((filter: any) => (
                    <Menu.Item key={filter}>{({ active }) => <button type="button" onClick={() => funnelChange(filter)} className={classNames(active ? "bg-gray-100 text-gray-900" : "text-gray-700", "block w-full text-left px-4 py-2 text-sm")}>
                      {filter === "Everyone" ? "Everyone" : alumni ? `Class of ${filter}` : filter === "Pledge" ? "Pledges" : "Members"}
                    </button>}</Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
          <button
            type="submit"
            className="hidden inline-flex justify-center rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <span className="sr-only">Search</span>
          </button>
        </form>
      </div>
      {shownDirectory[1] === 0 && <p role="status" className="px-6 py-4 text-sm text-gray-500">No matching {alumni ? "alumni" : "members"}.</p>}

      <nav
        className="min-h-0 flex-1 overflow-y-auto pb-[120px] sm:pb-[61px]"
        aria-label="Directory"
      >
        {Object.keys(shownDirectory[0]).map((letter) => ( // For each letter in the directory of visible profiles
          <div key={letter} className={"relative"}>
            <div className="sticky top-0 z-10 border-t border-b border-gray-200 bg-gray-50 px-6 py-1 text-sm font-medium text-gray-500">
              <h3>{letter}</h3>
            </div>
            <ul role="list" className="relative z-0 divide-y divide-gray-200">
              {Object.keys(shownDirectory[0][letter]) //for each profile under the letter
                .sort((uidA: string, uidB: string) => {
                  // Sort alphabetically by name
                  const nameA = toDisplayString(shownDirectory[0][letter][uidA].name).toLowerCase();
                  const nameB = toDisplayString(shownDirectory[0][letter][uidB].name).toLowerCase();
                  return nameA.localeCompare(nameB);
                })
                .map((uid: string) => {
                  const person = shownDirectory[0][letter][uid]; //individual profile
                  const personName = toDisplayString(person?.name) || "Member";
                  const personRole = toDisplayString(person?.role);
                  const roleLabel = alumni && graduationYear(person) ? `Class of ${graduationYear(person)}` : personRole;
                  const roleStyle = alumni ? "alumni" : /^pledge$/i.test(personRole.trim()) ? "pledge" : /^(VP of|President|Vice President|Co-President|Treasurer|Secretary)/i.test(personRole) ? "exec" : "member";
                  const personImage = toDisplayString(person?.pfp_thumb_link) || toDisplayString(person?.profile_pic_link);
                  return (
                    <li key={uid}>
                      <button
                        type="button"
                        onClick={() => props.onSelectProfile(uid)}
                        aria-pressed={uid === props.activeProfile}
                        className={classNames(
                          "portal-directory-member relative flex items-center transition-colors"
                        )}
                      >
                        <div className="flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={personImage}
                            alt=""
                          />
                        </div>
                        <div className="portal-directory-person">
                            <span className="portal-directory-name">
                              {personName}
                            </span>
                            {roleLabel && <span className="portal-directory-role" data-role={roleStyle}>{roleLabel}</span>}
                        </div>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Directory;
