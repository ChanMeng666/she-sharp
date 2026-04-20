/**
 * Zod schemas that validate OpenAI's structured output against EventV3.
 *
 * Strict validation here is the last line of defence before we write
 * anything to a Git branch. An invalid patch is rejected with a
 * Slack-friendly error.
 */

import { z } from "zod";

const EventCoverImage = z.object({
  url: z.string(),
  alt: z.string(),
});

const EventSpeakerV3 = z.object({
  name: z.string(),
  title: z.string(),
  company: z.string(),
  bio: z.string(),
  image: z.string(),
  linkedin: z.string(),
});

const EventSpeakerGroup = z.object({
  heading: z.string(),
  speakers: z.array(EventSpeakerV3),
});

const EventSpeakersV3 = z
  .object({
    keynote_speakers: EventSpeakerGroup.optional(),
    panel_speakers: EventSpeakerGroup.optional(),
    guest_speakers: EventSpeakerGroup.optional(),
    panel_facilitators: EventSpeakerGroup.optional(),
  })
  .partial();

const EventSponsorV3 = z.object({
  name: z.string(),
  logo: z.string(),
});

const EventSponsorsV3 = z.object({
  main: z.array(EventSponsorV3),
  other: z.array(EventSponsorV3),
});

const EventSpecialSection = z.object({
  type: z.string(),
  title: z.string(),
  content: z.array(z.string()),
});

const EventPhotoV3 = z.object({
  url: z.string(),
  alt: z.string(),
});

const EventLocationV3 = z.object({
  format: z.string(),
  venueName: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
});

const EventDetailPageData = z.object({
  url: z.string(),
  title: z.string(),
  subtitle: z.string(),
  date: z.string(),
  time: z.string(),
  location: EventLocationV3,
  fullDescription: z.array(z.string()),
  speakers: EventSpeakersV3,
  organizers: z.array(EventSpeakerV3),
  sponsors: EventSponsorsV3,
  specialSections: z.array(EventSpecialSection),
  photos: z.array(EventPhotoV3),
  galleryUrl: z.string(),
  registrationUrl: z.string(),
  humanitixUrl: z.string().optional(),
  images: z.array(EventPhotoV3),
  category: z.string(),
  status: z.string(),
  isFeatured: z.boolean(),
  refundPolicy: z.string().optional(),
});

export const EventV3Schema = z.object({
  id: z.number().nullable(),
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  coverImage: EventCoverImage,
  detailPageUrl: z.string(),
  shortDescription: z.string(),
  attendees: z.number().nullable(),
  checkedIn: z.number().nullable().optional(),
  detailPageData: EventDetailPageData,
});

const ImageTaskSchema = z.object({
  path: z.string(),
  description: z.string(),
  alreadyExists: z.boolean().optional(),
});

export const EventPatchSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("update"),
    eventSlug: z.string(),
    summary: z.string(),
    fields: z.record(z.unknown()),
    imageChecklist: z.array(ImageTaskSchema),
  }),
  z.object({
    op: z.literal("create"),
    summary: z.string(),
    event: EventV3Schema.partial(),
    imageChecklist: z.array(ImageTaskSchema),
  }),
  z.object({
    op: z.literal("clarify"),
    question: z.string(),
  }),
]);

export type ValidatedEventPatch = z.infer<typeof EventPatchSchema>;
