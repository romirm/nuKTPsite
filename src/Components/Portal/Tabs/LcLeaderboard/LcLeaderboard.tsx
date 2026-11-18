import React, { useEffect, useMemo, useState } from "react";
import Logo from "@images/Branding/Logo.png";
import "./lc-leaderboard.css";
import { isLocalPortalDemo } from "../../../../localPortal/config";
import { localLeetcodeRefreshTime } from "../../../../localPortal/runtime";

const places_to_20 = [
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
  "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th",
];

function weightedScoreCalc(easy: number, med: number, hard: number): number {
  return easy * 2 + med * 5 + hard * 8;
}

interface LeaderboardUser {
  lcUser: string;
  name: string;
  role: string;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  weightedScore: number;
  pictureLink: string;
}

interface LcLeaderboardProps {
  fullPubDir: any;
}

const LcLeaderboard: React.FC<LcLeaderboardProps> = ({
  fullPubDir,
}) => {
  const [lcStats, setLcStats] = useState<LeaderboardUser[]>([]);
  const [leaderboardType, setLeaderboardType] = useState<"allTime" | "active" | "pledges">("allTime");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const processPubDir = (dir: any): LeaderboardUser[] => {
    try {
      const lc_users: {
        [key: string]: {
          name: string;
          role: string;
          answers: any;
          pfp: string;
        };
      } = {};

      // Collect all users with LC data
      for (const user_uid in dir) {
        const user = dir[user_uid];
        if (typeof user?.leetcode?.username === "string" && user.leetcode.username.trim()) {
          if (!user.leetcode.answers) {
            continue;
          }
          const prof_pic = user.pfp_thumb_link || user.pfp_large_link || user.profile_pic_link;
          lc_users[user.leetcode.username] = {
            name: typeof user.name === "string" ? user.name : user.leetcode.username,
            role: typeof user.role === "string" ? user.role : "",
            answers: user.leetcode.answers,
            pfp: prof_pic,
          };
        }
      }


      // Calculate stats for each user
      const formattedStats: LeaderboardUser[] = [];
      for (const lcusername in lc_users) {
        const lc_user_elem = lc_users[lcusername];
        const easySolved = Number(lc_user_elem.answers.easySolved) || 0;
        const mediumSolved = Number(lc_user_elem.answers.mediumSolved) || 0;
        const hardSolved = Number(lc_user_elem.answers.hardSolved) || 0;

        formattedStats.push({
          lcUser: lcusername,
          name: lc_user_elem.name,
          role: lc_user_elem.role,
          easySolved,
          mediumSolved,
          hardSolved,
          acceptanceRate: Number(lc_user_elem.answers.acceptanceRate) || 0,
          weightedScore: weightedScoreCalc(easySolved, mediumSolved, hardSolved),
          pictureLink: lc_user_elem.pfp,
        });
      }

      // Sort by weighted score in descending order
      const sortedData = formattedStats.sort(
        (a, b) => b.weightedScore - a.weightedScore
      );

      return sortedData;
    } catch (errors) {
      console.error("Error loading lc stats:", errors);
      throw new Error("Failed to process leaderboard data");
    }
  };
  useEffect(() => {
    if (!fullPubDir || Object.keys(fullPubDir).length === 0) {
      setLoading(false);
      setError("No user data available");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const stats = processPubDir(fullPubDir);
      setLcStats(stats);
      const refreshedAt = isLocalPortalDemo ? localLeetcodeRefreshTime() : null;
      setLastUpdated(refreshedAt ? new Date(refreshedAt) : null);
      setLoading(false);
    } catch (err) {
      console.error("Error processing leaderboard:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setLoading(false);
    }
  }, [fullPubDir]);

  const displayedStats = useMemo(() => {
    if (leaderboardType === "allTime") {
      return lcStats;
    }

    if (leaderboardType === "pledges") {
      return lcStats.filter((user) => {
        const normalizedRole = (user.role || "").trim().toLowerCase();
        return normalizedRole === "pledge";
      });
    }

    return lcStats.filter((user) => {
      const normalizedRole = (user.role || "").trim().toLowerCase();
      const normalizedName = (user.name || "").trim().toLowerCase();
      const normalizedLcUser = (user.lcUser || "").trim().toLowerCase();

      const isAlumniRole = normalizedRole === "alumni";
      const isSteveException =
        normalizedName.includes("steve") ||
        normalizedName.includes("steven") ||
        normalizedLcUser.includes("steve");

      return !isAlumniRole && !isSteveException;
    });
  }, [lcStats, leaderboardType]);

  if (loading && lcStats.length === 0) {
    return (
      <div className="bg-white h-screen overflow-y-scroll flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page-scroll lc-leaderboard h-full overflow-y-auto">
      <div className="lc-leaderboard-content mx-auto">
        <header className="lc-leaderboard-header">
          <h2>Leetcode Leaderboard</h2>
          <p>Easy questions are 2 points, medium are 5 points, and hard are 8 points.</p>
          <div className="lc-leaderboard-toolbar">
            <div className="lc-leaderboard-filters" role="group" aria-label="Leaderboard type">
              {([
                ["allTime", "All Time"], ["active", "Active"], ["pledges", "Pledges"],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={leaderboardType === value}
                  onClick={() => setLeaderboardType(value)}>{label}</button>
              ))}
            </div>
            {lastUpdated && <p className="lc-leaderboard-updated">Local refresh: {lastUpdated.toLocaleString()} · Some entries may be unavailable or sample data</p>}
          </div>
        </header>
        {error && <p role="alert" className="lc-leaderboard-empty">{error}</p>}
        {displayedStats.length === 0 ? (
          <p className="lc-leaderboard-empty">
            {leaderboardType === "active" ? "No active leaderboard entries match the current filter."
              : leaderboardType === "pledges" ? "No pledge leaderboard entries are available right now."
              : "No leaderboard data available. Please check back later."}
          </p>
        ) : (
          <ol className="lc-leaderboard-list" aria-label="LeetCode rankings">
            {displayedStats.map((user, index) => (
              <li key={user.lcUser} className="lc-leaderboard-row" data-rank={index + 1}>
                <span className="lc-leaderboard-rank" aria-label={`${places_to_20[index] || `Rank ${index + 1}`} place`}>{index + 1}</span>
                <img className="lc-leaderboard-avatar" src={user.pictureLink || Logo} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = Logo; }} />
                <div className="lc-leaderboard-member">
                  <h3><a href={`https://leetcode.com/${user.lcUser}`} target="_blank" rel="noopener noreferrer">{user.name}</a></h3>
                  <a className="lc-leaderboard-username" href={`https://leetcode.com/${user.lcUser}`} target="_blank" rel="noopener noreferrer">@{user.lcUser} <span aria-hidden="true">↗</span></a>
                </div>
                <dl className="lc-leaderboard-stats">
                  <div className="lc-stat-total"><dt>Total</dt><dd>{user.easySolved + user.mediumSolved + user.hardSolved}</dd></div>
                  <div className="lc-stat-easy"><dt>Easy</dt><dd>{user.easySolved}</dd></div>
                  <div className="lc-stat-medium"><dt>Medium</dt><dd>{user.mediumSolved}</dd></div>
                  <div className="lc-stat-hard"><dt>Hard</dt><dd>{user.hardSolved}</dd></div>
                  <div className="lc-stat-score"><dt>Score</dt><dd>{user.weightedScore}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default LcLeaderboard;
