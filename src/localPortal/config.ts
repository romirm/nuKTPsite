// These local modes must never activate in a deployed build.
const isLocalDevelopment =
  process.env["NODE_ENV"] === "development" &&
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

export const isReadOnlyLivePortal =
  isLocalDevelopment && process.env["REACT_APP_PORTAL_LIVE"] === "true";
export const isLocalPortalDemo =
  isLocalDevelopment && !isReadOnlyLivePortal && process.env["REACT_APP_PORTAL_DEMO"] === "true";
