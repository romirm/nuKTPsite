import AnjanaPic from "@images/Exec/anjana2026.jpeg"
import ChloePic from "@images/Exec/chloe2026.jpeg"
import KatiaPic from "@images/Exec/katia2026.jpeg"
import MoPic from "@images/Exec/mo2026.jpeg"
import OliviaPic from "@images/Exec/olivia2026.jpeg"
import RachelPic from "@images/Exec/rachel2026.jpeg"
import RohanPic from "@images/Exec/rohan2026.jpeg"
import RomirPic from "@images/Exec/romir2026.jpeg"
import ShervinPic from "@images/Exec/shervin2026.jpeg"
import SophiaPic from "@images/Exec/sophia2026.jpeg"
import SujeePic from "@images/Exec/sujee2026.jpeg";

const people: { name: string; role: string; imageUrl: any; linkedin: string }[] = [
  {
    name: "Mohammed Alamin",
    role: "President",
    imageUrl: MoPic,
    linkedin: "https://www.linkedin.com/in/alaminmo/",
  },
  {
    name: "Anjana Radha",
    role: "VP of Programming",
    imageUrl: AnjanaPic,
    linkedin: "https://www.linkedin.com/in/anjana-radha-a68159215/",
  },
  {
    name: "Rohan Badani",
    role: "VP of External Affairs & Alumni Relations",
    imageUrl: RohanPic,
    linkedin: "https://www.linkedin.com/in/rohan-badani/",
  },
  {
    name: "Olivia Paik",
    role: "VP of Internal Experience",
    imageUrl: OliviaPic,
    linkedin: "https://www.linkedin.com/in/olivia-paik/",
  },
  {
    name: "Romir Mohan",
    role: "VP of Technology",
    imageUrl: RomirPic,
    linkedin: "https://www.linkedin.com/in/romirmohan/",
  },
  {
    name: "Katia Ohmacht",
    role: "VP of Technology",
    imageUrl: KatiaPic,
    linkedin: "https://www.linkedin.com/in/katiaohmacht/",
  },
  {
    name: "Chloe Lu",
    role: "VP of Marketing",
    imageUrl: ChloePic,
    linkedin: "https://www.linkedin.com/in/chloelu05/",
  },
  {
    name: "Sophia Myint",
    role: "VP of Recruitment",
    imageUrl: SophiaPic,
    linkedin: "https://www.linkedin.com/in/sophiamyint/",
  },
  {
    name: "Shervin Naini",
    role: "VP of Finance",
    imageUrl: ShervinPic,
    linkedin: "https://www.linkedin.com/in/shervin-n/",
  },
  {
    name: "Sujee Rubio",
    role: "VP of Diversity, Equity, and Inclusion",
    imageUrl: SujeePic,
    linkedin: "https://www.linkedin.com/in/sujee-rubio-0a23762a9/",
  },
  {
    name: "Rachel Li",
    role: "VP of Pledge Experience",
    imageUrl: RachelPic,
    linkedin: "https://www.linkedin.com/in/rachelnwk/",
  },
];

function Team() {
  return (
    <div id="team" className="overflow-hidden bg-gray-50">
      <div className="mx-auto max-w-7xl py-12 px-4 text-center sm:px-6 lg:px-8 lg:py-24">
        <div className="space-y-8 sm:space-y-12">
          <div className="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              KTP Exec
            </h2>
            <p className="text-xl text-gray-600">
              Our leadership team is committed to supporting an inclusive,
              supportive experience.
            </p>
          </div>
          
          {/* Team Layout (Shared logic for both viewports) */}
          {[ "sm:hidden", "hidden sm:grid" ].map((displayClass) => (
            <ul
              key={displayClass}
              role="list"
              className={`${displayClass} mx-auto grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-4 md:gap-x-6 lg:max-w-5xl lg:gap-x-8 lg:gap-y-12 xl:grid-cols-4 place-items-center`}
            >
              {people.map((person) => (
                <li key={person.name}>
                  <div className="space-y-4">
                    {/* Clickable Profile Photo */}
                    <a 
                      href={person.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block transition-transform duration-200 hover:scale-105"
                    >
                      <img
                        className="mx-auto h-20 w-20 rounded-full lg:h-24 lg:w-24 object-cover object-[50%_20%] ring-2 ring-transparent hover:ring-indigo-500"
                        src={person.imageUrl}
                        alt={`${person.name} profile`}
                      />
                    </a>
                    <div className="space-y-2">
                      <div className="text-center text-xs font-medium lg:text-sm">
                        <h3>{person.name}</h3>
                        <p className="text-indigo-600">{person.role}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Team;