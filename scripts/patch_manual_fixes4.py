"""Fourth batch of manual backfills:
  * inspire-her: give the "AUT | Google" combined sponsor a description plus
    a couple of short agenda/scholarship links in fullDescription
  * ai-for-the-environment-hackathon-festival-2024: add the "Who can join?"
    paragraph that the scraper dropped
  * she-sharp-centrality: add the "What is Blockchain?" tagline
  * technological-change-workplace-workforce-impacts: extend the HCLTech
    sponsor description with the second paragraph the scraper cut
  * google-educator-conference-2023/2024: clean up remaining sub-taglines
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRAPED_JSON = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"


SPONSOR_DESCRIPTIONS: dict[tuple[str, str], str] = {
    (
        "inspire-her-te-whakatipuranga-wahine",
        "AUT | Google",
    ): (
        "AUT is focused on providing exceptional student opportunities, "
        "learning experiences, and graduate success by impactful research "
        "and industry connectivity. Google supports all Kiwis towards a "
        "digital future. Google New Zealand started with just one person in "
        "2007 and has grown to around 50 people now based in Auckland and "
        "Wellington, supporting Aotearoa's transition into a thriving "
        "digital economy."
    ),
}


SPONSOR_DESCRIPTION_EXTENDS: dict[tuple[str, str], str] = {
    (
        "technological-change-workplace-workforce-impacts",
        "HCLTech",
    ): (
        " Their differentiated propositions serve some of New Zealand's "
        "leading organizations across key industry verticals including "
        "Banking and Insurance, Primary Industry and Public Sector."
    ),
}


FD_APPENDS: dict[str, list[str]] = {
    "inspire-her-te-whakatipuranga-wahine": [
        "See the agenda here.",
        "Click here for AUT Scholarships.",
    ],
    "ai-for-the-environment-hackathon-festival-2024": [
        "Who can join? Anyone who wants to solve real-world problems in "
        "protecting our water resources, fighting climate change, reducing "
        "pollution, managing land use, preserving biodiversity or "
        "increasing waste recycling.",
    ],
    "she-sharp-centrality": [
        "What is Blockchain?",
    ],
    "google-educator-conference-2023": [
        "The audience is High School Teachers who teach Computer Science, "
        "Digital Technologies, STEM or related subjects; teachers who are "
        "looking to refresh or add on to their skills; plus ICT curriculum "
        "leaders, primary school teachers and school librarians.",
    ],
    "google-educator-conference-2024": [
        "The audience is High School Teachers who teach Computer Science, "
        "Digital Technologies, STEM or related subjects; teachers who are "
        "looking to refresh or add on to their skills; plus ICT curriculum "
        "leaders, primary school teachers and school librarians.",
    ],
}


def main() -> int:
    apply = "--apply" in sys.argv

    scraped = json.loads(SCRAPED_JSON.read_text(encoding="utf-8"))
    by_slug = {e["slug"]: e for e in scraped["events"]}

    changed = 0

    for (slug, name), desc in SPONSOR_DESCRIPTIONS.items():
        event = by_slug.get(slug)
        if not event:
            print(f"  [skip] {slug}: not found")
            continue
        sp = event.get("detailPageData", {}).get("sponsors") or {}
        found = False
        for key in ("main", "other"):
            for entry in sp.get(key) or []:
                if entry.get("name") == name:
                    if not entry.get("description"):
                        entry["description"] = desc
                        print(f"  [sponsor-desc] {slug} / {name}")
                        changed += 1
                    found = True
                    break
            if found:
                break

    for (slug, name), extra in SPONSOR_DESCRIPTION_EXTENDS.items():
        event = by_slug.get(slug)
        if not event:
            continue
        sp = event.get("detailPageData", {}).get("sponsors") or {}
        for key in ("main", "other"):
            for entry in sp.get(key) or []:
                if entry.get("name") == name and entry.get("description"):
                    if extra.strip() not in entry["description"]:
                        entry["description"] = (
                            entry["description"].rstrip() + extra
                        )
                        print(f"  [extend-desc] {slug} / {name}")
                        changed += 1

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
