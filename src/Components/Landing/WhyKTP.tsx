import WIKTP from "@images/Branding/WIKTP.jpg";
import Pyramid from "@images/Branding/pyramid.jpg";
import WinterPC from "@images/Branding/winterpc.jpg";
import Awh from "@images/Branding/awh.jpg";
import NorthwesternBackdrop from "./NorthwesternBackdrop";

export default function WhyKTP() {
  return (
    <section id="WhatIsKTP" className="studio-about studio-section">
      <NorthwesternBackdrop scene="rock" />
      <div className="studio-container studio-about-layout">
        <div className="studio-about-copy">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            What is{" "}
            <span className="bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">
              KTP?
            </span>
          </h2>
          <p className="mt-8 text-xl leading-8 text-slate-600 font-medium">
            Kappa Theta Pi is a dynamic community of tech professionals
            committed to fostering deep connections, mutual support, and
            lifelong friendships.
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Through focused professional development opportunities and
            collaborative events, members are empowered to navigate the tech
            landscape with confidence and expertise.
          </p>
        </div>
        <div className="studio-about-photos">
          <img src={WIKTP} alt="" loading="lazy" />
          <img src={Pyramid} alt="" loading="lazy" />
          <img src={Awh} alt="" loading="lazy" />
          <img src={WinterPC} alt="" loading="lazy" />
        </div>
      </div>
    </section>
  );
}
