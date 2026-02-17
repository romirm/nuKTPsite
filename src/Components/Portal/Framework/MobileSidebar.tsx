import { Fragment, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ActiveProfileContext } from "@portal/Framework/ActiveProfileContext";
function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}
export default function MobileSidebar(props: {
  args: SideBarArgsType;
  sideBarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}) {
  const args = props.args;
  const {_, setActiveProfile}:any = useContext(ActiveProfileContext);
  _;
  return (
    <>
      <Transition.Root show={props.sideBarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 lg:hidden"
          onClose={props.setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white focus:outline-none border-r border-slate-200">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => props.setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                  <div className="flex flex-shrink-0 items-center px-4">
                    <img
                      className="cursor-pointer h-8 w-auto"
                      src={args.Logo}
                      alt="Kappa Theta Pi"
                      onClick={() => {
                        window.location.href = "/";
                      }}
                    />
                  </div>
                  <nav aria-label="Sidebar" className="mt-5">
                    <div className="space-y-1 px-2">
                      {Object.keys(args.Navigation).map((NavKey: string) => {
                        const currTab = args.Navigation[NavKey];
                        const isCurrent = args.CurrTab === NavKey;
                        if (!currTab.secondary && (args.Admin || !currTab.adminonly)) {
                          return (
                            <a
                              key={currTab.name}
                              onClick={() => {
                                args.onTabClick(NavKey);
                              }}
                              className={classNames(
                                isCurrent
                                  ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border-l-4 border-blue-600 shadow-sm"
                                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm transition-all",
                                "group flex items-center px-3 py-2 text-base font-semibold rounded-md"
                              )}
                              aria-current={
                                isCurrent ? "page" : undefined
                              }
                            >
                              <currTab.icon
                                className={classNames(
                                  isCurrent
                                    ? "text-blue-600"
                                    : "text-slate-400 group-hover:text-blue-700 transition-colors",
                                  "mr-4 h-6 w-6"
                                )}
                                aria-hidden="true"
                              />
                              {currTab.name}
                            </a>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <hr
                      className="my-5 border-t border-slate-200"
                      aria-hidden="true"
                    />
                    <div className="space-y-1 px-2">
                      {Object.keys(args.Navigation).map((NavKey: string) => {
                        const currTab = args.Navigation[NavKey];
                        const isCurrent = args.CurrTab === NavKey;
                        if (currTab.secondary && (args.Admin || !currTab.adminonly)) {
                          return (
                            <a
                              key={currTab.name}
                              onClick={() => {
                                args.onTabClick(NavKey);
                              }}
                              className={classNames(
                                isCurrent
                                  ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border-l-4 border-blue-600 shadow-sm"
                                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm transition-all",
                                "group flex items-center px-3 py-2 text-base font-semibold rounded-md"
                              )}
                            >
                              <currTab.icon
                                className={classNames(
                                  isCurrent
                                    ? "text-blue-600"
                                    : "text-slate-400 group-hover:text-blue-700 transition-colors",
                                  "mr-4 h-6 w-6 flex-shrink-0"
                                )}
                                aria-hidden="true"
                              />
                              {currTab.name}
                            </a>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </nav>
                </div>
                <div className="flex flex-shrink-0 border-t border-slate-200 bg-white p-4">
                  <a
                    className="cursor-pointer group block w-full flex-shrink-0 hover:opacity-80 transition-opacity"
                    onClick={() => {
                      props.setSidebarOpen(false);
                      args.onTabClick("Members");
                      setActiveProfile(args.uid);
                    }}
                  >
                    <div className="flex items-center">
                      <div>
                        <img
                          className="inline-block h-10 w-10 rounded-full"
                          src={args.ImageUrl}
                          alt=""
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-base font-bold text-slate-900">
                          {args.CurrentUserName}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                          View profile
                        </p>
                      </div>
                    </div>
                  </a>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true">
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
