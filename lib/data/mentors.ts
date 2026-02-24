import { Mentor, MentorCategory, Industry, INDUSTRIES, CATEGORY_ICONS } from '@/types/mentor';

export const mentors: Mentor[] = [
  {
    id: 'aishvarya-saraf',
    name: 'Aishvarya Saraf',
    role: 'Human Resources Manager (Advisory)',
    company: 'Fiserv',
    image: '/img/scraped/site/mentorship/65f0b7c3161799543612526c_Aishvarya_Photo_0462b75b.jpg',
    description: 'Aishvarya, a Human Resources Manager at Fiserv, has a people-centric approach and believes in the correlation between employee engagement, productivity, and company success. \n\nMentees can gain from her knowledge of strategic HR initiatives, change management, and employee engagement.',
    expertise: ['Human Resources', 'People Management', 'Organisational Development', 'Employee Engagement'],
    industry: 'Business & Management',
    yearsOfExperience: 10,
    languages: ['English', 'Hindi'],
    linkedIn: 'https://www.linkedin.com/in/aishvarya-s-416bb910a/',
    availability: 'available',
    menteeCount: 5,
    rating: 4.9,
  },
  {
    id: 'alana-hoponoa',
    name: 'Alana Hoponoa',
    role: 'Cloud Services, Sales and FinOps Consultant',
    company: 'OSS Group Ltd',
    image: '/img/scraped/site/mentorship/66e4f54c5fb03ae45239d90e_Alana_Photo_df1fa2a4.jpg',
    description: 'Alana is a passionate and driven ICT professional, currently working as a Cloud Services, Sales, and FinOps Consultant. With over 20 years of experience in the ICT industry, her career spans roles with service providers, end users, resellers, and distributors. Alana has built strong, trusted relationships within the channel community, driven by her commitment to delivering exceptional results for her customers.',
    expertise: ['Cloud Computing', 'FinOps', 'Sales Strategy', 'AWS', 'Azure'],
    industry: 'Technology',
    yearsOfExperience: 8,
    languages: ['English'],
    linkedIn: 'https://www.linkedin.com/in/alana-hoponoa/',
    availability: 'available',
    menteeCount: 3,
    rating: 4.8,
  },
  {
    id: 'anshu-maharaj',
    name: 'Anshu Maharaj',
    role: 'Product Manager',
    company: 'MYOB',
    image: '/img/scraped/site/mentorship/65f7d581ab77ff98f436f102_Anshu_Photo_59560633.jpg',
    description: 'Anshu  is a highly experienced product manager with over 20 years of experience in managing products for Enterprise SaaS and on-premises customers. Anshu has worked in a variety of industries, including Transport, Taxation & Compliance, Payroll, Records Management, Identity Services, Border Security and Passenger Management, and GIS. \n\nWith hands-on experience in DevOps and Azure hosting platforms, Anshu excels in leveraging cutting-edge technology for optimal results. As a dynamic leader and research professional, she has spearheaded numerous successful Agile and Waterfall-driven initiatives. Anshu\'s commitment to excellence and her proactive approach to staying updated on industry trends make her a valuable asset to any team.',
    expertise: ['Product Management', 'SaaS', 'Enterprise Software', 'Agile', 'Strategy'],
    industry: 'Technology',
    yearsOfExperience: 20,
    languages: ['English', 'Hindi'],
    linkedIn: 'https://www.linkedin.com/in/anshu-maharaj-4b715a27/',
    availability: 'busy',
    menteeCount: 8,
    rating: 5.0,
  },
  {
    id: 'donna-chamberlain',
    name: 'Donna Chamberlain',
    role: 'Senior Business Solutions Manager',
    company: 'Fisher & Paykel Healthcare',
    image: '/img/scraped/site/mentorship/65e53d5bb5ef17c52bf98dcf_Donna_Photo_6fe252a0.jpg',
    description: 'Donna Chamberlain, as Senior Business Solutions Manager at Fisher & Paykel Healthcare and NZSUG Treasurer, expertly balances the growth of SAP and Salesforce within the company while fostering team development. Her leadership is marked by strategic thinking, empathy, and a commitment to innovation, ensuring her team excels in delivering sustainable business solutions. \n\nWith a passion for the SAP community and continuous improvement, Donna\'s role extends beyond her day-to-day tasks, embodying leadership that is both visionary and grounded in practicality.',
    expertise: ['Business Solutions', 'Healthcare Technology', 'SAP', 'Process Improvement'],
    industry: 'Healthcare',
    yearsOfExperience: 15,
    languages: ['English'],
    linkedIn: 'https://www.linkedin.com/in/donna-chamberlain-9408162/',
    availability: 'available',
    menteeCount: 4,
    rating: 4.7,
  },
  {
    id: 'farhan-sattar',
    name: 'Farhan Sattar',
    role: 'Technical Trainer',
    company: 'Microsoft',
    image: '/img/scraped/site/mentorship/66011a4d5ec3e645d1508707_Farhan_Photo_4d22cb7e.jpg',
    description: 'With over 25 years in the IT industry, Farhan is a seasoned Business Programme Manager and Learning & Development Technical Trainer at Microsoft. He blends deep technical expertise with a passion for growth. His background spans technical consulting, programme management, and strategic development, with successful projects across sectors like NHS and Auckland Council. \n\nHolding multiple industry certifications, he\'s committed to staying ahead of tech trends, empowering through collaborative programme development. Renowned for organisational agility and translating complexities into strategic plans, Farhan inspires a culture of learning. His mission: empower organisations and individuals to leverage Microsoft technologies for transformative growth.',
    expertise: ['Technical Training', 'Microsoft Technologies', 'Learning & Development', 'Cloud Computing'],
    industry: 'Technology',
    yearsOfExperience: 25,
    languages: ['English', 'Urdu'],
    linkedIn: 'https://www.linkedin.com/in/farhansattar/',
    availability: 'available',
    menteeCount: 12,
    rating: 4.9,
  },
  {
    id: 'kriv-naicker',
    name: 'Kriv Naicker',
    role: 'Managing Director',
    company: 'Synaptec NZ',
    image: '/img/scraped/site/mentorship/66f5f00b3944ec082bf229cb_Kriv_Photo_1_ae60403e.jpg',
    description: 'Kriv Naicker is the Founder and Managing Director of Synaptec – an innovation and strategy advisory organisation that focuses on the impact of Disruptive Technology, the Internet of Things, Cloud/Fog/Edge Computing, 5G, Artificial Intelligence and Machine Learning, Augmented/Virtual/Mixed Reality, Drones/ UAVs. \n\nKriv was also instrumental in the formation of the NZ IoT (Internet of Things) Alliance and served as the Alliance’s first Executive Director and is currently Board Chair.',
    expertise: ['Innovation', 'Strategy', 'Digital Transformation', 'Leadership', 'Entrepreneurship'],
    industry: 'Consulting',
    yearsOfExperience: 18,
    languages: ['English'],
    linkedIn: 'https://www.linkedin.com/in/kriv-naicker/',
    availability: 'available',
    menteeCount: 6,
    rating: 5.0,
  },
  {
    id: 'laura-rutherfurd',
    name: 'Laura Rutherfurd',
    role: 'Risk & Compliance Manager',
    company: 'MYOB',
    image: '/img/scraped/site/mentorship/67dcc2787ef23b701467071a_Laura_Photo_d10bc0e3.jpg',
    description: 'Laura is dedicated to helping customers thrive by simplifying business processes for internal and external stakeholders. As a Risk & Compliance Manager, she leads teams with integrity, ensuring top compliance and risk management standards. She understands the importance of mitigating non-compliance risks and the benefits of strong risk management, including enhanced product quality and customer satisfaction.\n\nWith a background in coaching, Laura mentors and develops team members, fostering personal and professional growth. She thrives on collaboration, securing leadership support, and tailoring communication to engage various audiences. Through assessments, training, and dialogue, she helps organisations address risks, cultivating a culture of trust and excellence. \n\nOutside of work, Laura enjoys trails with family, including her two dogs. These adventures provide balance and fresh perspectives, enriching her personal and professional life. She believes a well-rounded approach leads to success and fulfilment.',
    expertise: ['Risk Management', 'Compliance', 'Process Improvement', 'Governance'],
    industry: 'Business & Management',
    yearsOfExperience: 12,
    languages: ['English'],
    linkedIn: 'https://www.linkedin.com/in/laura-rutherfurd-338ab81b/',
    availability: 'available',
    menteeCount: 3,
    rating: 4.8,
  },
  {
    id: 'mahsa-mccauley',
    name: 'Mahsa McCauley (Mohaghegh)',
    role: 'Founder/Director',
    company: 'She Sharp',
    image: '/img/scraped/site/mentorship/65f0a4636161c0e53f5267ee_Mahsa_Photo_3_be94815f.jpg',
    description: 'Dr. Mahsa McCauley is the founder and the director of She Sharp , an Associate Professor in the School of Computer, Engineering and Mathematical Sciences at Auckland University of Technology and Chair of the AI Forum New Zealand. An internationally recognised leader in AI and machine learning, Dr. McCauley also serves on the boards of NZTech, EdTechNZ and the AI Research Association, where she contributes to shaping the future of AI policy and research in New Zealand. Internationally, she has engaged as a Fulbright Scholar at North Carolina A&T State University, applying AI to agriculture and cybersecurity challenges.\n\nHer leadership and impact have earned numerous recognitions, including the YWCA Equal Pay Champion Award, Massey University Distinguished Alumni Award, and the Unsung Hero Award at the Women in Security Awards.',
    expertise: ['Leadership', 'Women in Tech', 'Education', 'Research', 'Community Building'],
    industry: 'Education',
    yearsOfExperience: 15,
    languages: ['English', 'Persian'],
    linkedIn: 'https://www.linkedin.com/in/mahsamohaghegh/',
    availability: 'busy',
    menteeCount: 20,
    rating: 5.0,
  },
  {
    id: 'meena-vallabh',
    name: 'Meena Vallabh',
    role: 'General Manager - Services Development',
    company: 'Stroke Foundation of New Zealand',
    image: '/img/scraped/site/mentorship/6826f5bdf7fa544c51e1fb74_Meena_Photo_7177e306.jpg',
    description: 'Meena joined Stroke Aotearoa New Zealand in 2024. Shas over 25 years in health having started as a pharmacist and over time moving into strategy, service design/ innovation in health systems. \n\nMeena values enduring relationships and is motivated by opportunities to deliver meaningful change that will achieve equity for priority populations and improve outcomes for New Zealanders. \n\nMeena in her role as General Manager Services Development is responsible for the development and execution of a comprehensive services development strategy (including advocacy) aligned with Stroke Aotearoa\'s mission to prevent stroke and improve lives.',
    expertise: ['Healthcare Management', 'Service Development', 'Strategic Planning', 'Public Health'],
    industry: 'Healthcare',
    yearsOfExperience: 25,
    languages: ['English', 'Hindi'],
    linkedIn: 'https://www.linkedin.com/in/meena-vallabh-213ba255/',
    availability: 'available',
    menteeCount: 4,
    rating: 4.9,
  },
  {
    id: 'meeta-patel',
    name: 'Meeta Patel',
    role: 'Technical Advisor',
    company: 'Freelance',
    image: '/img/scraped/site/mentorship/6602333b1f0943e4ca77cdae_Meeta_Photo_1_f8e670f7.jpg',
    description: 'Having worked as a research scientist for most of her career at Scion, and served as NanoLayr\'s Senior Scientist and Sustainability Lead, Meeta spearheaded the development of the company\'s sustainability strategy, implementing goals and sourcing eco-friendly solutions. Her PhD in Chemistry from The University of Auckland, along with her expertise in biopolymers, was instrumental. \n\nWith over 20 years in the industry, she has forged strong partnerships with councils, universities, and research institutes. Previously, as Research & Production Manager at Biopolymer Network Ltd., Meeta managed various aspects of the product EcoBeans, showcasing her proficiency in research, production, packaging, marketing, and logistics.',
    expertise: ['Research & Development', 'Materials Science', 'Technical Advisory', 'Innovation'],
    industry: 'Consulting',
    yearsOfExperience: 20,
    languages: ['English', 'Gujarati'],
    linkedIn: 'https://www.linkedin.com/in/meeta-patel-53105928/',
    availability: 'available',
    menteeCount: 2,
    rating: 4.7,
  },
  {
    id: 'mehwish-hasan',
    name: 'Mehwish Hasan',
    role: 'ICT leader',
    company: 'ACG Schools',
    image: '/img/scraped/site/mentorship/66e4f6c822fd5a8e2a0ace27_Mehwish_Photo_62b56523.jpg',
    description: 'Mehwish Hasan, a devoted educator, and the Computer Science Curriculum Leader at ACG Sunderland in Auckland is on a mission to bring excitement to the students\' learning experiences. With a background in telecommunications engineering, Mehwish\'s unique perspective has led her to become New Zealand\'s inaugural QuiverVision Ambassador. This distinctive role empowers her to weave technology into education truly remarkably. Through the Quiver App, students can transform static, coloured images into dynamic, interactive marvels through augmented reality. This ingenious approach sparks creativity and guarantees that learning remains engaging and enjoyable.',
    expertise: ['Education Technology', 'Computer Science', 'Curriculum Development', 'Leadership'],
    industry: 'Education',
    yearsOfExperience: 10,
    languages: ['English', 'Urdu'],
    linkedIn: 'https://www.linkedin.com/in/mehwishhasan55/',
    availability: 'available',
    menteeCount: 7,
    rating: 4.8,
  },
  {
    id: 'midu-chandra',
    name: 'Midu Chandra',
    role: 'General Manager',
    company: 'Datacom',
    image: '/img/scraped/site/mentorship/66d789e3800fba6d4a4cb025_Midu_Photo_0f2d3900.jpg',
    description: 'Midu has been working within the strategy, product, technology, marketing, and digital industries across Australia and New Zealand for over 25 years. His roles have focused on building high-growth and sustainable businesses, bringing a good balance of startup and corporate experience.',
    expertise: ['Strategy', 'Digital Transformation', 'Product Management', 'Marketing', 'Leadership'],
    industry: 'Technology',
    yearsOfExperience: 18,
    languages: ['English'],
    linkedIn: 'https://www.linkedin.com/in/miduchandra/',
    availability: 'busy',
    menteeCount: 9,
    rating: 4.9,
  },
  {
    id: 'prasanth-pavithran',
    name: 'Prasanth Pavithran',
    role: 'Senior Business Analyst',
    company: 'Office of the CTO at AUT',
    image: '/img/scraped/site/mentorship/67ee141cce99e214bc54b91f_Prasanth_Photo_c221c95c.jpg',
    description: 'Prasanth is an experienced Information Technology and Management professional with over 23 years of global expertise. Originally from Lutyens\' Delhi, India, he has called New Zealand home for the past 17 years where he lives with his wife, two children, and their dog. \n\nCurrently, he serves as a Senior Business Analyst in the Office of the Chief Technology Officer (OCTO) at Auckland University of Technology (AUT). His career includes past roles as a Capability Manager and management positions for large organisations.\n\nBeyond his professional endeavours, he contributes to the New Zealand community through coaching and mentoring young professionals for over a decade. His community involvement extends to Community Patrols NZ. He joined SheSharp to try and have a wider impact and make a difference for future generations. \n\nIn his personal time, Prasanth enjoys playing badminton and exploring creative writing. As a son, husband, father, and brother, he is committed to sharing his experience while honouring both his heritage and the place he now calls home.',
    expertise: ['Business Analysis', 'IT Management', 'Digital Transformation', 'Project Management'],
    industry: 'Technology',
    yearsOfExperience: 23,
    languages: ['English', 'Malayalam'],
    linkedIn: 'https://www.linkedin.com/in/prasanth-pavithran-mba-a54ab912/',
    availability: 'available',
    menteeCount: 5,
    rating: 4.8,
  },
  {
    id: 'shree-jaiswal',
    name: 'Shree Jaiswal',
    role: 'Enterprise Account Manager',
    company: 'MYOB',
    image: '/img/scraped/site/mentorship/67e5e25efc94d5320319d873_Shree_Photo_2f8ec78e.jpg',
    description: 'Shree Jaiswal is a dynamic Enterprise Account Manager at MYOB, with extensive experience in sales, account management, and partner relationship management. She specialises in helping businesses leverage innovative financial solutions to drive growth and efficiency. Throughout her career, Shree has worked closely with MYOB partners, supporting them in navigating business challenges and strengthening their market presence. \n\nWith a passion for coaching and leadership development, Shree actively mentors sales specialists and partners, guiding them toward success. Her ability to build strong relationships, communicate effectively, and solve complex challenges has made her a trusted advisor in the tech industry. \n\nShree was recognised for her outstanding performance at MYOB, being selected for the prestigious Supercharged High-Performance Programme, an achievement earned by only the top 4% of employees. Additionally, she was a finalist for the MYOB Women in Tech Awards, showcasing her contributions to diversity and inclusion in the industry. \n\nAs a She Sharp mentor, Shree is committed to empowering individuals by sharing her expertise, fostering confidence, and providing practical career guidance. She believes in leading by example, helping mentees set ambitious yet achievable goals, and supporting them in building the skills needed to thrive in the tech industry.\n\nShree\'s mentorship style is calm, approachable, and results-driven—she thrives in guiding others through challenges, equipping them with the tools to grow, and inspiring them to take charge of their careers. She is excited to be part of the She Sharp Mentorship Programme and looks forward to making a meaningful impact on the next generation of tech professionals.',
    expertise: ['Sales', 'Account Management', 'Enterprise Software', 'Relationship Building'],
    industry: 'Business & Management',
    yearsOfExperience: 12,
    languages: ['English', 'Hindi'],
    linkedIn: 'https://www.linkedin.com/in/shree-jaiswal-375b4337/',
    availability: 'available',
    menteeCount: 4,
    rating: 4.7,
  },
  {
    id: 'shweta-sharma',
    name: 'Shweta Sharma',
    role: 'Product Owner | Business Consultant',
    company: 'Quanton',
    image: '/img/scraped/site/mentorship/66e4fba3ec07c3fa3fd4bf96_Shweta_Photo_b89a9bb5.jpg',
    description: 'Shweta is a Product Owner and Consultant at Quanton, leading AI Product Services with a focus on Business Process Automation (BPA/RPA) and Continuous Improvement (CI) initiatives. With a deep understanding of the evolving business landscape, Shweta excels in aligning AI solutions with clients\' strategic objectives, delivering impactful and measurable outcomes. Specializing in navigating the complexities of AI-driven transformation, she is dedicated to driving continuous improvement and innovation.',
    expertise: ['Product Ownership', 'AI/ML', 'Business Intelligence', 'Consulting', 'Agile'],
    industry: 'Consulting',
    yearsOfExperience: 14,
    languages: ['English', 'Hindi'],
    linkedIn: 'https://linkedin.com/in/shweta-sharma',
    availability: 'available',
    menteeCount: 6,
    rating: 4.9,
  },
  {
    id: 'steffie-lopez',
    name: 'Steffie López',
    role: 'Chief of Staff to the CIO',
    company: 'Fonterra',
    image: '/img/scraped/site/mentorship/65efd0d35637569fe2814aab_Stephanie_Photo_5773ab2c.jpg',
    description: 'Steffie is the Chief of Staff for IT at Fonterra. We serve our 10,500 farmer owners with digital solutions underpinning the transformation of 16.6 Billion litres of milk per annum into 30% of the world’s dairy exports. Steffie works closely with executives and partners to deliver strategic outcomes across all areas of technology. In addition, she offers over seven years in technology transformation management consulting. She has a formative background as an internationally experienced Senior Technical Business Analyst winning the PMO of the Year at the Irish PMI National Project Awards in 2019. She brings a versatile blend of business acumen, technology insight, and technical delivery. As a young woman in IT and champion of diversity, she seeks to provide guidance and support to new talent as they navigate the complexities of the corporate world. She’s also a pretty good shot at pool.',
    expertise: ['IT Leadership', 'Digital Strategy', 'Change Management', 'Executive Support'],
    industry: 'Technology',
    yearsOfExperience: 16,
    languages: ['English', 'Spanish'],
    linkedIn: 'https://www.linkedin.com/in/stephaniechoy/',
    availability: 'busy',
    menteeCount: 3,
    rating: 5.0,
  },
  {
    id: 'tracey-connor',
    name: 'Tracey Connor',
    role: 'Digital Test and Release Manager',
    company: 'Fonterra',
    image: '/img/scraped/site/mentorship/65efd23750b6ef0921c40f00_Tracey_Photo_7bcf37c6.jpg',
    description: 'Tracey has 15+ years\’ experience as an IT people, thought and technical leader across Test, Release, Development, Build and DevOps capabilities and is experienced in resource planning, recruitment, and development of capabilities. She is an advocate of business-outcome delivery utilizing agile and lean delivery approaches with a passion for continuous delivery and automation. She loves designing and implementing Agile/DevOps delivery systems at scale. \n\nShe brings out the very best in people, loves diversity and relishes a challenge. Through adaptive leadership she enjoys nurturing, leading, building and developing high performing engineering teams. With a Green Belt in Lean Six Sigma, she recognizes continuous improvement as a team sport! Tracey has held international management positions at JP Morgan and Deloitte – her current role is building up a practice of awesome platform and release engineers at Fonterra.',
    expertise: ['Test Management', 'Release Management', 'DevOps', 'Team Leadership', 'Quality Assurance'],
    industry: 'Technology',
    yearsOfExperience: 15,
    languages: ['English'],
    linkedIn: 'https://www.linkedin.com/in/tracey-connor-6573ab6/',
    availability: 'available',
    menteeCount: 5,
    rating: 4.8,
  },
  {
    id: 'yvonne-weidemann',
    name: 'Yvonne Weidemann',
    role: 'Business Analyst',
    company: 'MYOB',
    image: '/img/scraped/site/mentorship/65f93c30c7cfd863ae48258e_Yvonne_Photo_bd2d1474.jpg',
    description: 'Yvonne is a versatile Business Analyst specialising in Requirements Gathering, Process Improvement, and Stakeholder Communication. With expertise in Functional Testing, Risk Assessment, and User Experience Design, she ensures software projects meet stakeholder expectations. \n\nProficient in Agile methodologies, she facilitates scrum rituals and champions continuous improvement initiatives. Yvonne excels in documentation, change management, and stays updated on industry trends to drive innovation in software development processes.',
    expertise: ['Business Analysis', 'Requirements Gathering', 'Process Improvement', 'Stakeholder Management'],
    industry: 'Business & Management',
    yearsOfExperience: 10,
    languages: ['English', 'German'],
    linkedIn: 'https://www.linkedin.com/in/yvonne-weidemann-icp-apo-icp-apm-a5a11a35/',
    availability: 'available',
    menteeCount: 2,
    rating: 4.6,
  },
];

