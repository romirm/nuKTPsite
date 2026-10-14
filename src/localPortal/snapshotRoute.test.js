const fs = require("fs");
const setupProxy = require("../setupProxy");
jest.mock("fs", () => ({ readFileSync: jest.fn() }));

test("snapshot route is served only to same-origin loopback demo requests", () => {
  const environment = { NODE_ENV: process.env.NODE_ENV, REACT_APP_PORTAL_DEMO: process.env.REACT_APP_PORTAL_DEMO };
  try {
    process.env.NODE_ENV = "development"; process.env.REACT_APP_PORTAL_DEMO = "true";
    let handler;
    setupProxy({ get: (_, callback) => { handler = callback; } });
    const request = (host = "localhost:3001", origin, address = "127.0.0.1") => ({ get: name => name === "host" ? host : origin, socket: { remoteAddress: address } });
    const response = () => { const res = { sendStatus: jest.fn(), set: jest.fn(), json: jest.fn(), status: jest.fn() }; res.status.mockReturnValue(res); return res; };
    fs.readFileSync.mockReturnValue('{"public_users":{"member":{"name":"Test Member"}}}');
    const allowed = response(); handler(request(), allowed);
    expect(allowed.json).toHaveBeenCalled();
    expect(allowed.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    fs.readFileSync.mockClear();
    for (const req of [request("evil.example:3001"), request("localhost:3001", "https://evil.example"), request("localhost:3001", undefined, "192.168.1.2")]) {
      const res = response(); handler(req, res); expect(res.sendStatus).toHaveBeenCalledWith(404);
    }
    process.env.REACT_APP_PORTAL_DEMO = "false";
    const disabled = response(); handler(request(), disabled); expect(disabled.sendStatus).toHaveBeenCalledWith(404);
    process.env.REACT_APP_PORTAL_DEMO = "true"; process.env.NODE_ENV = "production";
    const production = response(); handler(request(), production); expect(production.sendStatus).toHaveBeenCalledWith(404);
    expect(fs.readFileSync).not.toHaveBeenCalled();
  } finally {
    for (const [key, value] of Object.entries(environment)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
