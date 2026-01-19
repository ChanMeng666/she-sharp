/**
 * Events Data
 *
 * This file contains all event data for the She Sharp website.
 * Includes 84 real She Sharp events from 2014 to present.
 *
 * To add a new event:
 * 1. Copy an existing event object as a template
 * 2. Update all fields with the new event information
 * 3. Set a unique slug (URL-friendly identifier)
 * 4. Set isFeatured: true if this should be the featured event
 */

import { Event } from "@/types/event";

export const events: Event[] = [
  {
    slug: "she-sharp-hcltech-ai-empowerment-shaping-an-inclusive-digital-future",
    title: "She Sharp & HCLTech: AI Empowerment: Shaping an Inclusive Digital Future",
    shortDescription: "An inspiring evening exploring how inclusive AI and diverse perspectives can shape future innovation and work.",
    description: `Join us for an inspiring evening on how AI is helping people unlock new levels of creativity, productivity, and innovation.

The event features a keynote address and a panel discussion with industry leaders who will share stories and insights on how diverse perspectives in STEM lead to fair, ethical, and inclusive AI solutions.

We will also explore the impact of AI on the future of work and highlight the skills and mindsets that will help you adapt, thrive, and lead in an AI-powered world.`,
    category: "networking",
    status: "completed",
    isFeatured: false,
    startDate: "2025-11-21",
    startTime: "16:30",
    endTime: "19:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      venueName: "University Union Building, University of Otago",
      address: "",
      city: "Dunedin",
      mapUrl: "",
      meetingUrl: "",
    },
    organizer: {
      name: "She Sharp",
      title: "Host",
      company: "She Sharp",
    },
    speakers: [
      {
        name: "Rasha Y. Abu-Safieh",
        title: "Head of Digital Strategy & Partnerships",
        company: "University of Otago",
        bio: "Rasha Abu-Safieh is Head of Digital Strategy and Partnering at the University of Otago and an internationally recognised leader in digital strategy and implementation. A Time Magazine Next Generation Leader and Edmund Hillary Fellow, Rasha's two decades of experience span digital transformation, AI strategy, and social innovation. With qualifications in AI for Business, Digital Transformation, and Systems Change Leadership, she has co-founded award-winning social enterprises and co-led Otago's Digital Strategy. Based in Dunedin, Rasha champions technology that empowers people and communities through inclusive, sustainable, human-centred innovation.",
        image: "/img/RashaAbuSafieh.jpg",
      },
      {
        name: "Graeme Riley",
        title: "Chief Information Officer",
        company: "Dunedin City Council",
        bio: "Graeme Riley is a technology and digital-transformation leader with more than 25 years experience across aviation, IT, and financial services in Australia, China, Europe, and New Zealand. He has led global and national technology programmes, modernising IT organisations and delivering complex solutions across both public and private sectors. As CIO at Dunedin City Council, Graeme is focused on building digital capability that supports communities, strengthens public services, and ensures technology and AI are developed responsibly, ethically, and inclusively. He has a strong track record in building high-performing teams, simplifying complex environments, and using technology as an enabler for people and organisations.",
        image: "/img/GraemeRiley.png",
      },
      {
        name: "Deb Sutton",
        title: "Labour Market Advisor",
        company: "Ministry of Social Development",
        bio: "In her current role, Deb implements employment strategies and responds to the Southern region's labour market demands. She builds relationships with employers, industry groups, providers, and government agencies to create initiatives that help MSD jobseekers gain sustainable employment. With over 30 years' experience in training, recruitment, business development, project management, and HR across government, tertiary, manufacturing, and mining, Deb's strengths lie in people development and building win-win connections between individuals and businesses.",
        image: "/img/DebSutton.jpg",
      },
      {
        name: "Sophie Wiltshier",
        title: "Callaghan Innovation MTF, PGDip, BA",
        company: "",
        bio: "With 14+ years' experience across private and public sectors, Sophie empowers startups and women in business, tech, and science. She supports frontier ventures to export globally, win tenders, and unlock $3M+ for innovation and growth. Her strategic lens and human-centred design help scale NZ businesses, protect IP, and maximise the R&D Tax Incentive. Sophie proudly contributes to Aotearoa's innovation ecosystem, ensuring no opportunity or funding is left behind.",
        image: "/img/SophieWiltshier.jpg",
      },
      {
        name: "Kerry Ryan",
        title: "Principal Advisor for Secondary Transitions",
        company: "",
        bio: "Kerry Ryan is a Principal Advisor for Secondary Transitions in Otago and Southland, with nearly 40 years of experience in education across both local and international contexts. He has taught A Level and the International Baccalaureate, and held senior leadership roles in secondary schools, including 12 years as Head of Science. Kerry is committed to culturally responsive practice and inclusive education. He is a strong advocate for teacher professional learning and development, viewing it as a key driver of student success and system transformation. Kerry is particularly mindful of the role creatives play in tech and how diverse thinking can shape more equitable futures.",
        image: "/img/KerryRyan.png",
      },
      {
        name: "Steve Gadsby",
        title: "Public Sector Lead APME, Consulting",
        company: "HCLTech",
        bio: "A Generalist by nature, Steve has accumulated a raft of experiences in his 30+ years in the IT Services and Consulting industries. His career spans life as a COBOL Programmer, just about every role that IT had to offer, and compulsory stints at both an NZ Telco, & a 'Big 4'. He currently oversees the Public Sector activities for the recently formed Consulting business unit for HCLTech across Asia Pacific and Middle East.\n\nBeing both a strategist and a deliverer, Steve adeptly travels both paths simultaneously. His passion though lies in both Education and positive societal change. He enjoys mentoring roles and the opportunity to 'give back' to the local communities through either swinging a chainsaw at local working bee's or sitting in the Presiding Member (Chair) of local School Boards.",
        image: "/img/SteveGadsby.png",
      },
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-hcltech-ai-empowerment-shaping-an-inclusive-digital-future",
      capacity: undefined,
      attendeeCount: undefined,
      waitlistEnabled: false,
      deadline: undefined,
      price: {
        amount: 0,
        currency: "NZD",
      },
      isFree: true,
    },
    coverImage: "/img/HCLTechPoster.png",
    albumUrl: "https://photos.google.com/share/AF1QipOzji5dKXJVUNCE4G2C4IUX4BmavWum-P9WZEKSruTpASO8L1ox7_L5emlZPBwzEg?key=Um51STlJTmhENWtDWEJ1QmlHUFNJSGhadExHajlB",
    attendeeAvatars: [],
    photos: [
      "https://lh3.googleusercontent.com/pw/AP1GczMNA-KAcjgfXDZnDIuqDFaQVZLhVrfqU1vJGi77Rl6ylf8qOglukYMXFyV4wNrJUF3fjb4g2a48xfBPGmiH-PSBoUNjNmM9LD2AnAZjRJUEiJ7dxN1o92ocwmd3i68VBK73L56Jgk0XYT70P7H78JC7dw=w1879-h1253-s-no-gm?authuser=0",
      "https://lh3.googleusercontent.com/pw/AP1GczMgabUeaBvMXpQO4k7Ohg38yIHDDZatDLWhkscQHPTv2gw_NgJrAgotG_ie7M3x0DBd2rCQer5fHU9NQrVni8eBeGYHiSEzvdTn4sQB8GE4ZEIWCHz83Wc4ytMYRpKXXhg3e9Vxz3IqL4Ur9FdenN2Ipw=w2296-h1530-s-no-gm?authuser=0",
      "https://lh3.googleusercontent.com/pw/AP1GczMNEy7XahBU3IuqXHbq1zGLSYIl3hGaaamYs13FgIx3OOPGfGoS_Q7rODbLQr_SW1CKZ-MzJxpwVt3w6APQ1FFtQHMwo84PcI1pxgygMgpLj2J1kXUBdVviyDz-5Wgfqxzgw8v_NZeC8drOEGP1NOfSsA=w1879-h1253-s-no-gm?authuser=0"
    ],
  },
 {
    slug: "she-sharp-vector-future-ready-data-ai-digital-innovation-inclusive-careers-at-vector",
    title: "Future-Ready: Data, AI, Digital Innovation & Inclusive Careers at Vector",
    shortDescription: "Join us for an inspiring evening with Vector as we explore how technology is transforming the energy sector.",
    description: `Join us for an inspiring evening with Vector as we explore how technology is transforming the energy sector.`,
    category: "networking",
    status: "completed",
    startDate: "2025-11-12",
    startTime: "17:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Shona Irving",
        title: "Head of Enterprise Data and Information Management",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68e07910a8f710b7f087da5b_Shona%20Irving.jpg",
      },
      {
        name: "Evelyn Hunserger",
        title: "Data Scientist",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68e0799e93e217abf557f66c_Evelyn%20Hunsenger.jpg",
      },
      {
        name: "Karen Ip",
        title: "Head of Engineering, VTS",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68e079d737c5fe190af8a4e7_Karen%20Ip.jpg",
      },
      {
        name: "Adriana Yong",
        title: "Delivery Analyst",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68e07a47ba04d345599b06d9_Adriana%20Yong.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-vector-powering-possibility-women-in-tech-vector",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68ee04bc0c2fdffc1de37e4e_Vector%20Event%20poster%20(1080%20x%201080%20px)%20(1)_11zon.png",
  },
  {
    slug: "code-secure",
    title: "Code Secure. Lead the Future: Women in Cybersecurity Workshop",
    shortDescription: "ðFree t-shirts, coding challenges, and a community of women in tech â all in one workshop!JoinXero,Secure Code Warrior, andShe Sharpfor a hands-on workshop built just for you. This is your space tolearn, connect, and growalongside an empowering community of women in tech. ð",
    description: `ðFree t-shirts, coding challenges, and a community of women in tech â all in one workshop!JoinXero,Secure Code Warrior, andShe Sharpfor a hands-on workshop built just for you. This is your space tolearn, connect, and growalongside an empowering community of women in tech. ð`,
    category: "workshop",
    status: "completed",
    startDate: "2025-10-03",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Fatemah Beydoun",
        title: "Chief Customer Officer, Secure Code Warrior",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68b6d4469334d9d88ba87f63_Copy%20of%20Fatemah%20Beydoun.jpg",
      },
      {
        name: "Suzy Clark",
        title: "Executive GM of Security, Xero",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68b6d4fdd1e862785575b4cb_Suzy%20Clarke-Headshot.jpg",
      },
      {
        name: "Mehika Manocha",
        title: "Lead Software Engineer, Xero",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68baac28c7eeb2d9347c4dd1_MehikaManochBio.jpg",
      },
      {
        name: "Mahsa McCauley (Mohaghegh)",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-scw-and-xero-code-secure-lead-the-future-women-in-cybersecurity-workshop",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68c01166fb8c1fe0aae90eb8_Xero%20-%20Social%20Media.png",
    albumUrl: "https://photos.app.goo.gl/4CWo8WBuM1rfg63q9",
  },
  {
    slug: "business-and-technology-transformation-through-platforms-and-products",
    title: "Business and Technology Transformation Through Platforms and Products",
    shortDescription: "Join a dynamic panel discussion featuring three diverse, experienced, and growth-minded women who are driving meaningful change within Fonterraâs Products and Platforms landscape. This session will explore the transformational shift toward a product and platform-centric approach, highlighting the pivotal role it plays in shaping the future of IT delivery and unlocking greater business outcomes.",
    description: `Join a dynamic panel discussion featuring three diverse, experienced, and growth-minded women who are driving meaningful change within Fonterraâs Products and Platforms landscape. This session will explore the transformational shift toward a product and platform-centric approach, highlighting the pivotal role it plays in shaping the future of IT delivery and unlocking greater business outcomes.`,
    category: "networking",
    status: "completed",
    startDate: "2025-09-03",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Vicky Enkhsaikhan",
        title: "women in tech advocate, educator, and GenAI expert",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68b3779bdd6358872971f627_image.png",
      },
      {
        name: "Aileen Collins",
        title: "Head of Digital Enablement, People & Culture",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c67fcaafaf0049b7cfdca_Aileen%20Collins%201.jpg",
      },
      {
        name: "Tracey Connor",
        title: "Release Train Practice Lead, IT Engineering",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c68228cdc8d1eadfa5cfb_TraceyConnor%201.JPG",
      },
      {
        name: "Kritika Law",
        title: "Platform Owner - Salesforce",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68a6c5e2b8bb64dd5904a4f0_Kritika.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-fonterra-business-and-technology-transformation-through-platforms-and-products?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68905ecd82303e399aed2679_Business%20and%20Technology%20Transformation%20Through%20Platforms%20and%20Products%20(1).png",
    albumUrl: "https://photos.app.goo.gl/TYrx8hrvrp4rbAS19",
  },
  {
    slug: "ai-hackathon-festival-2025",
    title: "AI Hackathon Festival 2025",
    shortDescription: "AI Forum is hosting the 2025 AI Hackathon across Aotearoa.",
    description: `AI Forum is hosting the 2025 AI Hackathon across Aotearoa.`,
    category: "workshop",
    status: "completed",
    startDate: "2025-08-15",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Alejandro Davila",
        title: "Founder of CONICAL",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689454587ec5f00ec724894a_alejandro-davila-nz-conical.jpg",
      },
      {
        name: "Michael Fielding",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c57b44e8448a103408b6e_Michael%20Fielding.jpeg",
      },
      {
        name: "Maria Mingallon",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c5866a7764e99fc366d18_Maria%20Mingallon.jpeg",
      },
      {
        name: "Richard Copus",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c589fe620176eb7c46185_Richard%20Copus.jpeg",
      },
      {
        name: "Mahsa McCauley (Mohaghegh)",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Nigel Hunt",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c689db85b3744f18ee181_Nigel%20Hunt.jpeg",
      },
      {
        name: "Tanya Gray",
        title: "Front-End Web Development Lead, Soul Machines",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c69916ee21e10a099900b_tanya-gray%20Tanya%20Gray.jpg",
      },
      {
        name: "Prasanth Pavithran",
        title: "Senior Business Analyst - Office of the CTO at AUT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b84f65184c0729d860632_1719309249585.jpeg",
      },
      {
        name: "Talita Ekandjo",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c604bc48ae4b3a5f034b0_Talita_Ekandjo%20Talita%20Ekandjo.jpg",
      },
      {
        name: "Alan Dent",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c66e3e624d2e6868f26cb_WEB2%2002%20Alan%20Dent.jpg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      },
      {
        name: "Shae Parsons",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c616e7d30faa0c152b994_IMG_8757.jpg",
      },
      {
        name: "Isha Sangrolkar",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c65caa1d0876274f8e62e_image.png",
      },
      {
        name: "Chan Meng",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c636f80d02fba831c735d_Chan%20Meng.png",
      },
      {
        name: "Yesha Kaniyawala",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c6244262a9408738b1f0c_yesha.jpg",
      },
      {
        name: "Cindy Luo",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c62f76e3510bde29f9bb9_cindy-luo%20Cindy%20Luo.png",
      },
      {
        name: "Ji Ruan",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/689c6892a2dd65a7070d2cb0_Ji%20Ruan.jpeg",
      },
      {
        name: "Sara Ghafoor",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/652774fc247ee7d771e65d2c_Sara.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/685b930195a2e57635c32a0a_-TechWomenNZ-%20Humanitix%20Event%20Banner%2020%20May%202025.webp",
    albumUrl: "https://photos.app.goo.gl/GUQBZCNDV7X5Jx5d6",
  },
  {
    slug: "thrive-your-career-your-story",
    title: "THRIVE: Your Career, Your Story",
    shortDescription: "Are you a soon-to-be graduate, a recent graduate, or a professional ready for a career move? This event is designed just for you.",
    description: `Are you a soon-to-be graduate, a recent graduate, or a professional ready for a career move? This event is designed just for you.`,
    category: "thrive",
    status: "completed",
    startDate: "2025-07-30",
    startTime: "55:00",
    endTime: "19:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Keynote Speaker",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686237b2c1b15cec7645e530_Elevate%20%20_HR-13%20(1).jpg",
      },
      {
        name: "Kathryn Sandford",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686237b2c1b15cec7645e530_Elevate%20%20_HR-13%20(1).jpg",
      },
      {
        name: "Libby Lavrova",
        title: "IBM - Data / AI Partner Technical Specialist",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66eba9db021d85dadb5ab595_IMG_1237.jpg",
      },
      {
        name: "Kai Ping (KP) Lew",
        title: "PBTech Head of Marketing",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b6d61e7e3158e2b7a52da_Kai%20Ping%20Lew.jpeg",
      },
      {
        name: "Vivien Tu",
        title: "Territory Sales Manager - Veeam Software",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b6e21a47aef2bb4fc3bae_vivientu.jpg",
      },
      {
        name: "Jamini Patel",
        title: "Distribution Manager (previous HPE graduate)",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b6e7dbaea94f8cf28eb91_Jamini%20Patel.jpeg",
      },
      {
        name: "Isuru Fernando",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b6f0c2c7d0f5245da92de_Isuru%20Fernandez.jpeg",
      },
      {
        name: "Caro Gao",
        title: "Customer Success Account Manager, Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68874aeb3141ace212fb2f33_Caro%20Gao.jpeg",
      },
      {
        name: "Dalia Raphael",
        title: "Founder and Director at Delta Insights",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b6fb262ce6721b047dc0e_Dalia.png",
      },
      {
        name: "Irene Naidu",
        title: "SnapperNet Business Development Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b7028bf8b5d7ad362879c_Irene%20Naidu.jpeg",
      },
      {
        name: "Mahsa McCauley (Mohaghegh)",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Maria Clamor",
        title: "Principal Sales Specialist, Spark New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b70ceb433ebe7308b30ea_Maria%20Clamor.jpeg",
      },
      {
        name: "Matthew Hall-White",
        title: "Financial Adviser - Life and Health Insurance",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b7136426b1f78f21f3888_Matthew%20Hall-White.jpeg",
      },
      {
        name: "Justine Hinton",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b71b0049053d3559cdcb4_Justine%20Hinton%20.jpeg",
      },
      {
        name: "Prasanth Pavithran",
        title: "Senior Business Analyst - Office of the CTO at AUT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/686b84f65184c0729d860632_1719309249585.jpeg",
      },
      {
        name: "Tuhi Cooper",
        title: "Programme Support Lead: Entelar Group",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6878ba01658d0d8fcc46ebe9_Tuhi%20Cooper.jpeg",
      },
      {
        name: "Bahareh Jalili-Moghaddam",
        title: "Call Centre Manager, PB Tech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/68874b7242b76ac2043c88f5_IMG_7827.jpeg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-techbabes-nz-thrive-your-career-your-story?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/685d16184e0d23702c5f2066_THRIVE%20Your%20Career%2C%20%20Your%20Story.jpg",
    albumUrl: "https://photos.app.goo.gl/58coFzFj2FfWbFMp7",
  },
  {
    slug: "ethnic-advantage-conference",
    title: "Ethnic Advantage Conference",
    shortDescription: "She Sharp will be at theEthnic Advantage Conference 2025, a powerful one-day event bringing together over 300 ethnic community leaders, service providers, faith leaders, government agencies, and more to explore the role of ethnic communities in social cohesion and resilience.",
    description: `She Sharp will be at theEthnic Advantage Conference 2025, a powerful one-day event bringing together over 300 ethnic community leaders, service providers, faith leaders, government agencies, and more to explore the role of ethnic communities in social cohesion and resilience.`,
    category: "conference",
    status: "completed",
    startDate: "2025-06-28",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/684918c467a93421eafe8f3b_unnamed.jpg",
    albumUrl: "https://photos.app.goo.gl/FUVC4aR3vPgvRzK57",
  },
  {
    slug: "tech-that-matches-your-vibe-find-your-perfect-fit",
    title: "âTech That Matches Your Vibe: Find Your Perfect Fitâ",
    shortDescription: "Discover how your unique strengths can shape your tech journey in this exciting lightning-style event! Hear from 6 inspiring speakers as they share how theyâve harnessed their unique talents to thrive in their roles and overcome challenges. Whether youâre exploring tech careers or seeking clarity on where you might fit, this event will spark ideas and help you uncover your potential.",
    description: `Discover how your unique strengths can shape your tech journey in this exciting lightning-style event! Hear from 6 inspiring speakers as they share how theyâve harnessed their unique talents to thrive in their roles and overcome challenges. Whether youâre exploring tech careers or seeking clarity on where you might fit, this event will spark ideas and help you uncover your potential.`,
    category: "networking",
    status: "completed",
    startDate: "2025-05-22",
    startTime: "17:30",
    endTime: "19:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "MEET THE SPEAKERS",
        title: "Product Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476b3feb16fc306be60ea59_2_Anshu%20Maharaj_Speakers.png",
      },
      {
        name: "Anshu Maharaj",
        title: "Product Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476b3feb16fc306be60ea59_2_Anshu%20Maharaj_Speakers.png",
      },
      {
        name: "Yvonne Weidemann",
        title: "Business Analyst",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476b331b16fc306be60227f_4_Yvonne%20Weidemann_Speakers.png",
      },
      {
        name: "Lara Rimell",
        title: "Senior Service Designer",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67fdfbea5d0dc5e216e1e10d_Lara%20Rimell.JPG",
      },
      {
        name: "Jo-Riza Camomot",
        title: "Software developer",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67fdfc8fc32d33fd86ff699c_Joriza.png",
      },
      {
        name: "Madaleen Bothma",
        title: "Senior product manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67fdfceb06fb9e7e878e02ef_Madaleen%20Bothma-12.jpg",
      },
      {
        name: "Kelly Yeo",
        title: "Senior Technical & Vendor Escalation (TVE)",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/681efb25a921853a9f1c5c11_Kelly%20Photo.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-myob-tech-that-matches?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67fd6ff293328e7d586a0200_myOB%20tech%20week%20event.png",
    albumUrl: "https://photos.google.com/share/AF1QipNxzXF2evZ8rGwTEe0_VASAbntGIRm77aa9q5jDQbUTm_al_yxu47Zv2KXyFFj_vA?key=RDloa3JNS3V2N3N3RGdXZWtDel9Id2ZUNGxyZXB3",
  },
  {
    slug: "iamremarkable",
    title: "#IAmRemarkable",
    shortDescription: "#IAmRemarkable is a global movement that empowers everyone, including under represented groups, to celebrate their achievements in the workplace and beyond, while challenging the social perception around self-promotion. At the heart of our movement is a 60 minute workshop open to everyone, hosted by our very own She Sharp founder and director- Dr Mahsa McCauley (Mohaghegh).",
    description: `#IAmRemarkable is a global movement that empowers everyone, including under represented groups, to celebrate their achievements in the workplace and beyond, while challenging the social perception around self-promotion. At the heart of our movement is a 60 minute workshop open to everyone, hosted by our very own She Sharp founder and director- Dr Mahsa McCauley (Mohaghegh).`,
    category: "networking",
    status: "completed",
    startDate: "2025-04-16",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Hosted by",
        title: "Founder of She Sharp and Senior lecturer at AUT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66dea1a04e2eb7c1275a9b08_Mahsa.png",
      },
      {
        name: "Dr. Mahsa McCauley (Mohaghegh)",
        title: "Founder of She Sharp and Senior lecturer at AUT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66dea1a04e2eb7c1275a9b08_Mahsa.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-iamremarkable?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67ce885e79f6ad76f91dc4a1_Screen%20Shot%202025-03-10%20at%207.36.11%20PM.png",
    albumUrl: "https://photos.app.goo.gl/Q7DK7YfkSDVweWPZ7",
  },
  {
    slug: "she-sharp-academy-ex-international-womens-day",
    title: "She Sharp & academyEX: International Women's Day",
    shortDescription: "She Sharpâs International Womenâs Day (IWD) event is scheduled for March 14 at academyEX. Join us for an inspiring evening celebrating women in tech, featuring engaging discussions, networking opportunities, and community connections. The registration starts at 4.30 pm, and the event kicks off at 5 PMâdonât miss it!",
    description: `She Sharpâs International Womenâs Day (IWD) event is scheduled for March 14 at academyEX. Join us for an inspiring evening celebrating women in tech, featuring engaging discussions, networking opportunities, and community connections. The registration starts at 4.30 pm, and the event kicks off at 5 PMâdonât miss it!`,
    category: "networking",
    status: "completed",
    startDate: "2025-03-14",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Commercial Communications Manager - DuluxGroup",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c62f5b750d6a1b1d32b821_Moumita%20Das%20Roy%20Photo.png",
      },
      {
        name: "Moumita Das Roy",
        title: "Commercial Communications Manager - DuluxGroup",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c62f5b750d6a1b1d32b821_Moumita%20Das%20Roy%20Photo.png",
      },
      {
        name: "Perrin Rowland",
        title: "Chief Product & Experience Officer",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c63282c133a81a3836b8d0_image%20(56).png",
      },
      {
        name: "Ireen Rahiman-Manuel",
        title: "Founder and Director of Impactdev360",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67c7f38a609ff1167d1fefb5_Screen%20Shot%202025-03-05%20at%207.40.1.png",
      },
      {
        name: "Janet Van Jenkins",
        title: "General Manager - Flexware",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67ce84dfa41b3725204bd57f_Screen%20Shot%202025-03-10%20at%207.21.10%20PM.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-academy-ex-international-women-s-day?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67bffefb4cf73d5f15062e96_IWD%20-%20Poster.png",
    albumUrl: "https://photos.app.goo.gl/Jm121AcMN8n8bn1g6",
  },
  {
    slug: "google-educator-conference-2024",
    title: "Google Educator Conference",
    shortDescription: "The Google Educator Conference is designed for digital technology teachersâtraining them in STEM subjects and creative ways to present these in New Zealand classrooms.",
    description: `The Google Educator Conference is designed for digital technology teachersâtraining them in STEM subjects and creative ways to present these in New Zealand classrooms.`,
    category: "conference",
    status: "completed",
    startDate: "2024-11-21",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "MEET THE KEYNOTE SPEAKERS",
        title: "Google for Education, NZ Program Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65084a6f7eff201d67564fb5_steve%20smith%20photo.jpeg",
      },
      {
        name: "Steve Smith",
        title: "Google for Education, NZ Program Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65084a6f7eff201d67564fb5_steve%20smith%20photo.jpeg",
      },
      {
        name: "Alliv Samson",
        title: "CGO and Co-Founder of Kami",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/670c79e4bcb72874bd74433a_Alliv%20Samson%20(Keynote).jpg",
      },
      {
        name: "Meet the Demo Facilitators",
        title: "Research Director, academyEX",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d3b444977df99baf784a0b_David%20Parsons.jpg",
      },
      {
        name: "Dr. David Parsons",
        title: "Research Director, academyEX",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d3b444977df99baf784a0b_David%20Parsons.jpg",
      },
      {
        name: "Dr. Kara Kennedy",
        title: "Principal - AI Literacy Institute",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d1789a4b5f67bde73883ce_Kara.jpeg",
      },
      {
        name: "Dr. Kathryn MacCallum",
        title: "Associate Professor, University of Canterbury",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d3b4038fa4a872b5117a48_Kathryn%20MacCallum-head.jpg",
      },
      {
        name: "Catherine Frost",
        title: "Lead Writer Technology , Ministry of Education",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66f8f1791c37f36fc8e345a1_Catherine%20Frost(Demo).jpg",
      },
      {
        name: "Dr. Mahsa McCauley (Mohaghegh)",
        title: "Founder of She Sharp and Senior lecturer at AUT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66dea1a04e2eb7c1275a9b08_Mahsa.png",
      },
      {
        name: "Munireh Rouget",
        title: "Deputy Chair - TENZ Council",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/670c7805bc6a2c73a5469191_Munireh.png",
      },
      {
        name: "Claire Wigley",
        title: "Teacher at Spotswood College New Plymouth",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654b416bc4182bc0aac67822_Claire%20Wigley%20photo.jpg",
      },
      {
        name: "Meet the Workshop Facilitators",
        title: "PhD student at the University of Canterbury",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66f8f432e9e4ff2af1eb4244_Henry%20Hickman(Workshop).jpeg",
      },
      {
        name: "Henry Hickman",
        title: "PhD student at the University of Canterbury",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66f8f432e9e4ff2af1eb4244_Henry%20Hickman(Workshop).jpeg",
      },
      {
        name: "Steven Rodkiss",
        title: "Digital Technologies Teacher, Burnside High School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66f8f4efcf9938934f400259_Steven%20Rodkiss%20(Workshop).jpg",
      },
      {
        name: "Alex Ward",
        title: "Head of Digital Technology Kerikeri High School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6523c77644a849818c9b981a_Alex%20Ward%204.jpg",
      },
      {
        name: "Bex Rose",
        title: "Head of Impact, Growth Culture",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66f8f36ab96e685709e9032f_Bex%20Rose.jpg",
      },
      {
        name: "Jessica Brennan",
        title: "Kami - Regional Customer Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/670c929c526b707d50355b4b_Jessica%20Brennan%20(Workshop).png",
      },
      {
        name: "Paul Savage",
        title: "Kami - Senior Product Marketer",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/670c9279065093d7fd6b92ec_Paul%20Savage%20(Workshop%20Speaker).png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/2024-google-educators-conference",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67038a0bb7c5001d51967702_Google%20educator%20poster750mb.jpg",
    albumUrl: "https://photos.app.goo.gl/fiBaK5aY349uqm9U6",
  },
  {
    slug: "the-role-of-technology-in-sustainable-development",
    title: "The Role of Technology in Sustainable Development",
    shortDescription: "Discuss how technology can be used to address environmental challenges and promote sustainability focusing on green Tech.",
    description: `Discuss how technology can be used to address environmental challenges and promote sustainability focusing on green Tech.`,
    category: "networking",
    status: "completed",
    startDate: "2024-11-15",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Keynote Speaker",
        title: "Vice President - HCLTech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6507ae756e164409e6fa0726_IMG_4506.jpg",
      },
      {
        name: "Lara Higson",
        title: "Vice President - HCLTech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6507ae756e164409e6fa0726_IMG_4506.jpg",
      },
      {
        name: "Meet the Panel Speakers",
        title: "Data Product Lead - Fonterra",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6715e0c3822287f94176a635_Loren%20George.PNG",
      },
      {
        name: "Loren George",
        title: "Data Product Lead - Fonterra",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6715e0c3822287f94176a635_Loren%20George.PNG",
      },
      {
        name: "Noor Syed",
        title: "Account Tech Strategist/CTO - Health Sector NZ",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/671b349bf78f063b34239a3c_Noor%20Syed.JPG",
      },
      {
        name: "Dr Kim de Graaf",
        title: "Senior Lecturer in Civil Engineering - UoW",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/671b35c8e36df2b7c7cf4180_Screen%20Shot%202024-10-25%20at%207.07.56%20PM.png",
      },
      {
        name: "Margaret Paiti",
        title: "Principal Advisor Secondary Transition - MOE",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65264c098c508e0a37d5d9a4_image%20(4).png",
      },
      {
        name: "Yvonne Gill",
        title: "Executive Director - TechWomen | NZTech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/671b36a6ce4999fac834f7d0_Yvonne%20Gill%20headshot%20Sep%2024.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-hcl?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67229b45be8ceb8c7580ded2_1.png",
    albumUrl: "https://photos.app.goo.gl/ZyRqyUtE32YFS4yj8",
  },
  {
    slug: "she-sharp-10-year-anniversary",
    title: "She Sharp 10-Year Anniversary",
    shortDescription: "Join us for a special celebration as we mark a decade of bridging the gender gap in STEM!SheSharp is on a mission to challenge misconceptions about the tech industry and empower the next generation of women to pursue careers in STEM through events, networking, and career development opportunities.",
    description: `Join us for a special celebration as we mark a decade of bridging the gender gap in STEM!SheSharp is on a mission to challenge misconceptions about the tech industry and empower the next generation of women to pursue careers in STEM through events, networking, and career development opportunities.`,
    category: "networking",
    status: "completed",
    startDate: "2024-10-18",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Keynote Speaker",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Mahsa McCauley (Mohaghegh)",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Meet the Speakers",
        title: "Founder, GirlBoss New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66ebaa7e8a9d1200adac0006_AlexiaHHeadshotSquare.jpg",
      },
      {
        name: "Alexia Hilbertidou",
        title: "Founder, GirlBoss New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66ebaa7e8a9d1200adac0006_AlexiaHHeadshotSquare.jpg",
      },
      {
        name: "Libby Lavrova",
        title: "Data & AI Tech Specialist",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66eba9db021d85dadb5ab595_IMG_1237.jpg",
      },
      {
        name: "Frances Valintine CNZM",
        title: "Founder & Board Director, academyEX",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66fa6a291efe1e2daf30f74b_Frances%20Valintine.jpeg",
      },
      {
        name: "Aravind Subramanian",
        title: "Partner in Deloitte's Technology",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66fe07ec60960af4d0aa824b_Picture%201.png",
      },
      {
        name: "Rochelle Moffitt",
        title: "Founder & CEO, Tickled Pink",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67034e56cb13daf751a0f03f_Rochelle.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-10-year-anniversary?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66c97b2fe04685acefd1f74d_September%2010th%20anniversary%20poste.png",
    albumUrl: "https://photos.google.com/share/AF1QipM5V7Qrn72ZMJjCVLlRm5nw8aYcyJ6mpBwGt6R9NhvXF2M65tdXP9lOdZUMuFv9hw?key=YU5XYlRlX1JWN2dKWVJsRWVqZTg4bUVyQ19DZEFB",
  },
  {
    slug: "harness-the-power-of-data-and-ai",
    title: "Harness the Power of Data and AI",
    shortDescription: "Harness The Power of Generative Al: A Deep Dive into Fonterra's Al Journey. Join us for an enlightening session on how Fonterra, a global dairy nutrition company, has harnessed the power of Artificial Intelligence (Al) to revolutionise their entire value chain which produces 30% of the world's dairy exports from nutritious New Zealand farms. What's in Store? Al in Action: Get an overview Of how Fo",
    description: `Harness The Power of Generative Al: A Deep Dive into Fonterra's Al Journey. Join us for an enlightening session on how Fonterra, a global dairy nutrition company, has harnessed the power of Artificial Intelligence (Al) to revolutionise their entire value chain which produces 30% of the world's dairy exports from nutritious New Zealand farms. What's in Store? Al in Action: Get an overview Of how Fo`,
    category: "networking",
    status: "completed",
    startDate: "2024-08-29",
    startTime: "17:30",
    endTime: "19:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "MEET THE SPEAKERS",
        title: "Digital Operational Technology Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66c30a2b3268394b8015104b_IMG_8771.JPG",
      },
      {
        name: "Saskia van Bergenhenegouwen",
        title: "Digital Operational Technology Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66c30a2b3268394b8015104b_IMG_8771.JPG",
      },
      {
        name: "Melody Taylor",
        title: "General Manager of the Integrated Operation Centre",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66a810db0953fb2d24b89350_Melody%20Taylor.jpg",
      },
      {
        name: "Natasha Brownlie",
        title: "Modern Work Specialist - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66b1bfc09569bcb55d2163a4_natasha.jpeg",
      },
      {
        name: "Helius Guimaraes",
        title: "Chief Data Officer & AI Officer - Fonterra",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66ba826e50ee06576fc79f6c_Helius%20photo.png",
      },
      {
        name: "EVENT ORGANISER",
        title: "Chief of Staff to the CIO - Fonterra",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66bc65845481bb49a1af93a6_S.%20Lo%CC%81pez.jpg",
      },
      {
        name: "Stephanie Lopez",
        title: "Chief of Staff to the CIO - Fonterra",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66bc65845481bb49a1af93a6_S.%20Lo%CC%81pez.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-fonterra-harness-the-power-of-generative-al",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667bb723c43cfe51b9856674_Harness%20the%20power%20of%20data%20and%20AI.png",
    albumUrl: "https://photos.app.goo.gl/CkyNgfFGPPSPe7aY7",
  },
  {
    slug: "ai-for-the-environment-hackathon-festival-2024",
    title: "AI for the Environment Hackathon Festival 2024",
    shortDescription: "AI Forum is hosting the 2024 AI Hackathon across Aotearoa and the South Pacific.",
    description: `AI Forum is hosting the 2024 AI Hackathon across Aotearoa and the South Pacific.`,
    category: "workshop",
    status: "completed",
    startDate: "2024-08-09",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667933a5997e449bc10ca2d1_aiHackathon.jpg",
  },
  {
    slug: "f-p-hackathon",
    title: "F&P Hackathon",
    shortDescription: "Fisher and Paykel Healthcare will be hosting an AI Hackathon on July 26th â 28th kicking off with a keynote from Nicholas Fourie, VP of ICT.Are you ready to embark on an exhilarating journey of creativity, problem-solving, and innovation? In a world where innovation is the lifeblood of progress, we often find ourselves bogged down by repetitive tasks, mundane processes, and administrative burden",
    description: `Fisher and Paykel Healthcare will be hosting an AI Hackathon on July 26th â 28th kicking off with a keynote from Nicholas Fourie, VP of ICT.Are you ready to embark on an exhilarating journey of creativity, problem-solving, and innovation? In a world where innovation is the lifeblood of progress, we often find ourselves bogged down by repetitive tasks, mundane processes, and administrative burden`,
    category: "workshop",
    status: "completed",
    startDate: "2024-07-26",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "MEET THE JUDGES",
        title: "Vice President of ICT - Fisher & Paykel Healthcare",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6678a66ed690c3f1f956735f_nicholas.jpeg",
      },
      {
        name: "Nicholas Fourie",
        title: "Vice President of ICT - Fisher & Paykel Healthcare",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6678a66ed690c3f1f956735f_nicholas.jpeg",
      },
      {
        name: "Mahsa McCauley (Mohaghegh)",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Rik Irons-Mclean",
        title: "CTO, Enterprise Commercial - Microsoft AU & NZ",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f46c6f4f3a7af01fe2339_Rik3_72dpi_sq1.jpg",
      },
      {
        name: "Justin Wood",
        title: "Director - Deloitte New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d2f76ba967f65eb1f7d9_1_Justin%20Wood.png",
      },
      {
        name: "Yvonne Chan",
        title: "Associate Dean | Board Director - AUT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6678a575ed15e364193488fc_yvonne.jpeg",
      },
      {
        name: "Alex Mercer",
        title: "Group Head of Marketing and Communications-Datacom",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668b9c5030dd022d83076ae9_alex.jpeg",
      },
      {
        name: "MEET THE MENTORS",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Anne Newmarch",
        title: "Consulting Analyst - Deloitte",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668c87dfb826223f4df3e5e8_Screen%20Shot%202024-07-09%20at%2012.44.04%20PM.png",
      },
      {
        name: "Blair Woods",
        title: "CTO - Supahuman AI",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8388b9d1f3f968e50cef_blair.jpeg",
      },
      {
        name: "Chanelle Butters",
        title: "Brand & Experience Designer - Datacom",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668c8a2d0d53875ac913580b_Chanelle_Profile%20-%20Chanelle%20Butters.jpg",
      },
      {
        name: "Chase Bloch",
        title: "Data Analyst - Fisher & Paykel Health Care, ICT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6699dd45c1c3a5e5ef2971df_Screen%20Shot%202024-07-19%20at%203.27.49%20PM.png",
      },
      {
        name: "Cherry Hsu",
        title: "Learning & Development Advisor - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6699ff442e194aa379daa691_Screen%20Shot%202024-07-19%20at%205.52.46%20PM.png",
      },
      {
        name: "Chris Campbell",
        title: "User Experience Manager-Fisher & Paykel Healthcare",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66998dd3330e2b89cb3d05dc_ChrisCampbell.jpg",
      },
      {
        name: "Dipesh Trikam",
        title: "Emerging Product Lead - Datacom",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668c86d9b01596e1a19d27c4_084A2228-EDIT%20square%20-%20Dipesh%20Trikam.jpg",
      },
      {
        name: "Farhan Sattar",
        title: "IT Technical Trainer - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f9b1c17cf72fd1bd3bf79_Screen%20Shot%202024-06-29%20at%205.26.23%20PM.png",
      },
      {
        name: "George Stevens",
        title: "Technical Specialist - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8b3c904ee3d80fb62c09_george.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      },
      {
        name: "Harpreet Singh",
        title: "Software Engineer - Fisher & Paykel Healthcare",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66a32aa38efafec51701edbc_harpreet.jpeg",
      },
      {
        name: "Jesse Luong",
        title: "Business Analyst - Fisher & Paykel Health Care",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f86a9746a0e04c5647f56_jesse.jpeg",
      },
      {
        name: "Jeff Yeh",
        title: "Marketing Specialist - Fisher & Paykel Healthcare",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f89730746e795773e1421_jeff.jpeg",
      },
      {
        name: "Joe Thornley",
        title: "Associate Director of Insight & Analytics- Datacom",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668c8aaf01fbfd953bdfe59d_joseph.jpeg",
      },
      {
        name: "Kim Thibault",
        title: "Chief Product Officer - BoardPro Limited",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f820ca23bb1e36640270e_kim.jpeg",
      },
      {
        name: "Midu Chandra",
        title: "General Manager for Futures & Insights - Datacom",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668c8daa696be29f56b80788_midu.jpeg",
      },
      {
        name: "Monika Tylova",
        title: "Mentor | Partnership Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f81551545aa63fa0e44ed_monika.jpeg",
      },
      {
        name: "Tara Davidson",
        title: "Category Marketing Manager - F&P Healthcare",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f884b53973df2152ce42d_tara.jpeg",
      },
      {
        name: "Troy May",
        title: "Coach - Consulting",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f827df33b9c14bd2272d1_troy.jpeg",
      },
      {
        name: "Upeka De Silva",
        title: "PhD student - Auckland University of Technology",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8ac7c5805649406d4172_upeka.jpeg",
      },
      {
        name: "Zeeshan Bhatti",
        title: "Head of Product Growth - BoardPro Limited",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8311c213d85ea66e217b_zeeshan.jpeg",
      },
      {
        name: "KEYNOTE SPEAKERS",
        title: "Vice President of ICT - Fisher & Paykel Healthcare",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6678a66ed690c3f1f956735f_nicholas.jpeg",
      },
      {
        name: "Ming Cheuk",
        title: "Chief Technical Officer - AI Forum NZ",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668c735b8c7670467dbf066a_ming.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668f2f772cf1af9e553ddf84_Screen%20Shot%202024-07-11%20at%201.03.22%20PM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66949b55cf165d4468cd1465_F%26P%20Hackathon%20with%20She%23.png",
    albumUrl: "https://photos.app.goo.gl/LV8HEbqdy5sb4q287",
  },
  {
    slug: "bank-on-yourself",
    title: "Bank on Yourself",
    shortDescription: "Are nerves holding you back? Fear not! Join Fiservâs empowering workshop, âBanking on Yourselfâ and be inspired by those who carved their own paths. Fiserv, a Fortune 200 leader in mobile banking, is fuelled by the talent and dedication of our team. We're leading the way because of the brilliant minds we invest in. Discover the power of self-belief, weâll even equip you with a successful t",
    description: `Are nerves holding you back? Fear not! Join Fiservâs empowering workshop, âBanking on Yourselfâ and be inspired by those who carved their own paths. Fiserv, a Fortune 200 leader in mobile banking, is fuelled by the talent and dedication of our team. We're leading the way because of the brilliant minds we invest in. Discover the power of self-belief, weâll even equip you with a successful t`,
    category: "networking",
    status: "completed",
    startDate: "2024-06-26",
    startTime: "17:30",
    endTime: "19:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "MEET THE SPEAKERS",
        title: "Software Development Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6667f1bf3464b6377bb014e5_Maria.png",
      },
      {
        name: "Maria Shcherbakova",
        title: "Software Development Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6667f1bf3464b6377bb014e5_Maria.png",
      },
      {
        name: "Kiranjeet Kaur",
        title: "Software Development Team Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66683a9176521d55a42142ae_kiran%20-%20Kiranjeet%20Kaur.jpg",
      },
      {
        name: "Jazmin Vagha",
        title: "Software Developer & Scrum Master",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6667f361d36661c723a5f3c8_Jazmin.jpeg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-fiserv-bank-on-yourself?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66346c2db16ed9c945e7c018_Bank%20on%20yourself%20%20Fiserv%20%20June%20Event%202024%20-%201.png",
    albumUrl: "https://photos.app.goo.gl/ge3TFoARSZSx3ce4A",
  },
  {
    slug: "own-the-unexpected",
    title: "Own the Unexpected",
    shortDescription: "Join us for an empowering evening as Les Mills International shines a spotlight on the unconventional routes many have taken to enter and navigate the technology industry. Expect to hear powerful stories if resilience, innovation, and success. Furthermore, we'll be exploring the theme of being underestimated - a common experience for many women and minorities in STEM. But rather than viewing it as",
    description: `Join us for an empowering evening as Les Mills International shines a spotlight on the unconventional routes many have taken to enter and navigate the technology industry. Expect to hear powerful stories if resilience, innovation, and success. Furthermore, we'll be exploring the theme of being underestimated - a common experience for many women and minorities in STEM. But rather than viewing it as`,
    category: "networking",
    status: "completed",
    startDate: "2024-05-09",
    startTime: "17:30",
    endTime: "19:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "MEET THE SPEAKERS",
        title: "Technical Lead, Les Mills International",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6628b276a83d5c54c52336f3_AV.png",
      },
      {
        name: "Micayla Wright",
        title: "Technical Lead, Les Mills International",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6628b276a83d5c54c52336f3_AV.png",
      },
      {
        name: "Liz Miller",
        title: "Director Digital Product, Les Mills International",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6628b33d97d6887bb17b8539_LM.png",
      },
      {
        name: "Effy Collis",
        title: "Senior Product Manager, Les Mills International",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6628b3be706b2e3dd86e7422_EC.png",
      },
      {
        name: "Macy Ma",
        title: "Senior Software Engineer, Les Mills International",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6628b43e7f9ad11f23a70e85_MM.png",
      },
      {
        name: "Rebecca Fox",
        title: "Salesforce Platform Manager, Les Mills Int'l",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6628b4d116d06ea1d5bfc01f_RF.png",
      },
      {
        name: "Jess Zhang",
        title: "Senior Data Engineer, Les Mills International",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6628b5534fdcec82458a7913_JZ.png",
      },
      {
        name: "Ramya Kommareddy",
        title: "Delivery Lead, Les Mills International",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6628b5d497d6887bb17e6ecd_RR.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-les-mills-own-the-unexpected?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6626f89f854f893dfd09e264_Own%20the%20Unexpected%20%20MYOB%20%20May%20Event%202024.png",
    albumUrl: "https://photos.app.goo.gl/6PAiXxTGDwA8VuvT9",
  },
  {
    slug: "embracing-bias",
    title: "Embracing Bias",
    shortDescription: "How to use cognitive biases to design great products, services, and your life! Join us for an evening at MYOB where weâll focus on the importance of understanding human behaviour. While technical qualifications can be a gateway to working in software design, we need people from all backgrounds to design meaningful products and services. This talk will speak to the vital contributions human-centr",
    description: `How to use cognitive biases to design great products, services, and your life! Join us for an evening at MYOB where weâll focus on the importance of understanding human behaviour. While technical qualifications can be a gateway to working in software design, we need people from all backgrounds to design meaningful products and services. This talk will speak to the vital contributions human-centr`,
    category: "networking",
    status: "completed",
    startDate: "2024-04-18",
    startTime: "17:30",
    endTime: "19:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Senior Design Researcher, MYOB",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65e8b2441d0ebbd30c2bbcb4_Annabelle%20Yoon%20Headshot.jpeg",
      },
      {
        name: "Annabelle Yoon",
        title: "Senior Design Researcher, MYOB",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65e8b2441d0ebbd30c2bbcb4_Annabelle%20Yoon%20Headshot.jpeg",
      },
      {
        name: "Hazel Halil Halim",
        title: "Senior Service Designer, MYOB",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65e8b284cd0cc1fc20d30c6a_Hazel%20Photo%20(1).jpeg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-myob-embracing-bias?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65e8b1780d4e1a2e971ead33_IMG_9232.png",
    albumUrl: "https://photos.app.goo.gl/brA5VppyZx9mAU2V9",
  },
  {
    slug: "international-womens-day-2",
    title: "International Women's Day",
    shortDescription: "Join us for our annual breakfast event at Woolworths. We will celebrate womenâs achievements, raise awareness about discrimination and take action to drive gender parity. Letâs have the opportunity to network and come together to leave the event with actionable outcomes to #inspireinclusion.",
    description: `Join us for our annual breakfast event at Woolworths. We will celebrate womenâs achievements, raise awareness about discrimination and take action to drive gender parity. Letâs have the opportunity to network and come together to leave the event with actionable outcomes to #inspireinclusion.`,
    category: "networking",
    status: "completed",
    startDate: "2024-03-07",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "MEET THE SPEAKERS",
        title: "Chief Analytics Officer, WWNZ",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65c32737e83dd843e3f12a83_Kathryn%20Byrne%20Photo.jpg",
      },
      {
        name: "Kathryn Byrne",
        title: "Chief Analytics Officer, WWNZ",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65c32737e83dd843e3f12a83_Kathryn%20Byrne%20Photo.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-woolworths-international-women-s-day?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65c325993a60e7690a376381_1.png",
    albumUrl: "https://photos.app.goo.gl/4nECHs1jrfg1X33g8",
  },
  {
    slug: "google-end-of-year-event",
    title: "SHE CELEBRATES",
    shortDescription: "Come celebrate the holiday season with us, reflect on the past year, and hear from diverse role models in tech and inspirations for the future!",
    description: `Come celebrate the holiday season with us, reflect on the past year, and hear from diverse role models in tech and inspirations for the future!`,
    category: "social",
    status: "completed",
    startDate: "2023-12-14",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "MEET THE SPEAKERS",
        title: "Performance Lead at Google",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/655c44185a3b4357bd424bdd_Hannah%20Weir_photo.png",
      },
      {
        name: "Hannah Weir",
        title: "Performance Lead at Google",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/655c44185a3b4357bd424bdd_Hannah%20Weir_photo.png",
      },
      {
        name: "Knight Hou",
        title: "CEO at Relab",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6564fa3498d5c4c4aebd0fb0_Knight%20Hao.png",
      },
      {
        name: "Kriv Naicker",
        title: "Managing Director at Synaptec NZ",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/656469084a1aef8b22fb34b0_KrivNaicker_profilephoto.jpg",
      },
      {
        name: "Natalie Johnston",
        title: "Data Intelligence Analyst at Spark New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65644160f016fd9f3a1f4b93_image_20231127_164637332b0015-59c2-44fc-9983-9c8363ceb781.jpg",
      },
      {
        name: "Darya Koko",
        title: "Senior Software Engineer at Best Practice Software",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65553dcbdf19c64f8bd5d29e_DaryaPhoto.png",
      },
      {
        name: "Ben Amadi",
        title: "Cybersecurity Education Analyst at Xero",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/656782597def54ed3b2cbec3_Ben%20Amadi_Xero_photo.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-celebrates-tot0tupv?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654b31000601810c248260dc_Screen%20Shot%202023-11-08%20at%207.50%201%20(1).png",
    albumUrl: "https://photos.google.com/share/AF1QipOo06Lmikuy3b7dDlOPK1C7ahH1YfFZrc9kH2V-N-zEjxctmj15gEkA8mHeijayWg?key=V2hqZ2syZS02WGp4YzFRMmM0S3JNU3Y4TllSOUhB",
  },
  {
    slug: "google-educator-conference-2023",
    title: "Google Educator Conference 2023",
    shortDescription: "The Google Educator Conference is designed for digital technology teachersâtraining them in STEM subjects and creative ways to present these in New Zealand classrooms.",
    description: `The Google Educator Conference is designed for digital technology teachersâtraining them in STEM subjects and creative ways to present these in New Zealand classrooms.`,
    category: "conference",
    status: "completed",
    startDate: "2023-11-17",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Demo Facilitators",
        title: "ImmerseHer 'Virtual Reality' Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f71ff4f0d7a07cddcab389_Screen%20Shot%202023-09-05%20at%208.32.35%20PM.png",
      },
      {
        name: "Lesieli Oliver",
        title: "ImmerseHer 'Virtual Reality' Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f71ff4f0d7a07cddcab389_Screen%20Shot%202023-09-05%20at%208.32.35%20PM.png",
      },
      {
        name: "Mehwish Hasan",
        title: "Education Ambassador, QuiverVision",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/651401b525c36574d67a3413_Mehwish%20Hasan%20Headshot.jpg",
      },
      {
        name: "Nils Reardon",
        title: "Introduction to Augment Reality Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f9b9ed7b6f7c9f95bec1ff_Nils%20Reardon.jpeg",
      },
      {
        name: "Nischay Gupta",
        title: "Introduction to Augmented Reality Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f9bac5ab2e282389ae1f5d_Screen%20Shot%202023-09-07%20at%207.57.50%20PM.png",
      },
      {
        name: "Steve Smith",
        title: "Google for Education, NZ Program Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65084a6f7eff201d67564fb5_steve%20smith%20photo.jpeg",
      },
      {
        name: "Claire Wigley",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654b416bc4182bc0aac67822_Claire%20Wigley%20photo.jpg",
      },
      {
        name: "MEET THE WORKSHOP FACILITATORS",
        title: "Head of Digital Technology Kerikeri High School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6523c77644a849818c9b981a_Alex%20Ward%204.jpg",
      },
      {
        name: "Alex Ward",
        title: "Head of Digital Technology Kerikeri High School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6523c77644a849818c9b981a_Alex%20Ward%204.jpg",
      },
      {
        name: "Christopher Mende",
        title: "Customer Engineering, Google Cloud NZ",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6523c7864dd8dc8744a0f0f9_christopher-mende-photo%201.jpeg",
      },
      {
        name: "Jennifer Gottschalk",
        title: "Digital Technologies Teacher, Massey High School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/651660618bc5c515a1dbf189_Gottschalk_photo%202.jpg",
      },
      {
        name: "Julie McMahon",
        title: "Lead Educator Grok Academy",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65291784ce92e9979573177e_Julie%201.png",
      },
      {
        name: "MEET THE PANELISTS",
        title: "Education Strategist at Cyclone Computers",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654b43a1b3fadccbb7f5f797_20231108_093807.jpg",
      },
      {
        name: "Aaron Overington",
        title: "Education Strategist at Cyclone Computers",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654b43a1b3fadccbb7f5f797_20231108_093807.jpg",
      },
      {
        name: "Evo Leota-Tupou",
        title: "Founder of Pacific Kids' Learning",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/650ce04b820846784cf43d08_Evo.png",
      },
      {
        name: "Malcolm Clarke",
        title: "President, Digital Technologies Teachers Aotearoa",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65487d1ddf1bfe388e81605e_Malcolm%20Clarke.jpg",
      },
      {
        name: "Shanon O'Connor",
        title: "Founder and Director of TÅnui Collab",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654873b6b75117a8e86f956a_Shanon%20O%27Connor.JPG",
      },
      {
        name: "Tracy Henderson",
        title: "Project Manager at University of Canterbury - CSER",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65487ca84dd34ae38960f123_Tracy%20Henderson.jpeg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65c0a63c0fc5e8376dfd1f29_GEC.png",
    albumUrl: "https://photos.google.com/share/AF1QipPpmlI7QXynCZ_KqLEZu_aQ3asmC4A1gw6OQdWU3G_yo93MWkH2LYLsp7GVJZn8xw?pli=1&key=UGxZdGllaGZPVUNudG95dFFJaTdWYTJmckNhQlJR",
  },
  {
    slug: "technological-change-workplace-workforce-impacts",
    title: "Technological Change - Workplace & Workforce Impacts",
    shortDescription: "Technological change will continue to reshape the workplace and workforce. It's up to us, as individuals, organisations, and societies, to shape this future collaboratively, ensuring that technological change benefits everyone.",
    description: `Technological change will continue to reshape the workplace and workforce. It's up to us, as individuals, organisations, and societies, to shape this future collaboratively, ensuring that technological change benefits everyone.`,
    category: "networking",
    status: "completed",
    startDate: "2023-11-03",
    startTime: "16:30",
    endTime: "18:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Vice President - HCLTech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6507ae756e164409e6fa0726_IMG_4506.jpg",
      },
      {
        name: "Lara Higson",
        title: "Vice President - HCLTech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6507ae756e164409e6fa0726_IMG_4506.jpg",
      },
      {
        name: "Roz Urbahn",
        title: "Chief People Officer - LIC",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65238f3312393c5e483655d8_roz-profile.jpg",
      },
      {
        name: "Divya Kumar",
        title: "Strategy Consultant - HCL Tech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65238fe6a9f45e134cbffae0_Screen%20Shot%202023-10-09%20at%201.30.00%20PM.png",
      },
      {
        name: "Katrina Lipinski",
        title: "Data Chapter Lead - Fonterra IT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65239035a50676b7869edcdc_katrina-profile.png",
      },
      {
        name: "Rosie Spragg",
        title: "General Manager Economic Development - Te Waka",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6523905a6ad2c5e919be9b3f_rosie-profile.jpeg",
      },
      {
        name: "Margaret Paiti",
        title: "Principal Advisor Secondary Transition - MOE",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65264c098c508e0a37d5d9a4_image%20(4).png",
      },
      {
        name: "Sania Naved",
        title: "Business Analyst - Te Whatu Ora",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65278dfae706df81e1fa211b_She%23%20photo%20-%20Sania.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-hcl-technological-change-workplace-and-workforce-impacts?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6506f6f1e2f6c2cf326375a5_Technological-change%20(1).png",
    albumUrl: "https://photos.app.goo.gl/YuKvz6hVJPEnGcG16",
  },
  {
    slug: "inspire-her-te-whakatipuranga-wahine",
    title: "Inspire Her: Te Whakatipuranga Wahine",
    shortDescription: "At She Sharp, our mission is to actively engage a broader range of Maori and Pasifika female students by equipping them with the knowledge, network, and skills to enter STEM industries. We are dedicated to inspiring and empowering the next generation of talent from these communities to explore and embrace the dynamic world of STEM and the digital domain through immersive hands-on workshops on topi",
    description: `At She Sharp, our mission is to actively engage a broader range of Maori and Pasifika female students by equipping them with the knowledge, network, and skills to enter STEM industries. We are dedicated to inspiring and empowering the next generation of talent from these communities to explore and embrace the dynamic world of STEM and the digital domain through immersive hands-on workshops on topi`,
    category: "networking",
    status: "completed",
    startDate: "2023-10-11",
    startTime: "09:00",
    endTime: "15:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "PVC Pacific AUT, Associate Professor - Pasifika EC",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6502d5ea616dd2883ab3a53e_Jacoba.png",
      },
      {
        name: "Jacoba Matapo",
        title: "PVC Pacific AUT, Associate Professor - Pasifika EC",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6502d5ea616dd2883ab3a53e_Jacoba.png",
      },
      {
        name: "Brittany Teei",
        title: "Founder of KidsCoin",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/650921df674b117c1d2fcd76_Brittany%20Teei.png",
      },
      {
        name: "Evo Leota-Tupou",
        title: "Founder of Pacific Kids' Learning",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/650ce04b820846784cf43d08_Evo.png",
      },
      {
        name: "Meet the Workshop Leads",
        title: "The Amazing Robot Maze Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f717e95357a405f5fe9f84_Mahla_Nejati.jpg",
      },
      {
        name: "Dr Mahla Nejati",
        title: "The Amazing Robot Maze Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f717e95357a405f5fe9f84_Mahla_Nejati.jpg",
      },
      {
        name: "Lesieli Oliver",
        title: "ImmerseHer 'Virtual Reality' Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f71ff4f0d7a07cddcab389_Screen%20Shot%202023-09-05%20at%208.32.35%20PM.png",
      },
      {
        name: "Dr Dulsha Kularatna Abeywardana",
        title: "SparkSTEM Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f72860facbe27ca14ada9d_Screen%20Shot%202023-09-05%20at%209.06.46%20PM.png",
      },
      {
        name: "Aneela Lala",
        title: "SparkSTEM Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f728dc7f1109aeeeb1cff4_Screen%20Shot%202023-09-05%20at%209.10.22%20PM.png",
      },
      {
        name: "Nils Reardon",
        title: "Introduction to Augment Reality Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f9b9ed7b6f7c9f95bec1ff_Nils%20Reardon.jpeg",
      },
      {
        name: "Nischay Gupta",
        title: "Introduction to Augmented Reality Workshop Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f9bac5ab2e282389ae1f5d_Screen%20Shot%202023-09-07%20at%207.57.50%20PM.png",
      },
      {
        name: "Meet the Expo Holders",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6505adec246b11c3f53723c4_Group%20480965686.png",
      },
      {
        name: "Centre for Automation and Robotic Engineering Science",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6505adec246b11c3f53723c4_Group%20480965686.png",
      },
      {
        name: "IEEE WIE",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6506eef1fa75cf63c52025c9_Group%20480965686%20(1).png",
      },
      {
        name: "MYOB",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6506ef9385186409b5f2b285_Group%20480965689.png",
      },
      {
        name: "Fonterra",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6506efc6ce2d9d36a2b6b3db_Group%20480965687.png",
      },
      {
        name: "Quivervision",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6506f05f8e404802ea49ffbe_Group%20480965690.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/inspire-her-te-whakatipuranga-wahine?c=website",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f71e8518226d4308e8450f_Screen%20Shot%202023-09-05%20at%208.20%201%20(1).png",
    albumUrl: "https://photos.app.goo.gl/8MLnZczARZSK297Z6",
  },
  {
    slug: "fonterra-a-legendairy-career",
    title: "A Legendairy Career",
    shortDescription: "Good Together: by complementing technical expertise with power skills, the opportunities are endless",
    description: `Good Together: by complementing technical expertise with power skills, the opportunities are endless`,
    category: "networking",
    status: "completed",
    startDate: "2023-08-24",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Panel Host",
        title: "General Manager IT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ba837b5b24857b50e87a6a_SHolland%20picture.JPG",
      },
      {
        name: "Suzanne Holland",
        title: "General Manager IT",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ba837b5b24857b50e87a6a_SHolland%20picture.JPG",
      },
      {
        name: "Meet the Panel",
        title: "IT Graduate",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ba84136e3878d5ec8e845e_Screen%20Shot%202023-07-21%20at%209.11.29%20PM.png",
      },
      {
        name: "Jeeny Then",
        title: "IT Graduate",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ba84136e3878d5ec8e845e_Screen%20Shot%202023-07-21%20at%209.11.29%20PM.png",
      },
      {
        name: "Dr Caroline Murray",
        title: "GM â On Farm Excellence â Animals",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ba8455e0a94b76612dd3c6_Caroline%20Murray.jpg",
      },
      {
        name: "Caroline Campbell",
        title: "Technical Assistant",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ba852c65878f48a0e19a4b_CCampbell%20headshot.jpg",
      },
      {
        name: "Linda Mulvihill",
        title: "General Manager Energy & Climate",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ba8659207f66103ee80e7c_Linda%20M%20profile.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-fonterra-a-legendairy-career",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64c26e358410f2f3de81780f_Event%20Tile_BGs%20(3).png",
    albumUrl: "https://photos.google.com/share/AF1QipPp89jeZu3NIuBu4IyZBEFXPiNW_bu0G3eBGOu1TmViyHc4Q6DVLglaaqr-P8tuVg?key=ejdiZklKV3g4NWR5Q3BuR2R2RVdvcWg4Zzk5aHZn",
  },
  {
    slug: "ai-for-the-environment-hackathon-festival",
    title: "AI for the Environment Hackathon Festival",
    shortDescription: "AI Forum NZ is hosting an AI for the Environment Hackathon Festival across Aotearoa, Australia and the South Pacific. Do you have a passion for saving the planet, starting in our backyard? The winners will pitch their solutions at the AI Summit on 21 September in Auckland.This event will be hosted in partnership with academyEX on August 11th and 12th, kicking off with an inspiring keynote from Fra",
    description: `AI Forum NZ is hosting an AI for the Environment Hackathon Festival across Aotearoa, Australia and the South Pacific. Do you have a passion for saving the planet, starting in our backyard? The winners will pitch their solutions at the AI Summit on 21 September in Auckland.This event will be hosted in partnership with academyEX on August 11th and 12th, kicking off with an inspiring keynote from Fra`,
    category: "workshop",
    status: "completed",
    startDate: "2023-08-11",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/ai-forum-nz-hackathon-2023",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64c26f08b65cd323e912b9c8_Screen%20Shot%202023-07-27%20at%209.17%201%20(1).png",
    albumUrl: "https://photos.app.goo.gl/VdheuDZPz9aV7UUT8",
  },
  {
    slug: "2023-the-buzz-about-banking",
    title: "The Buzz about Banking",
    shortDescription: "Hear the experiences of Kiwibank executives and engage in an innovation roadmap workshop!",
    description: `Hear the experiences of Kiwibank executives and engage in an innovation roadmap workshop!`,
    category: "networking",
    status: "completed",
    startDate: "2023-07-25",
    startTime: "17:00",
    endTime: "19:30",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Chief Digital and Technology Officer, Kiwibank",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/649786d44120e52d61d87966_Hamish%20People%20Tile.png",
      },
      {
        name: "Hamish Rumbold",
        title: "Chief Digital and Technology Officer, Kiwibank",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/649786d44120e52d61d87966_Hamish%20People%20Tile.png",
      },
      {
        name: "Belinda Newman",
        title: "Treasurer, Kiwibank",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/649786e80ba5038800974a30_Belinda%20People%20Tile.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://events.humanitix.com/she-sharp-and-kiwibank",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64978803711ad103aec4cabf_Kiwibank%20Event%20Tile.png",
    albumUrl: "https://photos.app.goo.gl/VDMepEvbrsgNTxxYA",
  },
  {
    slug: "2023-innovation-unleashed",
    title: "Innovation Unleashed",
    shortDescription: "Some of the worldâs leading companies use Deloitteâs 10 Types of Innovation Framework to create innovative products.",
    description: `Some of the worldâs leading companies use Deloitteâs 10 Types of Innovation Framework to create innovative products.`,
    category: "networking",
    status: "completed",
    startDate: "2023-06-20",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet The Speakers",
        title: "Creative Director, Deloitte Creative",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648283f89ed007962ff38991_1_Thomas%20Darlow.png",
      },
      {
        name: "Thomas Darlow",
        title: "Creative Director, Deloitte Creative",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648283f89ed007962ff38991_1_Thomas%20Darlow.png",
      },
      {
        name: "Kath Millard",
        title: "Associate Director, Deloitte",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6482843d6d987582a9d58cf6_2_Kath%20Millard.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64828350ea9d41a9b9477b56_1_Tile%20image.png",
    albumUrl: "https://photos.app.goo.gl/qjg3MPUN54C1mPmTA",
  },
  {
    slug: "tomorrow-expo-tech-week",
    title: "Tomorrow Expo",
    shortDescription: "We had a wonderful time at the NZTech Techweek NZ Tomorrow Expo, where we showcased our work dedicated to empowering women in tech.We were delighted to welcome many groups of students visiting from diverse range of Auckland schools who were eager to learn more about STEM, robotics, AR and VR. They had a chance to try out some of our activities, such as programming a robot, virtual reality and expl",
    description: `We had a wonderful time at the NZTech Techweek NZ Tomorrow Expo, where we showcased our work dedicated to empowering women in tech.We were delighted to welcome many groups of students visiting from diverse range of Auckland schools who were eager to learn more about STEM, robotics, AR and VR. They had a chance to try out some of our activities, such as programming a robot, virtual reality and expl`,
    category: "conference",
    status: "completed",
    startDate: "2023-05-12",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/649ca6cd042bb29e5f8c38e4_Tomorrow%20Expo%20photo-min.JPEG",
    albumUrl: "https://photos.app.goo.gl/CrG8zEn3gx2taT7z8",
  },
  {
    slug: "2023-kickstart-your-career-in-tech-with-myob",
    title: "Kickstart your Career in Tech with MYOB",
    shortDescription: "This event is aimed at providing women with insights and opportunities to pursue a career in the tech industry.",
    description: `This event is aimed at providing women with insights and opportunities to pursue a career in the tech industry.`,
    category: "networking",
    status: "completed",
    startDate: "2023-04-12",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "Product Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476b3feb16fc306be60ea59_2_Anshu%20Maharaj_Speakers.png",
      },
      {
        name: "Anshu Maharaj",
        title: "Product Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476b3feb16fc306be60ea59_2_Anshu%20Maharaj_Speakers.png",
      },
      {
        name: "Laura Rutherfurd",
        title: "Product Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476b25922508d639e5432c8_1_Laura%20Rutherfurd_Speakers.png",
      },
      {
        name: "Lucy Brychkova",
        title: "Quality Analyst",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476b2c1fcda5206fe37b8f0_3_Lucy%20Brychkova_Speakers.png",
      },
      {
        name: "Yvonne Weidemann",
        title: "Business Analyst",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476b331b16fc306be60227f_4_Yvonne%20Weidemann_Speakers.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6494e3e6cf83b867d4bbc1a4_1_Kickstart%20your%20Career%20in%20Tech%20with%20MYOB_V2.jpeg",
    albumUrl: "https://photos.app.goo.gl/5ujM3ZDBZNZkvHf3A",
  },
  {
    slug: "2023-international-womens-day",
    title: "International Womenâs Day",
    shortDescription: "For International Womenâs Day, She Sharp is partnering with Countdown and inviting you to #embraceequity and kick-start your day. Letâs challenge gender stereotypes, call out discrimination, draw attention to bias, and seek out inclusion in all aspects of our personal and professional lives.",
    description: `For International Womenâs Day, She Sharp is partnering with Countdown and inviting you to #embraceequity and kick-start your day. Letâs challenge gender stereotypes, call out discrimination, draw attention to bias, and seek out inclusion in all aspects of our personal and professional lives.`,
    category: "networking",
    status: "completed",
    startDate: "2023-03-08",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Keynote Speaker",
        title: "Head of Sustainability, Countdown",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6497b55bc53c614805089638_Catherine%20Langabeer.jpeg",
      },
      {
        name: "Catherine Langabeer",
        title: "Head of Sustainability, Countdown",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6497b55bc53c614805089638_Catherine%20Langabeer.jpeg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6494e3cae9d75b4110bef55b_2_International%20Women%E2%80%99s%20Day_V2.jpeg",
    albumUrl: "https://photos.app.goo.gl/Dm7dYQxWUZrmiGYp6",
  },
  {
    slug: "2022-she-celebrates",
    title: "She Celebrates",
    shortDescription: "She Sharp is delighted to present She Celebrates: A reflection on the past year and Inspiration for the future! Come and join us for an evening of Reflection and Inspiration presented by a variety of motivational speakers from STEM-related industries and hosted by AWS and She Sharp. This fantastic opportunity will introduce you to new and exciting ideas for the future, while providing a space to n",
    description: `She Sharp is delighted to present She Celebrates: A reflection on the past year and Inspiration for the future! Come and join us for an evening of Reflection and Inspiration presented by a variety of motivational speakers from STEM-related industries and hosted by AWS and She Sharp. This fantastic opportunity will introduce you to new and exciting ideas for the future, while providing a space to n`,
    category: "social",
    status: "completed",
    startDate: "2022-12-05",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet The speaker",
        title: "Founder, GirlBoss New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66ebaa7e8a9d1200adac0006_AlexiaHHeadshotSquare.jpg",
      },
      {
        name: "Alexia Hilbertidou",
        title: "Founder, GirlBoss New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66ebaa7e8a9d1200adac0006_AlexiaHHeadshotSquare.jpg",
      },
      {
        name: "Mike Nooney",
        title: "AWS NZ, Tech Leader",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476df115f664581424da077_2_Mike%20Nooney.png",
      },
      {
        name: "Priti Ambani",
        title: "Tata Consultancy Services",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476df4c7531cb13319aa71e_3_Priti%20Ambani.png",
      },
      {
        name: "Denise Carter-Bennett",
        title: "Datacom, Cybersecurity Analyst",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476df76b75d28b0f30595b1_4_Denise%20Carter-Bennett.png",
      },
      {
        name: "Persis Patel",
        title: "Vodafone, SME Consumer PMO Busines Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476dfa57487080b5533b5c0_5_Persis%20Patel.png",
      },
      {
        name: "Damien Harvey",
        title: "Deloitte, Partner - Consulting",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476dfd07c28c52e940f76da_6_Damien%20Harvey.png",
      },
      {
        name: "Dr. Haren Sam",
        title: "Head of Enterprise Greenfield",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6476dffe816823abe71c3ce8_7_Dr.%20Haren%20Sam.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6494e38de9d75b4110beef0b_3_She%20celebrates_V2.jpeg",
    albumUrl: "https://photos.app.goo.gl/xqbaZe42T4pxaouN9",
  },
  {
    slug: "2022-shaping-the-future-with-ai",
    title: "Shaping the future with AI",
    shortDescription: "The world is constantly evolving. Digital technologies are transforming exponentially from day to day and Artificial Intelligence has changed the way we interact with the world around us. We can find information through conversations with machines, instantly translate written and verbal language and even have our own personal digital assistant.Â",
    description: `The world is constantly evolving. Digital technologies are transforming exponentially from day to day and Artificial Intelligence has changed the way we interact with the world around us. We can find information through conversations with machines, instantly translate written and verbal language and even have our own personal digital assistant.Â`,
    category: "networking",
    status: "completed",
    startDate: "2022-10-20",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6494e3ace9d75b4110bef1a5_4_Shaping%20the%20Future%20with%20AI_V2.jpeg",
    albumUrl: "https://photos.app.goo.gl/v7j1FphkjqNwHs9C8",
  },
  {
    slug: "2022-ai-enviro-hack",
    title: "AI Enviro HackÂ",
    shortDescription: "She Sharp Hackathon is an all-female-led and non-binary 32 hour hackathon, which aims to help individuals to understand they belong in tech and that there are various roles you can have in the tech industry. Do you have a passion to save the planet, starting in our backyard? Weâre bringing to life practical examples from the AI Forumâs recently published AI for Environment in Aotearoa New Zeal",
    description: `She Sharp Hackathon is an all-female-led and non-binary 32 hour hackathon, which aims to help individuals to understand they belong in tech and that there are various roles you can have in the tech industry. Do you have a passion to save the planet, starting in our backyard? Weâre bringing to life practical examples from the AI Forumâs recently published AI for Environment in Aotearoa New Zeal`,
    category: "workshop",
    status: "completed",
    startDate: "2022-09-03",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Keynote speaker",
        title: "Founder, Tech Futures Lab and The Mind Lab",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d2746ba967f65eb18841_Francis%20Valintine.png",
      },
      {
        name: "Frances Valintine",
        title: "Founder, Tech Futures Lab and The Mind Lab",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d2746ba967f65eb18841_Francis%20Valintine.png",
      },
      {
        name: "meet the judges",
        title: "Director - Deloitte New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d2f76ba967f65eb1f7d9_1_Justin%20Wood.png",
      },
      {
        name: "Justin Wood",
        title: "Director - Deloitte New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d2f76ba967f65eb1f7d9_1_Justin%20Wood.png",
      },
      {
        name: "Mahsa McCauley (Mohaghegh)",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Nicole Upchurch",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64780f267a383aaf3739e93c_3_Nicole%20Upchurch.png",
      },
      {
        name: "Pip Gilbert",
        title: "AWS",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6482897f07b33fd23450e2ef_1_Pip%20Gilbert.png",
      },
      {
        name: "Shona Grundy",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64867d3e21cde0e125858442_5_Shona%20Grundy.png",
      },
      {
        name: "meet the mentors",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64780d3b4165a94ec7bb0eaa_1_Amrit%20Kaur.png",
      },
      {
        name: "Amrit Kaur",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64780d3b4165a94ec7bb0eaa_1_Amrit%20Kaur.png",
      },
      {
        name: "Audrey Zhang",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64780da5e448e3020c817da2_2_Audrey%20Zhang.png",
      },
      {
        name: "Jodine Stodart",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64867f73cde40441751f0e30_3_Jodine%20Stodart.png",
      },
      {
        name: "Nikki McLay",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64867faa4967e2567a25e159_4_Nikki%20McLay.png",
      },
      {
        name: "Tariq Shaikh",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64867fd49005664081410391_5_Tariq%20Shaikh.png",
      },
      {
        name: "Chanel Sullivan",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6486800575633d2f785db14a_6_Chanel%20Sullivan.png",
      },
      {
        name: "Christine Yip",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6486802ee7208653a6718053_7_Christine%20Yip.png",
      },
      {
        name: "Fiona Lai",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64868064741436cf6ffbc1de_8_Fiona%20Lai.png",
      },
      {
        name: "Tahseena Begum",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64868096377f5d11a4d320ea_9_Tahseena%20Begum.png",
      },
      {
        name: "Alex Cao",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648680c54967e2567a266d1f_10_Alex%20Cao.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477ed045e6a432b96dab2e7_5_Tile%20Image.png",
    albumUrl: "https://photos.app.goo.gl/xL7pZxBjx4sPNHbG9",
  },
  {
    slug: "2022-navigating-the-workplace-as-a-woman",
    title: "Navigating the Workplace as a Woman",
    shortDescription: "We operate in an unusual world that has seen workplaces and normal operating models change from the norms that we have been used to. Navigating the ânew normalâ can be challenging for both new starters in the tech industry settling in, as well as for managers and teams helping their junior staff find their pathways and build networks in often remote or disrupted working environments.",
    description: `We operate in an unusual world that has seen workplaces and normal operating models change from the norms that we have been used to. Navigating the ânew normalâ can be challenging for both new starters in the tech industry settling in, as well as for managers and teams helping their junior staff find their pathways and build networks in often remote or disrupted working environments.`,
    category: "networking",
    status: "completed",
    startDate: "2022-07-21",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "Associate Product Owner",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648a4696bb2f73c5a042f2a1_1_Renay%20Yang.png",
      },
      {
        name: "Renay Yang",
        title: "Associate Product Owner",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648a4696bb2f73c5a042f2a1_1_Renay%20Yang.png",
      },
      {
        name: "Reilly Sharpe",
        title: "Technology Graduate",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648a46c670b4bfbd4ef2f975_2_Reilly%20Sharpe.png",
      },
      {
        name: "Lauren Halka",
        title: "Technology Graduate",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648290e4839477511e44f04f_3_Lauren%20Halka.png",
      },
      {
        name: "Megan Tapsell",
        title: "Head of Pacific Technology",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6482912aab47e05d56543a67_4_Megan%20Tapsell.png",
      },
      {
        name: "Angela Batistich",
        title: "Tech Area Lead, Wholesale Technologies",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6482917143ecc1e804367593_5_Angela%20Batistich.png",
      },
      {
        name: "Marija Potter",
        title: "Head of Workforce, ANZ Tech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648291bf13795c88a6b873b6_6_Marija%20Potter.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6494e3693325c35d3a244826_6_Navigating%20the%20Workplace%20as%20a%20Woman_V2.jpeg",
    albumUrl: "https://photos.app.goo.gl/nvrAm5Y6BKDZe8WAA",
  },
  {
    slug: "2022-women-in-security",
    title: "Women in SecurityÂ",
    shortDescription: "Join us at the AWS Office in Auckland for this special event recognising individuals, initiatives, and organisations that are changing the norms, reconditioning the way we think about diversity, inclusion, and equity, and shaping a new normal for the security industry in Aotearoa.",
    description: `Join us at the AWS Office in Auckland for this special event recognising individuals, initiatives, and organisations that are changing the norms, reconditioning the way we think about diversity, inclusion, and equity, and shaping a new normal for the security industry in Aotearoa.`,
    category: "networking",
    status: "completed",
    startDate: "2022-06-17",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "Trade Me - Head of Security",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648253be6b22f174f69d795d_1_Kate%20Pearce.png",
      },
      {
        name: "Kate Pearce",
        title: "Trade Me - Head of Security",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648253be6b22f174f69d795d_1_Kate%20Pearce.png",
      },
      {
        name: "Amina AggarwalÂ",
        title: "Spark - Security Consultant",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64824fd9b9ac85dab394fc03_2_Amina%20Aggarwal%C2%A0.png",
      },
      {
        name: "Briar Feng",
        title: "PHD - NZ Super Fund",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6482501e8b5294df7f728629_3_Briar%20Feng.png",
      },
      {
        name: "Laura BellÂ",
        title: "SafeStack Academy - CEO",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648250548453f638f7e9c094_4_Laura%20Bell%C2%A0.png",
      },
      {
        name: "Asya IvanovaÂ",
        title: "Generate KiwiSaver - CTO",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64825ba6b3e1561c0c52c109_5_Asya%20Ivanova%C2%A0.png",
      },
      {
        name: "Special Guests",
        title: "AWS - NZ Country Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648250d3e6213b74fbb6de53_1_Tiffany%20Bloomquist.png",
      },
      {
        name: "Tiffany Bloomquist",
        title: "AWS - NZ Country Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648250d3e6213b74fbb6de53_1_Tiffany%20Bloomquist.png",
      },
      {
        name: "Sarah LockÂ",
        title: "AWS - Startup Account Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6482518de6213b74fbb7d528_2_Sarah%20Lock%C2%A0.png",
      },
      {
        name: "Sai HonigÂ",
        title: "NZNWS - Co-Founder",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648251d9d24696d449324c43_3_Sai%20Honig%C2%A0.png",
      },
      {
        name: "Tash BettridgeÂ",
        title: "NZNWS - Co-Founder",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648252262f2d3942579598c7_4_Tash%20Bettridge%C2%A0.png",
      },
      {
        name: "Abby ZhangÂ",
        title: "NZNWS - Auckland Chapter Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64825a115238aea115f7f985_5_Abby%20Zhang%C2%A0.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6494e53ded6d62b496161928_7_Women%20in%20Security_V2.png",
    albumUrl: "https://photos.app.goo.gl/kAtCCTk9Z1cfUMxRA",
  },
  {
    slug: "2022-women-igniting-tech",
    title: "Women Igniting Tech",
    shortDescription: "Surround yourself with great women: Stories of the women who have ignited our passion for careers in Technology. Enjoy a networking breakfast and surround yourself with great women. She Sharp and Countdown collaborate to bring you first-hand the real stories of the women who are igniting our passion for careers in Technology. Join our breakfast session and see what you can learn to help you re/ign",
    description: `Surround yourself with great women: Stories of the women who have ignited our passion for careers in Technology. Enjoy a networking breakfast and surround yourself with great women. She Sharp and Countdown collaborate to bring you first-hand the real stories of the women who are igniting our passion for careers in Technology. Join our breakfast session and see what you can learn to help you re/ign`,
    category: "networking",
    status: "completed",
    startDate: "2022-05-20",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "Chapter Lead Agile Coaching",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648675c77be995da7605de5e_1_Mispah%20Carelsen.png",
      },
      {
        name: "Mispah Carelsen",
        title: "Chapter Lead Agile Coaching",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648675c77be995da7605de5e_1_Mispah%20Carelsen.png",
      },
      {
        name: "Kari Jones",
        title: "Head of Analytics & Insights",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648678bb23072516cc1b85ed_2_Kari%20Jones.png",
      },
      {
        name: "Shannon Evans",
        title: "Senior Product Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648678ec7487ca6201f8adb0_3_Shannon%20Evans.png",
      },
      {
        name: "Steph Welch",
        title: "Product Chapter Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64867a68f6227d3adca33f7d_4_Steph%20Welch.png",
      },
      {
        name: "Manasi Paul",
        title: "Chapter Lead QA",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6486796f7487ca6201f8ce0b_5_Manasi%20Paul.png",
      },
      {
        name: "Tingting LI",
        title: "Senior Software Developer",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648679a3b30fed3935af6453_6_Tingting%20LI.png",
      },
      {
        name: "Jing Lu",
        title: "Software Developer",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648679d259c4ecf33585bdf6_7_Jing%20Lu.png",
      },
      {
        name: "Mahsa McCauley (Mohaghegh)",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6494e35549db0dffe8756d1d_8_Women%20Igniting%20Tech_V2.jpeg",
    albumUrl: "https://photos.app.goo.gl/WgWXBsgCydK7oghg9",
  },
  {
    slug: "2022-mind-your-own-career",
    title: "Mind your own Career",
    shortDescription: "She Sharp is teaming up with MYOB to discuss the diversity of careers in technology and the multiple pathways we can take to achieve our dream job in STEM. Come along and engage with an expert team of MYOB panellists who will highlight some of the pathways that can be followed which lead to a career in Technology, participate in a guided workshop to help discover our deep-set motivations and Q&A w",
    description: `She Sharp is teaming up with MYOB to discuss the diversity of careers in technology and the multiple pathways we can take to achieve our dream job in STEM. Come along and engage with an expert team of MYOB panellists who will highlight some of the pathways that can be followed which lead to a career in Technology, participate in a guided workshop to help discover our deep-set motivations and Q&A w`,
    category: "networking",
    status: "completed",
    startDate: "2022-04-28",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "Delivery Manager at MYOB",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64867c2dd1fa9d749a79d64b_1_Lyndsay%20Kilburn.png",
      },
      {
        name: "Lyndsay Kilburn",
        title: "Delivery Manager at MYOB",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64867c2dd1fa9d749a79d64b_1_Lyndsay%20Kilburn.png",
      },
      {
        name: "Taylor Waddington",
        title: "ProtÃ©gÃ© Software Developer at MYOB",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6486829bfe9ab71e50be070b_2_Taylor%20Waddington.png",
      },
      {
        name: "Kyle Nicholas",
        title: "Senior Developer at MYOB",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648682c751d3e1c28b6a1af3_3_Kyle%20Nicholas.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6494e54bed6d62b496163a4a_9_Mind%20your%20own%20Career_V2.png",
    albumUrl: "https://photos.app.goo.gl/XLUJykcL6DD8kVjU6",
  },
  {
    slug: "2022-break-the-bias",
    title: "Break the Bias",
    shortDescription: "International Womenâs Day is fast approaching and She Sharp is partnering with AWS to bring you an inspirational evening where we talk all about #breakingthebias!",
    description: `International Womenâs Day is fast approaching and She Sharp is partnering with AWS to bring you an inspirational evening where we talk all about #breakingthebias!`,
    category: "networking",
    status: "completed",
    startDate: "2022-03-10",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "AWS",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6482897f07b33fd23450e2ef_1_Pip%20Gilbert.png",
      },
      {
        name: "Pip Gilbert",
        title: "AWS",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6482897f07b33fd23450e2ef_1_Pip%20Gilbert.png",
      },
      {
        name: "Gilbert Quinn",
        title: "AWS",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64828b92749917a512c020c5_2_Gilbert%20Quinn.png",
      },
      {
        name: "Pratima Singh",
        title: "AWS",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64828be3707cd0f45ee67d28_3_Pratima%20Singh.png",
      },
      {
        name: "Adam Barker",
        title: "AWS",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64828c1e703c18919f0bde8c_4_Adam%20Barker.png",
      },
      {
        name: "Workshop Presenters",
        title: "GD1 (Global from Day One)",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64828c87d1b3a162a1142d8b_1_Erin%20Anderson%20Scott.png",
      },
      {
        name: "Erin Anderson Scott",
        title: "GD1 (Global from Day One)",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64828c87d1b3a162a1142d8b_1_Erin%20Anderson%20Scott.png",
      },
      {
        name: "Pauli Sosa",
        title: "Go Hard on Tech (Auckland Unlimited)",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64828d5ac5e5af003d6be744_2_Pauli%20Sosa.png",
      },
      {
        name: "Ankita Dhakar",
        title: "Security Lit / Cyber Cosmos",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64828da52c68a7521b2c389a_3_Ankita%20Dhakar.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6494e3123cb23a9e7bbdc6df_10_Break%20the%20Bias_V2.jpeg",
    albumUrl: "https://photos.app.goo.gl/Wo8NNXtzdfhzbHcG7",
  },
  {
    slug: "women-in-data-and-analytics",
    title: "Women in Data and Analytics",
    shortDescription: "Join us ONLINE on Tuesday 30th November for a jam-packed evening!",
    description: `Join us ONLINE on Tuesday 30th November for a jam-packed evening!`,
    category: "networking",
    status: "completed",
    startDate: "2021-11-30",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ec4a4d2a184282fda5733e_Leila%20-%20photo.png",
      },
      {
        name: "Leila Etaati",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ec4a4d2a184282fda5733e_Leila%20-%20photo.png",
      },
      {
        name: "Indira Bandari",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ec4a9a7d1c69f7fb0be2bd_Indira%20-%20photo.jpg",
      },
      {
        name: "Owen Auger",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ec4abc3999b3c2c5a5214f_Owen%20-%20photo.jpg",
      },
      {
        name: "Sudhir Rawat",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ec4adf3ce19c2c5c44653b_Sudhir%20-%20photo.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ec49622a184282fda46b41_landing%20image.JPG",
  },
  {
    slug: "ada-lovelace-day",
    title: "Ada Lovelace Day",
    shortDescription: "Join us to celebrate Ada Lovelace Day and International Day of the Girls. We are delighted to present two wonderful speakers for this event â Ankita and Elina. Hear their stories and be inspired!",
    description: `Join us to celebrate Ada Lovelace Day and International Day of the Girls. We are delighted to present two wonderful speakers for this event â Ankita and Elina. Hear their stories and be inspired!`,
    category: "networking",
    status: "completed",
    startDate: "2021-10-11",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ec501ea6cca4de3256029e_Elina%20-%20photo.jpg",
      },
      {
        name: "Elina Ashimbayeva",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64ec501ea6cca4de3256029e_Elina%20-%20photo.jpg",
      },
      {
        name: "Ankita Dhakar",
        title: "Security Lit / Cyber Cosmos",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64828da52c68a7521b2c389a_3_Ankita%20Dhakar.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562b2a35867daf52e28b2fe_Screen%20Shot%202023-11-26%20at%203.49%201.png",
  },
  {
    slug: "2021-iamremarkable",
    title: "IamRemarkable",
    shortDescription: "#IamRemarkable is a Google initiative empowering women and other underrepresented groups to celebrate their achievements in the workplace and beyond.",
    description: `#IamRemarkable is a Google initiative empowering women and other underrepresented groups to celebrate their achievements in the workplace and beyond.`,
    category: "networking",
    status: "completed",
    startDate: "2021-09-15",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64eb035bf21a7d732ec814fa_IamRemarkable%20Online%20Workshop(1).png",
  },
  {
    slug: "women-in-ai-for-social-good",
    title: "Women in AI for social good",
    shortDescription: "From healthcare, to finance, education and government, artificial intelligence (AI) is reshaping every part of our lives. It is also helping solve some of the worldâs greatest challenges. However, women account for less than 25 percent of the AI workforce.",
    description: `From healthcare, to finance, education and government, artificial intelligence (AI) is reshaping every part of our lives. It is also helping solve some of the worldâs greatest challenges. However, women account for less than 25 percent of the AI workforce.`,
    category: "social",
    status: "completed",
    startDate: "2021-06-08",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Mahsa McCauley (Mohaghegh)",
        title: "Founder and Chair - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d34fd4a7dba0fe2b6467_2_Mahsa%20McCauley.png",
      },
      {
        name: "Jean Yang",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Heather Gadonniex",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Nikki McLay",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64867faa4967e2567a25e159_4_Nikki%20McLay.png",
      },
      {
        name: "Kirrily Denny",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Jacqueline Comer",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd2d7602aec51ad6de54_Screen%20Shot%202023-11-26%20at%204.35%201.png",
    albumUrl: "https://photos.app.goo.gl/TJuU1hjyTMJzHVR46",
  },
  {
    slug: "the-truths-to-gaming-and-start-up",
    title: "The Truths to Gaming and Start-up",
    shortDescription: "âThe Truths to Gaming and Start-up - SheSharp Editionâ is organised by SheSharp, in collaboration with Geo AR Games & the New Zealand Game Developers Association (NZGDA). If youâre interested in Gaming, Augmented Reality, and Development, then this is an event you donât want to miss!",
    description: `âThe Truths to Gaming and Start-up - SheSharp Editionâ is organised by SheSharp, in collaboration with Geo AR Games & the New Zealand Game Developers Association (NZGDA). If youâre interested in Gaming, Augmented Reality, and Development, then this is an event you donât want to miss!`,
    category: "networking",
    status: "completed",
    startDate: "2021-05-25",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "MEET THE SPEAKERS",
        title: "OUR SPEAKER",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f93a9f9a746969321b2fdc_1516268653905.jpeg",
      },
      {
        name: "Melanie Langlotz",
        title: "OUR SPEAKER",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f93a9f9a746969321b2fdc_1516268653905.jpeg",
      },
      {
        name: "Talia Pua",
        title: "Creative Director at Hand Pulled Collective",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f93f0583e4f598c5dfc8ac_1629082152983.jpeg",
      },
      {
        name: "Carol Taka",
        title: "MÄori Game Designer and Creative",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f9408288c68388ad00128e_1677104858462.jpg",
      },
      {
        name: "Vaanipriya Diwan",
        title: "Creative Technologist",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f9411cbb26fe236bdfd0be_1531124351355.jpeg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65277a1019ab40b9c17a26e5_The%20Truths%20to%20Gaming...png",
    albumUrl: "https://photos.app.goo.gl/qBktoQHvdBSEqhrc6",
  },
  {
    slug: "imagine-zone-techweek",
    title: "Imagine Zone - TechWeek",
    shortDescription: "TheÂMinistry of EducationÂ andÂNZTechpartnered up to host the Tech21 Summit, to inspire Äkonga (learners) into technology careers. The one day Summit aimed to spark inspiration for year 7â10Â  Äkonga while showcasing tech innovation and creativity, plus offering the opportunity to find out more about Technology Learning career pathways.",
    description: `TheÂMinistry of EducationÂ andÂNZTechpartnered up to host the Tech21 Summit, to inspire Äkonga (learners) into technology careers. The one day Summit aimed to spark inspiration for year 7â10Â  Äkonga while showcasing tech innovation and creativity, plus offering the opportunity to find out more about Technology Learning career pathways.`,
    category: "networking",
    status: "completed",
    startDate: "2021-05-24",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562c1b57602aec51ad96329_Screen%20Shot%202023-11-26%20at%204.53%201.png",
    albumUrl: "https://photos.app.goo.gl/EUqHeNaCKx1YnPRZ8",
  },
  {
    slug: "women-in-tech-and-trades",
    title: "Women in Tech and Trades",
    shortDescription: "This monthâs event was all about women in tech and trades who are proving that they are more than just a diversity quota filler & industry leaders who are setting a new benchmark for inclusivity every day.",
    description: `This monthâs event was all about women in tech and trades who are proving that they are more than just a diversity quota filler & industry leaders who are setting a new benchmark for inclusivity every day.`,
    category: "networking",
    status: "completed",
    startDate: "2021-04-29",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Chief Technical and Product Officer",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6518fe0f198fff26d0199285_1610665363083.jpeg",
      },
      {
        name: "Chris Stevens",
        title: "Chief Technical and Product Officer",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6518fe0f198fff26d0199285_1610665363083.jpeg",
      },
      {
        name: "Babra Ajaz",
        title: "Senior Software Engineer - Deloitte",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668c88bb3b00d4de350e69b8_headshot%20-%20Babra%20Ajaz.jpeg",
      },
      {
        name: "Ruby Kolesky",
        title: "Co-CEO, â¤ï¸ of Product @ Joyous",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6518ffc0f62a50461a28df9b_1694685688437.jpeg",
      },
      {
        name: "Amy FitzPatrick",
        title: "Owner, Pink Sparky",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562b83c332c7603e8986a74_Screen%20Shot%202023-11-26%20at%204.15.01%20PM.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562b6c4450333206054b5d5_Event%20Tile_BGs%20(11).png",
    albumUrl: "https://photos.app.goo.gl/SGiRGm4PKmDy9ouy5",
  },
  {
    slug: "2021-international-womens-day",
    title: "International Women's Day",
    shortDescription: "SheSharp is delighted to announce our first community event of the year: We are partnering with MYOB to celebrate International Womenâs Day! There will be team challenges, fun quizzes, and general fun and interactive awesomeness. So bring your A-game along! This is a great event to bring along your work colleagues to network and reconnect with others you havenât had the opportunity to meet in ",
    description: `SheSharp is delighted to announce our first community event of the year: We are partnering with MYOB to celebrate International Womenâs Day! There will be team challenges, fun quizzes, and general fun and interactive awesomeness. So bring your A-game along! This is a great event to bring along your work colleagues to network and reconnect with others you havenât had the opportunity to meet in `,
    category: "networking",
    status: "completed",
    startDate: "2021-03-18",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f8373ec5d3aadabfb86784_Camilla%20Weinstein.png",
      },
      {
        name: "Camilla Weinstein",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f8373ec5d3aadabfb86784_Camilla%20Weinstein.png",
      },
      {
        name: "Grant McIvor",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Meet the Panellists",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f8377e1139bd0eb92aa53e_Lindsay%20Brotherton%20Kilburn.jpg",
      },
      {
        name: "Lindsay Brotherton Kilburn",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f8377e1139bd0eb92aa53e_Lindsay%20Brotherton%20Kilburn.jpg",
      },
      {
        name: "Dene Lynch",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Martin Longley",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f837a0c5d3aadabfb8bda8_Martin%20Longley.jpg",
      },
      {
        name: "Taylor Waddington",
        title: "ProtÃ©gÃ© Software Developer at MYOB",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6486829bfe9ab71e50be070b_2_Taylor%20Waddington.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562c52e5867daf52e34066c_Screen%20Shot%202023-11-26%20at%205.09%201.png",
    albumUrl: "https://photos.app.goo.gl/DrumDy7uurprGiX68",
  },
  {
    slug: "girls-night-out",
    title: "Girls Night Out",
    shortDescription: "We partnered with Xero to give people an opportunity to have a much needed night out to end 2020 with a bang!",
    description: `We partnered with Xero to give people an opportunity to have a much needed night out to end 2020 with a bang!`,
    category: "social",
    status: "completed",
    startDate: "2020-11-26",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Security Risk & Compliance Specialist, Xero",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Monica Makau (Mumbi)",
        title: "Security Risk & Compliance Specialist, Xero",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Monique Warrington",
        title: "Graduate, Xero",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Catherine Sun (Cat)",
        title: "Product Insights Lead, Xero",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562bd916a2068e01dc80fa4_WhatsApp_Image_2023-10-18_at_5.35.37_PM.jpeg.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f82ca021aa3802cee9bf48_Girls%20night%20out.png",
    albumUrl: "https://photos.app.goo.gl/dDLxQ92n5NSzrfDk9",
  },
  {
    slug: "online-quiz-night-celebrating-ada-lovelace-day",
    title: "Online Quiz Night celebrating Ada Lovelace Day",
    shortDescription: "We have another amazing event coming up on the 15th October with our lovely She Sharp Alumni, Ruth James speaking at the Event! The event is to celebrate Ada Lovelace Day! In sponsorship with Xero!",
    description: `We have another amazing event coming up on the 15th October with our lovely She Sharp Alumni, Ruth James speaking at the Event! The event is to celebrate Ada Lovelace Day! In sponsorship with Xero!`,
    category: "webinar",
    status: "completed",
    startDate: "2020-10-15",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562d4f14f5963423a071387_Screen%20Shot%202023-11-26%20at%206.17.30%20PM.png",
      },
      {
        name: "Ruth James",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562d4f14f5963423a071387_Screen%20Shot%202023-11-26%20at%206.17.30%20PM.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562d5e0dcbd1d3b7f7e987f_Screen%20Shot%202023-11-26%20at%206.19%201.png",
    albumUrl: "https://photos.app.goo.gl/KmMQByWYpxDE4yoz7",
  },
  {
    slug: "she-storytellers-series-2-0",
    title: "SHE# Storytellers Series 2.0",
    shortDescription: "SheSharp is delighted to announce Storytellers Series 2.0 after an overwhelming response from our first series!",
    description: `SheSharp is delighted to announce Storytellers Series 2.0 after an overwhelming response from our first series!`,
    category: "networking",
    status: "completed",
    startDate: "2020-09-24",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet The Speakers",
        title: "NZNWS - Co-Founder",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648251d9d24696d449324c43_3_Sai%20Honig%C2%A0.png",
      },
      {
        name: "Sai HonigÂ",
        title: "NZNWS - Co-Founder",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648251d9d24696d449324c43_3_Sai%20Honig%C2%A0.png",
      },
      {
        name: "Divya Kumar",
        title: "Strategy Consultant - HCL Tech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65238fe6a9f45e134cbffae0_Screen%20Shot%202023-10-09%20at%201.30.00%20PM.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65ba0df3f3f95eec638681d3_She%20Sharp%20Speakers%20Series%202.0%20-%20Social%20Media%20Square%20(1).png",
    albumUrl: "https://photos.app.goo.gl/5Co2mqzaYwJXytE7A",
  },
  {
    slug: "shesharp-future-ready",
    title: "SheSharp Future Ready",
    shortDescription: "Join She Sharp for an inspirational and empowering panel on STEM Careers for our future generations. The recent times have taught us that if there is anything that the future holds is the impact technology will have on our day-to-day. We hope to inspire and guide you to learn more about various STEM pathways.",
    description: `Join She Sharp for an inspirational and empowering panel on STEM Careers for our future generations. The recent times have taught us that if there is anything that the future holds is the impact technology will have on our day-to-day. We hope to inspire and guide you to learn more about various STEM pathways.`,
    category: "networking",
    status: "completed",
    startDate: "2020-08-13",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64780d3b4165a94ec7bb0eaa_1_Amrit%20Kaur.png",
      },
      {
        name: "Amrit Kaur",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64780d3b4165a94ec7bb0eaa_1_Amrit%20Kaur.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6541eb6a63018af5b0b3c9e5_Future%20Ready.png",
    albumUrl: "https://photos.app.goo.gl/tyz4czPPvav8fE93A",
  },
  {
    slug: "she-sharp-techweek-envision-the-future",
    title: "She Sharp Techweek: Envision The Future",
    shortDescription: "Join She Sharp for an inspiring and thought-provoking panel on the future of leadership in technology. 2020 has brought unprecedented challenges to the forefront of humanity. With a crisis comes opportunities. Learn how we can harness the power of human ingenuity to create a better tomorrow. Topics to be discussed will include:",
    description: `Join She Sharp for an inspiring and thought-provoking panel on the future of leadership in technology. 2020 has brought unprecedented challenges to the forefront of humanity. With a crisis comes opportunities. Learn how we can harness the power of human ingenuity to create a better tomorrow. Topics to be discussed will include:`,
    category: "networking",
    status: "completed",
    startDate: "2020-07-29",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64faedd0e6f461cad8ec0e3e_Techweek2020.webp",
    albumUrl: "https://photos.app.goo.gl/6H7FqD4NgPBQMtk39",
  },
  {
    slug: "she-storytellers-series",
    title: "SHE# Storytellers Series",
    shortDescription: "Whilst 2020 started off with a bang, the start of a new decade, it quickly turned into unprecedented times. Yes, weâve heard the word âunprecedentedâ a lot over the past few months, but the truth is, the world just wasnât prepared for what was quickly evolving to be the biggest pandemic of this generation. For us here, in little olâ New Zealand, Kiwis too, persevered, making sacrifices f",
    description: `Whilst 2020 started off with a bang, the start of a new decade, it quickly turned into unprecedented times. Yes, weâve heard the word âunprecedentedâ a lot over the past few months, but the truth is, the world just wasnât prepared for what was quickly evolving to be the biggest pandemic of this generation. For us here, in little olâ New Zealand, Kiwis too, persevered, making sacrifices f`,
    category: "networking",
    status: "completed",
    startDate: "2020-05-28",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet The Speakers",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f7bd97700193c77acbca98_saba-samiei.jpg",
      },
      {
        name: "Saba Samiei",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64f7bd97700193c77acbca98_saba-samiei.jpg",
      },
      {
        name: "Tash BettridgeÂ",
        title: "NZNWS - Co-Founder",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/648252262f2d3942579598c7_4_Tash%20Bettridge%C2%A0.png",
      },
      {
        name: "Dr Lena Waizenegger",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64fe6be4b23a976cbc99cf2f_Dr%20Lena.png",
      },
      {
        name: "Alisa Edwards",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64fe6d05a1cce20956d4e278_Alisa%20Edwards.png",
      },
      {
        name: "Paola Golledge",
        title: "",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64fe6ee6176be51b08818d6e_Paola.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65ba0ab8a581c7736378608f_She%20Sharp%20Speakers%20Series%20Social%20Media%20Square%20v4.png",
  },
  {
    slug: "robotic-process-automation",
    title: "Robotic Process Automation Workshop",
    shortDescription: "We invite you to take part in our automation challenge, which will have you working in teams to develop an automated solution for a basic use case. There will be experienced developers on hand to help you through your solution, but with limited time this will definitely be a challenge. We have prepared some pre-work to help you prepare for the day, however the software we will be using (UiPath) is",
    description: `We invite you to take part in our automation challenge, which will have you working in teams to develop an automated solution for a basic use case. There will be experienced developers on hand to help you through your solution, but with limited time this will definitely be a challenge. We have prepared some pre-work to help you prepare for the day, however the software we will be using (UiPath) is`,
    category: "workshop",
    status: "completed",
    startDate: "2020-03-05",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the speakers",
        title: "Automation Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65013352e6920711965c57d9_87654148_2686054368342840_2068468739518496768_n.jpg",
      },
      {
        name: "Priyanka Tailor",
        title: "Automation Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65013352e6920711965c57d9_87654148_2686054368342840_2068468739518496768_n.jpg",
      },
      {
        name: "Thashnee Pillay",
        title: "Service Design Lead",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/650133c09ad19c5f51f01063_87873690_2687338451547765_4406142030535720960_n.jpg",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65013115c8690e010a0e9084_landingImage.jpg",
    albumUrl: "https://photos.app.goo.gl/K87RwgfETg7gcJWr7",
  },
  {
    slug: "she-sharp-centrality",
    title: "She Sharp @ Centrality",
    shortDescription: "Unless you have been living under a rock, you will have heard of blockchain.",
    description: `Unless you have been living under a rock, you will have heard of blockchain.`,
    category: "networking",
    status: "completed",
    startDate: "2019-07-25",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Product Manager at Centrality",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654aa37e2d41de50e8f368b8_Speaker1.png",
      },
      {
        name: "Bette Chen",
        title: "Product Manager at Centrality",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654aa37e2d41de50e8f368b8_Speaker1.png",
      },
      {
        name: "Kathryn Topp",
        title: "CEO & Founder Yabble",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654aa3e077de00da827e7dcb_Speaker%202.png",
      },
      {
        name: "Kaye Maree Dunn",
        title: "Co-Founder at Ähau",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654aa458235cf4f597054f92_KMH.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6550a2aa308e88ddc86ad294_Event%20Tile_BGs%20(10).png",
    albumUrl: "https://photos.app.goo.gl/YJM9SteTrd6i1zXH8",
  },
  {
    slug: "she-wahine-kakano",
    title: "SHE# @ WÄHINE KÄKANO",
    shortDescription: "WÄhine KÄkano is New Zealandâs premier young womenâs festival where young women between the ages of 16-22 years can attend a wide range of workshops which will equip them with skills and confidence required to take on their careers.",
    description: `WÄhine KÄkano is New Zealandâs premier young womenâs festival where young women between the ages of 16-22 years can attend a wide range of workshops which will equip them with skills and confidence required to take on their careers.`,
    category: "networking",
    status: "completed",
    startDate: "2019-06-24",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6550a255f224407ac9d6ca99_wahine-kakano-she%201%20(1).png",
    albumUrl: "https://photos.app.goo.gl/PtMF1YjAqTY1uLvQ8",
  },
  {
    slug: "she-amazon-web-services-aws",
    title: "SHE# @ AMAZON WEB SERVICES (AWS)",
    shortDescription: "She# was proud to hold an incredible event at Amazon Web Services on a very inspiring topic: The Amazon Culture of Innovation. Attendees enjoyed listening to AWSâs Katrien Pagenaer, the NZ Sales Manager at AWS as she talked about the the key innovation fostering ideas followed by Amazon that helped it grow from an online books retailer to an e-commerce and computing giant. This was followed by a",
    description: `She# was proud to hold an incredible event at Amazon Web Services on a very inspiring topic: The Amazon Culture of Innovation. Attendees enjoyed listening to AWSâs Katrien Pagenaer, the NZ Sales Manager at AWS as she talked about the the key innovation fostering ideas followed by Amazon that helped it grow from an online books retailer to an e-commerce and computing giant. This was followed by a`,
    category: "networking",
    status: "completed",
    startDate: "2019-06-13",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speaker",
        title: "NZ Sales Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6541ee7429b55768d464dab9_Katrien%20Pagnaer.png",
      },
      {
        name: "Katrien Pagenaer",
        title: "NZ Sales Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6541ee7429b55768d464dab9_Katrien%20Pagnaer.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6550a285de5933fd685d2136_Event%20Tile_BGs%20(9).png",
    albumUrl: "https://photos.app.goo.gl/Yh1Kr9SaA4dYMujr5",
  },
  {
    slug: "she-workday",
    title: "SHE# @ WORKDAY",
    shortDescription: "She# in collaboration with Workday developed an interactive evening exploring the world of Cyber Security. The attendees were divided into groups for an exiting session of cyber-security quiz and the winners received Workday goodies. We were also delighted to hear from a panel of four Workday employees about their journeys into this industry. The evening was brought to a close by a demonstration o",
    description: `She# in collaboration with Workday developed an interactive evening exploring the world of Cyber Security. The attendees were divided into groups for an exiting session of cyber-security quiz and the winners received Workday goodies. We were also delighted to hear from a panel of four Workday employees about their journeys into this industry. The evening was brought to a close by a demonstration o`,
    category: "networking",
    status: "completed",
    startDate: "2019-05-02",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6550a23419795897b21d0281_workday-card%201%20(1).png",
    albumUrl: "https://photos.app.goo.gl/ZKbFaBhM562arnnd8",
  },
  {
    slug: "she-deloitte",
    title: "SHE# @ DELOITTE",
    shortDescription: "She# was delighted to be invited to Deloitte for a Chatbot Design Workshop. Over 40 attendees were split into teams to develop a Chatbot solution in a case study presented by Deloitte. Experienced Deloitte consultants mentored each team to ensure they had the necessary guidance. Teams elected four members to talk to the âclientâ and understand the client requirements for the solution. Finally,",
    description: `She# was delighted to be invited to Deloitte for a Chatbot Design Workshop. Over 40 attendees were split into teams to develop a Chatbot solution in a case study presented by Deloitte. Experienced Deloitte consultants mentored each team to ensure they had the necessary guidance. Teams elected four members to talk to the âclientâ and understand the client requirements for the solution. Finally,`,
    category: "networking",
    status: "completed",
    startDate: "2019-03-06",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Director",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6541a15fcc35060620e8d0f1_kate.png",
      },
      {
        name: "Kate Reid",
        title: "Director",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6541a15fcc35060620e8d0f1_kate.png",
      },
      {
        name: "Justin Wood",
        title: "Director - Deloitte New Zealand",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6477d2f76ba967f65eb1f7d9_1_Justin%20Wood.png",
      },
      {
        name: "Damian Harvey",
        title: "Partner",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6541a1f87ba6babe478e983b_Damian%20Harvey.png",
      },
      {
        name: "Bev Cassidy-Mackenzie",
        title: "Diversity and Inclusion Expert",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6541a2e75ffc7529840b56f3_Bev%20Cassidy-Mackenzie.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6550a1f14d1a59b887876b5b_Event%20Tile_BGs%20(6).png",
    albumUrl: "https://photos.app.goo.gl/ESDcBgJKy8vxXCVWA",
  },
  {
    slug: "she-sharp-nyriad",
    title: "She Sharp @ Nyriad",
    shortDescription: "Nyriad is our platinum sponsor and held their very first event with us on 26th July, 2018. Nyriad is a New Zealand exascale software company specialising in advance data storage solutions for big data and high performing computing.",
    description: `Nyriad is our platinum sponsor and held their very first event with us on 26th July, 2018. Nyriad is a New Zealand exascale software company specialising in advance data storage solutions for big data and high performing computing.`,
    category: "networking",
    status: "completed",
    startDate: "2018-07-26",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65546f49288acc86aa5df4b2_The%20Truths%20to%20Gaming...png",
    albumUrl: "https://photos.app.goo.gl/qcMhc1rHJ6fBgtv8A",
  },
  {
    slug: "vision-board-grid-akl",
    title: "Vision Board @ Grid AKL",
    shortDescription: "Lynda Clements (UoA) and Judy MacFarlaine (AUT), who have conducted these workshops previously, talked a bit about what Vision Boards are and how they can help us direct our attention and intention for our goals and desires.",
    description: `Lynda Clements (UoA) and Judy MacFarlaine (AUT), who have conducted these workshops previously, talked a bit about what Vision Boards are and how they can help us direct our attention and intention for our goals and desires.`,
    category: "networking",
    status: "completed",
    startDate: "2018-06-26",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65546ae80764bf6513d49b23_Event%20Tile_BGs%20(1).png",
    albumUrl: "https://photos.app.goo.gl/qcMhc1rHJ6fBgtv8A",
  },
  {
    slug: "she-sharp-techweek",
    title: "She Sharp @ TechWeek",
    shortDescription: "The event was about learning project management skill and how these concepts can be used by anyone in our daily lives.The workshop provided an introduction to the basics of project management as well as tools and techniques to help develop skills to become a great project manager leading successful projects.",
    description: `The event was about learning project management skill and how these concepts can be used by anyone in our daily lives.The workshop provided an introduction to the basics of project management as well as tools and techniques to help develop skills to become a great project manager leading successful projects.`,
    category: "networking",
    status: "completed",
    startDate: "2018-05-26",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/655467585a5309a409f6af25_Event%20Tile_BGs.png",
    albumUrl: "https://photos.app.goo.gl/nzoPZDiyhnmzfYzr6",
  },
  {
    slug: "she-sharp-vend",
    title: "She Sharp @ VEND",
    shortDescription: "A joint event with Vend, held on 26th April, taught the women about real-world that Vend solves. They also shared their why, why they do the things they do and how they do. We also heard from Jade, Joanna and Novia, some of the senior women from product, design and engineering. The event also gave the attendees to work on a problem which simulated the Challenges faced in a real world scenario.",
    description: `A joint event with Vend, held on 26th April, taught the women about real-world that Vend solves. They also shared their why, why they do the things they do and how they do. We also heard from Jade, Joanna and Novia, some of the senior women from product, design and engineering. The event also gave the attendees to work on a problem which simulated the Challenges faced in a real world scenario.`,
    category: "networking",
    status: "completed",
    startDate: "2018-04-26",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/655464c93a5afa26bf74f0ee_9_Cover%20(1).png",
    albumUrl: "https://photos.app.goo.gl/P1wRFoB1FXZfjFwd8",
  },
  {
    slug: "she-with-google-codelab",
    title: "SHE# with Google Codelab",
    shortDescription: "We partnered with our gold sponsor again this year for the annual SheSharp with Google event. Over 50 attendees, from students to working professionals, joined us for this midday event held on Monday 26th March at AUT city campus.",
    description: `We partnered with our gold sponsor again this year for the annual SheSharp with Google event. Over 50 attendees, from students to working professionals, joined us for this midday event held on Monday 26th March at AUT city campus.`,
    category: "workshop",
    status: "completed",
    startDate: "2018-03-26",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654b307b4cfa8fab0e35d99f_29352035_10155498139713519_4620327580508639018_o.jpg",
    albumUrl: "https://photos.app.goo.gl/9myFnTVS6KUeDmRx5",
  },
  {
    slug: "design-thinking",
    title: "Design Thinking",
    shortDescription: "The event was facilitated by representation from the Digital UX department, Product Owners, as well as current interns at Air New Zealand.We were introduced to Design Thinking as âA problem solving approach, particularly applicable to fuzzy or wicked problems â making it well suited to design human experiencesâ.",
    description: `The event was facilitated by representation from the Digital UX department, Product Owners, as well as current interns at Air New Zealand.We were introduced to Design Thinking as âA problem solving approach, particularly applicable to fuzzy or wicked problems â making it well suited to design human experiencesâ.`,
    category: "workshop",
    status: "completed",
    startDate: "2018-02-20",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/654b2c1826ec7e025ca0cf83_28954072_10155490495263519_4487677198732673971_o.jpg",
    albumUrl: "https://photos.app.goo.gl/kT2rPYNb5yFr6yst5",
  },
  {
    slug: "auckland-tech-grand-tour",
    title: "AUCKLAND TECH GRAND TOUR",
    shortDescription: "We wrapped up 2017 with an Auckland Tech Grand Tour of some of the biggest names in the local tech scene. Transport and lunch was provided for the female university and high school students that went on a whistle stop tour.",
    description: `We wrapped up 2017 with an Auckland Tech Grand Tour of some of the biggest names in the local tech scene. Transport and lunch was provided for the female university and high school students that went on a whistle stop tour.`,
    category: "networking",
    status: "completed",
    startDate: "2017-12-11",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/655bd62128e417eef19cb904_Christmas%20event2017.png",
    albumUrl: "https://photos.app.goo.gl/LmTbupupj7u1JG5A9",
  },
  {
    slug: "she-pushpay",
    title: "SHE# @ PUSHPAY",
    shortDescription: "We had our event with PushPay on 19th Oct, 2017 and it was about the DevOps concepts and how it is bringing cultural change in industry. We had 3 awesome speakers from 3 different tech companies in Auckland, Lisa Helm from 2degree, Alix Klingenberg from Push pay and Rashmi Modhwadia from Orion Health.",
    description: `We had our event with PushPay on 19th Oct, 2017 and it was about the DevOps concepts and how it is bringing cultural change in industry. We had 3 awesome speakers from 3 different tech companies in Auckland, Lisa Helm from 2degree, Alix Klingenberg from Push pay and Rashmi Modhwadia from Orion Health.`,
    category: "networking",
    status: "completed",
    startDate: "2017-10-19",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/655b03cd589685400ad64989_Pushpay.png",
    albumUrl: "https://photos.app.goo.gl/N9TkNfvKbJvgJt6M7",
  },
  {
    slug: "she-techweek-2017",
    title: "SHE# @ TECHWEEK",
    shortDescription: "Come along to hear outstanding women give quick insightful talks about their challenges, inspiration and motivations around solving real world problems using technology. This inspiring group include a wide range of experience from award winning high school and university students to working professionals, demonstrating that inspiration can happen at any age!",
    description: `Come along to hear outstanding women give quick insightful talks about their challenges, inspiration and motivations around solving real world problems using technology. This inspiring group include a wide range of experience from award winning high school and university students to working professionals, demonstrating that inspiration can happen at any age!`,
    category: "networking",
    status: "completed",
    startDate: "2017-05-01",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/655ae9f65a2f35ddedd3785d_Event%20Tile_BGs.png",
    albumUrl: "https://photos.app.goo.gl/A5cZzcCjCNPsBDjV7",
  },
  {
    slug: "she-with-google-aut",
    title: "SHE# with GOOGLE @ AUT",
    shortDescription: "âGooglersâ from Google Sydney joined us for a bias busting workshop that was open to all students and professionals.",
    description: `âGooglersâ from Google Sydney joined us for a bias busting workshop that was open to all students and professionals.`,
    category: "networking",
    status: "completed",
    startDate: "2017-03-23",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65553288b72931b4e9ebb579_GoogleAUT%20Landing%20Image.png",
    albumUrl: "https://photos.app.goo.gl/N4fin2qfgD4711sJ7",
  },
  {
    slug: "superhero-daughter-day",
    title: "SUPERHERO DAUGHTER DAY",
    shortDescription: "SheSharp, OMGTech, Colab AUT and Tech Girl Movement collaborated for Superhero Daughter Day 2017",
    description: `SheSharp, OMGTech, Colab AUT and Tech Girl Movement collaborated for Superhero Daughter Day 2017`,
    category: "networking",
    status: "completed",
    startDate: "2017-03-18",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65a8610a9bce4e231d2b28dd_Event%20Tile_BGs%20(10).png",
    albumUrl: "https://photos.app.goo.gl/Na5RAHcxDDm5MrGb9",
  },
  {
    slug: "she-orion-health",
    title: "SHE# @ ORION HEALTH",
    shortDescription: "Over 50 (mainly high school students) joined us for our first She# event of 2017 held at Orion Health. We started the workshop with some ice breakers and team building games so everyone became for comfortable and familiar with one another.",
    description: `Over 50 (mainly high school students) joined us for our first She# event of 2017 held at Orion Health. We started the workshop with some ice breakers and team building games so everyone became for comfortable and familiar with one another.`,
    category: "networking",
    status: "completed",
    startDate: "2017-02-25",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65ba0729f05a37c813862a02_.jpg",
  },
  {
    slug: "she-fisher-paykel",
    title: "SHE# @ FISHER & PAYKEL",
    shortDescription: "On a sunny Thursday morning during half term a group of female high school and university students headed out to the Fisher and Paykel Healthcare offices in East Tamaki. Weâd all come to find out more about this iconic Kiwi company founded in 1934 and their pioneering work create medical apparatus for healthcare.",
    description: `On a sunny Thursday morning during half term a group of female high school and university students headed out to the Fisher and Paykel Healthcare offices in East Tamaki. Weâd all come to find out more about this iconic Kiwi company founded in 1934 and their pioneering work create medical apparatus for healthcare.`,
    category: "networking",
    status: "completed",
    startDate: "2016-09-29",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65a85e6806ca2326d76790e8_Event%20Tile_BGs%20(9).png",
    albumUrl: "https://photos.app.goo.gl/HLAefNZronkJoUe56",
  },
  {
    slug: "she-with-trade-me",
    title: "SHE# with TRADE ME",
    shortDescription: "We had Ruth, the Head of UX Design at Trade Me, give us a lesson on how she has overcome her fears of public speaking and some effective skills on how to present effectively.",
    description: `We had Ruth, the Head of UX Design at Trade Me, give us a lesson on how she has overcome her fears of public speaking and some effective skills on how to present effectively.`,
    category: "networking",
    status: "completed",
    startDate: "2016-08-03",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65646667917974cfd2f334d4_Event%20Tile_BGs%20(7).png",
    albumUrl: "https://photos.app.goo.gl/dKS16iUrVsYdepXj7",
  },
  {
    slug: "security-101-plugging-the-data-leak",
    title: "Security 101: Plugging the Data Leak",
    shortDescription: "The awesome team at Flexware came and ran a security workshop with us. This involved learning about Ciphers, encrypting and decrpyting and working with Arduinos. The aim was to emphasise to everyone just how critical security is in addition to learning the basics of how it works. Check out the Flexware team below.",
    description: `The awesome team at Flexware came and ran a security workshop with us. This involved learning about Ciphers, encrypting and decrpyting and working with Arduinos. The aim was to emphasise to everyone just how critical security is in addition to learning the basics of how it works. Check out the Flexware team below.`,
    category: "networking",
    status: "completed",
    startDate: "2016-05-28",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65630a640452a90b80fffd40_Event%20Tile_BGs%20(3).png",
    albumUrl: "https://photos.app.goo.gl/i5gkSHpZiMHeyc7W8",
  },
  {
    slug: "she-microsoft",
    title: "She Sharp @ Microsoft",
    shortDescription: "This event brought speakers from various parts of the tech industry together for an evening of demos, lightning talks, networking and cupcakes. We were even lucky enough to get to try out the first ever Microsoft HoloLens in New Zealand!",
    description: `This event brought speakers from various parts of the tech industry together for an evening of demos, lightning talks, networking and cupcakes. We were even lucky enough to get to try out the first ever Microsoft HoloLens in New Zealand!`,
    category: "networking",
    status: "completed",
    startDate: "2016-04-27",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Meet the Speakers",
        title: "Business Strategy Director",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6563e2b5669316cb06457295_Donna-Wright.png",
      },
      {
        name: "Donna Wright",
        title: "Business Strategy Director",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6563e2b5669316cb06457295_Donna-Wright.png",
      },
      {
        name: "Rocky Heckman",
        title: "HoloLens Business Development Manager",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6563e3ada57237327e4dabf4_Rocky-Heckman-ovfwdpiq05c1otgefljz0kwl9q21kj4k6vz49b2t2w.png",
      },
      {
        name: "Lance Witheridge",
        title: "Insights Analyst, TRADEME",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6563e5c5ebad4f0466457c8e_Lance-W-ovfwddatjavbhvy5ey9tm5zljpq9sgs1t7ht0pkxbs.png",
      },
      {
        name: "Frederica Lanzo",
        title: "Technical Business Analyst, Orion Health",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6563e6efbd0f4dcd61a62bfa_Federica-L-ovfwdcczcgu169zikfv71o84ybuwkrobh2ubjfmbi0.png",
      },
      {
        name: "Ella Obreja",
        title: "Head of Product, Lightbox",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6563e77b017a4c0a7ae138f2_Ella-O-ovfwdbf55msquo0vpxgkh6gocxzjd2kl4y6u25npo8.png",
      },
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6563ea8be0ea84080bf098ba_Event%20Tile_BGs%20(4).png",
    albumUrl: "https://photos.app.goo.gl/UuHHsPgm5EcK7qaD8",
  },
  {
    slug: "she-evening-with-google",
    title: "She Sharp - An Evening with Google",
    shortDescription: "About 100 attendees joined SheSharp and Google team from Sydney for an evening at GridAKL. The first session addressed the issue of unconscious bias with Google sharing their training and knowledge around this area. This proved to be a great insight into how one of the biggest tech companies in the world is addressing the issue of diversity.",
    description: `About 100 attendees joined SheSharp and Google team from Sydney for an evening at GridAKL. The first session addressed the issue of unconscious bias with Google sharing their training and knowledge around this area. This proved to be a great insight into how one of the biggest tech companies in the world is addressing the issue of diversity.`,
    category: "networking",
    status: "completed",
    startDate: "2016-03-21",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/656305664d7f3c3ad79fc2f4_Event%20Tile_BGs%20(1).png",
    albumUrl: "https://photos.app.goo.gl/rW2QcwNvypL2Ugye6",
  },
  {
    slug: "app-inventor-workshop-orion-health",
    title: "App Inventor Workshop @ Orion Health",
    shortDescription: "Our first SheSharp event of 2016 was held at the Orion Health Head office in Auckland with over 40 female high school students from across Auckland attending.The morning kicked off with a team building challenge to break the ice and get the creative juices flowing.",
    description: `Our first SheSharp event of 2016 was held at the Orion Health Head office in Auckland with over 40 female high school students from across Auckland attending.The morning kicked off with a team building challenge to break the ice and get the creative juices flowing.`,
    category: "workshop",
    status: "completed",
    startDate: "2016-03-12",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6562e7a22e529075a4b93da7_Event%20Tile_BGs.png",
    albumUrl: "https://photos.app.goo.gl/JznDe7PKXDFuLxd99",
  },
  {
    slug: "she-sharp-westpac",
    title: "She Sharp @ Westpac",
    shortDescription: "This event took place in the heart of Auckland CBD at Westpacâs head office. We heard from the inspiring DawieOlivers, Westpacâs Chief Information Officer, and his team on what they do at Westpac and their focus on the importnace of diversity of thought.",
    description: `This event took place in the heart of Auckland CBD at Westpacâs head office. We heard from the inspiring DawieOlivers, Westpacâs Chief Information Officer, and his team on what they do at Westpac and their focus on the importnace of diversity of thought.`,
    category: "networking",
    status: "completed",
    startDate: "2015-11-26",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/656460e9aaab50cbc60dd004_westpaclanding.jpg",
    albumUrl: "https://photos.app.goo.gl/DmvjaUAX1GhWagPX8",
  },
  {
    slug: "she-sharp-xero-in-wellington",
    title: "She Sharp @ Xero in Wellington",
    shortDescription: "Wellingtonâs first SheSharp event was sponsored by Xero and 920 Career Agents as well as Orion Health, Unitec and Google and was held at Xero with a team of SheSharp members who travelled down from Auckland. The event was sold out, with over 60 women attending from around Wellington, some even travelling in from other cities around New Zealand.In addition to secondary and tertiary students, ther",
    description: `Wellingtonâs first SheSharp event was sponsored by Xero and 920 Career Agents as well as Orion Health, Unitec and Google and was held at Xero with a team of SheSharp members who travelled down from Auckland. The event was sold out, with over 60 women attending from around Wellington, some even travelling in from other cities around New Zealand.In addition to secondary and tertiary students, ther`,
    category: "networking",
    status: "completed",
    startDate: "2015-10-01",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65645f776f03289b84a749c3_xerowellingtonlanding.jpg",
    albumUrl: "https://photos.app.goo.gl/EKu6cXcn1TNQYYDTA",
  },
  {
    slug: "hacking-insecurities-grid-akl",
    title: "Hacking Insecurities @ Grid AKL",
    shortDescription: "Imposter Syndrome is a long talked about topic that many people in the tech industry suffer from (not just women, either!). Itâs that feeling of not being good enough or that you donât deserve to be where you are today. We often think weâre alone in this mindset; but most people feel this way at some point in their career!",
    description: `Imposter Syndrome is a long talked about topic that many people in the tech industry suffer from (not just women, either!). Itâs that feeling of not being good enough or that you donât deserve to be where you are today. We often think weâre alone in this mindset; but most people feel this way at some point in their career!`,
    category: "workshop",
    status: "completed",
    startDate: "2015-08-19",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65645d256caa5e2eb48536ea_hackinglanding.jpg",
    albumUrl: "https://photos.app.goo.gl/bzB9Zfsfbftid2n69",
  },
  {
    slug: "agile-session-with-xero",
    title: "Agile Session with Xero",
    shortDescription: "SheSharp and the Hi Tech Company of the year, Xero, brought together an action-packed evening with women from all fields of technology. There were plenty of opportunities to network with the women of Xero and find out about what Xero has to offer.",
    description: `SheSharp and the Hi Tech Company of the year, Xero, brought together an action-packed evening with women from all fields of technology. There were plenty of opportunities to network with the women of Xero and find out about what Xero has to offer.`,
    category: "networking",
    status: "completed",
    startDate: "2015-06-03",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65645ab43126fd9108ec23fe_XeroLanding.jpg",
    albumUrl: "https://photos.app.goo.gl/BApfooEpsr5SiKU1A",
  },
  {
    slug: "ux-design-with-ibm",
    title: "UX Design with IBM",
    shortDescription: "SheSharp joined with IBM for an awesome event that gave women the opportuniy to connect with lots of industry professionals. We had a guest speaker from IBM tell us about her story and journey to project management with IBM. We also had a hands-on session all about User Experience in app development.",
    description: `SheSharp joined with IBM for an awesome event that gave women the opportuniy to connect with lots of industry professionals. We had a guest speaker from IBM tell us about her story and journey to project management with IBM. We also had a hands-on session all about User Experience in app development.`,
    category: "networking",
    status: "completed",
    startDate: "2015-03-12",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/656458c0902a2bfd76425737_IBMlanding.jpg",
    albumUrl: "https://photos.app.goo.gl/f7dM9LCjthkiBtsZA",
  },
  {
    slug: "she-sharp-anita-borg-celebration",
    title: "She Sharp Anita Borg Celebration",
    shortDescription: "The Google Anita Borg Scholarship Alumni and SheSharp together hosted the Anita Borg birthday celebration to commemorate the truly inspiring woman she was. This was an event that happened globally in honour of Anita. We shared her incredible journey, stories and how she helped form a path for women to enter the computer world. She had such a strong passion for encouraging women into technology and",
    description: `The Google Anita Borg Scholarship Alumni and SheSharp together hosted the Anita Borg birthday celebration to commemorate the truly inspiring woman she was. This was an event that happened globally in honour of Anita. We shared her incredible journey, stories and how she helped form a path for women to enter the computer world. She had such a strong passion for encouraging women into technology and`,
    category: "social",
    status: "completed",
    startDate: "2015-01-16",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65645535a6017f9b4487b58a_anitalanding.jpg",
    albumUrl: "https://photos.google.com/share/AF1QipNVz5RsqOJkjo2ZZ4KPTYByfSZFuhMdjkpw5Qt7u7goKQnX3OUfmH0Mvl8KYuEb1w?key=ZFlpbWZEZGpMSjBKTFF1cHdXWmJlbm9URGtWSUJ3",
  },
  {
    slug: "she-sharp-launch-event",
    title: "She Sharp Launch Event",
    shortDescription: "She Sharp had the official launch event with Orion Health at their Grafton offices. This included a Scrum workshop and plenty of opportunity to network with Orion employees as well as other women in technical fields. Guest speakers from Orion Health, Diana Venter and Tegan Harrison shared some of their stories of being a woman in software development and also talked about some of Orion Healthâs ",
    description: `She Sharp had the official launch event with Orion Health at their Grafton offices. This included a Scrum workshop and plenty of opportunity to network with Orion employees as well as other women in technical fields. Guest speakers from Orion Health, Diana Venter and Tegan Harrison shared some of their stories of being a woman in software development and also talked about some of Orion Healthâs `,
    category: "networking",
    status: "completed",
    startDate: "2014-07-04",
    startTime: "18:00",
    endTime: "20:00",
    timezone: "Pacific/Auckland",
    location: {
      format: "in_person",
      city: "Auckland",
    },
    speakers: [
      {
        name: "Sune Rogers",
        title: "Head of ICT Planning & Portfolio Management - F&PH",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8928fec2ee6c5169631a_Screen%20Shot%202024-07-10%20at%207.01.34%20AM.png",
      },
      {
        name: "Melinda Legg",
        title: "Ambassador | Event Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668d8a34e723ee28cc7f4eed_Screen%20Shot%202024-07-10%20at%207.06.12%20AM.png",
      },
      {
        name: "Iuliia Shmykova",
        title: "Ambassador | Data Insight Manager - She Sharp",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/668cb5d2a99f0698bd428cbd_iulia.jpeg",
      },
      {
        name: "Michelle Sandford",
        title: "Developer Engagement Lead Asia - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e1238644649f294b1cb_michelle.jpeg",
      },
      {
        name: "Renee Noble",
        title: "Python Cloud Advocate - Microsoft",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/667f8e5639d419f849993ac3_renee.jpeg",
      },
      {
        name: "Amir Mohammadi",
        title: "Founder & Director - Promptech",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6683852ea94122c453a26366_amir.jpeg",
      },
      {
        name: "Geri Harris",
        title: "Senior Lecturer - AUT Business School",
        image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66833ab7ab9af673a80d47af_geri.jpeg",
      }
    ],
    registration: {
      isRequired: true,
      externalUrl: "https://register.charities.govt.nz/Charity/CC57025",
      isFree: true,
    },
    coverImage: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65644012ba31a04ba51ba2f1_Event%20Tile_BGs%20(12).png",
    albumUrl: "https://photos.google.com/share/AF1QipM6kDjk86UgxWbSSL1uRo0LqdJnJsGFFDpVvGe4xIpHHBfaHKXd83NBvYDJPG4FPA?key=NGdHUC02VEZqbUctaE5rczJDcXNHZHc4S3cya3dR",
  }
];

