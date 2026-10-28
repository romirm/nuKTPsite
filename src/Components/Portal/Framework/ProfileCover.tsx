import PixelPattern from "./PixelPattern";
import PortalAsciiSky from "./PortalAsciiSky";
import NinjaBannerScene from "./NinjaBannerScene";
import { assignedBannerActivity } from "./majorBanner";

/** Assigned scenes stay fixed; older profiles use their original subject assignment. */
export default function ProfileCover({ major, assigned, name }: { major: unknown; assigned?: unknown; name?: string }) {
  const activity = assignedBannerActivity(major, assigned);
  const stageTop = { software: 32, data: 16, quant: 16, mechanical: 22, electrical: 22, chemical: 10, biotech: 8, neuroscience: 6, physics: 0, design: 10, reading: 18 }[activity];
  return <div className="portal-default-cover" data-banner-activity={activity} aria-hidden="true">
    <PixelPattern cover />
    <PortalAsciiSky name={name} />
    <svg className="portal-banner-ninja" viewBox={`0 ${stageTop} 156 ${100 - stageTop}`} shapeRendering="crispEdges" focusable="false">
      <NinjaBannerScene activity={activity} />
    </svg>
  </div>;
}
