const fs = require("fs");
const path = require("path");

// CRA loads this middleware only in its development server. The snapshot stays
// outside src/public so neither webpack nor Firebase Hosting can package it.
module.exports = function localMemberSnapshot(app) {
  app.get("/__local-portal/member-snapshot", (req, res) => {
    const host = req.get("host") || "";
    const origin = req.get("origin");
    const localAddress = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
    if (process.env.NODE_ENV !== "development" || process.env.REACT_APP_PORTAL_DEMO !== "true" || !localAddress ||
      !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) || (origin && origin !== `http://${host}`)) {
      res.sendStatus(404); return;
    }
    res.set("Cache-Control", "no-store");
    try {
      const snapshot = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../.local-portal/member-snapshot.json"), "utf8"));
      res.json(snapshot);
    } catch (error) {
      if (error.code === "ENOENT") res.sendStatus(204);
      else res.status(500).json({ error: "The local member snapshot could not be read." });
    }
  });
};
