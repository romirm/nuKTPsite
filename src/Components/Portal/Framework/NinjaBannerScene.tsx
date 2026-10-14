import PixelMembers from "../../Landing/PixelMembers";
import { CompactNinjaArtwork } from "../../Landing/PixelNinja";
import type { MajorBannerActivity } from "./majorBanner";

const ink = "#160e27", purple = "#4e2a84", mid = "#705093", lilac = "#a18aba", light = "#d8c4ff";

/** Portal-only activities extend the landing page's established ninja artwork. */
export default function NinjaBannerScene({ activity }: { activity: MajorBannerActivity }) {
  if (activity === "data") return <PixelMembers activity="quant" chartStyle="data" x={0} y={96} />;
  if (activity !== "physics" && activity !== "design" && activity !== "reading") {
    return <PixelMembers activity={activity} x={0} y={96} />;
  }
  return <g data-member-activity={activity}>
    <path fill={ink} opacity=".5" d="M8 90h136v6H8z"/>
    <g className="portal-banner-researcher" transform="translate(20 48) scale(2)"><CompactNinjaArtwork /></g>
    {activity === "physics" && <>

      <path fill={mid} d="M94 52h6v32h-6zM94 70h-6v8h-6v8h-6v4h-6v-4h6v-8h6v-8h6v-8h6zM100 62h6v8h6v8h6v8h6v4h-8v-8h-6v-8h-6v-8h-4z"/>
      <g transform="translate(96 46) rotate(-28)">
        <path fill={mid} d="M-34-10h62v18h-62zM-40-6h6V4h-6z"/>
        <path fill={light} d="M-34-10h62v3h-62zM26-14h6v26h-6z"/>
        <path fill={purple} d="M-30 4h56v4h-56z"/>
      </g>
      <g className="member-bulb" fill={light} opacity=".65">
        <path d="M122 8h4v4h4v4h-4v4h-4v-4h-4v-4h4zM78 14h3v3h-3zM144 30h3v3h-3z"/>
      </g>
    </>}
    {activity === "design" && <>

      <path fill={mid} d="M78 28h50v40H78zM98 18h6v10h-6zM98 68h6v22h-6zM86 68h6v8h-6v14h-6V76h6zM116 68h6v8h6v14h-6V76h-6z"/>
      <path fill={ink} d="M82 32h42v32H82z"/>
      <g className="portal-banner-design" fill={light}>
        <path d="M88 38h12v12H88zM110 50h8v8h-8z"/>
        <path fill={lilac} d="M104 38h14v6h-14zM88 54h14v4H88z"/>
        <path fill="#c499cf" d="M104 48h6v6h-6z"/>
      </g>
      <path fill={lilac} d="M48 68h18v-4h4v-8h4v12h-6v4H48z"/>
      <path fill={light} d="M70 52h4v6h-4z"/>
      <path fill={mid} d="M132 72h16v12h-16z"/>
      <path fill={light} d="M136 68h2v8h-2zM142 66h2v10h-2z"/>
    </>}
    {activity === "reading" && <>

      <path fill={mid} d="M58 68h82v6H58zM64 74h6v16h-6zM128 74h6v16h-6z"/>
      <path fill={lilac} d="M58 68h82v2H58z"/>
      <path fill={mid} d="M64 40h22v4h4v-4h22v24H90v4h-4v-4H64z"/>
      <path fill={light} d="M68 44h16v4h2v14H68zM92 44h16v18H90V48h2z"/>
      <g className="member-chart" fill={purple}><path d="M72 48h8v2h-8zM72 54h10v2H72zM94 48h10v2H94zM94 54h8v2h-8z"/></g>
      <path fill={mid} d="M126 34h4v30h-4zM120 64h16v4h-16z"/>
      <path className="member-bulb" fill={light} d="M120 26h16v4h4v6h-24v-6h4z"/>
    </>}
  </g>;
}
