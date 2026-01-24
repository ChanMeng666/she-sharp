import { EventV3 } from "@/types/event";
import customEventsJson from "./json/events-custom.json";

export const customEventsV3: EventV3[] =
  (customEventsJson.events as EventV3[]) ?? [];
