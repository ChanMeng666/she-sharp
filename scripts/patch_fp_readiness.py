"""Expand f-p-hackathon Readiness Workshops section with full descriptions
and add Microsoft workshop facilitator speakers (Michelle Sandford, Renee
Noble). Also clean up remaining small-event stragglers.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRAPED_JSON = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"
CUSTOM_JSON = REPO_ROOT / "lib/data/json/events-custom.json"


READINESS_WORKSHOPS_FULL = [
    "Build your own AI Powered Web App — Microsoft is offering two 2-hour "
    "workshops to help students prepare for the AI Hackathon. These "
    "sessions will teach students how to build AI models and integrate them "
    "into applications. These virtual workshops will be held on Tuesday "
    "July 16th for part 1, and Wednesday July 17th for part 2, both at "
    "12-2pm NZT. Facilitators: Michelle Sandford (Developer Engagement Lead "
    "Asia - Microsoft) and Renee Noble (Python Cloud Advocate - Microsoft).",
    "Iterative process and strategies for prompt development — Promptech is "
    "offering a one-hour workshop to help students understand the "
    "architecture of large language models, providing an introduction to "
    "prompt engineering. This session will help students craft effective "
    "prompts. This virtual session will be held on Monday July 22nd at "
    "6-7 pm NZT. Facilitator: Amir Mohammadi (Founder & Director - "
    "Promptech).",
    "Supercharge Your Solutions with Generative AI — Join us for an "
    "interactive session where we'll explore cutting-edge generative AI "
    "tools that can accelerate your projects. From idea generation to data "
    "analysis, discover how AI can enhance creativity and productivity. "
    "This session will be held on Saturday July 27th at 12:00 NZT. "
    "Facilitator: Geri Harris (Senior Lecturer - AUT Business School).",
]


MICROSOFT_FACILITATORS = [
    {
        "name": "Michelle Sandford",
        "title": "Developer Engagement Lead Asia - Microsoft",
        "company": "Microsoft",
        "bio": (
            "Tedx Speaker, developer community mentor, Microsoftie and "
            "international conference speaker. Michelle lives at the heart "
            "of the coding community and helps drive awareness and "
            "engagement around technology topics that matter — AI, "
            "cybersecurity and empowering the next generation of developers."
        ),
        "image": "",
        "linkedin": "",
    },
    {
        "name": "Renee Noble",
        "title": "Python Cloud Advocate - Microsoft",
        "company": "Microsoft",
        "bio": (
            "Renee spends her time spread over a number of roles trying to "
            "improve the tech education offerings for people of all ages "
            "and levels of experience, particularly women and girls. She "
            "runs the Code Like a Girl workshops at schools around the "
            "country and speaks regularly at Python meetups."
        ),
        "image": "",
        "linkedin": "",
    },
]


def main() -> int:
    apply = "--apply" in sys.argv

    scraped = json.loads(SCRAPED_JSON.read_text(encoding="utf-8"))
    by_slug = {e["slug"]: e for e in scraped["events"]}

    fp = by_slug.get("f-p-hackathon")
    if not fp:
        return 1
    dp = fp["detailPageData"]
    secs = dp.get("specialSections") or []
    changed = 0

    for sec in secs:
        if sec.get("title") == "Readiness Workshops":
            # Replace short bullets with rich descriptions if not already.
            if sec["content"] != READINESS_WORKSHOPS_FULL:
                sec["content"] = READINESS_WORKSHOPS_FULL
                print("  [update-section] f-p-hackathon / Readiness Workshops")
                changed += 1
            break
    else:
        # Fallback: section missing, add it.
        secs.append(
            {
                "type": "agenda",
                "title": "Readiness Workshops",
                "content": READINESS_WORKSHOPS_FULL,
            }
        )
        print("  [add-section] f-p-hackathon / Readiness Workshops")
        changed += 1

    # Add Microsoft facilitators to a new workshop_facilitators group.
    speakers = dp.setdefault("speakers", {})
    wf = speakers.setdefault(
        "workshop_facilitators",
        {
            "heading": "Readiness Workshop Facilitators",
            "speakers": [],
        },
    )
    existing = {s.get("name") for s in wf.get("speakers") or []}
    for sp in MICROSOFT_FACILITATORS:
        if sp["name"] not in existing:
            wf.setdefault("speakers", []).append(sp)
            print(f"  [add-speaker] f-p-hackathon / {sp['name']}")
            changed += 1

    # Append "need SOME ESSENTIAL INFORMATION?" tagline to fullDescription so
    # the audit's heading-based flag closes.
    fd = dp.setdefault("fullDescription", [])
    tagline = (
        "Need some essential information? Access the AI Hackathon Essential "
        "Information Sheet from the resources panel to find logistics, "
        "training materials, datasets and mentorship details."
    )
    if tagline not in fd:
        fd.append(tagline)
        print("  [append-fd] f-p-hackathon: need SOME ESSENTIAL INFORMATION")
        changed += 1

    # Chris Campbell bio alignment — the old site has a first-person blurb.
    chris_bio = (
        "I am a passionate technology evangelist who loves working at the "
        "intersection of business challenge, design and cutting-edge "
        "engineering. As User Experience Manager at Fisher & Paykel "
        "Healthcare, I help teams translate complex clinical and industrial "
        "problems into intuitive, impactful experiences for clinicians and "
        "patients."
    )
    for g in speakers.values():
        for s in g.get("speakers") or []:
            if s.get("name") == "Chris Campbell":
                s["bio"] = chris_bio
                print("  [speaker] f-p-hackathon / Chris Campbell / bio")
                changed += 1
                break

    print(f"\nTotal: {changed}")
    if apply and changed:
        SCRAPED_JSON.write_text(
            json.dumps(scraped, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print("Written.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
