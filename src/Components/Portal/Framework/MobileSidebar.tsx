import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PortalNavigation, PortalProfileLink } from "./PortalNavigation";

export default function MobileSidebar({ args, sideBarOpen, setSidebarOpen }: {
  args: SideBarArgsType; sideBarOpen: boolean; setSidebarOpen: (val: boolean) => void;
}) {
  return (
    <Transition.Root show={sideBarOpen} as={Fragment}>
      <Dialog as="div" className="ktp-portal portal-mobile-dialog relative z-40 lg:hidden" onClose={setSidebarOpen}>
        <Transition.Child as={Fragment} enter="transition-opacity duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="portal-mobile-backdrop fixed inset-0" />
        </Transition.Child>
        <div className="fixed inset-0 z-40 flex">
          <Transition.Child as={Fragment} enter="transition duration-200 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition duration-200 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
            <Dialog.Panel className="portal-sidebar portal-sidebar-mobile">
              <div className="portal-brand">
                <a href="/" aria-label="Kappa Theta Pi"><img src={args.Logo} alt="Kappa Theta Pi" /></a>
                <button type="button" className="portal-close-sidebar" onClick={() => setSidebarOpen(false)}>
                  <span className="sr-only">Close sidebar</span><XMarkIcon aria-hidden="true" />
                </button>
              </div>
              <PortalNavigation args={args} />
              <PortalProfileLink args={args} onClose={() => setSidebarOpen(false)} />
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