// ============================================
// Helper Functions for Mentor Data Management
// ============================================

/**
 * Get mentor by ID
 */
export function getMentorById(id: string): Mentor | undefined {
  return mentors.find(mentor => mentor.id === id);
}

/**
 * Get mentors by industry
 */
export function getMentorsByIndustry(industry: Industry): Mentor[] {
  return mentors.filter(mentor => mentor.industry === industry);
}

/**
 * Get mentors by expertise area
 */
export function getMentorsByExpertise(expertise: string): Mentor[] {
  return mentors.filter(mentor =>
    mentor.expertise.some(e => e.toLowerCase().includes(expertise.toLowerCase()))
  );
}

/**
 * Search mentors by name, role, company, or expertise
 */
export function searchMentors(query: string): Mentor[] {
  const searchLower = query.toLowerCase();
  return mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchLower) ||
    mentor.role.toLowerCase().includes(searchLower) ||
    mentor.company.toLowerCase().includes(searchLower) ||
    mentor.expertise.some(e => e.toLowerCase().includes(searchLower))
  );
}

/**
 * Get all unique expertise areas from mentor data
 */
export function getAllExpertiseAreas(): string[] {
  const expertiseSet = new Set<string>();
  mentors.forEach(mentor => {
    mentor.expertise.forEach(e => expertiseSet.add(e));
  });
  return Array.from(expertiseSet).sort();
}

