import { TeamMember, TeamRole, TEAM_ROLES } from '@/types/team';

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Mahsa McCauley",
    roles: ["Trustee", "Ambassador", "Founder and Chair"],
    linkedin: "https://nz.linkedin.com/in/mahsamohaghegh/",
    description:
      "Dr. Mahsa McCauley is the founder and the director of She Sharp, an Associate Professor in the School of Computer, Engineering and Mathematical Sciences at Auckland University of Technology and Chair of the AI Forum New Zealand. An internationally recognised leader in AI and machine learning, Dr. McCauley also serves on the boards of NZTech, EdTechNZ and the AI Research Association, where she contributes to shaping the future of AI policy and research in New Zealand. Internationally, she has engaged as a Fulbright Scholar at North Carolina A&T State University, applying AI to agriculture and cybersecurity challenges.\n\nHer leadership and impact have earned numerous recognitions, including the YWCA Equal Pay Champion Award, Massey University Distinguished Alumni Award, and the Unsung Hero Award at the Women in Security Awards.",
    image: "/img/team/Mahsa.png",
  },
  {
    id: 2,
    name: "Mike McCauley",
    roles: ["Trustee", "Ambassador", "Assets Manager"],
    linkedin: "https://nz.linkedin.com/in/mccauleymichae/",
    description:
      "Mike is a Digital Delivery Manager on the ICT Leadership team at Metlifecare, where he oversees the strategy and delivery of ICT solutions for new builds and property redevelopments. A dedicated advocate for women in tech, Mike has been a member of She Sharp since its inception in 2014. He oversees the charity's finances and physical assets, and is often seen taking photos at She Sharp events.\n\nOutside of his professional life, Mike enjoys time with his family, playing guitar, and has a passion for cooking and all things coffee.",
    image: "/img/team/Mike.png",
  },
  {
    id: 3,
    name: "Raquel Anne Maderazo",
    roles: ["Ambassador", "Event Manager"],
    linkedin: "https://www.linkedin.com/in/raquel-anne-maderazo/",
    description:
      "Raquel is a certified Project Management Professional (PMP®) with a master’s degree in IT Project Management from AUT and over 12 years of experience in the IT industry. She has led network infrastructure, software development, and ERP projects across diverse industries in Europe, UK, US, and Philippines. Known for her adaptability, she strives for project excellence and fosters a collaborative, inclusive work environment. As an event manager at She Sharp, Raquel leverages her project management expertise to plan and organise She Sharp-led conferences & events. Inspired by She Sharp’s mission, she’s passionate about creating a diverse environment where women can grow, learn, and overcome challenges in STEM.",
    image: "/img/team/Raquel.png",
  },
  // {
  //   id: 4,
  //   name: "Isha Sangrolkar",
  //   roles: ["Ambassador", "Website Lead"],
  //   linkedin: "https://www.linkedin.com/in/isha-sangrolkar/",
  //   description:
  //     "Isha is pursuing her Master of Computer and Information Sciences degree at AUT, focusing on expanding her expertise in the field. With a background as a DevOps engineer at Persistent Systems in India, she brings real-world experience and technical insight to her academic journey.\n\nIsha's introduction to She Sharp came through her participation in various events organised at AUT by Dr. Mahsa. Sharing a common mission with She Sharp, Isha is dedicated to promoting gender balance within the tech industry.",
  //   image: "/img/team/Isha.png",
  // },
  {
    id: 5,
    name: "Meeta Patel",
    roles: ["Ambassador", "Industry"],
    linkedin: "https://www.linkedin.com/in/meeta-patel-53105928/",
    description:
      "Dr. Meeta Patel is an experienced scientist with over 20 years of research expertise. As a Senior Scientist and Sustainability Lead at NanoLayr, she developed and implemented the company's sustainability strategy, including eco-friendly packaging. Her PhD in science and background in biopolymers have been invaluable. \n\nDr. Patel has built strong relationships with councils, universities, research institutes, community groups, and organisations, showcasing her collaboration skills. She is active in volunteering, organising community sports, and promoting STEM education. As an industry lead ambassador for SHE Sharp, she leverages her experience in professional and volunteer roles to foster collaboration.",
    image: "/img/team/Meeta.png",
  },
  {
    id: 6,
    name: "Prasanth Pavithran",
    roles: ["Ambassador", "Industry"],
    linkedin: "https://www.linkedin.com/in/prasanth-pavithran-mba-a54ab912/",
    description:
      "Prasanth is an experienced Information Technology and Management professional with over 23 years of global expertise. Originally from Lutyens' Delhi, India, he has called New Zealand home for the past 17 years where he lives with his wife, two children, and their dog.\n\n Currently, he serves as a Senior Business Analyst in the Office of the Chief Technology Officer (OCTO) at Auckland University of Technology (AUT). His career includes past roles as a Capability Manager and management positions for large organisations.\n\n Beyond his professional endeavours, he contributes to the New Zealand community through coaching and mentoring young professionals for over a decade. His community involvement extends to Community Patrols NZ. He joined SheSharp to try and have a wider impact and make a difference for future generations.\n\nIn his personal time, Prasanth enjoys playing badminton and exploring creative writing. As a son, husband, father, and brother, he is committed to sharing his experience while honouring both his heritage and the place he now calls home.",
    image: "/img/team/Prasanth-Pavithran.png",
  },
  {
    id: 7,
    name: "Sara Ghafoor",
    roles: ["Ambassador", "Marketing Lead"],
    linkedin: "https://www.linkedin.com/in/sara-ghafoor/",
    description:
      "Kia ora! I’m Sara Ghafoor, an Electrical Engineer turned AI enthusiast passionate about inclusive tech. At Entelar Group, I support telecom site operations and major rollouts across NZ. I also help lead SheSharp’s events, mentorships, and community initiatives, collaborating with Google, Microsoft, Fonterra, and more. With a background in machine learning, medical imaging, and generative AI, I’m driven by tech that creates real-world impact—whether I’m mentoring at hackathons, managing projects, or running national events.",
    image: "/img/Sara.png",
  },
  {
    id: 8,
    name: "Chan Meng",
    roles: ["Ambassador", "Website Team Lead"],
    linkedin: "https://www.linkedin.com/in/chanmeng666/",
    description:
      "Chan Meng is an AI Agent Architect and full-stack engineer based in Auckland, building at the intersection of AI, cultural technology, and women's health. As She Sharp's Senior Full Stack Engineer and Website Team Lead, she was recruited directly by founder Dr Mahsa Mohaghegh to lead the platform rebuild that now serves 2,200+ members. She holds a Master of Applied Computing with Distinction from Lincoln University, is a UN Women CSW 69 speaker, and received the Outstanding Mentor Award at the 2025 AI Hackathon Festival (AI Forum NZ × She Sharp × AUT). An earliest-ecosystem MCP server author, she architects production AI agents with Next.js, TypeScript, Python, and Kubernetes — and has mentored 800+ women into tech along the way.",
    image: "/img/team/Chan.png",
  },
  {
    id: 9,
    name: "Marriane Bentigan",
    roles: ["Ambassador", "Marketing"],
    linkedin: "https://www.linkedin.com/in/marriane-bentigan-204203220/",
    description:
      "Marriane is a Marketing Specialist at PB Tech who loves bringing creativity and strategy together to make ideas come alive. With years of experience leading marketing programmes across Asia-Pacific, she's now happily growing her career in New Zealand. Passionate about giving back, she supports women in tech and uplifts communities where people feel welcome and inspired. \n\nOutside of work, Marriane is the full-time mediator between her two strong-willed boys and wife, a creative video professional—so her days are often filled with sibling banter, production talk, and the occasional strategic Costco run. Her energy is contagious, and she's always ready to cheer others on and be the hype bud you didn't know you needed.",
    image: "/img/team/Marriane.png",
  }, {
    id: 10,
    name: "Gurleen Kaur",
    roles: ["Ambassador", "Secretary"],
    linkedin: "https://www.linkedin.com/in/leen-kaur/",
    description:
      "Gurleen is a graduating student at Auckland University of Technology, pursuing a Bachelor of Computer and Information Sciences with a major in Software Development and a minor in Data Science. Passionate about empowering women in tech, she volunteers with She Sharp's marketing team, contributing through video editing, content creation, and leveraging her skills in tools like CapCut and Canva. \n\nWith hands-on experience in projects like AI games, web development, and managing YouTube channels with over 10 million views, Gurleen is dedicated to bridging the gender gap in STEM while honing her expertise in programming and data analysis.",
    image: "/img/team/Gurleen.png",
  },
  {
    id: 11,
    name: "Yesha Kaniyawala",
    roles: ["Ambassador", "Website Maintenance"],
    linkedin: "https://www.linkedin.com/in/yeshakaniyawalasoftwareengineer/",
    description:
      "Yesha is an AI/Software Engineer at Possibl.ai who brings passion and real-world experience to She Sharp. Based in Auckland, she loves building AI-enhanced solutions and has worked across diverse tech stacks from web development to machine learning. \n\nAs a She Sharp Ambassador, Yesha is excited to support other women in tech through mentorship and website development, using her own experiences navigating the industry to help create a more inclusive and supportive STEM community.",
    image: "/img/team/Yesha.png",
  },
  {
    id: 12,
    name: "Len Estioko",
    roles: ["Ambassador", "Marketing Lead"],
    linkedin: "https://www.linkedin.com/in/lenestioko/",
    description:
      "Len is a seasoned advertising professional with over a decade of experience leading complex, integrated media campaigns across retail media, digital, Out-of-Home, and traditional channels. Holding a Master's in Management (Marketing), Len is committed to a growth mindset, constantly seeking innovative solutions and embracing new challenges. She finds great honor in supporting the next generation of passionate women in tech through her role as a She Sharp Ambassador. \n\nOutside of her career, Len manages a full-time role as a mom to a very active preschooler, whose boundless curiosity ensures her days are filled with hundreds of questions a day! Drawing on her strengths as a Relator and Developer, she’s always ready to connect deeply and champion the potential she sees in others, making her the purposeful advocate you need in your corner.",
    image: "/img/team/Len.png",
  }
  ,
  {
    id: 13,
    name: "Lesley Gao",
    roles: ["Ambassador", "Website Maintenance"],
    linkedin: "https://www.linkedin.com/in/lesley-gao/",
    description:
      "Lesley Gao is a Product Designer with a background in journalism, web development, and UX/UI design. She has worked across SaaS products, onboarding experiences, and support platforms, including the design and development of the She Sharp website. \n\nShe enjoy simplifying complex workflows and turning them into intuitive digital experiences. Lesley is also passionate about supporting communities and initiatives that empower and connect women in tech across Aotearoa.\n\nOutside of work, she enjoys hiking Auckland’s trails, photography, solving jigsaw puzzles, and building Lego.",
    image: "/img/team/Lesley.png",
  },
  {
    id: 14,
    name: "Nikita Kumari",
    roles: ["Ambassador", "Marketing"],
    linkedin: "https://www.linkedin.com/in/iamnikitakumari/",
    description:
      "Nikita Kumari is a Project Leader passionate about creating meaningful digital experiences. Over the past 5+ years, she has worked across B2B SaaS and AI-driven products and projects, leading cross-functional teams and blending strategy, design, and technology to deliver solutions that genuinely help people. She enjoys simplifying complexity, empowering teams, and turning ideas into impactful, well-executed products.\n\nOriginally from India and now based in New Zealand, Nikita thrives in diverse, collaborative environments where learning never stops. She's passionate about supporting women in tech and believes in sharing knowledge to lift others as she grows. Outside of work, she enjoys exploring cafés, mentoring, and connecting with like-minded communities.",
    image: "/img/team/Nikita.png",
  },
  {
    id: 15,
    name: "Tharaneetharan Thavarasan",
    roles: ["Ambassador", "Events Coordinator"],
    linkedin: "https://www.linkedin.com/in/tharaneetharan-thavarasan-52754940",
    description:
      "Tharaneetharan is a motivated and adaptable IT professional with a strong background in ERP systems, Business Analysis, and Data Analytics. He recently completed a Master of Information Technology, specializing in Data Science and Artificial Intelligence from Auckland Institute of Studies, New Zealand. This academic journey has enabled him to combine his business systems expertise with modern analytical and AI-driven approaches.\n\nHe is passionate about learning emerging technologies and exploring how Data Analytics and Artificial Intelligence can be applied to solve real-world business challenges and create meaningful value for organizations. As an ERP professional, he has worked as a Functional Consultant across SAP FICO, Microsoft Dynamics AX, and Microsoft Dynamics 365 Finance & Operations.\n\nThroughout his career, he has supported finance and supply chain business processes, reporting, system enhancements, migration activities, and end-user support. These experiences have helped him develop a strong understanding of how technology can improve operational efficiency, streamline business processes, and support data-driven decision-making.\n\nAs a She Sharp Ambassador, Tharaneetharan is excited to support women in technology through event coordination, community engagement, and event support activities. He also contributes to monthly newsletter preparation, website testing, and web design improvement initiatives.\n\nHis interests include Data Analytics, Artificial Intelligence, Machine Learning, Data Science, ERP Systems, Business Analytics, Business Technology, Front-end development, Software Testing and Digital Transformation. Outside of work, he enjoys travelling, photography, reading books and newspapers, listening to music, and playing sports. He believes that sports help develop teamwork, discipline, resilience, and a healthy work-life balance. He is also passionate about supporting and helping others in their learning and growth.",
    image: "/img/team/Tharanee.png",
  },
  {
    id: 16,
    name: "Nirmala Chinnappan",
    roles: ["Ambassador", "Event Manager"],
    linkedin: "https://www.linkedin.com/in/nirmalachinnappan/",
    description:
      "Nirmala is an Event and Project Management professional with over 18 years of experience delivering meaningful experiences that connect people, celebrate culture, and drive lasting impact. Her career spans event coordination, project management and IT systems administration; bridging strategy, technology, and community to produce solutions that are both innovative and people-centered. She holds a Master of IT Project Management from Auckland University of Technology, underpinning her practice with academic rigour and strategic depth.\n\nAs Event Manager at She Sharp, Nirmala helps in the planning and execution of She Sharp's signature conferences and events, creating professional platforms where women in STEM can grow, connect, and thrive. Deeply aligned with She Sharp's mission, she is committed to fostering inclusive environments that champion diversity, dismantle barriers, and empower the next generation of women in technology.",
    image: "/img/team/Nirmala.png",
  }
];


