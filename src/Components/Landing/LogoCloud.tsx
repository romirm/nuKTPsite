import Meta from "@vectors/meta.svg";
import Amazon from "@vectors/amazon.svg";
import Apple from "@vectors/apple.svg";
import Google from "@vectors/google.svg";
import Netflix from "@vectors/netflix.svg";

import Citadel from "@vectors/citadel.svg";
import HRT from "@vectors/hrt.svg";
import JaneStreet from "@vectors/janestreet.svg";
import IMC from "@vectors/imc.svg";
import Microsoft from "@vectors/microsoft.svg";

import CapitalOne from "@vectors/capitalone.svg";
import Palantir from "@vectors/palantir.svg";
import Uber from "@vectors/uber.svg";
import JPMorgan from "@vectors/jpmorgan.svg";
import Robinhood from "@vectors/robinhood.svg";

const logos = [
  { src: Meta, alt: "Meta", className: "h-[96px]"},
  { src: Apple, alt: "Apple" },
  { src: Amazon, alt: "Amazon" },
  { src: Netflix, alt: "Netflix" },
  { src: Google, alt: "Google" },

  { src: JaneStreet, alt: "Jane Street" },
  { src: Citadel, alt: "Citadel" },
  { src: HRT, alt: "HRT" },
  { src: IMC, alt: "IMC", className: "h-[108px]"},
  { src: Microsoft, alt: "Microsoft" },

  { src: Palantir, alt: "Palantir", className: "h-[108px]"},
  { src: Uber, alt: "Uber", className: "h-[108px]"},
  { src: CapitalOne, alt: "Capital One" },
  { src: JPMorgan, alt: "JPMorgan", className: "h-[172px]"},
  { src: Robinhood, alt: "Robinhood" },
];

export default function LogoCloud() {
  return (
    <section id="logocloud" className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-center text-lg font-semibold leading-8 text-gray-900">
          Our members work at many of the largest tech and quant companies
        </h2>

        <div
          className="
            mx-auto mt-16
            grid grid-cols-2 gap-x-8 gap-y-16
            sm:grid-cols-3 sm:gap-x-10
            lg:mx-0 lg:grid-cols-5
          "
        >
          {logos.map((logo) => (
            <div
              key={logo.alt}
              className="flex h-24 items-center justify-center"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className={`object-contain ${logo.className ?? "h-16"}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
