import { motion } from "framer-motion";
import ArcadeSky from "./ArcadeSky";
import PixelWorld from "./PixelWorld";
import AnjanaPic from "@images/Exec/anjana2026.jpeg";
import ChloePic from "@images/Exec/chloe2026.jpeg";
import KatiaPic from "@images/Exec/katia2026.jpeg";
import MoPic from "@images/Exec/mo2026.jpeg";
import OliviaPic from "@images/Exec/olivia2026.jpeg";
import RachelPic from "@images/Exec/rachel2026.jpeg";
import RohanPic from "@images/Exec/rohan2026.jpeg";
import RomirPic from "@images/Exec/romir2026.jpeg";
import ShervinPic from "@images/Exec/shervin2026.jpeg";
import SophiaPic from "@images/Exec/sophia2026.jpeg";
import SujeePic from "@images/Exec/sujee2026.jpeg";

const people = [
  { name: "Mohammed Alamin", role: "President", imageUrl: MoPic, linkedin: "https://www.linkedin.com/in/alaminmo/" },
  { name: "Anjana Radha", role: "VP of Programming", imageUrl: AnjanaPic, linkedin: "https://www.linkedin.com/in/anjana-radha-a68159215/" },
  { name: "Sophia Myint", role: "VP of Recruitment", imageUrl: SophiaPic, linkedin: "https://www.linkedin.com/in/sophiamyint/" },
  { name: "Rohan Badani", role: "VP of External Affairs", imageUrl: RohanPic, linkedin: "https://www.linkedin.com/in/rohan-badani/" },
  { name: "Olivia Paik", role: "VP of Internal Experience", imageUrl: OliviaPic, linkedin: "https://www.linkedin.com/in/olivia-paik/" },
  { name: "Romir Mohan", role: "VP of Technology", imageUrl: RomirPic, linkedin: "https://www.linkedin.com/in/romirmohan/" },
  { name: "Katia Ohmacht", role: "VP of Technology", imageUrl: KatiaPic, linkedin: "https://www.linkedin.com/in/katiaohmacht/" },
  { name: "Chloe Lu", role: "VP of Marketing", imageUrl: ChloePic, linkedin: "https://www.linkedin.com/in/chloelu05/" },
  { name: "Shervin Naini", role: "VP of Finance", imageUrl: ShervinPic, linkedin: "https://www.linkedin.com/in/shervin-n/" },
  { name: "Sujee Rubio", role: "VP of DEI", imageUrl: SujeePic, linkedin: "https://www.linkedin.com/in/sujee-rubio-0a23762a9/" },
  { name: "Rachel Li", role: "VP of Pledge Experience", imageUrl: RachelPic, linkedin: "https://www.linkedin.com/in/rachelnwk/" },
];

function Team() {
  const naturalSpring = {
    type: "spring",
    stiffness: 150,
    damping: 20,
    mass: 0.8,
  };

  const renderPerson = (person: any, idx: number, rowIdx: number) => (
    <motion.li 
      key={person.name}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...naturalSpring, delay: (rowIdx * 0.1) + (idx * 0.05) }}
      whileHover={{ 
        y: -4,
        transition: { type: "spring", stiffness: 300, damping: 25 } 
      }}
      className="studio-person group"
    >
      <a 
        href={person.linkedin} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block"
      >
        <div className="relative overflow-hidden rounded-3xl bg-slate-200 shadow-md ring-0 ring-blue-500/0 transition-all duration-300 group-hover:shadow-2xl group-hover:ring-4 group-hover:ring-blue-500/50">
          <img
            className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy" src={person.imageUrl}
            alt={person.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        
        <div className="mt-6 text-center">
          <h3 className="studio-hover-title text-lg font-bold leading-7 tracking-tight text-slate-900 transition-colors">
            {person.name}
          </h3>
          <p className="text-sm font-semibold leading-6 text-blue-600 uppercase tracking-wider">
            {person.role}
          </p>
        </div>
      </a>
    </motion.li>
  );

  return (
    <div id="team" className="studio-team studio-section relative bg-slate-50 py-24 sm:py-32 overflow-hidden">
      <ArcadeSky phase={1} />
      <PixelWorld scene="forest" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        <div className="mx-auto max-w-2xl text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
          >
            <span className="bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent">Leadership</span>
          </motion.h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Our leadership team supports an inclusive, 
            supportive experience for all members.
          </p>
        </div>

        <ul role="list" className="studio-team-grid">{people.map((person, index) => renderPerson(person, index, 0))}</ul>
      </div>
    </div>
  );
}

export default Team;
