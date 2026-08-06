// Page-specific testimonials data
//
// Editorial rules for this file — every one of them exists because it was
// broken once:
//
// 1. Every person here must be a real person who said this. The home, events,
//    donate, about and media groups used to hold seventeen invented people
//    ("Sarah Chen, Software Engineer, Microsoft" and so on) who endorsed real,
//    named companies. They were removed in full. A registered charity putting
//    fictional endorsements of real employers on its public site is worse than
//    an empty section, and no component was rendering them anyway.
// 2. Never invent an employer to fill a field. The two real testimonials below
//    shipped with placeholder company names ("Tech Innovations Ltd", "Global
//    Tech Corp", "Innovation Hub NZ") attached to real people. `role` and
//    `company` are optional for exactly this reason — leave them out rather
//    than guess. Anshu Maharaj's are kept because `lib/data/mentors.ts`
//    corroborates them.
// 3. Testimonials on the mentorship page must be about She Sharp's own
//    programme. In March 2024 an AUT programme's testimonial was used here and
//    had to be pulled — it implied She Sharp had run mentorship when it had
//    not.
// 4. Get the person's consent before quoting them by name. Take extra care
//    with anyone who was a student at the time.

export interface MentorshipTestimonialPerson {
  name: string;
  /** Omit rather than guess — see rule 2 above. */
  role?: string;
  /** Omit rather than guess — see rule 2 above. */
  company?: string;
  journey?: string;
  image?: string;
}

export interface MentorshipTestimonial {
  id: string;
  mentee: MentorshipTestimonialPerson;
  mentor: MentorshipTestimonialPerson;
  quote: string;
  fullStory: string;
  author: string;
}

export const testimonialsByPage: {
  mentorship: MentorshipTestimonial[];
} = {
  mentorship: [
    {
      id: "mentor-1",
      mentee: {
        name: "Fay Fialho",
        journey: "6 months in the programme",
        image: "/img/scraped/avatars/dicebear-fay.svg",
      },
      mentor: {
        name: "Meeta Patel",
        role: "Technical Advisor",
        image: "/img/scraped/avatars/dicebear-meeta.svg",
      },
      quote:
        "From the first meeting with Meeta, she was inspiring, both personally and professionally. Her humble yet professional attitude made me comfortable with a feeling of being heard.",
      fullStory:
        "From the first meeting with Meeta, she was inspiring, both personally and professionally. Her humble yet professional attitude made me comfortable with a feeling of being heard. Her insights and experience of the job market, industries and people, provided me with with clarity and direction. The encouragement and assurance that I was on the right track, to continue to persevere and and embrace challenges is one that I will continue to keep with me as I journey forward. I would like to take this moment to say a 'Thank you' ( but one that does not end there), for your grace and positivity. Looking forward to staying in touch, to sharing our experiences and knowledge.",
      author: "Fay Fialho",
    },
    {
      id: "mentor-2",
      mentee: {
        name: "Shweta Sharma",
        role: "Product Owner",
        journey: "Completed 2024 Cohort",
        image: "/img/scraped/avatars/dicebear-shweta.svg",
      },
      mentor: {
        name: "Anshu Maharaj",
        role: "Product Manager",
        company: "MYOB",
        image:
          "/img/scraped/site/mentorship/65f7d581ab77ff98f436f102_Anshu_Photo_59560633.jpg",
      },
      quote:
        "This initiative has truly been a taonga (treasure) for both mentors and mentees, offering invaluable opportunities for growth, guidance, and connection.",
      fullStory:
        "What a successful completion of She Sharp first mentorship cohort of 2024! This initiative has truly been a taonga (treasure) for both mentors and mentees, offering invaluable opportunities for growth, guidance, and connection. A shoutout to my incredible She Sharp mentor, Anshu Maharaj, whose support has been instrumental in my journey, enabling me to grow in my Product Owner role. This journey so far has allowed me to grow but has also empowered me to build an efficient toolbox. It has equipped me with the skills and insights needed to navigate challenges with confidence, and I aim to continue applying these tools to make an impact in all aspects moving forward.",
      author: "Shweta Sharma",
    },
  ],
};
