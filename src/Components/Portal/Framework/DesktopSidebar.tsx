import { ActiveProfileContext } from "@portal/Framework/ActiveProfileContext";
import { useContext } from "react";
function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar(props: { args: SideBarArgsType }) {
  const args = props.args;
  const {_, setActiveProfile }: any = useContext(ActiveProfileContext);
  _;
  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex w-64 flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <img
                className="cursor-pointer h-12 w-auto"
                src={args.Logo}
                alt="Kappa Theta Pi"
                onClick={() => {
                  window.location.href = "/";
                }}
              />
            </div>
            <nav className="mt-5 flex-1" aria-label="Sidebar">
              <div className="space-y-1 px-2">
                {Object.keys(args.Navigation).map((NavKey: string) => {
                  const currTab = args.Navigation[NavKey];
                  const isCurrent = args.CurrTab === NavKey;
                  if (!currTab.secondary && (args.Admin || !currTab.adminonly) && (args.Pledge || !currTab.pledgeonly || args.Admin)) {
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
                          "cursor-pointer group flex items-center px-3 py-2 text-sm font-semibold rounded-md"
                        )}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        <currTab.icon
                          className={classNames(
                            isCurrent
                              ? "text-blue-600"
                              : "text-slate-400 group-hover:text-blue-600 transition-colors",
                            "mr-3 flex-shrink-0 h-6 w-6"
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
              <div className="flex-1 space-y-1 px-2">
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
                          "cursor-pointer group flex items-center px-3 py-2 text-sm font-semibold rounded-md"
                        )}
                      >
                        <currTab.icon
                          className={classNames(
                            isCurrent
                              ? "text-blue-600"
                              : "text-slate-400 group-hover:text-blue-600 transition-colors",
                            "mr-3 flex-shrink-0 h-6 w-6"
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
          <div className="fixed bottom-0">
            <div className="flex flex-shrink-0 border-t border-slate-200 bg-white p-4 w-64">
              <a
                className="cursor-pointer group block w-full flex-shrink-0 hover:opacity-80 transition-opacity"
                onClick={() => {
                  args.onTabClick("Members");
                  setActiveProfile(args.uid);
                }}
              >
                <div className="flex items-center">
                  <div>
                    <img
                      className="inline-block h-9 w-9 rounded-full"
                      src={args.ImageUrl}
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-bold text-slate-900">
                      {args.CurrentUserName}
                    </p>
                    <p className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                      View profile
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
