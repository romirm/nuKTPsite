/** A tiny, locally drawn mascot. Integer coordinates keep every pixel crisp. */
export default function PixelNinja({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  if (compact) return (
    <svg className={`pixel-ninja pixel-ninja-compact ${className}`} viewBox="0 0 16 20" fill="#cab0f3" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path className="ninja-scarf" d="M12 6h4v2h-2v3h-2z" fill="#4e2a84" />
      <path className="ninja-leg-left" d="M4 13h4v6H2v-2h2z" />
      <path className="ninja-leg-right" d="M9 13h4v4h2v2H9z" />
      <path className="ninja-arm-left" d="M2 10h3v5H1v-3h1z" />
      <path className="ninja-arm-right" d="M12 10h3v2h1v3h-4z" />
      <path d="M5 1h6v1h2v2h1v4h-1v2h-1v5H4v-5H3V8H2V4h1V2h2z" />
      <path d="M5 2h6v1H5zM3 5h10v3H3zM4 12h8v2H4z" fill="#4e2a84" />
      <path className="ninja-eyes" d="M5 5h1v2H5zM10 5h1v2h-1z" />
    </svg>
  );
  return (
    <svg className={`pixel-ninja ${className}`} viewBox="0 0 32 40" fill="none" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <g className="ninja-scarf" fill="#b6acd1">
        <path d="M22 12h8v3h-4v3h-5z" />
        <path d="M25 15h5v4h-3v3h-3z" fill="#836eaa" />
      </g>
      <g className="ninja-leg ninja-leg-left">
        <path d="M9 28h7v8h-2v3H6v-4h3z" fill="#171126" />
        <path d="M9 29h3v6H9z" fill="#4e2a84" />
      </g>
      <g className="ninja-leg ninja-leg-right">
        <path d="M17 28h7v7h3v4H17z" fill="#171126" />
        <path d="M18 29h3v5h-3z" fill="#4e2a84" />
      </g>
      <g className="ninja-body">
        <path d="M9 18h14v3h3v10H6V21h3z" fill="#171126" />
        <path d="M10 19h4v8h-4zM20 19h3v8h-3z" fill="#4e2a84" />
        <path d="M7 27h18v3H7z" fill="#b6acd1" />
        <path d="M14 26h5v5h-5z" fill="#e4e0ee" />
        <path d="M14 21h2v2h-2zM16 23h2v2h-2zM18 21h2v2h-2z" fill="#75bfff" />
        <g className="ninja-arm ninja-arm-left">
          <path d="M5 20h5v10H3v-6h2z" fill="#211735" />
          <path d="M3 28h5v4H3z" fill="#b6acd1" />
        </g>
        <g className="ninja-arm ninja-arm-right">
          <path d="M23 20h5v4h2v6h-7z" fill="#211735" />
          <path d="M25 28h5v4h-5z" fill="#b6acd1" />
        </g>
        <path d="M10 2h12v2h3v3h2v11h-3v3H9v-3H6V7h2V4h2z" fill="#171126" />
        <path d="M10 4h11v2H10zM8 7h3v5H8z" fill="#40305b" />
        <path d="M7 10h19v4H7z" fill="#4e2a84" />
        <path d="M9 11h15v6H9z" fill="#e4c5a0" />
        <g className="ninja-eyes" fill="#171126">
          <path d="M12 12h2v3h-2zM20 12h2v3h-2z" />
        </g>
        <path d="M9 16h15v4H9z" fill="#211735" />
        <path d="M7 10h3v3H7zM23 10h3v3h-3z" fill="#cab0f3" />
      </g>
    </svg>
  );
}
