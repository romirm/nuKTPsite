import { motion } from "framer-motion";

const timeline = [
  {
    name: "Networking Night",
    description: "Engage in a memorable evening where KTP members forge lasting connections in the tech world.",
    date: "Day 1",
    dateTime: "2026-01-12",
  },
  {
    name: "Coffee Chats",
    description: "Dive into casual conversations about tech innovations, career insights, and shared experiences over coffee.",
    date: "Day 2",
    dateTime: "2026-01-13",
  },
  {
    name: "Social",
    description: "Join us for our social to connect with members and discover what KTP is all about.",
    date: "Day 3",
    dateTime: "2026-01-14",
  },
  {
    name: "Group Interviews",
    description: "Showcase your skills and team dynamics in our collaborative group interviews for prospective members.",
    date: "Day 4",
    dateTime: "2026-01-15",
  },
  {
    name: "Individual Interviews",
    description: "Engage in a focused one-on-one session to explore your potential and alignment with KTP's vision.",
    date: "Day 5",
    dateTime: "2026-01-16",
  },
];

export default function RushEvents2() {
  const naturalSpring = {
    type: "spring",
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  };

  return (
    <div id="rushevents2" className="relative bg-slate-50 py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16 sm:mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
          >
            Join us for <span className="bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">rush week</span>
          </motion.h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            We're excited to meet you! Apply when applications open.
          </p>
        </div>

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-5">
          {timeline.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              // Entrance transition
              transition={{ ...naturalSpring, delay: idx * 0.1 }}
              // Natural hover physics
              whileHover={{ 
                y: -10, 
                scale: 1.01,
                transition: { type: "spring", stiffness: 300, damping: 25 } 
              }}
              className="group relative flex flex-col justify-between rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-shadow duration-500 hover:shadow-2xl hover:ring-blue-200"
            >
              <div>
                <time
                  dateTime={item.dateTime}
                  className="flex items-center text-sm font-bold leading-6 text-blue-600 uppercase tracking-wider"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-2" />
                  {item.date}
                </time>
                <p className="mt-4 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-700">
                  {item.name}
                </p>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  {item.description}
                </p>
              </div>
              
              <div className="mt-6 h-1 w-12 rounded-full bg-slate-100 group-hover:bg-blue-100 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}