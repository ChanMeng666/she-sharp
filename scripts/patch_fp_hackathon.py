"""f-p-hackathon: add the six-person judges group and backfill the Judging
Information special section with the intro + theme paragraphs the scraper
dropped. Also close the remaining gaps on her-waka-april and the Google
Educator Conference 2024 event.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRAPED_JSON = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"
CUSTOM_JSON = REPO_ROOT / "lib/data/json/events-custom.json"


JUDGES_GROUP = {
    "heading": "MEET THE JUDGES",
    "speakers": [
        {
            "name": "Nicholas Fourie",
            "title": "Vice President of ICT - Fisher & Paykel Healthcare",
            "company": "Fisher & Paykel Healthcare",
            "bio": (
                "Nicholas Fourie has been the Vice President of Information "
                "& Communication Technology at Fisher & Paykel Healthcare "
                "since February 2017. Since joining the company in 2007, he "
                "has held various systems engineering and management roles. "
                "Before his tenure at Fisher & Paykel, Nicholas worked for "
                "the South African division of BHP Billiton. He holds a "
                "Diploma in Computer Engineering from Damelin School of "
                "Information Technology in South Africa. Nicholas has also "
                "served on the Computer and Mathematical Sciences Industry "
                "Advisory Board for Auckland University of Technology "
                "(AUT). Regularly featured in the CIO50 New Zealand Top "
                "Award Winners, Nicholas achieved the number one ranking "
                "and won the prestigious award in 2023."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Mahsa McCauley (Mohaghegh)",
            "title": "Founder and Chair - She Sharp",
            "company": "She Sharp",
            "bio": (
                "Dr. Mahsa McCauley is the founder and the director of She "
                "Sharp, an Associate Professor in the School of Computer, "
                "Engineering and Mathematical Sciences at Auckland "
                "University of Technology and Chair of the AI Forum New "
                "Zealand. An internationally recognised leader in AI and "
                "machine learning, Dr. McCauley also serves on the boards "
                "of NZTech, EdTechNZ and the AI Research Association, where "
                "she contributes to shaping the future of AI policy and "
                "research in New Zealand. Internationally, she has engaged "
                "as a Fulbright Scholar at North Carolina A&T State "
                "University, applying AI to agriculture and cybersecurity "
                "challenges."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Rik Irons-Mclean",
            "title": "CTO, Enterprise Commercial - Microsoft AU & NZ",
            "company": "Microsoft AU & NZ",
            "bio": (
                "Rik Irons-Mclean is a global leader focused on delivering "
                "business outcomes through data and digital tech adoption. "
                "As CTO, Rik drives outcomes through strategic data and "
                "digital tech adoption. Previously, he led Sustainability "
                "Sales Enablement at Microsoft and UK Strategy for "
                "manufacturing, energy and resources. With 13 years at "
                "Cisco, Rik held global roles in energy, IoT, security and "
                "digital transformation, including Chief Architect (CTO) "
                "for all industries. He authors books, contributes to "
                "industry papers, and serves on boards for energy, "
                "manufacturing, sustainability, IoT and digital skills. "
                "He's part of Australia's Climate Leaders Coalition and "
                "Sustainability Tech Council, holding an MBA in "
                "international leadership and MIEMA and CEnv sustainability "
                "accreditations."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Justin Wood",
            "title": "Director - Deloitte New Zealand",
            "company": "Deloitte New Zealand",
            "bio": (
                "Justin has worked in technology for most of his career and "
                "has a long history working in Integration and specifically "
                "APIs across a range of industries but mostly in the "
                "financial sector. He has designed and implemented "
                "applications on public Cloud since the early days when "
                "there were only a handful of services available from "
                "Amazon Web Services."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Yvonne Chan",
            "title": "Associate Dean | Board Director - AUT",
            "company": "AUT",
            "bio": (
                "Meet Yvonne – a passionate advocate for authentic "
                "collaboration and transdisciplinary innovation driving "
                "positive social impact. As the Associate Dean and Director "
                "of Engagement for the Faculty of Design and Creative "
                "Technologies at AUT University, she fosters connections "
                "between academia, industry, government and the community. "
                "With a background in Smart and high-performance textiles, "
                "Yvonne's expertise spans textiles, fashion, colour, "
                "culture and technology."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Alex Mercer",
            "title": "Group Head of Marketing and Communications - Datacom",
            "company": "Datacom",
            "bio": (
                "Alex Mercer has worked across the Asia Pacific region and "
                "the U.S. for organisations such as Microsoft, Xero, Orion "
                "Health, NEXT Foundation, the Giving Pledge, Datacom, and "
                "Delightful Communications. Her career highlights include "
                "collaborating with talented leaders and achieving "
                "significant milestones. Alex is passionate about tech and "
                "enjoys navigating and leading through change using her "
                "brand marketing and communications skills, often handling "
                "crisis issues. She is also dedicated to New Zealand's "
                "social enterprise and business growth, actively investing "
                "in entrepreneurial businesses and helping to establish "
                "ArcAngels, an organisation that supports women-founded "
                "businesses."
            ),
            "image": "",
            "linkedin": "",
        },
    ],
}


# Additional fullDescription paragraphs for f-p-hackathon to cover the
# "Judging panel of 6 judges" intro + theme/date taglines.
FP_FD_APPENDS = [
    "Brought to you by She Sharp & Fisher And Paykel Healthcare — Friday, "
    "July 26th - Sunday, July 28th, 2024.",
    "Judging panel of 6 judges (see below), led by Dr Mahsa McCauley - "
    "Founder Director of She Sharp.",
    "The theme of the \"F&P AI Hackathon with She Sharp\" is about breaking "
    "free from drudgery and using innovation and technology to address "
    "repetitive tasks, mundane processes, and administrative burdens. "
    "Participants are expected to align their proposed solutions to "
    "address one or more of the 8 use cases provided in the brief.",
]


# Bio alignment updates for the remaining flagged mentors (Geri Harris vs
# Alan Dent heading mix-up in AI Hackathon 2025, Claire Wigley in GEC 2024).
SPEAKER_UPDATES: dict[tuple[str, str], dict] = {
    # google-educator-conference-2024 — append Claire Wigley as a facilitator.
    # Claire was at both 2023 and 2024 per old-site H2 listings; missing from
    # the 2024 new-site JSON. Add under guest_speakers.
    ("google-educator-conference-2024", "Dr. David Parsons"): {},  # touch
    # ai-hackathon-festival-2025 — explicitly set Alan Dent title so the
    # audit heading/paragraph match succeeds.
    ("ai-hackathon-festival-2025", "Alan Dent"): {
        "title": "Director - Auckland AI & Emerging Technology",
    },
}


FD_APPENDS: dict[str, list[str]] = {
    "her-waka-april-2026": [
        "Each two-hour programme brings together up to 25 participants in a "
        "supportive, high-impact environment that blends inspiration, "
        "practical skills, and direct employer insight. Through real "
        "conversations and structured learning, participants gain clarity on "
        "how to position themselves confidently and competitively in "
        "today's job market.",
    ],
}


# Additional speaker rows to add.
ADDITIONAL_SPEAKERS: dict[str, list[tuple[str, dict]]] = {
    "google-educator-conference-2024": [
        (
            "guest_speakers",
            {
                "name": "Claire Wigley",
                "title": "Teacher at Spotswood College New Plymouth",
                "company": "Spotswood College",
                "bio": (
                    "Claire is a dedicated teacher at Spotswood College in "
                    "New Plymouth, focused on teaching 21st-century skills. "
                    "With a background in textiles technology, she has "
                    "expanded her expertise to encompass various areas of "
                    "the Technology Curriculum, from cooking to coding and "
                    "laser cutting. As an Inquiry Specialist teacher, Claire "
                    "integrates Design Thinking into her lessons and in "
                    "2023 took on the role of council member at TENZ."
                ),
                "image": "",
                "linkedin": "",
            },
        ),
    ],
    "google-educator-conference-2023": [
        (
            "guest_speakers",
            {
                "name": "Lesieli Oliver — Education Ambassador, QuiverVision",
                "title": "Education Ambassador, QuiverVision",
                "company": "QuiverVision / Lālanga",
                "bio": (
                    "Lesieli, a proud Tongan, founder and Chief Visionary "
                    "Officer of Lālanga, is also an Education Ambassador "
                    "with QuiverVision, championing Māori-Pasifika student "
                    "success through augmented-reality learning experiences."
                ),
                "image": "",
                "linkedin": "",
            },
        ),
    ],
}


def main() -> int:
    apply = "--apply" in sys.argv

    scraped = json.loads(SCRAPED_JSON.read_text(encoding="utf-8"))
    custom = json.loads(CUSTOM_JSON.read_text(encoding="utf-8"))
    by_slug_scraped = {e["slug"]: e for e in scraped["events"]}
    by_slug_custom = {e["slug"]: e for e in custom["events"]}

    def find(slug):
        return by_slug_custom.get(slug) or by_slug_scraped.get(slug)

    changed = 0

    # 1. Add judges group to f-p-hackathon.
    fp = find("f-p-hackathon")
    if fp:
        sp = fp.setdefault("detailPageData", {}).setdefault("speakers", {})
        if "panel_speakers" not in sp:
            sp["panel_speakers"] = JUDGES_GROUP
            print(f"  [add-group] f-p-hackathon / panel_speakers (judges) "
                  f"({len(JUDGES_GROUP['speakers'])})")
            changed += len(JUDGES_GROUP["speakers"])
        else:
            # If a panel_speakers group already exists but lacks the judges,
            # skip — user can inspect.
            existing = {s.get("name") for s in (sp["panel_speakers"].get("speakers") or [])}
            missing = [
                s for s in JUDGES_GROUP["speakers"]
                if s["name"] not in existing
            ]
            if missing:
                sp["panel_speakers"]["speakers"].extend(missing)
                print(
                    f"  [extend-group] f-p-hackathon / panel_speakers "
                    f"(+{len(missing)} judges)"
                )
                changed += len(missing)

        fd = fp["detailPageData"].setdefault("fullDescription", [])
        for para in FP_FD_APPENDS:
            if para in fd:
                continue
            fd.append(para)
            print(f"  [append-fd] f-p-hackathon: {para[:60]}…")
            changed += 1

    # 2. Speaker targeted updates.
    for (slug, name), fields in SPEAKER_UPDATES.items():
        if not fields:
            continue
        event = find(slug)
        if not event:
            continue
        speakers = event.get("detailPageData", {}).get("speakers") or {}
        found = False
        for group in speakers.values():
            for sp in group.get("speakers") or []:
                if sp.get("name") == name:
                    for f, v in fields.items():
                        if sp.get(f) != v:
                            sp[f] = v
                            print(f"  [speaker] {slug} / {name} / {f}")
                            changed += 1
                    found = True
                    break
            if found:
                break

    # 3. fullDescription appends.
    for slug, paras in FD_APPENDS.items():
        event = find(slug)
        if not event:
            continue
        fd = event.setdefault("detailPageData", {}).setdefault(
            "fullDescription", []
        )
        for para in paras:
            if para in fd:
                continue
            fd.append(para)
            print(f"  [append-fd] {slug}: {para[:60]}…")
            changed += 1

    # 4. Add extra speakers to existing groups.
    for slug, entries in ADDITIONAL_SPEAKERS.items():
        event = find(slug)
        if not event:
            continue
        sp = event.setdefault("detailPageData", {}).setdefault("speakers", {})
        for group_key, new_sp in entries:
            group = sp.setdefault(
                group_key,
                {"heading": "Additional Speakers", "speakers": []},
            )
            existing_names = {
                s.get("name") for s in group.get("speakers") or []
            }
            if new_sp["name"] in existing_names:
                continue
            group.setdefault("speakers", []).append(new_sp)
            print(
                f"  [add-speaker] {slug} / {group_key} / {new_sp['name']}"
            )
            changed += 1

    print(f"\nTotal: {changed}")
    if apply and changed:
        SCRAPED_JSON.write_text(
            json.dumps(scraped, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        CUSTOM_JSON.write_text(
            json.dumps(custom, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print("Written.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
