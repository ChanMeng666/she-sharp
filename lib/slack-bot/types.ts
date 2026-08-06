/**
 * Shared types for the Slack Event Bot.
 */

import type { EventV3 } from "@/types/event";

/** A single image file the admin needs to place locally. */
export interface ImageTask {
  /** Public path where the image should be placed (e.g., /img/events/<slug>-<desc>.<ext>). */
  path: string;
  /** Human-readable purpose (e.g., "Speaker photo: Danubia Paim"). */
  description: string;
  /** True if the path already exists on disk and does not need to be placed. */
  alreadyExists?: boolean;
}

/** A structured operation the AI proposes in response to a /event command. */
export type EventPatch =
  | {
      op: "update";
      eventSlug: string;
      summary: string;
      fields: Record<string, unknown>;
      imageChecklist: ImageTask[];
    }
  | {
      op: "create";
      summary: string;
      event: Partial<EventV3>;
      imageChecklist: ImageTask[];
    }
  | {
      op: "clarify";
      question: string;
    };

/** Context passed to the AI extractor to produce an EventPatch. */
export interface ExtractionContext {
  userCommand: string;
  channelName: string;
  channelTopic: string;
  channelMessages: string;
  currentEventsJson: string;
  sponsorInventory: string[];
  conventions: string;
}

/** Payload encoded in the Confirm/Cancel button's value field. */
export interface InteractionPayload {
  draftId: string;
  channelId: string;
  userId: string;
  summary: string;
}
