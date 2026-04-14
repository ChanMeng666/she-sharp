/**
 * One-time script to populate attendee data from Humanitix CSV export
 * into the event JSON data files.
 *
 * Usage: npx tsx scripts/populate-event-data.ts
 *
 * Data source: Humanitix attendee report CSV with columns:
 *   Row Labels (event name), Count of Ticket no., Sum of Is_Checked in
 */

import * as fs from "fs";
import * as path from "path";

// --- CSV → JSON manual mapping ---
// CSV event names differ significantly from JSON titles.
// This map was built by hand-matching each CSV row to its JSON event.
// Key: CSV event name (trimmed), Value: JSON event ID
const csvToJsonId: Record<string, number> = {
  // 2020
  "STORYTELLERS SERIES": 23,
  "She Sharp Future Ready!": 62,
  "She Sharp Techweek: Envision The Future: How to Create A More Diverse, Inclusive & Sustainable Future through Technology & Human-Centered Innovation":
    61,
  "Girls Night Out @Xero": 64,
  "She Sharp@ EY": 60, // Robotic Process Automation Workshop at EY
  "STORYTELLERS SERIES  2.0": 22,
  "ONLINE EVENT CELEBRATING ADA LOVELACE DAY": 39,

  // 2021
  "She# International Women's Day event with MYOB - Thursday 18th March 2021": 69,
  IamRemarkable: 68,
  "Women in Data and Analytics": 67,
  "The Truths to Gaming and Start-up - presented by She Sharp & Geo AR Games": 63,
  "She Sharp @ Fergus: Women in Tech & Trades": 58,
  "Ada Lovelace Day  Celebration": 66,

  // 2022
  "She Sharp & Google - Shaping the Future with AI": 82,
  "She Sharp - AI for the Environment Female-Led Hackathon #AIEnviroHack": 80,
  "She Sharp & AWS presents: She Celebrates - End of Year Event": 81,
  "Women in Security - Reshaping the Future": 75,
  "She Sharp & ANZ: Navigating the Workplace as a Woman": 78,
  "She Sharp & AWS International Women's Day Event #BreakTheBias": 74,
  "She Sharp & MYOB - Mind Your Own Career": 76,
  "Women Igniting a Passion for Tech - SOLD OUT": 77,

  // 2023
  "Inspire Her: Te Whakatipuranga Wahine": 65,
  "Google Educators Conference": 21,
  "She Sharp & Fonterra : A Legendairy Career": 71,
  "She Sharp & TechWomen NZ: From Burnout to Balance": 86, // in events-custom.json
  "She celebrates - End of Year Event": 53,
  "She Sharp & Countdown: International Women's Day": 83,
  "She Sharp & Deloitte: Innovation Unleashed": 79,
  "She Sharp & Kiwibank: The Buzz about Banking": 73,
  "She Sharp & HCL: Technological change - workplace & workforce impacts": 59,
  "She Sharp & MYOB: Kickstart Your Career in Tech": 84,

  // 2024
  "F&P Hackathon with She#": 16,
  "She Sharp & Fonterra: Harness The Power of Generative Al": 14,
  "She Sharp 10-Year Anniversary": 13,
  "2024 Google Educator Conference": 11,
  "She Sharp & Les Mills: Own The Unexpected": 18,
  "She Sharp & Woolworths: International Women's Day": 20,
  "She Sharp & Fiserv: Bank on yourself": 17,
  "She Sharp & HCLTech": 12,
  "She Sharp & MYOB: Embracing Bias": 19,

  // 2025
  "She Sharp & TechBabesNZ: THRIVE: YOUR CAREER, YOUR STORY": 5,
  "She Sharp & Fonterra:Business and Technology Transformation Through Platforms and Products":
    4,
  "She Sharp & Vector: Future-Ready: Data, AI, Digital Innovation & Inclusive Careers at Vector":
    2,
  "She Sharp & Academy EX: International Women's Day": 10,
  "She Sharp & HCLTech: AI Empowerment: Shaping an Inclusive Digital Future": 1,
  "She Sharp & MYOB: Tech That Matches Your Vibe - Find Your Perfect Fit": 8,
  "She Sharp: #IAmRemarkable": 9,
  "She Sharp, SecureCodeWarrior, Xero: Code Secure. Lead the Future: Women in Cybersecurity Workshop":
    3,

  // 2026
  "She Sharp & academyEX: International Women's Day 2026": 85, // in events-custom.json
  "Own Your Energy with Candice Murray - Presented by She Sharp & Metlifecare": 87, // in events-custom.json
  "Her Waka": 88, // in events-custom.json
  "Her Waka (April 2026)": 89, // in events-custom.json
  "Her Waka (May 2026)": 90, // in events-custom.json
  "Her Waka (June 2026)": -1, // No match in JSON yet
};

// Early events with attendee counts from crawl data shortDescription
const earlyEventAttendees: Record<number, number> = {
  37: 100, // She Sharp - An Evening with Google
  50: 50, // SHE# with Google Codelab
  57: 40, // SHE# @ DELOITTE
};

// IDs that live in events-custom.json instead of shesharp_events_v3.json
const customEventIds = new Set([85, 86, 87, 88, 89, 90]);

