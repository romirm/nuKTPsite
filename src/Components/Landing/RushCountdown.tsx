import { useEffect, useState } from "react";
import { getWinterRushCountdown } from "./winterRushCountdown";

export default function RushCountdown() {
  const [remaining, setRemaining] = useState(() => getWinterRushCountdown());

  useEffect(() => {
    const refresh = () => {
      const next = getWinterRushCountdown();
      setRemaining((current) => current.months === next.months && current.days === next.days && current.started === next.started ? current : next);
    };
    const onVisibility = () => { if (!document.hidden) refresh(); };
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);
    refresh();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <section className="rush-countdown" aria-labelledby="rush-countdown-title">
      <div className="rush-countdown-bar" aria-hidden="true">
        <span>YOUR NEXT CHAPTER</span>
        <svg viewBox="0 0 20 20" fill="currentColor" shapeRendering="crispEdges" focusable="false">
          <path d="M4 1h2v3h8V1h2v3h3v15H1V4h3zm-1 7v9h14V8zM5 10h3v3H5zm7 0h3v3h-3z" />
        </svg>
      </div>
      <div className="rush-countdown-body">
        <p className="rush-countdown-kicker">{remaining.started ? "THE WAIT IS OVER" : "COUNTING DOWN TO"}</p>
        <h2 id="rush-countdown-title">Winter Rush <span>2027</span></h2>
        <dl className="rush-countdown-clock" aria-label="Time until Winter Rush 2027" aria-live="polite" aria-atomic="true">
          {[{ label: "Months", value: remaining.months }, { label: "Days", value: remaining.days }].map(({ label, value }) => (
            <div className="rush-countdown-unit" key={label}>
              <dt>{label}</dt>
              <dd className="rush-countdown-tile">
                <span className="rush-countdown-number" key={value}>{String(value).padStart(2, "0")}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="rush-countdown-note">{remaining.started ? "Winter Rush 2027 has begun." : "A new chapter starts here."}</p>
      </div>
      <div className="rush-countdown-footer">
        <time dateTime="2027-01-11">JANUARY 11, 2027</time>
        <span>EVANSTON, IL</span>
      </div>
    </section>
  );
}
