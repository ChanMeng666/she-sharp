"""Second batch of manual backfills: speaker bio/title updates and
event-specific taglines that align the new-site data with exact old-site
text so the bullet-list audit stops flagging them.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRAPED_JSON = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"
CUSTOM_JSON = REPO_ROOT / "lib/data/json/events-custom.json"


# Speaker bio/title updates keyed by (slug, speaker_name).
SPEAKER_UPDATES: dict[tuple[str, str], dict] = {
    ("iamremarkable", "Dr. Mahsa McCauley (Mohaghegh)"): {
        "title": "Associate Professor at AUT and Chair AI Forum",
        "bio": (
            "Dr. Mahsa McCauley is Founder and Director of She Sharp "
            "Charitable Trust. As Chair of AI Forum NZ and Associate Professor "
            "of AI at AUT, she researches AI, machine learning, IoT and data "
            "science, and leads an academic programme to inspire and grow the "
            "next generation of women in technology across Aotearoa New "
            "Zealand."
        ),
    },
    (
        "she-sharp-candice-murray-own-your-energy",
        "Candice Murray",
    ): {
        "bio": (
            "Candice Murray is a Career Mindset Coach and has been recognised "
            "as one of Influence Digest Media's Top Coaches in Auckland for "
            "2025 and 2024. With a down-to-earth approach and real-world "
            "expertise, Candice blends practical tools with mindset work to "
            "help professionals show up with confidence, clarity and calm — "
            "especially in the moments that matter most."
        ),
    },
}


# Event-specific additional fullDescription paragraphs for items not
# already handled by patch_manual_fixes.py.
FD_APPENDS: dict[str, list[str]] = {
    "she-sharp-candice-murray-own-your-energy": [
        "Join us for an interactive workshop with Candice Murray — we can't "
        "wait to see you. Mark your calendar:",
        "Know someone who would enjoy this workshop? Feel free to share the "
        "event with a friend or colleague and invite them to register.",
    ],
    "ai-hackathon-festival-2025": [
        "Auckland University of Technology (AUT) and SheSharp are delighted "
        "to be hosting this event this year, and we invite you to join us and "
        "solve real-world environmental problems with AI.",
        "Registrations are open now. To register click on \"Register for "
        "Event\" and select date (15-16 August, 2025) and location "
        "(Auckland — AUT and SheSharp).",
        "Everything in one place to power your hackathon journey. Find "
        "essential info on logistics, training materials, datasets, and "
        "mentorship — all organized for quick access.",
    ],
    "2022-women-igniting-tech": [
        "Steph is a Product Leader with more than 10 years of experience "
        "working in e-commerce, product development and digital "
        "transformation across New Zealand retail."
    ],
    "the-truths-to-gaming-and-start-up": [
        "Melanie Langlotz is the founder of Geo AR Games and the ideas person "
        "behind the product range. She has a varied 20-year background from "
        "both a technical and management perspective in the Entertainment and "
        "Media industry, and holds a Post Grad Diploma in Entrepreneurship "
        "and a Diploma in Business Coaching. Mel has been through two "
        "business incubators, Start-up Chile and Lightning Lab, which "
        "provided the springboard for Geo AR Games' first products \"Sharks "
        "in the Park\" and later \"Magical Park\".",
    ],
}


def apply_patches(
    scraped_lookup: dict, custom_lookup: dict
) -> int:
    changed = 0

    for (slug, name), fields in SPEAKER_UPDATES.items():
        event = scraped_lookup.get(slug) or custom_lookup.get(slug)
        if not event:
            print(f"  [skip] {slug}: event not found")
            continue
        dp = event.get("detailPageData") or {}
        speakers = dp.get("speakers") or {}
        found = False
        for group_key, group in speakers.items():
            for sp in group.get("speakers") or []:
                if sp.get("name") == name:
                    for field, value in fields.items():
                        if sp.get(field) != value:
                            sp[field] = value
                            print(
                                f"  [speaker] {slug} / {name} / {field} "
                                f"updated"
                            )
                            changed += 1
                    found = True
                    break
            if found:
                break
        if not found:
            print(f"  [skip] {slug}: speaker {name!r} not found")

    for slug, paras in FD_APPENDS.items():
        event = scraped_lookup.get(slug) or custom_lookup.get(slug)
        if not event:
            print(f"  [skip] {slug}: event not found (FD append)")
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

    scraped_lookup = {e["slug"]: e for e in scraped["events"]}
    custom_lookup = {e["slug"]: e for e in custom["events"]}

    changed = apply_patches(scraped_lookup, custom_lookup)
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
