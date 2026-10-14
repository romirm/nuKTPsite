import { useEffect, useState, useContext, useMemo } from "react";
import { ActiveProfileContext } from "../../Framework/ActiveProfileContext";
import IndivProfile from "./IndivProfile";
import Directory from "./Directory";
import { DirectoryPopulation, selectDirectory } from "./directoryModel";

export default function DirectoryContainer(props: {
  fullPubDir: { [uid: string]: UserProfileType };
  uid: string;
  initialProfileUid?: string;
  population?: DirectoryPopulation;
}) {
  const population = props.population || "members";
  const [directoryVisible, setDirectoryVisible] = useState(!props.initialProfileUid);
  const { activeProfile, setActiveProfile }: any = useContext(ActiveProfileContext);
  const profiles = useMemo(() => selectDirectory(props.fullPubDir, population), [props.fullPubDir, population]);
  const ids = Object.keys(profiles).sort((a, b) => profiles[a].name.localeCompare(profiles[b].name));
  const fallback = props.initialProfileUid && profiles[props.initialProfileUid] ? props.initialProfileUid : profiles[props.uid] ? props.uid : ids[0];
  const selected = profiles[activeProfile] ? activeProfile : fallback;
  const grouped = useMemo(() => {
    const groups: Record<string, Record<string, UserProfileType>> = {};
    Object.entries(profiles).sort(([, a], [, b]) => a.name.localeCompare(b.name)).forEach(([uid, profile]) => {
      const letter = profile.name.trim().charAt(0).toUpperCase();
      (groups[letter] ||= {})[uid] = profile;
    });
    return groups;
  }, [profiles]);
  useEffect(() => {
    if (props.initialProfileUid && profiles[props.initialProfileUid]) { setActiveProfile(props.initialProfileUid); setDirectoryVisible(false); }
  }, [profiles, props.initialProfileUid, setActiveProfile]);
  useEffect(() => {
    if (!profiles[activeProfile] && fallback) setActiveProfile(fallback);
  }, [profiles, fallback, activeProfile, setActiveProfile]);
  if (!Object.keys(props.fullPubDir || {}).length) return <div role="status" className="portal-directory-empty">Loading directory…</div>;
  if (!ids.length) return <div role="status" className="portal-directory-empty">No {population} to display.</div>;
  return <div className="portal-directory relative z-0 flex flex-1">
    <IndivProfile directory={profiles} activeProfile={selected} alumni={population === "alumni"} dir_vis={directoryVisible} handler={() => setDirectoryVisible(v => !v)} loading={false} />
    <Directory directory={grouped} population={population} activeProfile={selected} onSelectProfile={(uid: string) => { setActiveProfile(uid); setDirectoryVisible(false); }} dir_vis={directoryVisible} handler={() => setDirectoryVisible(v => !v)} loading={false} />
  </div>;
}
