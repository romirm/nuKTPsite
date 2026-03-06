import React, { useMemo } from "react";
import { CheckIcon } from "@heroicons/react/20/solid";

const PLACEHOLDER_IMAGE_URL = "https://via.placeholder.com/200";
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

const PledgeTracker: React.FC<PledgeTrackerProps> = ({ fullPubDir }) => {
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

    return rows.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [fullPubDir]);

  return (
    <div className="bg-white h-screen overflow-y-scroll">
      <div className="mx-auto max-w-7xl py-12 px-6">
        <div className="space-y-12">
          <div className="space-y-5 sm:space-y-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Pledge Tracker
              </h2>
              <p className="text-xl text-gray-500 mt-2">
                View pledge progress for points, coffee chats, thank you notes,
                and capstone milestones.
              </p>
            </div>
            <p className="text-gray-500 italic">Pledges are listed alphabetically by name.</p>
          </div>

          <div className="lg:col-span-2">
            {pledgeUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No pledge tracker entries are available right now.
                </p>
              </div>
            ) : (
              <ul
                role="list"
                className="space-y-12 sm:-mt-8 sm:space-y-0 sm:divide-y sm:divide-gray-200 lg:gap-x-8 lg:space-y-0"
              >
                {pledgeUsers.map((pledgeUser) => (
                  <li key={pledgeUser.uid} className="sm:pt-5">
                    <div className="space-y-4 sm:grid sm:grid-cols-3 sm:items-start sm:gap-6 sm:space-y-0 max-w-4xl">
                      <div className="max-w-[200px] max-h-[200px] mt-[0.335rem]">
                        <div className="aspect-square overflow-hidden rounded-lg">
                          <img
                            className="rounded-lg shadow-lg object-cover min-w-full min-h-full"
                            src={pledgeUser.pictureLink}
                            alt={pledgeUser.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                PLACEHOLDER_IMAGE_URL;
                            }}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <h3 className="text-lg font-medium leading-6">
                          {pledgeUser.name}
                        </h3>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                              Pledge Points
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                              {pledgeUser.pledgePoints}
                            </p>
                          </div>

                          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                              Coffee Chats Completed
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                              {pledgeUser.coffeeChatsCompleted}
                            </p>
                          </div>

                          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                              Thank You Notes Sent
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                              {pledgeUser.thankYouNotesSent}
                            </p>
                          </div>

                          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                              Capstone Project Progress
                            </p>
                            <div className="mt-2 flex gap-2">
                              {pledgeUser.capstoneProjectProgress.map(
                                (isComplete, index) => (
                                  <div
                                    key={`${pledgeUser.uid}-capstone-${index}`}
                                    className={`flex h-9 w-9 items-center justify-center rounded border text-sm font-semibold ${
                                      isComplete
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-blue-200 bg-white text-blue-400"
                                    }`}
                                  >
                                    {isComplete ? (
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                      <span>{index + 1}</span>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PledgeTracker;