/**
 * Get all industries from the INDUSTRIES constant
 */
export function getIndustries(): readonly string[] {
  return INDUSTRIES;
}

/**
 * Get available mentors
 */
export function getAvailableMentors(): Mentor[] {
  return mentors.filter(mentor => mentor.availability === 'available');
}

/**
 * Get mentor categories with dynamically calculated counts
 */
export function getMentorCategories(): MentorCategory[] {
  const industryCount = new Map<string, number>();

  mentors.forEach(mentor => {
    industryCount.set(
      mentor.industry,
      (industryCount.get(mentor.industry) || 0) + 1
    );
  });

  const categories: MentorCategory[] = [
    { id: 'all', name: 'All Mentors', mentorCount: mentors.length },
  ];

  // Add categories for industries that have mentors
  if (industryCount.get('Technology')) {
    categories.push({
      id: 'technology',
      name: 'Technology',
      icon: CATEGORY_ICONS['technology'],
      mentorCount: industryCount.get('Technology') || 0,
    });
  }
  if (industryCount.get('Business & Management')) {
    categories.push({
      id: 'business',
      name: 'Business & Management',
      icon: CATEGORY_ICONS['business'],
      mentorCount: industryCount.get('Business & Management') || 0,
    });
  }
  if (industryCount.get('Healthcare')) {
    categories.push({
      id: 'healthcare',
      name: 'Healthcare',
      icon: CATEGORY_ICONS['healthcare'],
      mentorCount: industryCount.get('Healthcare') || 0,
    });
  }
  if (industryCount.get('Education')) {
    categories.push({
      id: 'education',
      name: 'Education',
      icon: CATEGORY_ICONS['education'],
      mentorCount: industryCount.get('Education') || 0,
    });
  }
  if (industryCount.get('Consulting')) {
    categories.push({
      id: 'consulting',
      name: 'Consulting',
      icon: CATEGORY_ICONS['consulting'],
      mentorCount: industryCount.get('Consulting') || 0,
    });
  }

  return categories;
}

/**
 * Get mentor statistics
 */
export function getMentorStats() {
  const byIndustry: Record<string, number> = {};
  let totalExperience = 0;
  let availableCount = 0;

  mentors.forEach(mentor => {
    byIndustry[mentor.industry] = (byIndustry[mentor.industry] || 0) + 1;
    totalExperience += mentor.yearsOfExperience;
    if (mentor.availability === 'available') {
      availableCount++;
    }
  });

  return {
    total: mentors.length,
    available: availableCount,
    byIndustry,
    averageExperience: Math.round(totalExperience / mentors.length),
  };
}