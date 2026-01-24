import { motion } from "framer-motion";
import PortalPic from "@images/Misc/Portal.jpeg";

function PortalAdvertisement() {
  const naturalSpring = {
    type: "spring",
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  };

  return (
    <div className="relative overflow-hidden bg-slate-50 pt-24 sm:pt-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
          >
            Not sure how to network?{" "}
            <span className="whitespace-nowrap bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">
              No problem.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600"
          >
            Networking with industry professionals is difficult, time-consuming,
            and daunting. With KTP's alumni network and member portal, we make it
            easy.
          </motion.p>
        </div>

        <div className="mt-16 -mb-12 sm:-mb-24 lg:-mb-40">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...naturalSpring, delay: 0.2 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <img
                className="w-full object-cover"
                src={PortalPic}
                alt="KTP Member Portal Interface"
              />
            </div>

            <div className="absolute -inset-x-20 -bottom-20 -z-10 h-full w-full bg-gradient-to-t from-blue-100/50 to-transparent blur-3xl" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default PortalAdvertisement;
