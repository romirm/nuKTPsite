import { useEffect, useRef, useState } from "react";

import Logo from "@images/Branding/Logo.png";
import RushCountdown from "./RushCountdown";
import NorthwesternBackdrop from "./NorthwesternBackdrop";
import ArcadeSky from "./ArcadeSky";
import { landingNavigation as navigation } from "./navigation";

export default function Hero(props: { maintenance: boolean }) {
  const [activeSection, setActiveSection] = useState("");
  const sectionLinks = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const header = document.querySelector(".studio-header");
      const threshold = (header?.getBoundingClientRect().height ?? 88) + 160;
      let current = "";
      for (const item of navigation) {
        const section = document.getElementById(item.href.slice(1));
        if (section && section.getBoundingClientRect().top <= threshold)
          current = item.href;
      }
      setActiveSection(current);
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const container = sectionLinks.current;
    const active = container?.querySelector<HTMLAnchorElement>(
      '[aria-current="location"]',
    );
    if (container && container.scrollWidth > container.clientWidth) {
      container.scrollTo({
        left: active
          ? container.scrollLeft + active.getBoundingClientRect().left
            - container.getBoundingClientRect().left
            - (container.clientWidth - active.offsetWidth) / 2
          : 0,
        behavior: "auto",
      });
    }
  }, [activeSection]);

  const navigateToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const section = document.getElementById(href.slice(1));
    if (!section) return;
    event.preventDefault();
    history.replaceState(null, "", href);
    section.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };
  const portalHref = props.maintenance ? "/maintenance" : "/signup";
  return (
    <section className="studio-hero" id="top">
      <NorthwesternBackdrop scene="lakefront" />
      <ArcadeSky />
      <header className="studio-header">
        <nav className="studio-nav" aria-label="Global">
          <a href="#top" className="studio-logo">
            <span className="sr-only">KTPNU</span>
            <img src={Logo} alt="KTP Logo" />
          </a>
          <div className="studio-links" ref={sectionLinks}>
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                aria-current={
                  activeSection === item.href ? "location" : undefined
                }
                onClick={(event) => navigateToSection(event, item.href)}
              >
                {item.name}
              </a>
            ))}
          </div>
          <a className="studio-portal" href={portalHref}>
            Member Portal <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <div className="studio-hero-grid studio-container">
        <div className="studio-hero-copy">
          <h1>
            <span className="studio-welcome">Welcome to</span> Kappa{" "}
            <span>Theta Pi</span>
          </h1>
          <p className="studio-hero-intro">
            We are a <span>tech fraternity</span> that connects, educates, and
            empowers.
          </p>
          <p>
            KTP Northwestern is a co-ed organization dedicated to providing a
            community for students interested in technology. We host events,
            workshops, and socials to help students learn and grow in their tech
            careers.
          </p>
          <div className="studio-actions">
            <a
              href="https://rush.ktpnu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="studio-primary"
            >
              Rush Application <span aria-hidden="true">↗</span>
            </a>
            <a href="mailto:info@ktpnu.com">
              Contact Us <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <RushCountdown />
      </div>
      <div className="studio-hero-rule studio-container">
        <span><span className="arcade-status-dot" aria-hidden="true" /> NORTHWESTERN UNIVERSITY · KAPPA CHAPTER</span>
        <a href="#greeting">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}
