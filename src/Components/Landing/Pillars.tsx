import { motion } from "framer-motion";
import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  ComputerDesktopIcon,
  UserGroupIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

const features: { name: string; description: string; icon: any }[] = [
  {
    name: "Professional Development",
    description:
      "KTP provides professional development and support for tech careers, including interview training, resume building, mentorship, and private company recruiting.",
    icon: BriefcaseIcon,
  },
  {
    name: "Alumni Connections",
    description:
      "Our alumni network connects you to members at top tech companies, including Microsoft, Amazon, Facebook, Apple, Google, consulting firms, financial technology firms, and startups.",
    icon: UserPlusIcon,
  },
  {
    name: "Social Growth",
    description:
      "At KTP, we understand that strong bonds create strong communities. KTP fosters these friendships through social events, including tailgates, bowling, apple picking, and KTP formal.",
    icon: ArrowTrendingUpIcon,
  },
  {
    name: "Technical Advancement",
    description:
      "Let us expand your technical skillset through workshops, projects, and more to enhance your technical skills and prepare you for your industry through new member education and beyond.",
    icon: ComputerDesktopIcon,
  },
  {
    name: "Academic Support",
    description:
      "KTP helps foster academic growth and excellence by providing a network of the brightest tech minds at Northwestern for support in and out of the classroom.",
    icon: AcademicCapIcon,
  },
  {
    name: "Diversity, Equity, and Inclusion",
    description:
      "KTP is an inclusive workplace that recruits the best in tech, regardless of gender, race, religion, or sexual orientation, and encourages members to bring their authentic selves.",
    icon: UserGroupIcon,
  },
];

function Pillars() {
  const naturalSpring = {
    type: "spring",
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  };

  return (
    <div className="relative bg-slate-50 py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
          >
            Pillars of <span className="bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">Kappa Theta Pi</span>
          </motion.h2>
          <p className="mt-4 text-xl font-medium text-slate-600">
            What We Stand For
          </p>
        </div>

        <div className="mx-auto mt-20 max-w-2xl sm:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...naturalSpring, delay: idx * 0.1 }}
                whileHover={{ 
                  y: -12, 
                  scale: 1.01,
                  transition: { type: "spring", stiffness: 300, damping: 25 } 
                }}
                className="group relative flex flex-col rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-shadow duration-500 hover:shadow-2xl hover:ring-blue-200"
              >
                <div className="-mt-12">
                  <div className="inline-flex items-center justify-center rounded-2xl bg-blue-600 p-3 shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <feature.icon className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-8">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-700">
                    {feature.name}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </div>
                <div className="mt-auto pt-6">
                  <div className="h-1.5 w-8 rounded-full bg-slate-100 group-hover:bg-blue-100 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pillars;