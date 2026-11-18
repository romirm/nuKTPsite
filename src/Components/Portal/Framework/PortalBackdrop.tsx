import PixelPattern from "./PixelPattern";
import PortalAsciiSky from "./PortalAsciiSky";

/** Carry the public site's palette into decorative portal backgrounds. */
export default function PortalBackdrop({ profile = false, name }: { profile?: boolean; name?: string }) {
  return (
    <div className={`portal-backdrop${profile ? " portal-backdrop--profile" : ""}`} aria-hidden="true">
      <div className="portal-sky-light" />
      <div className="portal-sky-grain" />
      {profile && <>
        <PixelPattern />
        <PortalAsciiSky name={name} />
      </>}
    </div>
  );
}
