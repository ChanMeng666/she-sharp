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

/** A short card-shaped quote, used by the home and join-our-team carousels. */
export interface ShortTestimonial {
  name: string;
  role: string;
  content: string;
}

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
        image: "/img/legacy-site/avatars/dicebear-fay.svg",
      },
      mentor: {
        name: "Meeta Patel",
        role: "Technical Advisor",
        image: "/img/legacy-site/avatars/dicebear-meeta.svg",
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
        image: "/img/legacy-site/avatars/dicebear-shweta.svg",
      },
      mentor: {
        name: "Anshu Maharaj",
        role: "Product Manager",
        company: "MYOB",
        image:
          "/img/legacy-site/site/mentorship/65f7d581ab77ff98f436f102_Anshu_Photo_59560633.jpg",
      },
      quote:
        "This initiative has truly been a taonga (treasure) for both mentors and mentees, offering invaluable opportunities for growth, guidance, and connection.",
      fullStory:
        "What a successful completion of She Sharp first mentorship cohort of 2024! This initiative has truly been a taonga (treasure) for both mentors and mentees, offering invaluable opportunities for growth, guidance, and connection. A shoutout to my incredible She Sharp mentor, Anshu Maharaj, whose support has been instrumental in my journey, enabling me to grow in my Product Owner role. This journey so far has allowed me to grow but has also empowered me to build an efficient toolbox. It has equipped me with the skills and insights needed to navigate challenges with confidence, and I aim to continue applying these tools to make an impact in all aspects moving forward.",
      author: "Shweta Sharma",
    },
  ],
};

/**
 * Home page carousel — short excerpts spanning mentorship and volunteering.
 * These are trimmed variants of the longer quotes elsewhere in this file, not duplicates.
 */
export const homeTestimonials: ShortTestimonial[] = [
  {
    name: "Fay Fialho",
    role: "Mentee",
    content:
      "From the first meeting with Meeta, she was inspiring, both personally and professionally. Her humble yet professional attitude made me comfortable with a feeling of being heard. Her insights and experience of the job market, industries and people, provided me with clarity and direction.",
  },
  {
    name: "Shweta Sharma",
    role: "Mentee",
    content:
      "This initiative has truly been a taonga (treasure) for both mentors and mentees, offering invaluable opportunities for growth, guidance, and connection. A shoutout to my incredible She Sharp mentor, Anshu Maharaj, whose support has been instrumental in my journey.",
  },
  {
    name: "Shein Delos Angeles",
    role: "Event Volunteer",
    content:
      "I volunteered to help with the She Sharp Tomorrow Expo and I enjoyed every step of the way. I wanted to commend this organisation for giving me an opportunity to meet people around tech and to know some people that are now my friends.",
  },
  {
    name: "Vic Arce",
    role: "Previous Ambassador",
    content:
      "Working with She# has been such a remarkable experience. I feel lucky to have had the opportunity to be surrounded by highly motivated people who want to make a difference for women. A friend described the She# team as people who eat passion for breakfast.",
  },
  {
    name: "Aneela Lala",
    role: "Previous Ambassador",
    content:
      "As an Ambassador for She Sharp, I have had the privilege of collaborating with fabulous like-minded Wahine, connecting with amazing people from diverse STEM fields and sharing my passion for STEM and inclusivity with so many talented, successful and inspiring Women in Industry.",
  },
  {
    name: "Yinghui (Maxie) Ouyang",
    role: "Event Volunteer",
    content:
      "Being a volunteer at She Sharp has been an enlightening and fulfilling experience. The She Sharp team really take care of you and make sure you get access to the benefits as if you are a participant of each event.",
  },
];

/** Join-our-team carousel — volunteer and ambassador voices, in full. */
export const joinTeamTestimonials: ShortTestimonial[] = [
    {
        name: "Shein Delos Angeles",
        role: "Event Volunteer",
        content:
            "I volunteered to help with the She Sharp Tomorrow Expo and I enjoyed every step of the way. I was one of the volunteers who helped set up and talk to people about She Sharp's agenda and it was a blast! I wanted to commend this organisation for giving me an opportunity to meet people around tech and to know some people that are now my friends. I'm looking forward to the next upcoming event!",
    },
    {
        name: "Vic Arce",
        role: "Previous Ambassador",
        content:
            "Working with She# has been such a remarkable experience. I feel lucky to have had the opportunity to be surrounded by highly motivated people who want to make a difference for women. I once spoke with a friend who described the She# team as people who eat passion for breakfast - a very amusing description which I found true in the months I've been with the team.",
    },
    {
        name: "Aneela Lala",
        role: "Previous Ambassador",
        content:
            "As an Ambassador for She Sharp, I have had the privilege of collaborating with fabulous like-minded Wahine, connecting with amazing people from diverse STEM fields and sharing my passion for STEM and inclusivity with so many talented, successful and inspiring Women in Industry. In addition, She Sharp has allowed me to step outside of my comfort zone (as an introvert), by providing a supportive safety net of Ambassadors who challenge my own limiting beliefs about my capabilities and encourage me to grow.",
    },
    {
        name: "Yinghui (Maxie) Ouyang",
        role: "Event Volunteer",
        content:
            "Being a volunteer at She Sharp has been an enlightening and fulfilling experience. The She Sharp team really take care of you and make sure you get access to the benefits as if you are a participant of each event. Networking is a great example of that. I've met more women in tech from the first event than I have in months. They go out of their way to make sure the volunteers are seen and appreciated for their hard work.",
    },
];
