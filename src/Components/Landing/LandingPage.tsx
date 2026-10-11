import { MotionConfig, useReducedMotion } from "framer-motion";
import ArcadeJourney from "./ArcadeJourney";
import Hero from "./Hero";
import Greeting from "./Greeting";
import WhyKTP from "./WhyKTP";
import RushEvents2 from "./RushEvents2";
import Pillars from "./Pillars";
import LogoCloud from "./LogoCloud";
import Team from "./Team";
import PortalAdvertisement from "./PortalAdvertisement";
import FAQs from "./FAQs";
import ReachOut from "./ReachOut";
import Footer from "./Footer";
import "./arcade.css";
import "./campus.css";

export default function LandingPage({ maintenance }: { maintenance: boolean }) {
  const paused = !!useReducedMotion();
  return (
    <MotionConfig reducedMotion={paused ? "always" : "user"}>
      <div className={`ktp-landing${paused ? " motion-paused" : ""}`}>
        <a className="arcade-skip-link" href="#greeting">Skip to main content</a>
        <Hero maintenance={maintenance} />
        <main>
          <Greeting />
          <WhyKTP />
          <Team />
          <Pillars />
          <LogoCloud />
          <RushEvents2 />
          <PortalAdvertisement />
          <FAQs />
          <ReachOut />
        </main>
        <Footer />
        <ArcadeJourney paused={paused} />
      </div>
    </MotionConfig>
  );
}
