import { useContext } from "react";
import { ActiveProfileContext } from "./ActiveProfileContext";

export function PortalNavigation({ args }: { args: SideBarArgsType }) {
  function links(secondary: boolean) {
    return Object.entries(args.Navigation).map(([key, tab]) => {
      if (key === "SocialGraph" || tab.secondary !== secondary || (tab.adminonly && !args.Admin) || (tab.pledgeonly && !args.Pledge && !args.Admin)) return null;
      const current = args.CurrTab === key;
      return (
        <button key={key} type="button" className="portal-nav-item" aria-current={current ? "page" : undefined} onClick={() => args.onTabClick(key)}>
          <tab.icon aria-hidden="true" />
          <span>{tab.name}</span>
          {current && <span className="portal-nav-dot" aria-hidden="true" />}
        </button>
      );
    });
  }
  return (
    <nav className="portal-navigation" aria-label="Sidebar">
      <div className="portal-nav-group">{links(false)}</div>
      <div className="portal-nav-group portal-nav-secondary">{links(true)}</div>
    </nav>
  );
}

export function PortalProfileLink({ args, onClose }: { args: SideBarArgsType; onClose?: () => void }) {
  const { setActiveProfile }: any = useContext(ActiveProfileContext);
  return (
    <button type="button" className="portal-profile-link" onClick={() => {
      onClose?.(); args.onTabClick("MyProfile"); setActiveProfile(args.uid);
    }}>
      <img src={args.ImageUrl} alt="" />
      <span><strong>{args.CurrentUserName}</strong><span>View profile</span></span>
      <span className="portal-profile-arrow" aria-hidden="true">↗</span>
    </button>
  );
}
