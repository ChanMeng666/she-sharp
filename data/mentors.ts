import { Mentor, MentorCategory, Industry, INDUSTRIES, CATEGORY_ICONS } from '@/types/mentor';

export const mentors: Mentor[] = [
  {
    id: 'aishvarya-saraf',
    name: 'Aishvarya Saraf',
    role: 'Human Resources Manager (Advisory)',
    company: 'Fiserv',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65f0b7c3161799543612526c_Aishvarya%20Photo.jpg',
    description: 'Aishvarya, a Human Resources Manager at Fiserv, has a people-centric approach and believes in the correlation between employee satisfaction and organizational success.',
    expertise: ['Human Resources', 'People Management', 'Organizational Development', 'Employee Engagement'],
    industry: 'Business & Management',
    yearsOfExperience: 10,
    languages: ['English', 'Hindi'],
    linkedIn: 'https://linkedin.com/in/aishvarya-saraf',
    availability: 'available',
    menteeCount: 5,
    rating: 4.9,
  },
  {
    id: 'alana-hoponoa',
    name: 'Alana Hoponoa',
    role: 'Cloud Services, Sales and FinOps Consultant',
    company: 'OSS Group Ltd',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66e4f54c5fb03ae45239d90e_Alana%20Photo.jpg',
    description: 'Alana is a passionate and driven ICT professional, currently working as a Cloud Services, Sales, and FinOps Consultant.',
    expertise: ['Cloud Computing', 'FinOps', 'Sales Strategy', 'AWS', 'Azure'],
    industry: 'Technology',
    yearsOfExperience: 8,
    languages: ['English'],
    availability: 'available',
    menteeCount: 3,
    rating: 4.8,
  },
  {
    id: 'anshu-maharaj',
    name: 'Anshu Maharaj',
    role: 'Product Manager',
    company: 'MYOB',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65f7d581ab77ff98f436f102_Anshu%20Photo.jpg',
    description: 'Anshu is a highly experienced product manager with over 20 years of experience in managing products for Enterprise SaaS companies.',
    expertise: ['Product Management', 'SaaS', 'Enterprise Software', 'Agile', 'Strategy'],
    industry: 'Technology',
    yearsOfExperience: 20,
    languages: ['English', 'Hindi'],
    availability: 'busy',
    menteeCount: 8,
    rating: 5.0,
  },
  {
    id: 'donna-chamberlain',
    name: 'Donna Chamberlain',
    role: 'Senior Business Solutions Manager',
    company: 'Fisher & Paykel Healthcare',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65e53d5bb5ef17c52bf98dcf_Donna%20Photo.jpg',
    description: 'Donna Chamberlain, as Senior Business Solutions Manager at Fisher & Paykel Healthcare and NZSUG Treasurer, expertly manages business solutions.',
    expertise: ['Business Solutions', 'Healthcare Technology', 'SAP', 'Process Improvement'],
    industry: 'Healthcare',
    yearsOfExperience: 15,
    languages: ['English'],
    availability: 'available',
    menteeCount: 4,
    rating: 4.7,
  },
  {
    id: 'farhan-sattar',
    name: 'Farhan Sattar',
    role: 'Technical Trainer',
    company: 'Microsoft',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66011a4d5ec3e645d1508707_Farhan%20Photo.jpg',
    description: 'With over 25 years in the IT industry, Farhan is a seasoned Business Program Manager and Learning & Development specialist.',
    expertise: ['Technical Training', 'Microsoft Technologies', 'Learning & Development', 'Cloud Computing'],
    industry: 'Technology',
    yearsOfExperience: 25,
    languages: ['English', 'Urdu'],
    availability: 'available',
    menteeCount: 12,
    rating: 4.9,
  },
  {
    id: 'kriv-naicker',
    name: 'Kriv Naicker',
    role: 'Managing Director',
    company: 'Synaptec NZ',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66f5f00b3944ec082bf229cb_Kriv%20Photo%20(1).jpg',
    description: 'Kriv Naicker is the Founder and Managing Director of Synaptec – an innovation and strategy advisory organisation.',
    expertise: ['Innovation', 'Strategy', 'Digital Transformation', 'Leadership', 'Entrepreneurship'],
    industry: 'Consulting',
    yearsOfExperience: 18,
    languages: ['English'],
    availability: 'available',
    menteeCount: 6,
    rating: 5.0,
  },
  {
    id: 'laura-rutherfurd',
    name: 'Laura Rutherfurd',
    role: 'Risk & Compliance Manager',
    company: 'MYOB',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67dcc2787ef23b701467071a_Laura%20Photo.jpg',
    description: 'Laura is dedicated to helping customers thrive by simplifying business processes for internal and external stakeholders.',
    expertise: ['Risk Management', 'Compliance', 'Process Improvement', 'Governance'],
    industry: 'Business & Management',
    yearsOfExperience: 12,
    languages: ['English'],
    availability: 'available',
    menteeCount: 3,
    rating: 4.8,
  },
  {
    id: 'mahsa-mccauley',
    name: 'Mahsa McCauley (Mohaghegh)',
    role: 'Founder/Director',
    company: 'She Sharp',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65f0a4636161c0e53f5267ee_Mahsa%20Photo%20(3).jpg',
    description: 'Dr Mahsa McCauley is a Senior Lecturer in AUT\'s School of Computer, Engineering, and Mathematical Sciences.',
    expertise: ['Leadership', 'Women in Tech', 'Education', 'Research', 'Community Building'],
    industry: 'Education',
    yearsOfExperience: 15,
    languages: ['English', 'Persian'],
    availability: 'busy',
    menteeCount: 20,
    rating: 5.0,
  },
  {
    id: 'meena-vallabh',
    name: 'Meena Vallabh',
    role: 'General Manager - Services Development',
    company: 'Stroke Foundation of New Zealand',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6826f5bdf7fa544c51e1fb74_Meena%20Photo.jpg',
    description: 'Meena joined Stroke Aotearoa New Zealand in 2024. She has over 25 years in health services development.',
    expertise: ['Healthcare Management', 'Service Development', 'Strategic Planning', 'Public Health'],
    industry: 'Healthcare',
    yearsOfExperience: 25,
    languages: ['English', 'Hindi'],
    availability: 'available',
    menteeCount: 4,
    rating: 4.9,
  },
  {
    id: 'meeta-patel',
    name: 'Meeta Patel',
    role: 'Technical Advisor',
    company: 'Freelance',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6602333b1f0943e4ca77cdae_Meeta%20Photo%20(1).jpg',
    description: 'Having worked as a research scientist for most of her career at Scion, and served as NanoLayr\'s Senior Scientist.',
    expertise: ['Research & Development', 'Materials Science', 'Technical Advisory', 'Innovation'],
    industry: 'Consulting',
    yearsOfExperience: 20,
    languages: ['English', 'Gujarati'],
    availability: 'available',
    menteeCount: 2,
    rating: 4.7,
  },
  {
    id: 'mehwish-hasan',
    name: 'Mehwish Hasan',
    role: 'ICT leader',
    company: 'ACG Schools',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66e4f6c822fd5a8e2a0ace27_Mehwish%20Photo.jpg',
    description: 'Mehwish Hasan, a devoted educator, and the Computer Science Curriculum Leader at ACG Sunderland in Auckland.',
    expertise: ['Education Technology', 'Computer Science', 'Curriculum Development', 'Leadership'],
    industry: 'Education',
    yearsOfExperience: 10,
    languages: ['English', 'Urdu'],
    availability: 'available',
    menteeCount: 7,
    rating: 4.8,
  },
  {
    id: 'midu-chandra',
    name: 'Midu Chandra',
    role: 'General Manager',
    company: 'Datacom',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d789e3800fba6d4a4cb025_Midu%20Photo.jpg',
    description: 'Midu has been working within the strategy, product, technology, marketing, and digital industries across Australia and New Zealand.',
    expertise: ['Strategy', 'Digital Transformation', 'Product Management', 'Marketing', 'Leadership'],
    industry: 'Technology',
    yearsOfExperience: 18,
    languages: ['English'],
    availability: 'busy',
    menteeCount: 9,
    rating: 4.9,
  },
  {
    id: 'prasanth-pavithran',
    name: 'Prasanth Pavithran',
    role: 'Senior Business Analyst',
    company: 'Office of the CTO at AUT',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67ee141cce99e214bc54b91f_Prasanth%20Photo.jpg',
    description: 'Prasanth is an experienced Information Technology and Management professional with over 23 years of global experience.',
    expertise: ['Business Analysis', 'IT Management', 'Digital Transformation', 'Project Management'],
    industry: 'Technology',
    yearsOfExperience: 23,
    languages: ['English', 'Malayalam'],
    availability: 'available',
    menteeCount: 5,
    rating: 4.8,
  },
  {
    id: 'shree-jaiswal',
    name: 'Shree Jaiswal',
    role: 'Enterprise Account Manager',
    company: 'MYOB',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67e5e25efc94d5320319d873_Shree%20Photo.jpg',
    description: 'Shree Jaiswal is a dynamic Enterprise Account Manager at MYOB, with extensive experience in sales, account management.',
    expertise: ['Sales', 'Account Management', 'Enterprise Software', 'Relationship Building'],
    industry: 'Business & Management',
    yearsOfExperience: 12,
    languages: ['English', 'Hindi'],
    availability: 'available',
    menteeCount: 4,
    rating: 4.7,
  },
  {
    id: 'shweta-sharma',
    name: 'Shweta Sharma',
    role: 'Product Owner | Business Consultant',
    company: 'Quanton',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66e4fba3ec07c3fa3fd4bf96_Shweta%20Photo.jpg',
    description: 'Shweta is a Product Owner and Consultant at Quanton, leading AI Product Services with a focus on Business Intelligence.',
    expertise: ['Product Ownership', 'AI/ML', 'Business Intelligence', 'Consulting', 'Agile'],
    industry: 'Consulting',
    yearsOfExperience: 14,
    languages: ['English', 'Hindi'],
    availability: 'available',
    menteeCount: 6,
    rating: 4.9,
  },
  {
    id: 'steffie-lopez',
    name: 'Steffie López',
    role: 'Chief of Staff to the CIO',
    company: 'Fonterra',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65efd0d35637569fe2814aab_Stephanie%20Photo.jpg',
    description: 'Steffie is the Chief of Staff for IT at Fonterra. We serve our 10,500 farmer owners with digital solutions.',
    expertise: ['IT Leadership', 'Digital Strategy', 'Change Management', 'Executive Support'],
    industry: 'Technology',
    yearsOfExperience: 16,
    languages: ['English', 'Spanish'],
    availability: 'busy',
    menteeCount: 3,
    rating: 5.0,
  },
  {
    id: 'tracey-connor',
    name: 'Tracey Connor',
    role: 'Digital Test and Release Manager',
    company: 'Fonterra',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65efd23750b6ef0921c40f00_Tracey%20Photo.jpg',
    description: 'Tracey has 15+ years\' experience as an IT people, thought and technical leader across Test, Release, Development, Build.',
    expertise: ['Test Management', 'Release Management', 'DevOps', 'Team Leadership', 'Quality Assurance'],
    industry: 'Technology',
    yearsOfExperience: 15,
    languages: ['English'],
    availability: 'available',
    menteeCount: 5,
    rating: 4.8,
  },
  {
    id: 'yvonne-weidemann',
    name: 'Yvonne Weidemann',
    role: 'Business Analyst',
    company: 'MYOB',
    image: 'https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65f93c30c7cfd863ae48258e_Yvonne%20Photo.jpg',
    description: 'Yvonne is a versatile Business Analyst specialising in Requirements Gathering, Process Improvement, and stakeholder management.',
    expertise: ['Business Analysis', 'Requirements Gathering', 'Process Improvement', 'Stakeholder Management'],
    industry: 'Business & Management',
    yearsOfExperience: 10,
    languages: ['English', 'German'],
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