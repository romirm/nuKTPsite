import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const allLogos: Record<string, string> = (() => {
  const context = (require as any).context("@/Assets/Vectors", false, /\.svg$/);
  const map: Record<string, string> = {};
  context.keys().forEach((key: string) => {
    const fileName = key.replace("./", "").replace(".svg", "");
    const mod = context(key);
    map[fileName] = typeof mod === 'string' ? mod : mod.default;
  });
  return map;
})();

const groups = [
  {
    id: "faang, faang+",
    rows: [
      ["meta", "apple", "amazon", "netflix", "google"],
      ["microsoft", "palantir", "roblox", "uber", "datadog"]
    ]
  },
  {
    id: "quant",
    rows: [
      ["hrt", "janestreet", "citadel", "optiver", "imc"],
      ["ctc", "bam", "virtu", "jpmorganchase", "goldmansachs"]
    ]
  },
  {
    id: "fintech",
    rows: [
      ["ramp", "c1", "bloomberg", "robinhood", "paypal"],
      ["mckinsey", "bcg", "bain", "deloitte", "accenture"]
    ]
  }
];

export default function LogoCloud() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % groups.length);
    }, 4000); // Slightly longer interval for readability
    return () => clearInterval(interval);
  }, []);

  const currentStage = groups[stageIndex];

  return (
    <section id="logocloud" className="relative bg-slate-50 pt-24 pb-16 sm:pt-32 sm:pb-20 overflow-hidden">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-8">
        <h2 className="text-center text-lg font-semibold leading-8 text-slate-900 mb-20">
          Our members work at many of the largest technology, quant, and financial services companies
        </h2>

        <div className="relative min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={stageIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ 
                duration: 0.7, 
                ease: [0.4, 0, 0.2, 1] // Custom cubic-bezier for a "smoother" feel than linear
              }}
              className="space-y-16 lg:space-y-24 w-full" 
            >
              {currentStage.rows.map((row, rowIdx) => (
                <div 
                  key={rowIdx} 
                  className="grid grid-cols-2 gap-x-12 gap-y-16 sm:grid-cols-3 lg:grid-cols-5 items-center justify-items-center"
                >
                  {row.map((companyKey) => {
                    const fullKey = `${companyKey}_logo`;
                    const src = allLogos[fullKey];
                    
                    return (
                      <div key={companyKey} className="w-full flex justify-center px-4">
                        {src ? (
                          <img
                            className="h-14 w-full lg:h-16 object-contain"
                            src={src}
                            alt={`${companyKey} logo`}
                          />
                        ) : (
                          <span className="text-sm text-gray-400 font-medium uppercase tracking-wider">{companyKey}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-20 flex justify-center gap-x-3">
          {groups.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setStageIndex(idx)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                stageIndex === idx 
                ? "bg-blue-600 w-10" 
                : "bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to stage ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}