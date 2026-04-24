"""Her Waka batch patch: align her-waka, her-waka-april-2026, her-waka-may-2026
with the old-site content the scraper partially dropped.

Adds the missing short taglines to fullDescription, aligns speaker bios with
the old-site text, and fills in missing RCSA recruiter guest speakers for
her-waka-april-2026.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CUSTOM_JSON = REPO_ROOT / "lib/data/json/events-custom.json"


FD_APPENDS: dict[str, list[str]] = {
    "her-waka": [
        "Ready to take your next step into meaningful work?",
        "🌟 March 2026 Theme: AI & The Future of Work — our March HER WAKA "
        "session focuses on Artificial Intelligence and the evolving tech job "
        "market in 2026.",
        "Join us and take your next step forward with confidence. ✨",
    ],
    "her-waka-april-2026": [
        "Ready to take your next step into meaningful work?",
        "🌟 April 2026 Theme: #IamRemarkable — our April HER WAKA session "
        "focuses on building confidence, self-advocacy and practical AI "
        "skills for job seekers.",
        "In the second half of the session, participants will take part in "
        "a 30-minute recruiter networking activity, where 2–3 tables will be "
        "set up to allow small groups to connect directly with recruiters. "
        "Each participant will have a few minutes at each table to introduce "
        "themselves, ask questions, and practise real-world conversations in "
        "a supportive environment.",
        "HER WAKA is more than an event. It is a practical, supportive step "
        "toward sustainable employment and long-term workforce participation.",
        "Join us and take your next step forward with confidence. ✨",
    ],
    "her-waka-may-2026": [
        "🌟 May 2026 Theme: Cybersecurity Workshop — our May HER WAKA session "
        "focuses on cybersecurity awareness and the in-demand skills shaping "
        "safer digital workplaces.",
        "In the second half of the session, participants will take part in a "
        "45-minute recruiter networking activity with RCSA representatives. "
        "There will be 2–3 tables set up where small groups can connect "
        "directly with recruiters, ask questions, and practise real-world "
        "conversations in a supportive environment.",
        "HER WAKA is more than an event. It is a practical, supportive step "
        "toward sustainable employment and long-term workforce participation.",
        "Join us and take your next step forward with confidence. ✨",
    ],
}


# Speaker bio / title updates keyed by (slug, name).
SPEAKER_UPDATES: dict[tuple[str, str], dict] = {
    # her-waka (March)
    ("her-waka", "Nikita Kumari"): {
        "bio": (
            "Hi, I'm Nikita Kumari — a PMP-certified Product and Project "
            "Manager with over 6 years of experience delivering AI and "
            "digital products in the B2B SaaS space. I began my career as a "
            "Python developer, building a strong technical foundation before "
            "moving into product and agile delivery roles. Since then, I've "
            "led cross-functional teams and worked with engineers, designers "
            "and business stakeholders to turn complex ideas into scalable "
            "solutions. My work includes AI and machine learning initiatives "
            "for healthcare, research, and enterprise customers."
        ),
    },
    ("her-waka", "Meeta Patel"): {
        "bio": (
            "Dr Patel is Programme Lead and Lead Facilitator for Leading "
            "Change for Good at AcademyEX, with a career spanning industry, "
            "research and academia. With a background as a research "
            "scientist, she spent many years in applied research before "
            "moving into education, reflecting a commitment to learning and "
            "community. In this role, she leads and delivers the programme "
            "end-to-end, ensuring a meaningful and impactful experience for "
            "participants. Outside of professional work, she is an "
            "Ambassador for She Sharp, a non-profit organisation focused on "
            "bridging the gender gap, and is actively involved in the "
            "community, driven by a strong belief in equity and the power of "
            "people to create change."
        ),
    },
    ("her-waka", "Abe Naus"): {
        "title": "General Manager - Potentia",
        "bio": (
            "Abe Naus is General Manager of Potentia. He works as the "
            "Kaitiaki for the Auckland business driving the growth, success "
            "and cultural alignment of the Auckland consulting teams, "
            "ensuring they're building the right future proofed business. "
            "He is an experienced IT, Projects and Change Recruiter who has "
            "been working in recruitment for the past 16 years. Originally "
            "starting his recruitment career in the Education sector, he has "
            "since recruited within a range of specialisations across NZ, "
            "including IT, Projects and Change. His recruitment team's "
            "areas of expertise include Project Services, DevOps, Big Data "
            "& Analytics, Architects, Developers, Test Analysts, Business "
            "Analysts, AI and Agile skilled individuals."
        ),
    },
    ("her-waka", "Paul Kelly"): {
        "title": "Business Manager - Randstad Digital",
        "bio": (
            "Paul Kelly is Business Manager for Auckland at Randstad "
            "Digital, bringing over a decade of experience in recruitment, "
            "particularly within the banking, finance, insurance and "
            "government industries. He is passionate about connecting top "
            "talent with leading organisations and has a proven ability to "
            "build strong relationships with both clients and candidates."
        ),
    },
    ("her-waka", "Neekee Reshamwala"): {
        "title": "Business Manager for Auckland - Randstad Digital",
        "bio": (
            "As the Business Manager for Auckland, Neekee is responsible "
            "for driving growth and overseeing daily operations, delivering "
            "exceptional results for clients and candidates. Before joining "
            "Randstad Digital, Neekee held senior leadership roles in the "
            "recruitment industry, where she honed her skills in sales, "
            "business development and team management. She holds a Master's "
            "degree in Business Management from Massey University and has an "
            "in-depth understanding of Auckland's job market."
        ),
    },
    ("her-waka", "Dr. Mahsa McCauley"): {
        "title": "Associate Professor at AUT and Chair AI Forum",
        "bio": (
            "Dr. Mahsa McCauley is Founder and Director of She Sharp "
            "Charitable Trust. As Chair of AI Forum NZ and Associate "
            "Professor of AI at AUT, she researches AI, machine learning, "
            "IoT and cybersecurity. She serves on boards of NZTech, EdTechNZ "
            "and World Summit Awards, advancing AI strategy, education and "
            "SDG projects."
        ),
    },
}


# Additional speaker groups to ADD (for events lacking full RCSA speakers).
# Keyed by slug; each value is {group_key: group_dict}.
NEW_SPEAKER_GROUPS: dict[str, dict] = {
    "her-waka-april-2026": {
        "guest_speakers": {
            "heading": "RCSA Recruiters",
            "speakers": [
                {
                    "name": "Abe Naus",
                    "title": "General Manager - Potentia",
                    "company": "Potentia",
                    "bio": (
                        "Abe Naus is General Manager of Potentia. He works "
                        "as the Kaitiaki for the Auckland business driving "
                        "the growth, success and cultural alignment of the "
                        "Auckland consulting teams, ensuring they're "
                        "building the right future proofed business. His "
                        "recruitment team's areas of expertise include "
                        "Project Services, DevOps, Big Data & Analytics, "
                        "Architects, Developers, Test Analysts, Business "
                        "Analysts, AI and Agile skilled individuals."
                    ),
                    "image": "",
                    "linkedin": "",
                },
                {
                    "name": "Anabella Bianchi",
                    "title": "Director Consultant - Elevate Consulting",
                    "company": "Elevate Consulting",
                    "bio": (
                        "Born in Argentina and settled in NZ since 2005, "
                        "Anabella has worked in the resourcing industry for "
                        "nearly 20 years dealing with a wide range of "
                        "industries and sectors both within NZ and "
                        "internationally. In the last nine years, she "
                        "joined the ICT industry and is extremely passionate "
                        "about helping customers with the best resourcing "
                        "options and their projects' roadmaps to make them "
                        "successful."
                    ),
                    "image": "",
                    "linkedin": "",
                },
                {
                    "name": "Sri Nanduri",
                    "title": "Senior Consultant - Potentia",
                    "company": "Potentia",
                    "bio": (
                        "Sri Nanduri is an experienced Auckland-based "
                        "technology recruiter with over 8 years experience, "
                        "specialising in Technology, Transformation and "
                        "Digital roles within New Zealand. She has a strong "
                        "background in senior client management, candidate "
                        "placement and career coaching, helping "
                        "professionals build personal brands and enhance "
                        "their interview skills. Sri stands out for her "
                        "skill in finding talent for niche, high impact "
                        "roles such as product management and technical "
                        "leadership."
                    ),
                    "image": "",
                    "linkedin": "",
                },
            ],
        }
    },
}


def main() -> int:
    apply = "--apply" in sys.argv

    custom = json.loads(CUSTOM_JSON.read_text(encoding="utf-8"))
    by_slug = {e["slug"]: e for e in custom["events"]}

    changed = 0

    for slug, paras in FD_APPENDS.items():
        event = by_slug.get(slug)
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

    for (slug, name), fields in SPEAKER_UPDATES.items():
        event = by_slug.get(slug)
        if not event:
            continue
        speakers = event.get("detailPageData", {}).get("speakers") or {}
        found = False
        for group in speakers.values():
            for sp in group.get("speakers") or []:
                if sp.get("name") == name or (
                    name == "Dr. Mahsa McCauley"
                    and sp.get("name", "").startswith("Dr. Mahsa")
                ):
                    for f, v in fields.items():
                        if sp.get(f) != v:
                            sp[f] = v
                            print(f"  [speaker] {slug} / {name} / {f}")
                            changed += 1
                    found = True
                    break
            if found:
                break
        if not found:
            print(f"  [skip] {slug}: speaker {name!r} not found")

    for slug, groups in NEW_SPEAKER_GROUPS.items():
        event = by_slug.get(slug)
        if not event:
            continue
        sp = event.setdefault("detailPageData", {}).setdefault("speakers", {})
        for key, group_data in groups.items():
            if key in sp and (sp[key] or {}).get("speakers"):
                print(f"  [skip] {slug}: {key} already has speakers")
                continue
            sp[key] = group_data
            print(
                f"  [add-group] {slug} / {key} "
                f"({len(group_data['speakers'])} speakers)"
            )
            changed += len(group_data["speakers"])

    print(f"\nTotal: {changed}")
    if apply and changed:
        CUSTOM_JSON.write_text(
            json.dumps(custom, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print("Written.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
