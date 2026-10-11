import { CSSProperties } from "react";

/** Small decorative flybys use the empty space above and below section content. */
export default function ArcadeSky({ phase = 0 }: { phase?: number }) {
  const timing = { "--flyby-offset": `${phase * -3}s` } as CSSProperties;
  return (
    <>
      <svg className="arcade-flight arcade-flight--scout" style={timing} viewBox="0 0 32 16" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
        <g className="arcade-thruster" fill="#a58cc9">
          <path opacity=".35" d="M0 7h8v2H0z" />
          <path d="M6 6h6v4H6z" />
        </g>
        <path fill="#71519e" d="M10 5h10V3h4v4h4v2h-4v4h-4v-2H10z" />
        <path fill="#d8c4ff" d="M12 6h12v1h6v2h-6v1H12z" />
        <path fill="#4e2a84" d="M18 6h4v3h-4z" />
        <path fill="#a58cc9" d="M12 4h8v2h-8zM12 10h8v2h-8z" />
      </svg>
      <svg className="arcade-flight arcade-flight--saucer" style={timing} viewBox="0 0 32 16" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
        <path fill="#71519e" d="M10 4h12v2h4v3H6V6h4z" />
        <path fill="#d8c4ff" d="M12 4h8v2h-8zM4 8h24v2H4zM8 10h16v2H8z" />
        <path fill="#4e2a84" d="M10 8h2v2h-2zM16 8h2v2h-2zM22 8h2v2h-2z" />
        <g className="arcade-thruster" fill="#a58cc9" opacity=".4">
          <path d="M10 13h2v2h-2zM16 13h2v2h-2zM22 13h2v2h-2z" />
        </g>
      </svg>
      <svg className="arcade-flight arcade-flight--meteor" style={timing} viewBox="0 0 32 16" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
        <path fill="#71519e" opacity=".5" d="M0 0h4v2h4v2h4v2h4v2h4v2h4v2h-4v-2h-4V8h-4V6H8V4H4V2H0z" />
        <path fill="#a58cc9" d="M16 8h4v2h4v2h-4v-2h-4z" />
        <path fill="#d8c4ff" d="M24 10h4v2h2v2h-2v2h-4v-2h-2v-2h2z" />
      </svg>
    </>
  );
}
