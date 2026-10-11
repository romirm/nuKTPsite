import PixelMembers from "./PixelMembers";
import StadiumConstructionCrew, { TelescopeOperator } from "./PixelCampusCrew";

type World = "lake" | "campus" | "grove" | "forest" | "observatory" | "city" | "stadium" | "terminal" | "cavern" | "harbor";

const ink = "#160e27";
const deep = "#291741";
const purple = "#4e2a84";
const mid = "#705093";
const lilac = "#a18aba";
const light = "#d8c4ff";

function Pine({ x, y, scale = 1, color = deep }: { x: number; y: number; scale?: number; color?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path fill={ink} d="M-8 0h16v-110h-16z" />
    <path fill={color} d="M-16-204h32v28h20v28h20v28h20v28h20v32H-96v-32h20v-28h20v-28h20v-28h20z" />
    <path fill={mid} opacity=".22" d="M-16-204h16v28h-20v28h-20v28h-20v28h-20v24h-16v-24h20v-28h20v-28h20v-28h20z" />
  </g>;
}

function Boughs() {
  return <g fill={ink}>
    <path d="M0 0h164v32h-32v32h-28v36H76v36H44v40H0zM1440 0h-164v32h32v32h28v36h28v36h32v40h44z" />
    <path opacity=".65" d="M0 160h40v100h24v112h24v72H64v-40H40v-96H0zM1440 124h-40v96h-24v120h-24v80h24v-48h24v-92h40z" />
  </g>;
}

function Canopy() {
  const leaf = "M0 0h16v-8h24v8h16v16H40v8H16v-8H0z";
  return <svg className="pixel-canopy" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <g fill={ink}>
      <path d="M0 0h172v12h-40v16h-36v28H72v32H48v44H24v60H0zM1440 0h-172v12h40v16h36v28h24v32h24v44h24v60h24z" />
    </g>
    <g fill={deep}>
      <path d="M0 12h72v12h24v16H72v20H48v28H24v28H0zM1440 12h-72v12h-24v16h24v20h24v28h24v28h24z" />
    </g>
    <g fill={purple} opacity=".7">
      <path d={leaf} transform="translate(52 22)" /><path d={leaf} transform="translate(12 64)" /><path d={leaf} transform="translate(118 4)" />
      <path d={leaf} transform="translate(1330 22)" /><path d={leaf} transform="translate(1374 70)" /><path d={leaf} transform="translate(1264 4)" />
    </g>
    <g fill={mid} opacity=".55">
      <path d="M62 16h16v4H62zM24 60h16v4H24zM130 0h16v4h-16zM1340 16h16v4h-16zM1386 66h16v4h-16z" />
    </g>
    <g fill={mid} opacity=".35">
      <path d="M36 96h4v28h-4zM32 116h12v12H32zM24 136h4v24h-4zM20 152h12v12H20zM1400 94h4v36h-4zM1396 120h12v12h-12zM1412 140h4v28h-4zM1408 160h12v12h-12z" />
    </g>
  </svg>;
}

function Stars() {
  return <g fill={light} className="world-stars">
    {Array.from({ length: 38 }, (_, i) => {
      const x = 24 + ((i * 173) % 1380), y = 36 + ((i * 97) % 670);
      return <rect key={i} x={x} y={y} width={i % 7 === 0 ? 4 : 2} height={i % 7 === 0 ? 4 : 2} opacity={i % 3 === 0 ? .6 : .2} />;
    })}
    <path opacity=".7" d="M846 122h4v8h8v4h-8v8h-4v-8h-8v-4h8zM1200 330h4v6h6v4h-6v6h-4v-6h-6v-4h6z" />
  </g>;
}

function Moon() {
  return <g transform="translate(1070 130)" className="world-moon">
    <path fill={mid} opacity=".12" d="M-60-20h120v40H-60zM-40-40h80v80h-80z" />
    <path fill={lilac} d="M-24-36h48v12h12v48H24v12h-48V24h-12v-48h12z" />
    <path fill={light} d="M-24-36h36v12h-24v12h-12v36h-12v-48h12z" />
    <path fill={mid} opacity=".4" d="M8-12h12V0H8zM-8 16H4v8H-8z" />
  </g>;
}

function Chicago({ lightScene = false }: { lightScene?: boolean }) {
  return <g fill={lightScene ? "#9b80b2" : deep}>
    <path opacity=".65" d="M0 900V724h64v-60h60v236zM128 900V652h56v-28h48v276zM248 900V748h64v-52h72v204zM1096 900V672h64v-56h40v284zM1232 900V732h80v168zM1340 900V640h100v260z" />
    <path d="M384 900V630h32V580h28v-92h8v-40h8v40h32v-36h8v36h8v92h28v96h24v224zM588 900V684h72v-32h20v248zM712 900V604h28v-52h48v52h28v296zM864 900V540h8v-80h8v80h64v-80h8v80h8v360zM1004 900V652h60v248z" />
    <g fill={lightScene ? "#e9dcf4" : lilac} opacity=".35" className="world-windows">
      {Array.from({ length: 36 }, (_, i) => <rect key={i} x={i < 18 ? 428 + (i % 3) * 20 : 884 + (i % 3) * 20} y={612 + Math.floor((i % 18) / 3) * 36} width="6" height="12" />)}
    </g>
  </g>;
}

function Library() {
  return <g transform="translate(130 560)" opacity=".85">
    <path fill={deep} d="M0 336V140h32V72h16V48h12V24h12v24h16v24h16v68h28v60h240v-60h28V72h16V48h16V24h12v24h12v24h16v68h32v196z" />
    <path fill={mid} d="M48 72h40v12H48zM400 72h44v12h-44zM132 200h240v12H132zM0 324h504v12H0z" />
    <path fill={ink} d="M44 164h52v128H44zM404 164h52v128h-52zM140 236h36v60h-36zM204 236h36v60h-36zM268 236h36v60h-36zM332 236h32v60h-32z" />
    <path fill={lilac} opacity=".35" d="M60 168h8v56h-8zM420 168h8v56h-8zM148 244h8v36h-8zM276 244h8v36h-8z" />
    <path fill={mid} d="M188 336v-16h20v-16h88v16h20v16z" />
  </g>;
}

function Rock() {
  return <g transform="translate(1090 882)">
    <path fill={ink} d="M-116 8h224v24h-224z" />
    <path fill={purple} d="M-100 8v-56h20v-32h36v-16h72v12h44v20h24v72z" />
    <path fill={mid} d="M-80-48v-32h36v-16h72v12h44v20H20v-12h-56v16z" />
    <path fill={deep} d="M76-64h20V8H76zM-80-4H76V8H-80z" />
    {/* Painted letters remain decorative, just like the physical campus Rock. */}
    <text x="-4" y="-24" fill={light} textAnchor="middle" fontFamily="KTP Arcade, monospace" fontSize="24">KTP</text>
  </g>;
}

function Lake() {
  return <g>
    <path fill="#382459" d="M-200 822h1840v178H-200z" />
    <path fill={mid} opacity=".55" d="M-200 822h1840v6H-200z" />
    <g fill={lilac} opacity=".35" className="world-ripples">
      <path d="M112 850h96v4h-96zM380 878h120v4H380zM670 844h60v4h-60zM880 898h144v4H880zM1108 856h80v4h-80zM1260 918h144v4h-144zM600 950h132v4H600zM128 936h60v4h-60z" />
    </g>
    <g transform="translate(1190 862)"><g className="world-boat">
      <path fill={mid} d="M-44 0h96v8H40v8h-64V8h-20z" />
      <path fill={lilac} d="M0-72h4V0H0zM-4-64v52h-40v-8h8v-12h12v-12h12v-20z" />
      <path fill={light} opacity=".55" d="M8-56v44h28v-8h-8v-12H16v-24z" />
    </g></g>
  </g>;
}

function Terrain({ forest = false }: { forest?: boolean }) {
  return <g>
    <path fill={deep} d="M0 796h104v28h112v24h120v40h120v32h264v-28h160v-44h152v-36h192v-28h216v216H0z" />
    <path fill={mid} opacity=".18" d="M0 796h104v8H0zM104 824h112v8H104zM1032 812h192v8h-192zM1224 784h216v8h-216z" />
    <path fill="var(--world-floor, #211235)" d="M0 904h92v16h132v24h120v16h192v20h384v-12h204v-20h140v-28h176v80H0z" />
    <path fill={mid} opacity=".2" d="M504 980v-16h80v-12h96v-12h144v-12h116v-8h160v12H948v8H832v12H688v12H592v16z" />
    {forest && <>
      <Pine x={56} y={940} scale={1.8} color={ink} />
      <Pine x={210} y={950} scale={1.15} />
      <Pine x={1376} y={934} scale={1.8} color={ink} />
      <Pine x={1216} y={932} scale={1.15} />
    </>}
    <g fill={lilac} opacity=".55" className="world-fireflies">
      <path d="M154 720h4v4h-4zM286 854h4v4h-4zM1186 738h4v4h-4zM1262 862h4v4h-4zM938 916h4v4h-4z" />
    </g>
    <g fill={mid} opacity=".6">
      <path d="M324 932v-12h4v8h8v-16h4v20zM1100 938v-8h4v4h12v-12h4v16zM100 968v-12h4v8h12v-16h4v20z" />
    </g>
  </g>;
}

function Telescope() {
  return <g className="world-telescope"><g transform="translate(1120 806)">
    <path className="world-beam" fill={light} opacity=".04" d="M56-36l-448-352h-72v-24h-80v-24h-48v24h48v48h56v40h64v40h72v40h72v40h72v32h56z" />
    <path fill={ink} d="M-92 116h184v20h-184z" />
    <path fill={mid} d="M-8 32H8v84H-8zM-8 80h-12v12h-12v12h-12v12h-12v12h-16v-12h12v-12h12V92h12V80h12V68h12zM8 68h12v12h12v12h12v12h12v12h12v12H52v-12H40v-12H28V92H16V80H8z" />
    <g transform="rotate(-30)">
      <path fill={purple} d="M-100-30H52v48h-152z" />
      <path fill={lilac} d="M-100-30H52v8h-152zM44-38h20v64H44z" />
      <path fill={deep} d="M-96 8H44v10h-140z" />
      <path fill={light} d="M64-28h8v42h-8z" />
      <path fill={mid} d="M-120-20h20v28h-20z" />
    </g>
    <TelescopeOperator />
  </g></g>;
}

function Stadium() {
  return <g transform="translate(720 844)">
    <path fill={deep} d="M-352 84V-28h24v-40h48v-28h72v-12h416v12h72v28h48v40h24V84z" />
    <path fill={mid} d="M-352-28v-20h24v-28h48v-28h72v-12h416v12h72v28h48v28h24v20z" />
    <path fill={lilac} opacity=".5" d="M-328-76h48v-28h72v-12h416v12h72v28h48v12h-60v-24h-72v-12h-392v12h-72v24h-60z" />
    <path fill={ink} d="M-244-36v-24h48v-20h392v20h48v24z" />
    <path fill={purple} d="M-208-36v-12h40v-16h336v16h40v12z" />
    <path fill={mid} d="M-352-8h704v12h-704zM-328 76h656v12h-656z" />
    <g fill={ink}>{Array.from({ length: 17 }, (_, i) => <rect key={i} x={-324 + i * 40} y="14" width="24" height="60" />)}</g>
    <path fill={purple} d="M-116-16h232v48h-232z" />
    <text x="0" y="18" fill={light} fontFamily="KTP Pixel, monospace" fontSize="24" textAnchor="middle" letterSpacing="3">RYAN FIELD</text>
    <path fill={mid} d="M-352 84h704v12h-704zM-324 96h648v12h-648z" />
    <path fill={lilac} opacity=".3" d="M-280 120h560v4h-560zM-224 136h448v4h-448z" />
  </g>;
}

function Gateway() {
  return <g transform="translate(1170 822)">
    <path fill={ink} d="M-128 108V-64h24v-32h24v-24H80v24h24v32h24v172z" />
    <path fill={mid} d="M-112 108V-64h24v-24h24v-16H64v16h24v24h24v172H96V-56H72v-24H-72v24h-24v164z" />
    <path fill={purple} d="M-80 108V-40h24v-24H56v24h24v148z" />
    <path fill={lilac} opacity=".65" d="M-64-32h128v4H-64zM-64-8H64v4H-64zM-64 16H64v4H-64zM-64 40H64v4H-64zM-64 64H64v4H-64z" />
    <path fill={light} opacity=".5" d="M-88-56h8v132h-8zM80-56h8v132h-8z" className="world-windows" />
  </g>;
}

function Cavern() {
  return <g>
    <Boughs />
    <g fill={deep}>
      <path d="M0 140h64v68h32v80h24v44H88v-32H64v-84H0zM1440 120h-72v80h-32v68h-32v64h32v-28h32v-64h72z" />
      <path d="M0 770h60v-64h24v-36h24v36h24v64h44v230H0zM1440 744h-64v-84h-24v-44h-24v44h-24v84h-56v256h192z" />
    </g>
    <g fill={purple}>
      <path d="M48 878v-76h16v-32h16v32h16v76zM120 916v-48h12v-24h12v24h12v48zM1304 902v-88h16v-40h16v40h16v88z" />
    </g>
    <g fill={lilac} opacity=".5" className="world-windows">
      <path d="M64 802h8v60h-8zM132 868h4v40h-4zM1320 814h8v72h-8z" />
    </g>
  </g>;
}

export default function PixelWorld({ scene }: { scene: World }) {
  const forest = ["grove", "forest", "observatory", "campus"].includes(scene);
  return <>
    {forest && <Canopy />}
    <svg className={`pixel-world pixel-world--${scene}`} data-world={scene} viewBox="0 0 1440 1000" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <g className="world-far"><Stars />{["lake", "observatory", "harbor"].includes(scene) && <Moon />}
      <g fill={mid} opacity=".18" className="world-clouds"><path d="M64 224h64v-16h128v16h64v12H64zM976 284h48v-16h96v16h80v12H976z" /></g>
      {scene === "lake" || scene === "city" || scene === "harbor" ? <Chicago lightScene={scene === "city"} /> : null}
      {forest && <g opacity=".4"><Pine x={64} y={872} scale={2.6} color={purple} /><Pine x={274} y={862} scale={1.6} color={mid} /><Pine x={1376} y={866} scale={2.4} color={purple} /><Pine x={1200} y={860} scale={1.6} color={mid} /></g>}
    </g>
    <g className="world-near">
      {(scene === "lake" || scene === "harbor") && <Lake />}
      <Terrain forest={forest} />
      {scene === "campus" && <Library />}
      {scene === "grove" && <Rock />}
      {scene === "observatory" && <Telescope />}
      {scene === "stadium" && <Stadium />}
      {scene === "stadium" && <StadiumConstructionCrew />}
      {scene === "terminal" && <Gateway />}
      {scene === "cavern" && <Cavern />}
      {scene === "campus" && <PixelMembers activity="biotech" x={780} y={952} />}
      {scene === "grove" && <PixelMembers activity="chemical" x={600} y={964} />}
      {scene === "forest" && <>
        <PixelMembers activity="mechanical" x={560} y={966} />
        <PixelMembers activity="electrical" x={800} y={968} />
      </>}
      {scene === "observatory" && <PixelMembers activity="neuroscience" x={730} y={966} />}
      {scene === "city" && <PixelMembers activity="quant" x={620} y={946} />}
      {scene === "terminal" && <PixelMembers activity="software" x={620} y={956} />}
    </g>
  </svg>
  </>;
}
