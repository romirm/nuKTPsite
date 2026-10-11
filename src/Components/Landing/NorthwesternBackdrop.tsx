type Scene = "lakefront" | "rock" | "stadium";

const colors = {
  shadow: "#211235",
  dark: "#352052",
  purple: "#4e2a84",
  mid: "#71519e",
  lavender: "#a58cc9",
  light: "#d8c4ff",
};

function Tree({ x, y, small = false }: { x: number; y: number; small?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${small ? 0.7 : 1})`}>
      <path fill={colors.dark} d="M-4 0h8v-34h-8z" />
      <path fill={colors.purple} d="M-24-24v-20h8v-16h32v16h8v20z" />
      <path fill={colors.mid} d="M-16-44v-8H8v8zM-24-36h8v12h-8z" />
    </g>
  );
}

function Sky() {
  return (
    <>
      <g fill={colors.lavender} opacity=".35" className="campus-stars">
        <path d="M296 28h4v4h-4zM760 34h4v4h-4zM520 18h4v4h-4zM186 66h4v4h-4zM832 82h4v4h-4z" />
      </g>
      <g fill={colors.lavender} opacity=".12" className="campus-cloud">
        <path d="M92 62h16v-8h40v8h24v8H92zM712 54h24v-8h32v8h24v8h-80z" />
      </g>
    </>
  );
}

function Lakefront() {
  return (
    <>
      <Sky />
      {/* A stepped moon and the Willis / Hancock silhouettes across the lake. */}
      <path fill={colors.lavender} opacity=".35" d="M252 44h24v8h8v24h-8v8h-24v-8h-8V52h8z" />
      <g fill={colors.mid} opacity=".4">
        <path d="M280 168v-28h28v-16h28v44zM344 168V96h24v-12h12v84zM654 168v-44h24v-16h28v60zM732 168v-60h24v-12h12v72zM788 168v-28h32v28z" />
      </g>
      <g fill={colors.dark}>
        <path d="M308 168v-40h28v40zM346 168v-52h30v52zM392 168V84h12V60h12V40h4V20h4v20h16V24h4v20h4v40h12v20h12v64zM478 168v-48h32v-12h12v60zM532 168V96h12V72h24v24h12v72zM592 168V68h4V42h4v26h28V42h4v26h4v100zM650 168V96h36v72zM696 168v-40h28v40zM740 168v-32h32v32z" />
      </g>
      <g fill={colors.lavender} opacity=".4" className="campus-windows">
        {[[408, 92], [436, 116], [420, 140], [492, 136], [552, 112], [608, 84], [620, 132], [664, 116], [752, 148]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="4" height="8" />
        ))}
      </g>
      <path fill={colors.dark} opacity=".6" d="M-960 168h2880v72H-960z" />
      <path fill={colors.mid} opacity=".3" d="M-960 168h2880v4H-960z" />
      <g fill={colors.lavender} opacity=".25" className="campus-water">
        <path d="M288 188h56v4h-56zM408 178h32v4h-32zM476 204h72v4h-72zM592 184h44v4h-44zM712 212h80v4h-80zM840 186h48v4h-48zM352 224h28v4h-28zM616 228h40v4h-40z" />
      </g>
      <g fill={colors.purple} opacity=".4">
        <path d="M396 176h68v4h-68zM404 188h52v4h-52zM596 176h40v4h-40zM600 196h32v4h-32z" />
      </g>
      {/* The campus shoreline stays in the foreground. */}
      <path fill={colors.dark} d="M0 190h116v8h40v12h44v8h48v22H0z" />
      <path fill={colors.mid} opacity=".5" d="M0 190h116v8h40v8h-8v-4h-40v-8H0z" />
      <Tree x={64} y={196} />
      <Tree x={112} y={200} small />
      <path fill={colors.lavender} opacity=".4" d="M184 190h4v24h-4zM180 186h12v4h-12zM180 182h12v4h-12z" />
    </>
  );
}

function Rock() {
  return (
    <>
      <Sky />
      {/* A quiet Gothic campus outline behind the painted Rock. */}
      <g fill={colors.purple} opacity=".3">
        <path d="M252 202v-52h20v-8h8v-36h8v-8h8v8h8v36h8v8h20v52zM628 202v-52h20v-8h8v-36h8v-8h8v8h8v36h8v8h20v52zM324 202v-36h12v-8h56v8h12v36zM568 202v-36h12v-8h32v8h12v36z" />
      </g>
      <path fill={colors.dark} d="M-960 216h2880v24H-960z" />
      <path fill={colors.mid} opacity=".25" d="M-960 214h2880v4H-960z" />
      <Tree x={292} y={216} />
      <Tree x={660} y={216} />
      <Tree x={724} y={216} small />
      <path fill={colors.shadow} d="M392 212h176v12H392z" />
      <path fill={colors.purple} d="M404 208v-36h12v-20h20v-12h64v8h32v16h16v44z" />
      <path fill={colors.mid} d="M416 164v-12h20v-12h64v8h32v16h-28v-8h-64v8z" />
      <path fill={colors.dark} d="M532 164h16v44h-16zM416 196h116v12H416z" />
      <path fill={colors.lavender} opacity=".5" d="M424 174h4v4h-4zM512 188h8v4h-8zM428 192h12v4h-12z" />
      <text x="480" y="190" fill={colors.light} textAnchor="middle" fontSize="17" fontFamily="KTP Arcade, monospace">KTP</text>
      <g fill={colors.mid} opacity=".5">
        <path d="M356 212v-8h4v8h8v-4h4v8h-16zM588 216v-12h4v8h8v-8h4v12zM776 216v-8h4v4h8v-8h4v12z" />
      </g>
      <g fill={colors.lavender} opacity=".4" className="campus-fireflies">
        <path d="M376 164h4v4h-4zM580 180h4v4h-4zM624 138h4v4h-4z" />
      </g>
      <path fill={colors.mid} opacity=".3" d="M432 232h96v4h-96z" />
    </>
  );
}

function Stadium() {
  return (
    <>
      <Sky />
      <path fill={colors.dark} d="M-960 220h2880v20H-960z" />
      <Tree x={188} y={220} />
      <Tree x={760} y={220} />
      <Tree x={814} y={220} small />
      {/* Pixel interpretation of New Ryan Field's canopy and open seating bowl.
          Reference: Northwestern's November 2024 stadium renderings. */}
      <path fill={colors.purple} d="M248 200v-68h16v-24h32V92h48v-8h272v8h48v16h32v24h16v68z" />
      <path fill={colors.mid} d="M248 128v-16h16V96h32V80h48v-8h272v8h48v16h32v16h16v16H248z" />
      <path fill={colors.lavender} opacity=".5" d="M264 104v-8h32V80h48v-8h272v8h48v16h32v8h-40V92h-48v-8H352v8h-48v12z" />
      <path fill={colors.shadow} d="M320 124v-16h32V96h256v12h32v16z" />
      <path fill={colors.purple} d="M336 124v-8h32v-8h224v8h32v8z" />
      <path fill={colors.lavender} opacity=".35" d="M368 116h224v4H368zM344 124h272v4H344z" />
      <path fill={colors.mid} d="M248 144h464v8H248zM264 192h432v8H264z" />
      <g fill={colors.shadow}>
        {Array.from({ length: 15 }, (_, i) => <rect key={i} x={268 + i * 28} y="156" width="16" height="36" />)}
      </g>
      <g fill={colors.lavender} opacity=".3" className="campus-windows">
        <path d="M276 156h4v28h-4zM360 156h4v28h-4zM584 156h4v28h-4zM668 156h4v28h-4z" />
      </g>
      <path fill={colors.purple} d="M400 136h160v36H400z" />
      <text x="480" y="160" fill={colors.light} textAnchor="middle" fontSize="18" fontFamily="KTP Pixel, monospace" letterSpacing="2">RYAN FIELD</text>
      <path fill={colors.mid} d="M248 200h464v8H248zM264 208h432v8H264z" />
      <path fill={colors.lavender} opacity=".25" d="M328 224h304v4H328zM368 236h224v4H368z" />
      <g fill={colors.mid}>
        <path d="M220 216h4v-72h-4zM736 216h4v-72h-4z" />
      </g>
      <g fill={colors.lavender} opacity=".65" className="campus-flags">
        <path d="M224 144h24v16h-24zM740 144h24v16h-24z" />
      </g>
      <path fill={colors.purple} d="M228 148h4v8h-4zM236 148h4v8h-4zM232 152h4v4h-4zM744 148h4v8h-4zM752 148h4v8h-4zM748 152h4v4h-4z" />
    </>
  );
}

/** Decorative SVG keeps the scenery crisp at every size and needs no animation JS. */
export default function NorthwesternBackdrop({ scene }: { scene: Scene }) {
  return (
    <svg
      className={`northwestern-backdrop northwestern-backdrop--${scene}`}
      viewBox="0 0 960 240"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      {scene === "lakefront" ? <Lakefront /> : scene === "rock" ? <Rock /> : <Stadium />}
    </svg>
  );
}
