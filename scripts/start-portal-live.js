const { spawn } = require("child_process");
const path = require("path");

console.log("Starting a read-only portal connected to deployed Firebase. Sign in with your existing KTP account.");
const child = spawn(process.execPath, [require.resolve("@craco/craco/dist/bin/craco.js"), "start"], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
  env: { ...process.env, REACT_APP_PORTAL_LIVE: "true", REACT_APP_PORTAL_DEMO: "false", HOST: "127.0.0.1", PORT: process.env.PORT || "3002", BROWSER: "none" },
});
child.on("exit", code => process.exit(code || 0));
child.on("error", error => { console.error(error); process.exit(1); });
