import { motion } from "framer-motion";
import WIKTP from "@images/Branding/WIKTP.jpg";
import Pyramid from "@images/Branding/pyramid.jpg";
import WinterPC from "@images/Branding/winterpc.jpg";
import Awh from "@images/Branding/awh.jpg";

export default function WhyKTP() {
  // Define a consistent spring transition for a "natural" organic feel
  const naturalSpring = {
    type: "spring",
    stiffness: 150, // Lower stiffness = less "snappy"
    damping: 20,    // Higher damping = smoother settling
    mass: 0.8,      // Adds a sense of physical weight
  };

  return (
    <div id="WhatIsKTP" className="relative overflow-hidden bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:flex lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 lg:mx-0 lg:min-w-full lg:max-w-none lg:flex-none lg:gap-y-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-end-1 lg:w-full lg:max-w-lg lg:pb-8"
          >
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              What is <span className="bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">KTP?</span>
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
          </motion.div>

          <div className="flex flex-wrap items-start justify-end gap-6 sm:gap-8 lg:contents">
            <div className="w-0 flex-auto lg:ml-auto lg:w-auto lg:flex-none lg:self-end">
              <motion.img
                whileHover={{ y: -12, scale: 1.015 }}
                transition={naturalSpring}
                src={WIKTP}
                alt=""
                className="aspect-[7/5] w-[37rem] max-w-none rounded-3xl bg-gray-50 object-cover shadow-xl hover:shadow-2xl transition-shadow duration-500"
              />
            </div>
            <div className="contents lg:col-span-2 lg:col-end-2 lg:ml-auto lg:flex lg:w-[37rem] lg:items-start lg:justify-end lg:gap-x-8">
              <div className="order-first flex w-64 flex-none justify-end self-end lg:w-auto">
                <motion.img
                  whileHover={{ y: -12, scale: 1.015 }}
                  transition={naturalSpring}
                  src={Pyramid}
                  alt=""
                  className="aspect-[4/3] w-[24rem] max-w-none flex-none rounded-3xl bg-gray-50 object-cover shadow-xl hover:shadow-2xl transition-shadow duration-500"
                />
              </div>
              <div className="flex w-96 flex-auto justify-end lg:w-auto lg:flex-none">
                <motion.img
                  whileHover={{ y: -12, scale: 1.015 }}
                  transition={naturalSpring}
                  src={Awh}
                  alt=""
                  className="aspect-[7/5] w-[37rem] max-w-none flex-none rounded-3xl bg-gray-50 object-cover shadow-xl hover:shadow-2xl transition-shadow duration-500"
                />
              </div>
              <div className="hidden sm:block sm:w-0 sm:flex-auto lg:w-auto lg:flex-none">
                <motion.img
                  whileHover={{ y: -12, scale: 1.015 }}
                  transition={naturalSpring}
                  src={WinterPC}
                  alt=""
                  className="aspect-[4/3] w-[24rem] max-w-none rounded-3xl bg-gray-50 object-cover shadow-xl hover:shadow-2xl transition-shadow duration-500"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}