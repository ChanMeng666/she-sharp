import { PresetQuestion } from './types';

export const presetQuestions: PresetQuestion[] = [
  // ABOUT (group 1)
  {
    id: '1',
    question: 'What is She Sharp?',
    answer:
      "She Sharp is a non-profit organisation dedicated to bridging the gender gap in STEM fields. Since 2014, we have been empowering women in technology through mentorship programmes, networking events, and career development resources. With over 2200+ members and 50+ sponsors, we are committed to creating an inclusive tech community.\n\n**Learn more:** [About Us](/about) | [Our Team](/about#team)",
    category: 'about',
  },
  {
    id: '5',
    question: 'How can I volunteer?',
    answer:
      "Volunteering with She Sharp is a great way to give back to the community! We need volunteers for:\n- Event organisation\n- Mentorship coordination\n- Content creation\n- Community support\n\nWe value diverse skills and welcome volunteers from all backgrounds.\n\n**Get involved:** [Join Our Team](/join-our-team) | [Volunteer Code of Conduct](/volunteers/code-of-conduct)",
    category: 'about',
  },

  // GENERAL (group 2)
  {
    id: '6',
    question: 'What programmes does She Sharp offer?',
    answer:
      'She Sharp offers several key programmes:\n1. **Mentorship Programme** - 1-on-1 mentoring connections\n2. **THRIVE** - Leadership development programme\n3. **Networking Events** - Regular meetups and workshops\n4. **Career Resources** - Learning materials and job opportunities\n5. **Community Forums** - Online networking\n\nAll programmes support women at every stage of their STEM journey.\n\n**Explore:** [Mentorship Programme](/mentorship) | [Events](/events) | [About Us](/about)',
    category: 'general',
  },
  {
    id: '7',
    question: 'What does membership cost?',
    answer:
      "Mentee membership is **$100 NZD per year**, which includes:\n- 1-on-1 mentor sessions\n- AI-powered mentor matching\n- Access to all events\n- Premium learning resources\n- Networking opportunities\n\nMentor applications are **FREE** - experienced professionals can apply to give back to the community.\n\n**Join now:** [Become a Mentee](/mentorship/join) | [Become a Mentor](/mentorship/become-a-mentor)",
    category: 'general',
  },

  // MENTORSHIP (group 3)
  {
    id: '2',
    question: 'How can I join the mentorship programme?',
    answer:
      "To join as a mentee:\n1. Complete the application form\n2. Pay the $100 NZD annual membership fee\n3. Receive your invitation code via email\n4. Use the code to register and create your account\n\nOnce registered, you'll be matched with a mentor based on your goals and preferences.\n\n**Get started:** [Join as Mentee](/mentorship/join) | [View Our Mentors](/mentorship#mentors-list)",
    category: 'mentorship',
  },
  {
    id: '8',
    question: 'How can I get involved as a mentor?',
    answer:
      "To become a mentor:\n1. Complete the application form\n2. Our team reviews your application (5-7 business days)\n3. If approved, receive your invitation code via email\n4. Register and create your mentor account\n\nYou'll be matched with mentees based on your expertise and their goals.\n\n**Apply now:** [Become a Mentor](/mentorship/become-a-mentor) | [Mentorship Overview](/mentorship)",
    category: 'mentorship',
  },

  // EVENTS (group 4)
  {
    id: '3',
    question: 'When is the next event?',
    answer:
      "She Sharp hosts regular events including networking meetups, technical workshops, and special programmes like THRIVE. We typically host events monthly, both virtual and in-person, covering topics from technical skills to career development.\n\n**Explore events:** [Upcoming Events](/events) | [Photo Gallery](/resources#gallery)",
    category: 'events',
  },

  // SUPPORT (group 5)
  {
    id: '4',
    question: 'How can I become a sponsor?',
    answer:
      'We welcome corporate sponsors who share our vision of empowering women in STEM. Sponsorship opportunities include:\n- Event sponsorship\n- Programme funding\n- Annual partnerships\n\nYour organisation can support our mission and engage with our talented community of 2200+ members.\n\n**Learn more:** [Corporate Sponsorship](/sponsors/corporate-sponsorship) | [Email Us](mailto:hello@shesharp.org.nz)',
    category: 'support',
  },
];
