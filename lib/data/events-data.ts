/**
 * Events Data
 *
 * This file imports event data from the JSON file and exports it for use
 * throughout the application. The data structure matches the V3 format
 * from the scraped She Sharp events.
 */

import { EventV3 } from "@/types/event";
import eventsJson from "./json/shesharp_events_v3.json";

// Export the events array with proper typing
export const eventsV3: EventV3[] = eventsJson.events as EventV3[];

// Export metadata for reference
export const eventsMetadata = eventsJson.metadata;
