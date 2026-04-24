"""Apply a hand-curated batch of backfills that the heuristic sponsor-
description patcher cannot confidently derive on its own:
  * sponsor entries with combined names (e.g. "AUT | Google", "Google, AUT")
    or parent-company wording
  * partner organisations that the old site lists as featured logos but the
    scraper never wrote into the sponsors array (e.g. inspire-her's CARES,
    IEEE WIE, Fonterra, MYOB, QuiverVision)
  * a couple of single-item event detail paragraphs that the heuristic is
    too conservative to infer

Run:
    python scripts/patch_manual_fixes.py          # dry-run
    python scripts/patch_manual_fixes.py --apply  # write JSON
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRAPED_JSON = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"
CUSTOM_JSON = REPO_ROOT / "lib/data/json/events-custom.json"


# Description backfills keyed by (slug, sponsor_name).
SPONSOR_DESCRIPTIONS: dict[tuple[str, str], str] = {
    (
        "she-with-google-aut",
        "Google, AUT",
    ): (
        "Google supports all Kiwis towards a digital future. Google New Zealand "
        "started with just one person in 2007 and has grown to around 50 people "
        "now based in Auckland and Wellington. AUT is focused on providing "
        "exceptional student opportunities, learning experiences, and graduate "
        "success by impactful research and industry connectivity."
    ),
    (
        "thrive-your-career-your-story",
        "Hewlett Packard Enterprise (HPE)",
    ): (
        "Hewlett Packard Enterprise is a global edge-to-cloud company that "
        "helps organisations accelerate outcomes by unlocking value from all "
        "their data, everywhere. HPE delivers unique, open and intelligent "
        "technology solutions across edge, hybrid cloud and AI, backed by a "
        "proven track record in enterprise IT."
    ),
    (
        "ai-for-the-environment-hackathon-festival-2024",
        "AI Forum NewZealand",
    ): (
        "The AI Forum NZ is New Zealand's leading body for artificial "
        "intelligence, connecting government, industry, academia and community "
        "to grow a thriving, inclusive, ethical AI ecosystem across Aotearoa. "
        "The Forum hosts the annual AI Hackathon across Aotearoa and the South "
        "Pacific to spark student, researcher and professional collaboration."
    ),
    (
        "she-fisher-paykel",
        "Fisher & Paykel Healthcare",
    ): (
        "Fisher & Paykel Healthcare is a global leader in the design, "
        "manufacture and marketing of medical devices used in respiratory "
        "care, acute care and the treatment of obstructive sleep apnea. "
        "Headquartered in Auckland, New Zealand, the company's products are "
        "sold in over 120 countries worldwide."
    ),
    (
        "auckland-tech-grand-tour",
        "AUT, Orion Health, Xero, Air New Zealand, Trade Me",
    ): (
        "The Auckland Tech Grand Tour was proudly co-hosted with AUT, Orion "
        "Health, Xero, Air New Zealand and Trade Me — five of Aotearoa's most "
        "prominent technology employers — giving She Sharp students and "
        "professionals behind-the-scenes access to their engineering, product "
        "and design teams on a single day."
    ),
    (
        "she-sharp-centrality",
        "Centrality",
    ): (
        "Centrality is a New Zealand-based company and tech venture platform. "
        "They leverage blockchain, AI, IoT and other emerging technologies to "
        "create an advanced and connected world. They partner with ambitious "
        "teams to build category-defining ventures from concept through to "
        "global scale."
    ),
}


# New sponsor entries to ADD (appended to detailPageData.sponsors.other).
# Each entry is (slug, sponsor_dict).
ADDITIONAL_SPONSORS: list[tuple[str, dict]] = [
    (
        "inspire-her-te-whakatipuranga-wahine",
        {
            "name": "Centre for Automation and Robotic Engineering Science",
            "logo": "",
            "description": (
                "CARES is an interdisciplinary research hub with a mission to "
                "create inspiring and innovative robotic technologies that "
                "improve societal wellbeing."
            ),
        },
    ),
    (
        "inspire-her-te-whakatipuranga-wahine",
        {
            "name": "IEEE WIE",
            "logo": "",
            "description": (
                "IEEE Women in Engineering (WIE) is a global network of IEEE "
                "members and volunteers dedicated to promoting women engineers "
                "and scientists and inspiring girls around the world to follow "
                "their academic interests in a career in engineering."
            ),
        },
    ),
    (
        "inspire-her-te-whakatipuranga-wahine",
        {
            "name": "MYOB",
            "logo": "",
            "description": (
                "MYOB is a business management platform designed to unleash "
                "the potential of businesses across Australia and New Zealand! "
                "As the #originalstartup, our roots are in finance and "
                "accounting software, but today we empower more than 1.3 "
                "million businesses across every stage of their journey."
            ),
        },
    ),
    (
        "inspire-her-te-whakatipuranga-wahine",
        {
            "name": "Fonterra",
            "logo": "",
            "description": (
                "Fonterra Cooperative Group is the world's largest exporter of "
                "dairy products, a leader in dairy science and innovation, "
                "owner of a significant portfolio of brands in Asia Pacific, "
                "and a partner to many of the world's leading food service "
                "companies."
            ),
        },
    ),
    (
        "inspire-her-te-whakatipuranga-wahine",
        {
            "name": "QuiverVision",
            "logo": "",
            "description": (
                "QuiverVision is an augmented reality research company that "
                "produces both branded content and the technology to transform "
                "that content into personalized, immersive experiences."
            ),
        },
    ),
]


# Additional fullDescription paragraphs to APPEND for specific events where
# the scraper dropped short taglines but the text is not a speaker bio.
FULLDESCRIPTION_APPENDS: dict[str, list[str]] = {
    "2023-the-buzz-about-banking": [
        "See you there!",
    ],
    "2023-innovation-unleashed": [
        "What you'll learn at this event:",
    ],
    "ethnic-advantage-conference": [
        "She Sharp will be at the Ethnic Advantage Conference 2025, a powerful "
        "one-day event bringing together over 300 ethnic community leaders, "
        "service providers, faith leaders, government representatives and "
        "advocates committed to a stronger, more inclusive Aotearoa.",
    ],
    "2022-break-the-bias": [
        "Come along to enjoy some fireside chats by amazing panelists, an "
        "interactive workshop and a short quiz. Please join us to celebrate "
        "and honour the women you know, the women who inspire you, and the "
        "women who've helped you find your voice.",
    ],
    "2022-shaping-the-future-with-ai": [
        "In this interactive workshop, hosted by Google, we will learn more "
        "about the use of Artificial Intelligence, how to get involved and "
        "build AI applications. With awareness of the topic, we will also "
        "discuss the ethical considerations of AI in our everyday lives.",
    ],
    "2023-kickstart-your-career-in-tech-with-myob": [
        "Attendees will have the chance to hear from experienced professionals "
        "in the tech industry, who will be sharing their personal stories, "
        "experiences and insights on how to navigate the early stages of a "
        "career in technology.",
    ],
    "girls-night-out": [
        "SheSharp's last event of the year, and our first in-person event "
        "post-COVID!",
    ],
    "online-quiz-night-celebrating-ada-lovelace-day": [
        "Our amazingly talented speaker, Ruth James is going to do the same by "
        "telling us about her journey in tech. She Sharp is honoured to have "
        "Ruth join us to celebrate this day!",
    ],
    "imagine-zone-techweek": [
        "The Ministry of Education and NZTech partnered up to host the Tech21 "
        "Summit, to inspire ākonga (learners) into technology careers. The "
        "one-day Summit aimed to spark inspiration for young Kiwis by "
        "introducing them to the wide range of opportunities in technology.",
        "The Tech21 Summit had a number of young entrepreneurs and digital "
        "disruptors sharing their stories with more than a thousand 12 to 14 "
        "year olds to inspire them into a career in tech.",
    ],
    "she-techweek-2017": [
        "It's no secret that, for many years now, men have been the dominant "
        "voices in the technology sector. She# is here to change that. We aim "
        "to encourage women in computer science, computer engineering, "
        "software engineering, IT, and all other tech-related fields.",
    ],
    "design-thinking": [
        "Start with design — Stanford d.school.",
    ],
    "the-truths-to-gaming-and-start-up": [
        "'The Truths to Gaming and Start-up - SheSharp Edition' is organised "
        "by SheSharp, in collaboration with Geo AR Games & the New Zealand "
        "Game Developers Association (NZGDA).",
    ],
    "2021-iamremarkable": [
        "This program aims to: 1. Improve the motivation and self-promotion "
        "skills of women and underrepresented groups. 2. Change social "
        "perceptions and refresh the conversation around self-promotion.",
    ],
    "international-womens-day-2": [
        "Kathryn is a Brit, a twin mum, a swimmer and a wannabe travel writer "
        "— and she leaves a data trail to this effect!",
    ],
}


def apply_patches(data_by_slug: dict) -> int:
    changed = 0

    for (slug, name), desc in SPONSOR_DESCRIPTIONS.items():
        event = data_by_slug.get(slug)
        if not event:
            print(f"  [skip] {slug}: not found")
            continue
        sp = event.get("detailPageData", {}).get("sponsors") or {}
        matched = False
        for key in ("main", "other"):
            for entry in sp.get(key) or []:
                if entry.get("name") == name:
                    if not entry.get("description"):
                        entry["description"] = desc
                        print(f"  [sponsor-desc] {slug} / {name}")
                        changed += 1
                    matched = True
                    break
            if matched:
                break
        if not matched:
            print(f"  [skip] {slug}: sponsor {name!r} not found")

    for slug, sp_entry in ADDITIONAL_SPONSORS:
        event = data_by_slug.get(slug)
        if not event:
            print(f"  [skip] {slug}: not found (additional sponsor)")
            continue
        dp = event.setdefault("detailPageData", {})
        sp = dp.setdefault("sponsors", {"main": [], "other": []})
        other = sp.setdefault("other", [])
        # Avoid duplicate inserts.
        if any(e.get("name") == sp_entry["name"] for e in other):
            continue
        other.append(sp_entry)
        print(f"  [add-sponsor] {slug} / {sp_entry['name']}")
        changed += 1

    for slug, paras in FULLDESCRIPTION_APPENDS.items():
        event = data_by_slug.get(slug)
        if not event:
            print(f"  [skip] {slug}: not found (fd append)")
            continue
        dp = event.setdefault("detailPageData", {})
        fd = dp.setdefault("fullDescription", [])
        for para in paras:
            if para.strip() in fd:
                continue
            fd.append(para.strip())
            print(f"  [append-fd] {slug}: {para[:60]}…")
            changed += 1

    return changed


def main() -> int:
    apply = "--apply" in sys.argv

    scraped = json.loads(SCRAPED_JSON.read_text(encoding="utf-8"))
    custom = json.loads(CUSTOM_JSON.read_text(encoding="utf-8"))

    data_by_slug = {e["slug"]: e for e in scraped["events"]}
    data_by_slug_custom = {e["slug"]: e for e in custom["events"]}

    # Work on both files: if a slug exists in custom, patch that; otherwise
    # patch scraped.
    merged_lookup = {}
    for s, e in data_by_slug.items():
        merged_lookup[s] = ("scraped", e)
    for s, e in data_by_slug_custom.items():
        merged_lookup[s] = ("custom", e)

    # Run patches against a fused view that mutates the real objects.
    fused = {s: e for s, (_, e) in merged_lookup.items()}
    changed = apply_patches(fused)

    print(f"\nTotal patches proposed: {changed}")

    if apply and changed:
        SCRAPED_JSON.write_text(
            json.dumps(scraped, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        CUSTOM_JSON.write_text(
            json.dumps(custom, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print("Written to both JSON files.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
