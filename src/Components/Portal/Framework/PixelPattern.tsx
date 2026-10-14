import { useId } from "react";

/** Abstract stepped ribbons and pixels, shared by the profile canvas and cover. */
export default function PixelPattern({ cover = false }: { cover?: boolean }) {
  const id = useId().replace(/:/g, "");
  const contour = "M-48 632H96V608H192V584H288V560H384V536H480V512H576V488H672V464H768V440H864V416H960V392H1056V368H1152V344H1248";
  return (
    <svg className={`portal-pixel-pattern${cover ? " portal-pixel-pattern--cover" : ""}`}
      viewBox={cover ? "0 100 1200 280" : "0 0 1200 720"}
      preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id={`pixel-wash-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4e2a84"/><stop offset=".55" stopColor="#473065"/><stop offset="1" stopColor="#211235"/>
        </linearGradient>
        <pattern id={`pixel-grid-${id}`} width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M0 0h2v2H0z" fill="#d8c4ff" opacity=".12"/>
        </pattern>
      </defs>
      <path fill={`url(#pixel-wash-${id})`} d="M0 0h1200v720H0z"/>
      <path fill={`url(#pixel-grid-${id})`} d="M0 0h1200v720H0z"/>
      <g fill="#a18aba">
        <path opacity=".12" d="M768 0h432v432h-48v-48h-48v-48h-48v-48h-48v-48h-48v-48h-48v-48h-48V96h-48V48h-48z"/>
        <path opacity=".09" d="M0 360h48v48h48v48h48v48h48v48h48v48h48v48h48v72H0z"/>
      </g>
      <path d={`${contour}V720H-48z`} fill="#705093" opacity=".23"/>
      <g fill="none" stroke="#c4a9e3" strokeWidth="2" opacity=".22">
        <path d={contour}/><path d={contour} transform="translate(0 48)"/>
        <path d={contour} transform="translate(0 96)"/>
      </g>
      <g className="portal-pixel-shimmer" fill="#d8c4ff">
        <path opacity=".3" d="M72 132h12v12H72zM1080 84h12v12h-12zM1014 468h8v8h-8zM270 642h10v10h-10z"/>
        <path opacity=".15" d="M96 156h24v24H96zM1032 108h24v24h-24zM1056 492h16v16h-16zM294 618h18v18h-18z"/>
      </g>
      <g fill="none" stroke="#b493d7" strokeWidth="2" opacity=".22">
        <path d="M24 216h48v24h48v24h48M1104 192h-48v24h-48v24h-48"/>
        <path d="M744 624h48v-24h48v-24h48"/>
      </g>
    </svg>
  );
}