function parseCSV(
  csvContent: string
): Array<{ name: string; tickets: number; checkedIn: number }> {
  const lines = csvContent.split("\n");
  const results: Array<{ name: string; tickets: number; checkedIn: number }> =
    [];

  for (const line of lines) {
    // Skip empty lines, headers, year-only lines, totals
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("Row Labels") || trimmed === "(empty)")
      continue;
    if (/^(Total Result|\d{4}),/.test(trimmed)) continue;
    // Year-only rows like "2020,,"
    if (/^\d{4},,/.test(trimmed)) continue;

    // Parse CSV with potential quoted fields
    const parts = parseCSVLine(trimmed);
    if (parts.length < 3) continue;

    const name = parts[0].trim();
    const tickets = parseInt(parts[1], 10);
    const checkedIn = parseInt(parts[2], 10);

    if (name && !isNaN(tickets)) {
      results.push({ name, tickets, checkedIn: isNaN(checkedIn) ? 0 : checkedIn });
    }
  }

  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function main() {
  const csvPath = path.resolve(
    "C:/Users/0/Downloads/shesharp/attendee-report-(exported-2026-04-13@22.50.51).csv"
  );
  const v3Path = path.resolve("lib/data/json/shesharp_events_v3.json");
  const customPath = path.resolve("lib/data/json/events-custom.json");

  // Read CSV
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const csvEvents = parseCSV(csvContent);
  console.log(`Parsed ${csvEvents.length} events from CSV\n`);

  // Read JSON files
  const v3Data = JSON.parse(fs.readFileSync(v3Path, "utf-8"));
  const customData = JSON.parse(fs.readFileSync(customPath, "utf-8"));

  // Build ID → event index maps
  const v3Map = new Map<number, number>();
  v3Data.events.forEach((ev: { id: number }, idx: number) => {
    v3Map.set(ev.id, idx);
  });
  const customMap = new Map<number, number>();
  customData.events.forEach((ev: { id: number }, idx: number) => {
    customMap.set(ev.id, idx);
  });

  // Add checkedIn field to all v3 events
  for (const ev of v3Data.events) {
    if (!("checkedIn" in ev)) {
      // Insert after attendees
      const newEv = {} as Record<string, unknown>;
      for (const [key, val] of Object.entries(ev)) {
        newEv[key] = val;
        if (key === "attendees") {
          newEv["checkedIn"] = null;
        }
      }
      Object.keys(ev).forEach((k) => delete ev[k]);
      Object.assign(ev, newEv);
    }
  }

  // Add checkedIn field to template and custom events
  if (!("checkedIn" in customData.template)) {
    const newTemplate = {} as Record<string, unknown>;
    for (const [key, val] of Object.entries(customData.template)) {
      newTemplate[key] = val;
      if (key === "attendees") {
        newTemplate["checkedIn"] = null;
      }
    }
    customData.template = newTemplate;
  }
  for (const ev of customData.events) {
    if (!("checkedIn" in ev)) {
      const newEv = {} as Record<string, unknown>;
      for (const [key, val] of Object.entries(ev)) {
        newEv[key] = val;
        if (key === "attendees") {
          newEv["checkedIn"] = null;
        }
      }
      Object.keys(ev).forEach((k: string) => delete ev[k]);
      Object.assign(ev, newEv);
    }
  }

  // Apply CSV data
  let matched = 0;
  let unmatched = 0;

  for (const csvEvent of csvEvents) {
    const jsonId = csvToJsonId[csvEvent.name];

    if (jsonId === undefined) {
      console.log(`  UNMATCHED: "${csvEvent.name}" (${csvEvent.tickets} tickets)`);
      unmatched++;
      continue;
    }

    if (jsonId === -1) {
      console.log(`  SKIPPED: "${csvEvent.name}" (no JSON event yet)`);
      continue;
    }

    if (customEventIds.has(jsonId)) {
      const idx = customMap.get(jsonId);
      if (idx !== undefined) {
        customData.events[idx].attendees = csvEvent.tickets;
        customData.events[idx].checkedIn = csvEvent.checkedIn;
        console.log(
          `  MATCHED (custom): "${csvEvent.name}" → ID ${jsonId} (${csvEvent.tickets} tickets, ${csvEvent.checkedIn} checked in)`
        );
        matched++;
      } else {
        console.log(`  ERROR: ID ${jsonId} not found in custom events`);
        unmatched++;
      }
    } else {
      const idx = v3Map.get(jsonId);
      if (idx !== undefined) {
        v3Data.events[idx].attendees = csvEvent.tickets;
        v3Data.events[idx].checkedIn = csvEvent.checkedIn;
        console.log(
          `  MATCHED (v3): "${csvEvent.name}" → ID ${jsonId} (${csvEvent.tickets} tickets, ${csvEvent.checkedIn} checked in)`
        );
        matched++;
      } else {
        console.log(`  ERROR: ID ${jsonId} not found in v3 events`);
        unmatched++;
      }
    }
  }

  // Apply early event data from crawl
  console.log("\nApplying early event data from crawl:");
  for (const [id, count] of Object.entries(earlyEventAttendees)) {
    const numId = parseInt(id, 10);
    const idx = v3Map.get(numId);
    if (idx !== undefined) {
      v3Data.events[idx].attendees = count;
      console.log(
        `  Set ID ${numId} "${v3Data.events[idx].title}" → ${count} attendees`
      );
    }
  }

  // Write updated JSON
  fs.writeFileSync(v3Path, JSON.stringify(v3Data, null, 2) + "\n", "utf-8");
  fs.writeFileSync(
    customPath,
    JSON.stringify(customData, null, 2) + "\n",
    "utf-8"
  );

  console.log(`\n--- Summary ---`);
  console.log(`CSV events parsed: ${csvEvents.length}`);
  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log(`Early events (crawl): ${Object.keys(earlyEventAttendees).length}`);
  console.log(`\nJSON files updated successfully.`);
}

main();
