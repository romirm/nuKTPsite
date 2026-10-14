# KTP website

## Preview the member portal locally

After installing dependencies with `npm install`, run:

```sh
npm run start:portal
```

Open http://localhost:3001/member. The landing page's **Member Portal** link also
opens the demo automatically. No Google sign-in, Firebase emulators, or Java are
needed. The demo uses port 3001 so it can run beside a regular dev server on port
3000. To use another port, set `PORT` before running the command.

### Develop and preview portal changes

Keep `npm run start:portal` running while you edit the portal components in
`src/Components/Portal/` or styles in `src/index.css`. Saving a file recompiles
the app and refreshes the browser automatically; no build or deployment is needed
between edits. The sample-data preview uses the same portal components as the
deployed site, including the directory, calendar, admin panel, and other tabs.

The preview uses the existing portal with a fictional admin account (Alex Morgan),
sample member profiles, pledge progress, leaderboard scores, upcoming events,
and maps. Database edits and uploaded files stay in browser session storage;
**Reset sample data** restores the fixtures. There is no connection to the live
Firebase database, storage, authentication, or functions. Calendar Notion imports
are skipped; external links require internet access. Uploaded images are shown
without production thumbnail processing. To customize the fixtures, edit
`src/localPortal/sampleData.ts`, then reset sample data.

Demo access requires a development build, `REACT_APP_PORTAL_DEMO=true`, and a
loopback hostname. `npm run start:portal` sets the flag and binds the server to
127.0.0.1. Production builds always use normal Firebase authentication.

`npm start` retains the Firebase emulator workflow on localhost (ports configured
in `firebase.json`). `npm run build` creates the production site.

## View deployed Firebase data locally

```sh
npm run start:portal:live
```

Open http://localhost:3002/member and sign in with your **existing, authorized KTP
Northwestern account**. This separate mode reads the deployed `ktp-site` Firebase
project with your normal account permissions. It does not use sample auth or
emulators, and it does not create member profiles or enter the onboarding flow.
Google sign-in still creates a normal authentication session and may update
Firebase Authentication's sign-in metadata.

The portal's database adapter rejects `set`, `update`, `remove`, and `push` before
calling Firebase. Storage uploads and all callable Cloud Functions are also
blocked, including for admins. Reads and subscriptions work normally. These are
local application guards; they do not change deployed security rules or revoke
your account's actual permissions. Editable controls may remain visible, but
attempted changes are rejected. Production builds retain their normal behavior.

This mode uses the project's Firebase Hosting auth domain and requires localhost
in Firebase Authentication's authorized domains. If Google sign-in reports
`auth/unauthorized-domain`, the sign-in screen explains the required setting;
the launcher does not change it automatically. Allow popups for localhost if
your browser blocks the Google sign-in window.
## Local member profile copies

The demo also loads `.local-portal/member-snapshot.json` when present. This is a
snapshot of the deployed `public_users` member directory, read using an authorized
Firebase CLI account. The snapshot folder is ignored by Git and sits outside
`src` and `public`; it is never included in production builds. A development-only
route serves it to same-origin loopback requests in demo mode.

To refresh it, export `/public_users` from project `ktp-site` to
`.local-portal/source-public-users.json` and `/allowed_users` to
`.local-portal/source-allowed-users.json` with `firebase database:get`, then run
`node scripts/prepare-portal-members.js` and reload the demo. The preparation script
merges authoritative role assignments using the same resolver as the portal:
explicit UID assignments take priority, followed by Northwestern email username
assignments, then the public profile's role. Use a Node version
compatible with the installed Firebase CLI (the bundled Node 24 runtime works).
Copies are given `local-copy-` IDs and added alongside the sample accounts.
Each prepared export has a content revision. A changed revision replaces the
imported copies, including stale roles and members removed from the new export;
the fictional demo accounts remain. Reloading the same revision preserves local
edits; **Reset sample data** restores the current snapshot. The demo still uses its local database and storage adapters,
so testing these profiles does not write to Firebase. The copy contains only
directory fields, with no imported private users, auth, or admin privileges.

## City search

The globe's pin editor searches only `public/data/worldcities.csv`, the supplied city catalogue stored unchanged in this repository and copied into production builds. There is no external geocoding provider. The CSV is loaded from the site once per session and indexed in memory.

Suggestions appear as you type and accept city prefixes, misspellings, transposed letters and accent-free names. Add a region or country to distinguish places, such as `Paris, Texas`. Results show each city's region and country. Selecting a result fills in the city, country, latitude and longitude from that exact CSV row and moves the draft pin; **Save my pin** persists it through the existing portal database adapter.

## Connections

The **Connections** tab, directly below **Maps**, opens centered on the signed-in member, with their 12 strongest profile matches in a spaced circle. Choose 24 or all connections to expand the view. Selecting another member centers their circle; **Find me** returns to yours. **Whole chapter** shows every eligible profile, including members with no matches, and offers affinity, standing, and role arrangements. The searchable member list always includes the full filtered population.

The graph uses the portal's `public_users` directory and the roles already merged from `allowed_users`. No old graph exports, copied member data, or résumé files are bundled into production. The local demo includes its four fictional accounts alongside the ignored snapshot; real sign-in uses the authenticated user's UID. Refresh the portal to load directory changes.

Connections describe shared profile information, not verified friendships. `graphModel.ts` performs deterministic, local semantic concept matching: declared study aliases, normalized whole experience entries, and curated biography topic synonyms (for example ML/machine learning and climbing/bouldering). It uses no model API or external processing. Each connection exposes its contributing categories and both source texts. Missing values, generic Member roles, malformed roles, class standings entered as majors, and hidden internship/standing fields do not create matches. Unknown topics may have no recognized match; the UI does not imply exhaustive language understanding.

Scores are the sum of category weights times rarity-weighted Jaccard overlap: studies 30, experience 30, biography topics 30, standing 7, and pledge/executive role 3. Frequencies are calculated across the eligible directory before filters. Disabled categories remove both their evidence and their score; empty categories contribute zero. Scores are rounded to whole points, with positive overlaps shown as at least one point. Current chapter excludes explicit alumni labels, without guessing enrollment from dates. The whole-chapter overview shows the union of each member's two strongest links; the side panel lists every filtered connection. Selecting a connection outside the displayed circle adds it to the map.

Implementation: `src/Components/Portal/Tabs/SocialGraph/`. Model and interaction regression tests cover data normalization, privacy flags, filtering, deterministic layouts, personalized defaults, expansion, and profile navigation callbacks.
