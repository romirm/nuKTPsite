import { useEffect } from "react";

/** Only visible landscapes update, and only when the visitor scrolls. */
export default function useWorldParallax(paused: boolean) {
  useEffect(() => {
    if (paused) return;
    const landscapes = document.querySelectorAll<SVGSVGElement>(".pixel-world");
    const visible = new Set<SVGSVGElement>();
    let frame = 0;
    const update = () => {
      visible.forEach((scene) => {
        const bounds = scene.getBoundingClientRect();
        const offset = Math.max(-28, Math.min(28, (window.innerHeight / 2 - bounds.top - bounds.height / 2) * .035));
        scene.style.setProperty("--world-drift", `${offset}px`);
      });
      frame = 0;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const scene = entry.target as SVGSVGElement;
        if (entry.isIntersecting) visible.add(scene);
        else visible.delete(scene);
        scene.dataset["worldActive"] = String(entry.isIntersecting);
      });
      schedule();
    }, { rootMargin: "160px" });
    landscapes.forEach((scene) => observer.observe(scene));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      landscapes.forEach((scene) => {
        scene.style.removeProperty("--world-drift");
        delete scene.dataset["worldActive"];
      });
    };
  }, [paused]);
}
