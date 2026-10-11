import type { ReactNode } from "react";
import { CompactNinjaArtwork } from "./PixelNinja";

type Activity = "software" | "biotech" | "quant" | "chemical" | "mechanical" | "electrical" | "neuroscience";
const ink = "#160e27", dark = "#291741", purple = "#4e2a84", mid = "#705093", lilac = "#a18aba", light = "#d8c4ff";

/** The same two-tone hood, drawn separately so each member can bend and reach. */
function MemberHead({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path fill={purple} d="M12 6h4v2h-2v3h-2z" />
    <path d="M5 1h6v1h2v2h1v4h-1v2H3V8H2V4h1V2h2z" />
    <path fill={purple} d="M5 2h6v1H5zM3 5h10v3H3z" />
    <path className="ninja-eyes" d="M5 5h1v2H5zM10 5h1v2h-1z" />
  </g>;
}

const memberPositions: Record<Activity, [number, number]> = {
  software: [16, 44], biotech: [18, 50], quant: [20, 36], chemical: [18, 44],
  mechanical: [20, 54], electrical: [18, 52], neuroscience: [18, 50],
};

function Member({ activity }: { activity: Activity }) {
  const [x, y] = memberPositions[activity];
  const standing = activity === "biotech" || activity === "neuroscience";
  return <g transform={`translate(${x} ${y}) scale(2)`} fill="#cab0f3" className={`activity-ninja activity-ninja--${activity}${standing ? " member-working" : ""}`} data-member-pose={activity}>
    {activity === "software" && <>
      {/* Cross-legged on the ground, typing on a laptop balanced on their lap. */}
      <path d="M6 9h9v9H6zM4 17h14v3h4v3H0v-3h4z" />
      <path fill={purple} d="M6 15h9v2H6zM5 20h6v2H5zM13 18h3v3h-3z" />
      <g className="activity-typing"><path d="M5 11h3v5h6v3H5zM13 11h3v4h5v3h-8z" /></g>
      <MemberHead x={4} />
    </>}
    {activity === "biotech" && <CompactNinjaArtwork />}
    {activity === "quant" && <>
      {/* Seated, one hand at the chin and the other pointing to a trading chart. */}
      <path d="M7 9h9v8H7zM7 16h7v5h-3v5H5v-2h3v-5H7zM14 17h5v6h4v3h-9z" />
      <path fill={purple} d="M7 15h9v2H7zM14 24h9v2h-9z" />
      <path d="M5 11h3V8h4v3h-2v4H5z" />
      <g className="activity-pointing-hand"><path d="M13 11h3V8h4V6h4v2h-2v3h-5v4h-4z" /></g>
      <MemberHead x={4} />
    </>}
    {activity === "chemical" && <>
      {/* Wide stance, lifting a specimen to eye level while reaching for the reactor. */}
      <path d="M4 9h9v8H4zM4 16h4v5H3v2H0v-4h4zM9 16h4v4h4v3H9zM12 11h4v2h2v3h-6z" />
      <path fill={purple} d="M4 15h9v2H4z" />
      <g className="activity-flask-hand">
        <path d="M4 11H0V3h3v2H2v4h4v4H4z" />
        <path fill={lilac} d="M-1-2h4V2h2v5h-8V2h2z" />
        <path fill={purple} d="M-1 3h4v2h-4z" />
      </g>
      <MemberHead x={1} />
    </>}
    {activity === "mechanical" && <>
      {/* One knee down, the other foot planted, wrench reaching into the robot base. */}
      <path d="M7 9h9v3h-3v3H5v-3h2zM6 14h5v2H6v2H0v-2h6zM11 14h5v2h6v2H11z" />
      <path fill={purple} d="M6 13h7v2H6zM16 16h4v2h-4z" />
      <path d="M4 11h4v4H3v-2h1z" />
      <g className="activity-wrench-hand">
        <path d="M13 10h5v2h3v2h-8z" />
        <path fill={lilac} d="M21 6h2v3h2V6h2v5h-3v5h-2v-5h-1z" />
      </g>
      <MemberHead x={4} />
    </>}
    {activity === "electrical" && <>
      {/* Low crouch, a steady hand soldering the circuit board at floor level. */}
      <path d="M8 9h8v5H6v-3h2zM3 14h7v5H0v-2h3zM10 13h6v4h4v2H10z" />
      <path fill={purple} d="M7 12h8v2H7zM12 17h6v2h-6z" />
      <path d="M6 10h3v5H3v-2h3z" />
      <g className="activity-solder-hand">
        <path d="M14 10h6v3h-4v2h-3z" />
        <path fill={lilac} d="M19 10h5v2h-5z" /><path fill={light} d="M24 11h4v1h-4z" />
      </g>
      <MemberHead x={6} />
    </>}
    {activity === "neuroscience" && <CompactNinjaArtwork />}
  </g>;
}

function Bench() {
  return <g>
    <path fill={mid} d="M50 66h88v6H50z" />
    <path fill={lilac} d="M50 66h88v2H50z" />
    <path fill={dark} d="M56 72h6v18h-6zM126 72h6v18h-6z" />
    <path fill={purple} d="M56 72h2v18h-2zM126 72h2v18h-2z" />
  </g>;
}

function Monitor({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return <g transform={`translate(${x} ${y})`}>
    <path fill={mid} d="M0 0h38v28H0zM16 28h6v6h-6zM10 34h18v4H10z" />
    <path fill={lilac} d="M0 0h38v2H0z" />
    <path fill={ink} d="M4 4h30v20H4z" />
    <g className="member-screen">{children}</g>
  </g>;
}

function Bubbles({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} fill={light}>
    <g className="member-bubbles"><path d="M0 0h4v4H0zM10 10h2v2h-2zM4 20h4v4H4z" /></g>
  </g>;
}

function Gear({ x, y, small = false }: { x: number; y: number; small?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${small ? .65 : 1})`}>
    <g className={`member-gear${small ? " member-gear-reverse" : ""}`}>
      <path fill={lilac} d="M-4-18h8v6h8v8h6v8h-6v8H4v6h-8v-6h-8V4h-6v-8h6v-8h8z" />
      <path fill={purple} d="M-8-8H8V8H-8z" /><path fill={ink} d="M-4-4h8v8h-8z" />
    </g>
  </g>;
}

/** Decorative dioramas share the scroll mascot; integer coordinates keep the art crisp. */
export default function PixelMembers({ activity, x, y }: { activity: Activity; x: number; y: number }) {
  return <g transform={`translate(${x} ${y - 96})`} className={`pixel-members pixel-members--${activity}`} data-member-activity={activity}>
    <path fill={ink} opacity=".65" d="M8 90h130v6H8z" />
    <path fill={mid} opacity=".45" d="M0 94v-6h2v4h4v-8h2v10zM144 94v-8h2v6h4v-4h2v6z" />
    {!["software", "mechanical", "electrical"].includes(activity) && <Bench />}
    {activity === "quant" && <path fill={dark} d="M20 56h4v20h28v4H24v10h-4zM44 80h4v10h-4z" />}
    {!["quant", "electrical", "neuroscience"].includes(activity) && <Member activity={activity} />}

    {activity === "software" && <>
      {/* Laptop sits on the cross-legged coder's lap rather than another desk. */}
      <g transform="translate(-16 20)">
      <path fill={mid} d="M56 38h44v26H56zM50 62h58v4H50z" />
      <path fill={lilac} d="M56 38h44v2H56zM50 62h58v2H50z" />
      <path fill={ink} d="M60 42h36v16H60z" />
      <g fill={light} className="member-code">
        <path d="M64 46h6v2h-6zM74 46h12v2H74zM66 50h14v2H66zM64 54h8v2h-8z" />
        <path className="member-cursor" d="M76 54h2v2h-2z" />
      </g>
      </g>
      <g transform="translate(-12 22)">
      <path fill={lilac} d="M116 54h12v10h-12zM128 56h4v6h-4z" />
      <path fill={ink} d="M118 54h8v2h-8zM128 58h2v2h-2z" />
      <g transform="translate(118 44)"><path className="member-steam" fill={lilac} opacity=".5" d="M0 0h2v6H0zM6-4h2v8H6z" /></g>
      </g>
    </>}

    {activity === "biotech" && <>
      {/* Stepped microscope, specimen rack and a glowing DNA helix. */}
      <path fill={mid} d="M54 62h40v4H54zM68 40h6v22h-6zM68 40v-8h8v-8h8v6h-4v8h-6v4zM78 20h14v6H78z" />
      <path fill={lilac} d="M54 60h40v2H54zM76 46h16v4H76zM84 26h4v8h-4z" />
      <path fill={light} d="M78 44h10v2H78z" />
      <path fill={mid} d="M104 36h26v30h-26z" /><path fill={ink} d="M108 38h18v24h-18z" />
      <g className="member-dna" fill={light}><path d="M110 40h4v4h8v4h-8v4h8v4h-8v4h-4v-8h8v-4h-8z" /></g>
      <path fill={lilac} d="M94 56h4v8h-4zM132 54h4v10h-4z" />
      <Bubbles x={112} y={16} />
    </>}

    {activity === "quant" && <>
      {/* Two trading displays and a keyboard. */}
      <Monitor x={52} y={26}>
        <path fill={purple} d="M6 18h26v2H6zM6 10h26v2H6z" />
        <path className="member-chart" fill={light} d="M6 20h6v-4h6v-6h6v4h6V6h2v10H22v-4h-2v6h-6v4H6z" />
      </Monitor>
      <Monitor x={96} y={26}>
        <path fill={lilac} d="M8 14h4v6H8zM16 8h4v8h-4zM24 10h4v10h-4z" />
        <path className="member-cursor" fill={light} d="M8 12h4v2H8zM16 6h4v2h-4zM24 8h4v2h-4z" />
        <path fill={mid} d="M9 10h2v12H9zM17 4h2v16h-2zM25 6h2v16h-2z" />
      </Monitor>
      <path fill={lilac} d="M56 62h32v4H56z" /><path fill={dark} d="M60 62h4v2h-4zM68 62h4v2h-4zM76 62h4v2h-4z" />
      <Member activity={activity} />
    </>}

    {activity === "chemical" && <>
      {/* Process vessel and glass reactor with connecting pipes and bubbles. */}
      <path fill={mid} d="M58 28h24v6h4v28h-4v4H58v-4h-4V34h4z" />
      <path fill={lilac} d="M58 28h24v4H58zM58 34h4v26h-4zM64 22h12v6H64z" />
      <path fill={ink} d="M68 38h12v18H68z" /><path fill={purple} d="M68 48h12v8H68z" />
      <path fill={mid} d="M82 38h14v-8h18v10h-4v-6h-10v8H82z" />
      <path fill={lilac} d="M106 38h12v14h4v4h4v10h-28V56h4v-4h4z" />
      <path fill={dark} d="M110 42h4v12h4v4h4v4h-20v-4h4v-4h4z" /><path fill={purple} d="M102 58h20v4h-20z" />
      <Bubbles x={68} y={38} />
      <g transform="translate(110 18)"><path className="member-steam" fill={lilac} opacity=".6" d="M0 0h2v8H0zM6 4h2v8H6z" /></g>
    </>}

    {activity === "mechanical" && <>
      {/* Articulated robotic arm, turning gears and an open toolbox. */}
      <g transform="translate(0 22)">
      <path fill={mid} d="M60 62h28v4H60zM70 50h8v12h-8z" />
      <g transform="translate(74 50)"><g className="member-robot-arm">
        <path fill={lilac} d="M-4 0v-22h6v-8h18v6H8v6H2V0zM18-30h6v-6h4v10h-4v6h-4z" />
        <path fill={purple} d="M-2-6h4v4h-4zM0-26h4v4H0z" />
      </g></g>
      <Gear x={110} y={44} /><Gear x={130} y={24} small />
      <path fill={purple} d="M96 58h38v8H96zM100 54h30v4h-30z" /><path fill={lilac} d="M106 60h4v4h-4zM116 60h4v4h-4z" />
      <path fill={dark} d="M50 64h88v4H50z" />
      </g>
    </>}

    {activity === "electrical" && <>
      {/* Circuit board, oscilloscope and powered test bulb. */}
      <g transform="translate(0 22)">
      <Monitor x={92} y={24}>
        <path fill={purple} d="M6 14h26v2H6zM18 6h2v16h-2z" />
        <path className="member-signal" fill="none" stroke={light} strokeWidth="2" d="M6 15h6V8h4v12h4V10h4v5h8" />
      </Monitor>
      <path fill={purple} d="M54 52h34v14H54z" /><path fill={lilac} d="M58 56h6v2h-6zM62 58h2v4h-2zM64 60h16v2H64zM80 54h2v8h-2z" />
      <path fill={ink} d="M68 54h8v6h-8z" /><path fill={mid} d="M62 46h8v6h-8zM64 40h4v6h-4z" />
      <g className="member-bulb">
        <path fill={light} d="M60 26h12v4h4v8h-4v4H60v-4h-4v-8h4z" />
        <path fill={lilac} opacity=".5" d="M50 22h4v2h-4zM78 22h4v2h-4zM64 16h4v4h-4z" />
      </g>
      <path fill={mid} d="M88 64h8v2h-8z" />
      <path fill={dark} d="M92 62h42v6H92z" />
      <path className="activity-solder-glow" fill={light} d="M70 52h2v2h-2z" />
      </g>
      <Member activity={activity} />
    </>}

    {activity === "neuroscience" && <>
      {/* Peaceful miniature operating room with a brain scan and ECG. */}
      <path fill={mid} d="M54 64h66v6H54zM58 70h6v20h-6zM110 70h6v20h-6z" />
      <path fill={lilac} d="M56 56h16v8H56z" /><path fill={purple} d="M72 56h40v8H72zM80 52h24v4H80z" />
      <path fill={light} d="M76 56h4v8h-4z" /><path fill={mid} d="M128 24h4v66h-4zM126 84h10v4h-10z" />
      <Monitor x={100} y={14}>
        <path fill={lilac} d="M10 8h4V6h8v2h4v4h2v4h-4v2H12v-2H8v-4h2z" />
        <path fill={purple} d="M16 8h2v8h-2zM10 12h4v2h-4zM20 10h4v2h-4z" />
        <path className="member-signal" fill={light} d="M6 22h6v-2h4v-2h2v4h4v-2h4v2h6v2H20v-2h-2v2h-4v-2h-2v2H6z" />
      </Monitor>
      <path fill={mid} d="M50 12h4v18h28v4H50z" /><path fill={light} opacity=".7" d="M72 34h16v4H72zM76 38h8v4h-8z" />
      <path className="member-bulb" fill={light} opacity=".08" d="M76 42h8v8h8v6H68v-6h8z" />
      <Member activity={activity} />
    </>}
  </g>;
}
