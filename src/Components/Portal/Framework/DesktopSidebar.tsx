import { PortalNavigation, PortalProfileLink } from "./PortalNavigation";

export default function DesktopSidebar({ args }: { args: SideBarArgsType }) {
  return (
    <aside className="portal-sidebar hidden lg:flex">
      <div className="portal-brand">
        <a href="/" aria-label="Kappa Theta Pi"><img src={args.Logo} alt="Kappa Theta Pi" /></a>
      </div>
      <PortalNavigation args={args} />
      <PortalProfileLink args={args} />
    </aside>
  );
}
