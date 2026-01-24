import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

import LandingPic from "@images/Branding/landing1-min.jpg";
import SpringPC from "@images/Branding/springpc.jpg";
import SpeakerPic from "@images/Branding/speaker.jpg";
import AnnikaPic from "@images/Branding/annika.jpg";
import PcPic from "@images/Branding/pc.jpg";
import Logo from "@images/Branding/Logo.png";

const navigation = [
  { name: "At a Glance", href: "#greeting" },
  { name: "What is KTP?", href: "#WhatIsKTP" },
  { name: "Companies", href: "#logocloud" },
  { name: "Team", href: "#team" },
  { name: "FAQ", href: "#faq" },
];

export default function Hero(props: { maintenance: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const naturalSpring = {
    type: "spring",
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  };

  return (
    <div className="relative isolate bg-slate-50">
      <header className="fixed inset-x-0 top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5 transition-transform hover:scale-105">
              <span className="sr-only">KTPNU</span>
              <img className="h-10 w-auto" src={Logo} alt="KTP Logo" />
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-10">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-semibold leading-6 text-gray-600 hover:text-black transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a
              href={props.maintenance ? "/maintenance" : "/signup"}
              className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white shadow-lg hover:bg-gray-800 transition-all hover:ring-4 hover:ring-slate-200"
            >
              Member Portal
            </a>
          </div>
        </nav>
      </header>

      <main className="pt-24">
        <div className="relative isolate overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 pb-32 pt-20 sm:pt-32 lg:flex lg:px-8 lg:pt-24">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8"
            >
              <h1 className="mt-24 text-4xl font-extrabold tracking-tight text-slate-900 sm:mt-32 sm:text-6xl lg:mt-16 leading-tight">
                We are a <span className="bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">tech fraternity</span> that connects, educates, and empowers.
              </h1>
              <p className="relative mt-6 text-lg leading-8 text-slate-600">
                KTP Northwestern is a co-ed organization dedicated to providing a community for students interested in technology. 
                We host events, workshops, and socials to help students learn and grow in their tech careers.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <a
                  href="https://rush.ktpnu.com"
                  target="_blank"
                  className="rounded-xl bg-blue-700 px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all"
                >
                  Rush Application
                </a>
                <a href="mailto:info@ktpnu.com" className="text-sm font-bold leading-6 text-slate-900 hover:text-blue-600 transition-colors">
                  Contact Us <span aria-hidden="true">→</span>
                </a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32"
            >
              <div className="flex-none sm:max-w-5xl lg:max-w-none">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
                  <div className="space-y-4 pt-12">
                    <motion.div 
                      whileHover={{ y: -10, scale: 1.02 }}
                      transition={naturalSpring}
                      className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200"
                    >
                      <img src={AnnikaPic} alt="KTP" className="aspect-[2/3] w-48 object-cover transition-transform duration-500 hover:scale-110" />
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -10, scale: 1.02 }}
                      transition={naturalSpring}
                      className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200"
                    >
                      <img src={SpeakerPic} alt="KTP" className="aspect-[2/3] w-48 object-cover transition-transform duration-500 hover:scale-110" />
                    </motion.div>
                  </div>
                  <div className="space-y-4">
                    <motion.div 
                      whileHover={{ y: -10, scale: 1.02 }}
                      transition={naturalSpring}
                      className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200"
                    >
                      <img src={LandingPic} alt="KTP" className="aspect-[2/3] w-48 object-cover transition-transform duration-500 hover:scale-110" />
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -10, scale: 1.02 }}
                      transition={naturalSpring}
                      className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200"
                    >
                      <img src={PcPic} alt="KTP" className="aspect-[2/3] w-48 object-cover transition-transform duration-500 hover:scale-110" />
                    </motion.div>
                  </div>
                  <div className="space-y-4 pt-20">
                    <motion.div 
                      whileHover={{ y: -10, scale: 1.02 }}
                      transition={naturalSpring}
                      className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200"
                    >
                      <img src={SpringPC} alt="KTP" className="aspect-[2/3] w-48 object-cover transition-transform duration-500 hover:scale-110" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm">
          <div className="flex items-center justify-between">
            <img className="h-8 w-auto" src={Logo} alt="Logo" />
            <button onClick={() => setMobileMenuOpen(false)} className="rounded-md p-2.5 text-gray-700">
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 space-y-2">
            {navigation.map((item) => (
              <a key={item.name} href={item.href} className="block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-slate-50">
                {item.name}
              </a>
            ))}
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}