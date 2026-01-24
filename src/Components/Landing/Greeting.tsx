import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
// @ts-ignore
import RohanPic from "@images/Exec/rohan2026.jpeg";

interface AnimatedNumberProps {
  value: string;
  duration?: number;
  start: boolean;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 2000, start }) => {
  const numericValue = parseInt(value.replace(/\D/g, ""), 10);
  const suffix = value.replace(/[0-9]/g, "");
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!start) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuad = (t: number): number => t * (2 - t);
      setCount(Math.floor(easeOutQuad(progress) * numericValue));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [numericValue, duration, start]);

  return <>{count}{suffix}</>;
};

const stats = [
  { label: "National Chapters", value: "18" },
  { label: "Chapter Alumni", value: "100+" },
  { label: "Active Members", value: "120+" },
];

function Greeting() {
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Defined the spring physics for a "natural" weighted feel
  const naturalSpring = {
    type: "spring",
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  };

  return (
    <div id="greeting" className="relative bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-16 gap-y-16 lg:mx-0 lg:min-w-full lg:max-w-none lg:flex-none lg:grid-cols-2 lg:items-center">
          
          {/* Left Side: Testimonial Card */}
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              // Uses naturalSpring for the entrance animation
              transition={naturalSpring}
              // Hover physics are refined for a smooth lift and subtle scale
              whileHover={{ 
                y: -12, 
                scale: 1.015,
                transition: { type: "spring", stiffness: 300, damping: 25 } 
              }}
              className="group relative overflow-hidden rounded-3xl bg-gray-900 shadow-2xl transition-shadow duration-500 ring-1 ring-slate-200 hover:ring-blue-200"
            >
              <img
                className="h-[450px] w-full object-cover sm:h-[600px] transition-transform duration-700 group-hover:scale-105"
                src={RohanPic}
                alt="KTP Member Quote"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 opacity-90" />
              
              <div className="absolute bottom-0 p-8 sm:p-12">
                <blockquote className="text-xl font-medium text-white leading-relaxed">
                  <p className="relative italic">
                    “As a freshman studying CS, I was expecting to find a cutthroat tech environment. Joining KTP gave me a welcoming community of friendly, like-minded students, as well as the resources and support to help me succeed.”
                  </p>
                  <footer className="mt-6 flex items-center gap-x-3">
                    <div className="h-px w-8 bg-blue-500"></div>
                    <p className="text-base font-bold text-blue-400">Rohan Badani, KTP Member</p>
                  </footer>
                </blockquote>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Text Content */}
          <div className="lg:max-w-lg lg:pt-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                KTP at a Glance
              </p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Celebrating <span className="bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">Technological Passion</span>
              </h2>
              <div className="mt-8 space-y-6 text-lg leading-relaxed text-slate-600">
                <p>
                  Welcome to the Kappa Chapter of Kappa Theta Pi, Northwestern's premier 
                  pre-professional technology fraternity. 
                  At KTP, we prepare members for their prospective careers through professional development, taught by those who have been in the industry.
                </p>
                <p>
                  Celebrate a culture of growth with some of Northwestern's most brilliant software developers, designers, quants, and engineers.
                </p>
              </div>

              {/* Stats Section */}
              <div className="mt-12" ref={statsRef}>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex flex-col gap-y-1">
                      <dt className="text-sm font-semibold text-slate-500 uppercase tracking-tight">
                        {stat.label}
                      </dt>
                      <dd className="text-4xl font-black tracking-tighter text-slate-900">
                        <AnimatedNumber value={stat.value} start={isVisible} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Greeting;