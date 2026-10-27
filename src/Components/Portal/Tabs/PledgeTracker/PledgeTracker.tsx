import React, { useMemo, useState } from "react";
import { CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import Logo from "../../../../Assets/Images/Branding/Logo.png";
import "./pledge-tracker.css";

const PLACEHOLDER_IMAGE_URL = Logo;
const DEFAULT_PLEDGE_POINTS = 100;

interface PledgeTrackerProps {
  fullPubDir: any;
}

interface PledgeTrackerUser {
  uid: string;
  name: string;
  pictureLink: string;
  pledgePoints: number;
  coffeeChatsCompleted: number;
  thankYouNotesSent: number;
  capstoneProjectProgress: [boolean, boolean, boolean];
}

const toSafeNumber = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
};

const parseCapstoneProgress = (rawValue: any): [boolean, boolean, boolean] => {
  if (Array.isArray(rawValue)) {
    return [Boolean(rawValue[0]), Boolean(rawValue[1]), Boolean(rawValue[2])];
  }

  const capstoneObj = rawValue && typeof rawValue === "object" ? rawValue : {};

  return [
    Boolean(capstoneObj.milestone_1 ?? capstoneObj.step_1 ?? capstoneObj.box_1 ?? capstoneObj.stage_1),
    Boolean(capstoneObj.milestone_2 ?? capstoneObj.step_2 ?? capstoneObj.box_2 ?? capstoneObj.stage_2),
    Boolean(capstoneObj.milestone_3 ?? capstoneObj.step_3 ?? capstoneObj.box_3 ?? capstoneObj.stage_3),
  ];
};

type SortMode = "alphabetical" | "pledgePoints";

const PledgeTracker: React.FC<PledgeTrackerProps> = ({ fullPubDir }) => {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("pledgePoints");

  const pledgeUsers = useMemo(() => {
    if (!fullPubDir || typeof fullPubDir !== "object") {
      return [] as PledgeTrackerUser[];
    }

    const rows: PledgeTrackerUser[] = [];

    Object.keys(fullPubDir).forEach((uid) => {
      const user = fullPubDir[uid] || {};
      const normalizedRole = String(user.role || "").trim().toLowerCase();

      if (normalizedRole !== "pledge") {
        return;
      }

      const pledgeTracker = user.pledge_tracker || user.pledgeTracker || {};
      const capstoneRaw =
        pledgeTracker.capstone_project_progress ||
        pledgeTracker.capstoneProjectProgress ||
        {};

      rows.push({
        uid,
        name: user.name || "Unknown",
        pictureLink:
          user.pfp_large_link ||
          user.profile_pic_link ||
          user.pfp_thumb_link ||
          PLACEHOLDER_IMAGE_URL,
        pledgePoints: toSafeNumber(
          pledgeTracker.pledge_points ??
            pledgeTracker.pledgePoints ??
            DEFAULT_PLEDGE_POINTS
        ),
        coffeeChatsCompleted: toSafeNumber(
          pledgeTracker.coffee_chats_completed ??
            pledgeTracker.coffeeChatsCompleted
        ),
        thankYouNotesSent: toSafeNumber(
          pledgeTracker.thank_you_notes_sent ?? pledgeTracker.thankYouNotesSent
        ),
        capstoneProjectProgress: parseCapstoneProgress(capstoneRaw),
      });
    });

    const sortedRows = [...rows];

    sortedRows.sort((a, b) => {
      if (sortMode === "pledgePoints") {
        if (b.pledgePoints !== a.pledgePoints) {
          return b.pledgePoints - a.pledgePoints;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }

      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    return sortedRows;
  }, [fullPubDir, sortMode]);

  const visiblePledges = pledgeUsers.filter(user => user.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  return (
    <div className="portal-page-scroll pledge-tracker">
      <div className="pledge-tracker-shell">
        <section className="pledge-tracker-panel" aria-labelledby="pledge-roster-heading">
          <div className="pledge-tracker-heading">
            <div>
              <h2 id="pledge-roster-heading">Pledge Tracker</h2>
              <p>{pledgeUsers.length} {pledgeUsers.length === 1 ? "pledge" : "pledges"}</p>
            </div>
            <span className="pledge-tracker-emblem" aria-hidden="true">&#10022;</span>
          </div>
          <div className="pledge-tracker-toolbar">
            <div className="pledge-tracker-search">
              <MagnifyingGlassIcon aria-hidden="true" />
              <label className="sr-only" htmlFor="pledge-search">Search pledges</label>
              <input id="pledge-search" type="search" placeholder="Search pledges" value={search} onChange={event => setSearch(event.target.value)} />
            </div>
            <div className="pledge-tracker-sort">
              <label htmlFor="pledge-sort">Sort by</label>
              <select id="pledge-sort" value={sortMode} onChange={event => setSortMode(event.target.value as SortMode)}>
                <option value="alphabetical">Alphabetical</option>
                <option value="pledgePoints">Pledge points</option>
                              </select>
            </div>
          </div>
        </section>
        {visiblePledges.length === 0 ? (
          <div className="pledge-tracker-empty" role="status">
            <h3>{pledgeUsers.length ? "No matching pledges" : "No pledges yet"}</h3>
            <p>{pledgeUsers.length ? "Try a different name." : "Members with the Pledge role will appear here."}</p>
            {search && <button type="button" onClick={() => setSearch("")}>Clear search</button>}
          </div>
        ) : (
          <div className="pledge-leaderboard-frame">
            <div className="pledge-leaderboard-scroll" role="region" aria-label="Pledge leaderboard" tabIndex={0}>
              <table className="pledge-leaderboard">
                <caption className="sr-only">Pledge progress, sorted {sortMode === "alphabetical" ? "alphabetically" : "by points, highest first"}</caption>
                <thead><tr><th scope="col">#</th><th scope="col">Pledge</th><th scope="col">Points</th><th scope="col">Coffee chats</th><th scope="col">Thank-you notes</th><th scope="col">Capstone</th></tr></thead>
                <tbody>
                  {visiblePledges.map((user, index) => (
                    <tr key={user.uid}>
                      <td className="pledge-position">{String(index + 1).padStart(2, "0")}</td>
                      <th scope="row"><div className="pledge-player"><img src={user.pictureLink} alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = PLACEHOLDER_IMAGE_URL; }} /><span>{user.name}</span></div></th>
                      <td className="pledge-score pledge-score-primary">{user.pledgePoints.toLocaleString()}</td>
                      <td className="pledge-score">{user.coffeeChatsCompleted.toLocaleString()}</td>
                      <td className="pledge-score">{user.thankYouNotesSent.toLocaleString()}</td>
                      <td><div className="pledge-stage-track" aria-label={`${user.capstoneProjectProgress.filter(Boolean).length} of 3 capstone milestones complete`}>
                        {user.capstoneProjectProgress.map((complete, stage) => <span key={stage} className={complete ? "is-complete" : ""} title={`Milestone ${stage + 1}: ${complete ? "complete" : "not complete"}`} aria-label={`Milestone ${stage + 1}: ${complete ? "complete" : "not complete"}`}>{complete ? <CheckIcon aria-hidden="true" /> : <span aria-hidden="true">{stage + 1}</span>}</span>)}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PledgeTracker;
