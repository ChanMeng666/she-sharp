/**
 * Every Postgres enum in the schema.
 *
 * This file is the root of the schema dependency graph: it imports nothing from
 * the other schema modules, so the table files can all depend on it freely.
 */
import { pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role_type', ['mentor', 'mentee', 'admin']);
export const membershipTierEnum = pgEnum('membership_tier', ['free', 'basic', 'premium']);
export const relationshipStatusEnum = pgEnum('relationship_status', ['pending', 'active', 'paused', 'completed', 'rejected']);
export const meetingStatusEnum = pgEnum('meeting_status', ['scheduled', 'completed', 'cancelled', 'no_show']);
export const meetingTypeEnum = pgEnum('meeting_type', ['intro', 'regular', 'milestone', 'final']);
export const eventTypeEnum = pgEnum('event_type', ['workshop', 'networking', 'training', 'social', 'thrive']);
export const locationTypeEnum = pgEnum('location_type', ['online', 'in_person', 'hybrid']);
export const resourceTypeEnum = pgEnum('resource_type', ['document', 'video', 'link', 'template', 'guide']);
export const resourceAccessLevelEnum = pgEnum('resource_access_level', ['public', 'member', 'premium']);

// New enums for business logic update
export const invitationCodeStatusEnum = pgEnum('invitation_code_status', ['active', 'used', 'expired', 'revoked']);
export const invitationCodeTypeEnum = pgEnum('invitation_code_type', ['payment', 'mentor_approved', 'mentee_approved', 'admin_generated', 'test']);
export const formStatusEnum = pgEnum('form_status', ['not_started', 'in_progress', 'submitted', 'approved', 'rejected']);
export const bioMethodEnum = pgEnum('bio_method', ['self_written', 'ai_generated', 'already_sent']);
export const careerStageEnum = pgEnum('career_stage', ['undergraduate', 'postgraduate', 'early_career', 'mid_career', 'senior', 'career_transition']);
export const menteeTypePreferenceEnum = pgEnum('mentee_type_preference', ['undergraduate', 'postgraduate', 'professional']);
export const matchStatusEnum = pgEnum('match_status', ['pending_review', 'approved', 'rejected', 'active', 'expired']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid']);
export const mbtiTypeEnum = pgEnum('mbti_type', ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']);
export const genderEnum = pgEnum('gender', ['female', 'male', 'non_binary', 'prefer_not_to_say', 'other']);
export const meetingFormatEnum = pgEnum('meeting_format', ['online', 'in_person', 'hybrid']);
export const queueStatusEnum = pgEnum('queue_status', ['waiting', 'matching_in_progress', 'matched', 'expired', 'cancelled']);
export const confidenceLevelEnum = pgEnum('confidence_level', ['high', 'medium', 'low']);
export const programmeStatusEnum = pgEnum('programme_status', ['draft', 'active', 'closed', 'completed', 'archived']);

export const volunteerCurrentStatusEnum = pgEnum('volunteer_current_status', [
  'high_school_student', 'university_student', 'industry', 'sponsor_partner', 'other'
]);

export const volunteerTypeEnum = pgEnum('volunteer_type', ['ambassador', 'volunteer', 'ex_ambassador']);

export const howHeardAboutEnum = pgEnum('how_heard_about', [
  'attended_event', 'linkedin', 'word_of_mouth', 'search_engine', 'social_media', 'other'
]);

export const experienceRatingEnum = pgEnum('experience_rating', [
  'excellent', 'good', 'average', 'below_average', 'poor'
]);

export const recruitmentStageEnum = pgEnum('recruitment_stage', [
  'new', 'contacted', 'screening', 'interview_requested', 'interview_scheduled',
  'approved', 'rejected', 'onboarding', 'nda_sent', 'nda_signed', 'active'
]);

export const communicationMethodEnum = pgEnum('communication_method', ['email', 'phone']);

// How a person reached the post-event feedback form. Kept as an enum rather than
// free text because the deck QR is the only channel we cannot A/B any other way:
// if `deck_qr` is flat for an event, the code was too small or the slide too brief.
export const eventFeedbackSourceEnum = pgEnum('event_feedback_source', [
  'deck_qr', 'event_page', 'direct_link', 'email'
]);

// Three-way on purpose, where a nullable boolean would have been the obvious
// choice. Folding 'maybe' into NULL makes it indistinguishable from an
// unanswered question, and "% who would come again" is exactly the figure a
// funder report quotes — you cannot compute it if a third of the answers are
// ambiguous. NULL here means only what it says: they skipped the question.
export const eventAttendAgainEnum = pgEnum('event_attend_again', [
  'yes', 'maybe', 'no'
]);

// Source of a crawled grant/funding record (see the funding_opportunities table
// in ./system).
export const fundingSourceEnum = pgEnum('funding_source', [
  'beehive',
  'treasury',
  'gets',
  'data_govt',
  'mbie',
  'women_govt',
]);
