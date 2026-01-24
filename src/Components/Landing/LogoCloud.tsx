import { useEffect, useMemo, useState } from "react";

interface Logo {
  src: string;
  alt: string;
}

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

const logos: Logo[] = (() => {
  const context = require.context("@/Assets/Vectors", false, /\.svg$/);
  return context.keys().map((key) => {
    const fileName = key.replace("./", "").replace(".svg", "");
    const prettyName = fileName
      .replace(/_logo/i, "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const mod = context<string>(key);
    
    // Robust path extraction to fix the "path string" glitch
    let srcPath = "";
    if (typeof mod === 'string') {
      srcPath = mod;
    } else if (mod && typeof mod === 'object' && 'default' in mod) {
      srcPath = (mod as any).default;
    }

    return {
      src: srcPath,
      alt: prettyName,
    };
  }).filter(l => l.src !== "");
})();

const GRID_COLS = 5;
const GRID_ROWS = 3;
const SLOT_COUNT = GRID_COLS * GRID_ROWS; 
const FLIP_DURATION_MS = 700;
const INTERVAL_MS = 3000;

function LogoSlot({ current, next, flipping }: { current: Logo; next: Logo; flipping: boolean }) {
  return (
    <div className="relative h-24 w-full [perspective:1000px]">
      <div
        className={`relative h-full w-full [transform-style:preserve-3d] ${
          flipping 
            ? "transition-transform duration-700 [transform:rotateX(90deg)]" 
            : "[transform:rotateX(0deg)]" 
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden] [transform:translateZ(3rem)]">
          <img src={current.src} alt={current.alt} className="h-12 max-w-[140px] object-contain" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden] [transform:rotateX(-90deg)_translateZ(3rem)]">
          <img src={next.src} alt={next.alt} className="h-12 max-w-[140px] object-contain" />
        </div>
      </div>
    </div>
  );
}

export default function LogoCloud() {
  const initialIndices = useMemo(() => {
    const indices = Array.from({ length: logos.length }, (_, i) => i);
    return indices.sort(() => 0.5 - Math.random()).slice(0, SLOT_COUNT);
  }, []);

  const [displayed, setDisplayed] = useState<number[]>(initialIndices);
  const [next, setNext] = useState<number[]>(initialIndices);
  const [flippingSlot, setFlippingSlot] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      // Don't start a new flip if one is active or if we don't have enough logos to swap
      if (logos.length <= SLOT_COUNT || flippingSlot !== null) return;

      const slot = Math.floor(Math.random() * SLOT_COUNT);
      
      let newIndex: number;
      let attempts = 0;
      
      do {
        newIndex = Math.floor(Math.random() * logos.length);
        attempts++;
        // ANTI-DUPLICATE LOGIC:
        // 1. Is it already visible on any front face?
        // 2. Is it already assigned to any back face (pending flip)?
      } while (
        (displayed.includes(newIndex) || next.includes(newIndex)) && 
        attempts < 50
      );

      // Prepare the back face
      setNext((prev) => {
        const copy = [...prev];
        copy[slot] = newIndex;
        return copy;
      });

      // Trigger animation
      setFlippingSlot(slot);

      // Clean up after animation
      setTimeout(() => {
        setDisplayed((prev) => {
          const copy = [...prev];
          copy[slot] = newIndex;
          return copy;
        });
        setFlippingSlot(null); 
      }, FLIP_DURATION_MS);
    };

    const interval = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [displayed, next, flippingSlot]);

  return (
    <section id="logocloud" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-center text-lg font-semibold text-gray-900 mb-16">
          Our members work at many of the largest technology, quant, and financial services companies
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5 items-center">
          {displayed.map((idx, slot) => (
            <LogoSlot
              key={slot}
              current={logos[idx]}
              next={logos[next[slot]]}
              flipping={flippingSlot === slot}
            />
          ))}
        </div>
      </div>
    </section>
  );
}