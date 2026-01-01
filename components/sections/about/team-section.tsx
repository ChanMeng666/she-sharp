// "use client";

// import { Container } from "@/components/layout/container";
// import { Section } from "@/components/layout/section";
// import { Carousel, TestimonialCard, iTestimonial } from "@/components/ui/retro-testimonial";
// import { teamMembers } from "@/lib/data/team";

// export function TeamSection() {
//   const testimonialData: iTestimonial[] = teamMembers.map((member) => ({
//     name: member.name,
//     designation: member.roles.join(", "),
//     description: member.description,
//     profileImage: member.image,
//   }));

//   const cards = testimonialData.map((testimonial, index) => (
//     <TestimonialCard
//       key={`team-${index}`}
//       testimonial={testimonial}
//       index={index}
//       backgroundImage="https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop"
//     />
//   ));

//   return (
//     <Section className="py-16">
//       <Container size="wide">
//         <div className="text-center mb-8 sm:mb-12">
//           <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black">
//             Meet Our People
//           </h2>
//           <p className="mt-6 sm:mt-8 text-base sm:text-lg max-w-2xl mx-auto px-4 sm:px-0 text-black/80">
//             The passionate team of leaders, innovators, and advocates driving
//             change in the tech industry
//           </p>
//         </div>

//         <Carousel items={cards} />
//       </Container>
//     </Section>
//   );
// }
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import Image from "next/image";

