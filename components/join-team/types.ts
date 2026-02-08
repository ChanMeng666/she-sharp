export type TabMedia = {
  value: string;
  label: string;
  src: string;
  alt?: string;
};

export type VolunteerPath = {
  id: string;
  title: string;
  commitment: string;
  image: string;
  imageAlt?: string;
  description: string;
  highlights: string[];
  responsibilities: string[];
  benefits: string[];
  applicationNote: string;
};