/**
 * Find a team member by name
 */
export function getTeamMemberByName(name: string): TeamMember | undefined {
  return teamMembers.find(
    (member) => member.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get team members filtered by role
 */
export function getTeamMembersByRole(role: TeamRole): TeamMember[] {
  return teamMembers.filter((member) => member.roles.includes(role));
}

/**
 * Get featured team members
 */
export function getFeaturedTeamMembers(): TeamMember[] {
  return teamMembers.filter((member) => member.featured);
}

/**
 * Search team members by name, roles, or description
 */
export function searchTeamMembers(query: string): TeamMember[] {
  const searchLower = query.toLowerCase();
  return teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchLower) ||
      member.roles.some((r) => r.toLowerCase().includes(searchLower)) ||
      member.description.toLowerCase().includes(searchLower)
  );
}

/**
 * Get all unique roles from team data
 */
export function getAllTeamRoles(): TeamRole[] {
  const roleSet = new Set<TeamRole>();
  teamMembers.forEach((member) => {
    member.roles.forEach((r) => roleSet.add(r));
  });
  return Array.from(roleSet);
}

/**
 * Get all roles from the TEAM_ROLES constant
 */
export function getTeamRoles(): readonly TeamRole[] {
  return TEAM_ROLES;
}

/**
 * Get team statistics
 */
export function getTeamStats() {
  const byRole: Partial<Record<TeamRole, number>> = {};

  teamMembers.forEach((member) => {
    member.roles.forEach((role) => {
      byRole[role] = (byRole[role] || 0) + 1;
    });
  });

  return {
    total: teamMembers.length,
    byRole,
    featured: teamMembers.filter((m) => m.featured).length,
  };
}
