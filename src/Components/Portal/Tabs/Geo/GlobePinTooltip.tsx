import { useLayoutEffect, useRef, useState } from "react";
import { HometownPin } from "./globePins";

export default function GlobePinTooltip({ id, anchor, pins, onPointerEnter, onPointerLeave }: { id: string; anchor: SVGGElement; pins: HometownPin[]; onPointerEnter: () => void; onPointerLeave: () => void }) {
  const tooltip = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    const container = anchor.closest(".member-globe");
    if (!container || !tooltip.current) return;
    const place = () => {
      if (!tooltip.current) return;
      const frame = container.getBoundingClientRect(), pin = anchor.getBoundingClientRect();
      const { width, height } = tooltip.current.getBoundingClientRect();
      const above = pin.top - frame.top - height - 12;
      setPosition({
        left: Math.max(12, Math.min(frame.width - width - 12, pin.left - frame.left + pin.width / 2 - width / 2)),
        top: Math.max(12, Math.min(frame.height - height - 12, above >= 12 ? above : pin.bottom - frame.top + 12)),
      });
    };
    place();
    const observer = new ResizeObserver(place); observer.observe(container);
    return () => observer.disconnect();
  }, [anchor, pins]);

  return <div ref={tooltip} id={id} className="globe-pin-tooltip" role="tooltip" style={position} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
    {pins.length > 1 && <div className="globe-tooltip-kicker">{pins.length} members here</div>}
    {pins.map(pin => <div className="globe-tooltip-member" key={pin.id}>
      <span className="globe-tooltip-avatar" aria-hidden="true">{pin.name.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span>
      <div><strong>{pin.name}</strong><span>{[pin.city, pin.country].filter(Boolean).join(", ")}</span></div>
    </div>)}
  </div>;
}