const teamMembers = [
  {
    id: 1,
    name: "MAHSA MCCAULEY (MOHAGHEGH)",
    roles: ["Trustee", "Ambassador", "Founder and Chair"],
    description:
      "Dr. Mahsa McCauley is the founder and the director of She Sharp, an Associate Professor in the School of Computer, Engineering and Mathematical Sciences at Auckland University of Technology and Chair of the AI Forum New Zealand. An internationally recognised leader in AI and machine learning, Dr. McCauley also serves on the boards of NZTech, EdTechNZ and the AI Research Association, where she contributes to shaping the future of AI policy and research in New Zealand. Internationally, she has engaged as a Fulbright Scholar at North Carolina A&T State University, applying AI to agriculture and cybersecurity challenges.\n\nHer leadership and impact have earned numerous recognitions, including the YWCA Equal Pay Champion Award, Massey University Distinguished Alumni Award, and the Unsung Hero Award at the Women in Security Awards.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64811ab760ae807f1dc87e65_Team_1_Masha.png",
  },
  {
    id: 2,
    name: "MIKE MCCAULEY",
    roles: ["Trustee", "Ambassador", "Assets Manager"],
    description:
      "Mike is a Digital Delivery Manager on the ICT Leadership team at Metlifecare, where he oversees the strategy and delivery of ICT solutions for new builds and property redevelopments. A dedicated advocate for women in tech, Mike has been a member of She Sharp since its inception in 2014. He oversees the charity's finances and physical assets, and is often seen taking photos at She Sharp events. Outside of his professional life, Mike enjoys time with his family, playing guitar, and has a passion for cooking and all things coffee.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64811c5d42437e3bb5b152b3_Team_2_Mike.png",
  },
  {
    id: 3,
    name: "RAQUEL ANNE MADERAZO",
    roles: ["Ambassador", "Event Manager"],
    description:
      "Raquel is a certified Project Management Professional (PMP®) with a master’s degree in IT Project Management from AUT and over 12 years of experience in the IT industry. She has led network infrastructure, software development, and ERP projects across diverse industries in Europe, UK, US, and Philippines. Known for her adaptability, she strives for project excellence and fosters a collaborative, inclusive work environment. As an event manager at She Sharp, Raquel leverages her project management expertise to plan and organise She Sharp-led conferences & events. Inspired by She Sharp’s mission, she’s passionate about creating a diverse environment where women can grow, learn, and overcome challenges in STEM.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d6b441043c6ce5cc64bcdb_Raquel.png",
  },
  {
    id: 4,
    name: "SABRINA TEOH",
    roles: ["Ambassador", "Event Manager"],
    description:
      "Sabrina is a product development engineer at FPH, known for her passion for learning and self-improvement. She thrives on diverse experiences, from leading agile sprints, operating metal machinery, and soldering circuit boards to completing her first software merge request. These varied challenges have shaped her into a well-rounded professional who values teamwork, collaboration, and guiding conversations to meaningful outcomes.\n\nOutside of work, Sabrina stays active physically and mentally through Pilates, badminton, and learning Korean and software skills. She is deeply committed to empowering women in tech, encouraging others to explore and thrive in the industry.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d7e895dccee90db8608d3e_Sabrina.png",
  },
  {
    id: 5,
    name: "ISHA SANGROLKAR",
    roles: ["Ambassador", "Website Lead"],
    description:
      "Isha is pursuing her Master of Computer and Information Sciences degree at AUT, focusing on expanding her expertise in the field. With a background as a DevOps engineer at Persistent Systems in India, she brings real-world experience and technical insight to her academic journey.\n\nIsha's introduction to She Sharp came through her participation in various events organised at AUT by Dr. Mahsa. Sharing a common mission with She Sharp, Isha is dedicated to promoting gender balance within the tech industry.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/670e25e2f9fe2264ba4018d8_image%20(1).png",
  },
  {
    id: 6,
    name: "ALYSSA PAUSANOS",
    roles: ["Ambassador", "Mentoring Program Lead"],
    description:
      "Alyssa is a Graduate Software Engineer at Vista Group and a first-class honours Software Engineering graduate from Auckland University of Technology. She’s skilled in a variety of programming languages, frameworks, and tech stacks. Outside of work, she enjoys creative pursuits like web design and interior styling, which balance and inspire her technical side. Her journey with She Sharp began through a mentorship programme led by Dr. Mahsa, sparking her passion for supporting more women in STEM",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67229f74af4304fe122b5273_Alyssa.png",
  },
  {
    id: 7,
    name: "MEETA PATEL",
    roles: ["Ambassador", "Industry"],
    description:
      "Dr. Meeta Patel is an experienced scientist with over 20 years of research expertise. As a Senior Scientist and Sustainability Lead at NanoLayr, she developed and implemented the company's sustainability strategy, including eco-friendly packaging. Her PhD in science and background in biopolymers have been invaluable. Dr. Patel has built strong relationships with councils, universities, research institutes, community groups, and organizations, showcasing her collaboration skills. She is active in volunteering, organizing community sports, and promoting STEM education. As an industry lead ambassador for SHE Sharp, she leverages her experience in professional and volunteer roles to foster collaboration.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d67ca7e3a1ff33201a2c10_Meeta.png",
  },
  {
    id: 8,
    name: "SARA GHAFOOR",
    roles: ["Ambassador", "Secretary"],
    description:
      "Kia ora! I’m Sara Ghafoor, an Electrical Engineer turned AI enthusiast passionate about inclusive tech. At Entelar Group, I support telecom site operations and major rollouts across NZ. I also help lead SheSharp’s events, mentorships, and community initiatives, collaborating with Google, Microsoft, Fonterra, and more. With a background in machine learning, medical imaging, and generative AI, I’m driven by tech that creates real-world impact—whether I’m mentoring at hackathons, managing projects, or running national events.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/652774fc247ee7d771e65d2c_Sara.png",
  },
  {
    id: 9,
    name: "CHAN MENG",
    roles: ["Ambassador", "Website Maintenance"],
    description:
      "Full-stack developer and AI/ML specialist with expertise in React, Next.js, TypeScript, Python, and AWS. Currently Senior AI/ML Infrastructure Engineer at Sanicle and She Sharp Ambassador, building scalable AI solutions for workplace health and STEM education. UN CSW 69 speaker and AWS She Builds 2025 mentee, showcasing leadership in tech. Host of 4 Spotify podcasts including Decoding the Future and Future Turing, sharing insights on AI. Passionate mentor supporting 800+ women via Forward with Her and AI Forum NZ. Merges technical leadership with minimalist design to deliver elegant, inclusive solutions.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68d9fdf45b5764dd79558f1e_image%20(4).png",
  },
  {
    id: 10,
    name: "MARRIANE BENTIGAN",
    roles: ["Ambassador", "Marketing Lead"],
    description:
      "Marriane is a Marketing Specialist at PB Tech who loves bringing creativity and strategy together to make ideas come alive. With years of experience leading marketing programs across Asia-Pacific, she’s now happily growing her career in New Zealand. Passionate about giving back, she supports women in tech and uplifts communities where people feel welcome and inspired. Outside of work, Marriane is the full-time mediator between her two strong-willed boys and wife, a creative video professional—so her days are often filled with sibling banter, production talk, and the occasional strategic Costco run. Her energy is contagious, and she’s always ready to cheer others on and be the hype bud you didn’t know you needed.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68d9fe530f9d2f7196f933cd_image%20(5).png",
  },{
    id: 11,
    name: "GURLEEN KAUR",
    roles: ["Ambassador", "Marketing"],
    description:
      "Gurleen is a graduating student at Auckland University of Technology, pursuing a Bachelor of Computer and Information Sciences with a major in Software Development and a minor in Data Science. Passionate about empowering women in tech, she volunteers with She Sharp's marketing team, contributing through video editing, content creation, and leveraging her skills in tools like CapCut and Canva. With hands-on experience in projects like AI games, web development, and managing YouTube channels with over 10 million views, Gurleen is dedicated to bridging the gender gap in STEM while honing her expertise in programming and data analysis.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68d9feacc8aac7e6c251544d_image%20(3).png",
  },
  {
    id: 12,
    name: "YESHA KANIYAWALA",
    roles: ["Ambassador", "Website Maintenance"],
    description:
      "Yesha is an AI/Software Engineer at Possibl.ai who brings passion and real-world experience to She Sharp. Based in Auckland, she loves building AI-enhanced solutions and has worked across diverse tech stacks from web development to machine learning. As a She Sharp Ambassador, Yesha is excited to support other women in tech through mentorship and website development, using her own experiences navigating the industry to help create a more inclusive and supportive STEM community.",
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68d9fedf55c716e90b1fc777_image%20(2).png",
  }
  
];


