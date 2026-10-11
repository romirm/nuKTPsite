import { useEffect, useRef, useState } from "react";
import PixelNinja from "./PixelNinja";
import { landingNavigation } from "./navigation";

const checkpoints = landingNavigation.map(({ name, href }) => ({ id: href.slice(1), label: name }));
const checkpointStops = checkpoints.map((_, index) => 0.1 + index / (checkpoints.length - 1) * 0.8);
const trackStops = [0, ...checkpointStops, 1];

// Equal visual spacing, with each interval mapped to its real page distance.
function interpolate(value: number, source: number[], destination: number[]) {
  if (value <= source[0]) return destination[0];
  for (let index = 1; index < source.length; index++) {
    const distance = source[index] - source[index - 1];
    if (value <= source[index] && distance > 0) {
      const fraction = (value - source[index - 1]) / distance;
      return destination[index - 1] + fraction * (destination[index] - destination[index - 1]);
    }
  }
  return destination[destination.length - 1];
}

function scrollImmediately(top: number) {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo({ top, behavior: "auto" });
  root.style.scrollBehavior = previous;
}

export default function ArcadeJourney({ paused }: { paused: boolean }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(-1);
  const [dragging, setDragging] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<HTMLButtonElement>(null);
  const destinationsRef = useRef(trackStops);
  const dragRef = useRef<{ pointerId: number; offset: number } | null>(null);
  const checkpointTouchRef = useRef<{ pointerId: number; id: string; x: number; y: number } | null>(null);
  const touchActivationRef = useRef<{ id: string; at: number } | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    const runner = runnerRef.current;
    if (!rail || !runner) return;
    let frame = 0;
    let stopTimer: ReturnType<typeof setTimeout>;
    let lastY = window.scrollY;
    const update = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const fraction = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const position = interpolate(window.scrollY, destinationsRef.current, trackStops);
      runner.style.transform = `translateY(${position * rail.clientHeight}px)`;
      rail.style.setProperty("--journey-progress", String(position));
      setProgress(Math.round(fraction * 100));
      let current = -1;
      const threshold = (document.querySelector(".studio-header")?.getBoundingClientRect().height ?? 84) + 160;
      checkpoints.forEach((checkpoint, index) => {
        const section = document.getElementById(checkpoint.id);
        if (section && section.getBoundingClientRect().top <= threshold) current = index;
      });
      setActive(current);
      frame = 0;
    };
    const onScroll = () => {
      const direction = window.scrollY >= lastY ? "down" : "up";
      if (window.scrollY !== lastY && !paused) {
        runner.classList.add("is-running");
        runner.dataset["direction"] = direction;
        clearTimeout(stopTimer);
        stopTimer = setTimeout(() => runner.classList.remove("is-running"), 180);
      }
      lastY = window.scrollY;
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Keep the scroll mapping accurate after fonts, images or viewport changes.
    const measure = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      destinationsRef.current = [0, ...checkpoints.map(({ id }) => {
        const section = document.getElementById(id);
        if (!section) return 0;
        const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
        const destination = section.getBoundingClientRect().top + window.scrollY - margin;
        return Math.min(maxScroll, Math.max(0, destination));
      }), maxScroll];
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    observer.observe(rail);
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(stopTimer);
      runner.classList.remove("is-running");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [paused]);

  const navigateToCheckpoint = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;
    history.replaceState(null, "", `#${id}`);
    section.scrollIntoView({ behavior: paused ? "auto" : "smooth", block: "start" });
  };

  return (
      <nav className="arcade-journey" aria-label="Page checkpoints">
        <div className="arcade-journey-rail" ref={railRef}>
          <div className="arcade-journey-fill" aria-hidden="true" />
          <button
            type="button"
            role="slider"
            className={`arcade-runner${dragging ? " is-dragging" : ""}`}
            ref={runnerRef}
            aria-label="Drag ninja to scroll the page"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-valuetext={`${progress}% of page, ${active >= 0 ? checkpoints[active].label : "Welcome"}`}
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return;
              event.preventDefault();
              const thumb = event.currentTarget.getBoundingClientRect();
              dragRef.current = { pointerId: event.pointerId, offset: event.clientY - (thumb.top + thumb.height / 2) };
              event.currentTarget.setPointerCapture(event.pointerId);
              if (event.pointerType !== "touch") event.currentTarget.focus({ preventScroll: true });
              setDragging(true);
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              const rail = railRef.current;
              if (!drag || drag.pointerId !== event.pointerId || !rail) return;
              const bounds = rail.getBoundingClientRect();
              const fraction = Math.min(1, Math.max(0, (event.clientY - drag.offset - bounds.top) / bounds.height));
              scrollImmediately(interpolate(fraction, trackStops, destinationsRef.current));
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              dragRef.current = null;
              setDragging(false);
            }}
            onPointerCancel={() => { dragRef.current = null; setDragging(false); }}
            onLostPointerCapture={() => { dragRef.current = null; setDragging(false); }}
            onKeyDown={(event) => {
              const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
              const step = Math.max(40, window.innerHeight * 0.15);
              const targets: Record<string, number> = {
                ArrowDown: window.scrollY + step,
                ArrowRight: window.scrollY + step,
                ArrowUp: window.scrollY - step,
                ArrowLeft: window.scrollY - step,
                PageDown: window.scrollY + window.innerHeight,
                PageUp: window.scrollY - window.innerHeight,
                Home: 0,
                End: maxScroll,
              };
              if (!(event.key in targets)) return;
              event.preventDefault();
              scrollImmediately(Math.min(maxScroll, Math.max(0, targets[event.key])));
            }}
          ><PixelNinja compact /></button>
          {checkpoints.map((checkpoint, index) => (
            <a key={checkpoint.id} href={`#${checkpoint.id}`} className={index <= active ? "is-reached" : ""} style={{ top: `${checkpointStops[index] * 100}%` }} aria-current={index === active ? "location" : undefined} aria-label={`Checkpoint ${index + 1}: ${checkpoint.label}`}
              onPointerDown={(event) => {
                if (event.pointerType === "touch") checkpointTouchRef.current = { pointerId: event.pointerId, id: checkpoint.id, x: event.clientX, y: event.clientY };
              }}
              onPointerCancel={() => { checkpointTouchRef.current = null; }}
              onPointerUp={(event) => {
                const touch = checkpointTouchRef.current;
                checkpointTouchRef.current = null;
                if (event.pointerType !== "touch" || !touch || touch.pointerId !== event.pointerId || touch.id !== checkpoint.id) return;
                if (Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 8 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                touchActivationRef.current = { id: checkpoint.id, at: performance.now() };
                navigateToCheckpoint(checkpoint.id);
              }}
              onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              const touch = touchActivationRef.current;
              if (event.detail > 0 && touch?.id === checkpoint.id && performance.now() - touch.at < 700) return;
              navigateToCheckpoint(checkpoint.id);
            }}>
            </a>
          ))}
        </div>
      </nav>
  );
}
