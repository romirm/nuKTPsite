import PixelNinja from "./PixelNinja";

export default function ArcadeScene() {
  return (
    <div className="arcade-scene" aria-hidden="true">
      <div className="arcade-scene-bar"><span>THE KAPPA CHAPTER</span><span>♥ ♥ ♥</span></div>
      <div className="arcade-scene-world">
        <svg className="arcade-landscape" viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" focusable="false">
          <path fill="#281245" d="M0 0h320v240H0z" />
          <path fill="#4e2a84" d="M0 90h32v-8h24v9h36V72h40v20h38V78h30v17h32V68h38v22h25v-8h25v158H0z" />
          <path fill="#6f4a9c" d="M0 113h24v-12h20v14h45V97h34v18h37v-9h28v8h30V93h32v18h39v-8h31v137H0z" />
          <g className="arcade-moon"><path fill="#e4e0ee" d="M244 22h24v4h8v8h4v24h-4v8h-8v4h-24v-4h-8v-8h-4V34h4v-8h8z" /><path fill="#b6acd1" d="M244 34h8v8h-8zM263 51h8v8h-8zM239 51h4v4h-4z" /></g>
          <g className="arcade-stars" fill="#e4e0ee"><path d="M38 28h3v3h-3zM98 48h3v3h-3zM159 21h3v3h-3zM203 51h3v3h-3zM297 90h3v3h-3zM52 75h3v3h-3z" /><path d="M124 20h3v9h-3zM121 23h9v3h-9zM285 25h3v9h-3zM282 28h9v3h-9z" /></g>
          <g fill="#342051"><path d="M18 154h50v62H18zM75 137h62v79H75zM178 146h44v70h-44zM253 130h48v86h-48z" /><path d="M91 126h30v11H91zM259 120h36v10h-36z" /></g>
          <g fill="#cab0f3"><path d="M28 163h8v8h-8zM49 163h8v8h-8zM28 186h8v8h-8zM49 186h8v8h-8zM84 149h8v8h-8zM105 149h8v8h-8zM125 149h5v8h-5zM84 176h8v8h-8zM105 176h8v8h-8zM187 157h8v8h-8zM207 181h8v8h-8zM264 143h8v8h-8zM284 143h8v8h-8zM264 166h8v8h-8zM284 189h8v8h-8z" /></g>
          <g><path fill="#211735" d="M139 216V103h6V93h9V77h6V63h6v14h6v16h9v10h6v113z" /><path fill="#a495c3" d="M150 103h26v4h-26zM147 129h32v4h-32zM153 153h6v22h-6zM168 153h6v22h-6z" /><path fill="#e4e0ee" d="M157 109h10v3h3v10h-3v3h-10v-3h-3v-10h3z" /><path fill="#4e2a84" d="M160 112h3v7h5v3h-8z" /><path fill="#130e20" d="M157 189h11v27h-11z" /></g>
          <g className="arcade-cloud" fill="#836eaa"><path d="M10 52h8v-5h18v5h9v6H10z" /><path d="M174 34h7v-5h16v5h8v6h-31z" /></g>
          <path fill="#171126" d="M0 216h320v24H0z" /><path fill="#b6acd1" d="M0 214h320v4H0z" /><path fill="#4e2a84" d="M0 218h320v6H0z" />
          <path fill="#6f4a9c" d="M0 232h14v3H0zM24 225h18v3H24zM50 234h16v3H50zM80 225h18v3H80zM112 234h16v3h-16zM144 226h18v3h-18zM180 234h18v3h-18zM211 226h18v3h-18zM244 234h18v3h-18zM279 226h18v3h-18zM310 234h10v3h-10z" />
          <g className="arcade-coin" fill="#75bfff"><path d="M67 118h7v3h3v8h-3v3h-7v-3h-3v-8h3z" /><path d="M215 83h7v3h3v8h-3v3h-7v-3h-3v-8h3z" /></g>
        </svg>
        <div className="arcade-scene-mascot"><PixelNinja /></div>
        <div className="arcade-scene-message">BUILD. CONNECT. LEVEL UP.</div>
      </div>
      <div className="arcade-scene-footer"><span>EVANSTON, IL</span><span>PLAYER 01: YOU</span></div>
    </div>
  );
}