interface TeamMember {
  id: number;
  name: string;
  roles: string[];
  description: string;
  image: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
}

function TeamMemberCard({ member, index }: TeamMemberCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 使用系统颜色的背景选项
  const backgrounds = [
    "bg-surface-purple",
    "bg-surface-periwinkle",
    "bg-mint-light",
    "bg-surface-purple",
    "bg-surface-periwinkle",
    "bg-mint-light",
  ];

  const background = backgrounds[index % backgrounds.length];

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <article
          onClick={() => setIsDialogOpen(true)}
          className={`group relative ${background} rounded-2xl overflow-hidden
                      transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
                      focus-within:ring-4 focus-within:ring-brand/50 cursor-pointer`}
        >
          <div className="p-6 sm:p-8">
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                {!imageError ? (
                  <img
                    src={member.image}
                    alt={`${member.name}, ${member.roles.join(", ")}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-brand flex items-center justify-center text-brand-foreground text-4xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                {member.name}
              </h3>
              <p className="text-sm sm:text-base font-medium text-brand mb-4">
                {member.roles.join(" • ")}
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                {member.description}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDialogOpen(true);
                }}
                className="text-sm font-medium text-brand hover:text-brand-hover transition-colors underline"
              >
                Learn more
              </button>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </article>

        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto p-8 md:p-10"
          hideCloseButton
        >
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-6 mb-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-brand/20 shrink-0">
                {!imageError ? (
                  <Image
                    src={member.image}
                    alt={`${member.name}, ${member.roles.join(", ")}`}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-brand flex items-center justify-center text-brand-foreground text-3xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {member.name}
                </DialogTitle>
                <p className="text-base md:text-lg font-medium text-brand">
                  {member.roles.join(" • ")}
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription className="text-base text-foreground leading-relaxed whitespace-pre-line">
            {member.description}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TeamSection() {
  const [showAll, setShowAll] = useState(false);
  const displayedMembers = showAll ? teamMembers : teamMembers.slice(0, 6);

  return (
    <section
      className="py-16 lg:py-24 bg-background"
      aria-labelledby="team-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2
            id="team-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6"
          >
            Meet Our People
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto text-muted-foreground leading-relaxed">
            The passionate team of leaders, innovators, and advocates driving
            change in the tech industry
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          role="list"
        >
          {displayedMembers.map((member, index) => (
            <div key={member.id} role="listitem">
              <TeamMemberCard member={member} index={index} />
            </div>
          ))}
        </div>

        {!showAll && teamMembers.length > 6 && (
          <div className="text-center mt-12 lg:mt-16">
            <Button
              onClick={() => setShowAll(true)}
              variant="brand"
              size="lg"
              aria-label={`View all ${teamMembers.length} team members`}
            >
              View All {teamMembers.length} Team Members
            </Button>
          </div>
        )}

        {showAll && teamMembers.length > 6 && (
          <div className="text-center mt-12 lg:mt-16">
            <Button
              onClick={() => {
                setShowAll(false);
                document.getElementById("team-heading")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              variant="outline"
              size="lg"
              className="border-brand text-brand hover:bg-surface-purple hover:text-brand"
              aria-label="Show less team members"
            >
              Show Less
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
