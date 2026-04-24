"""Add AI Use Cases + Readiness Workshops content to f-p-hackathon.

These sections come from the old site but the scraper flattened them into
narrative paragraphs and dropped the 8 problem/solution pairs plus the
Microsoft / Promptech / AUT workshop facilitator cards.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRAPED_JSON = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"


AI_USE_CASES = {
    "type": "topics",
    "title": "AI Use Cases",
    "content": [
        "Problem: Manual analysis of customer feedback is laborious and prone "
        "to bias. Solution: An AI system that can generate automated "
        "summaries of customer feedback, highlighting key themes and "
        "concerns.",
        "Problem: Creating and maintaining training materials for new "
        "technology platforms is time-consuming. Solution: An AI system that "
        "can reformat, recompile and update various media types to keep "
        "training materials current.",
        "Problem: Manual checking and marking of VOU documents is prone to "
        "error and time-consuming. Solution: An AI system that can "
        "automatically mark VOUs against an answer sheet and populate the "
        "results into reporting tools.",
        "Problem: Manual extraction of information for weekly SAP update "
        "emails is time-consuming. Solution: An AI system that can draft "
        "automated emails using predefined templates and populate them from "
        "SAP data.",
        "Problem: Finding consistent answers to marketing-related questions "
        "is challenging. Solution: A centralised location where all relevant "
        "marketing knowledge material is stored and can be queried through "
        "natural language.",
        "Problem: Creating thumbnails for PDFs in the central storage "
        "location is labor-intensive. Solution: An AI system that can "
        "automate the thumbnail creation process.",
        "Problem: Writing test protocols and testing summaries is "
        "labor-intensive. Solution: An AI system that can automatically "
        "formulate test protocols and summaries from provided requirements.",
        "Problem: Updating and standardizing procedures is time-consuming. "
        "Solution: An AI system that can extract key points from existing "
        "procedures and reproduce a draft procedure in a new standardised "
        "format.",
    ],
}

READINESS_WORKSHOPS = {
    "type": "agenda",
    "title": "Readiness Workshops",
    "content": [
        "Build your own AI Powered Web App — Microsoft is offering two "
        "2-hour workshops to help students prepare for the AI Hackathon. "
        "These sessions will teach students how to build AI models and "
        "integrate them into applications. These virtual workshops will be "
        "held on Tuesday July 16th for part 1, and Wednesday July 17th for "
        "part 2, both at 12-2pm NZT. Facilitators: Michelle Sandford "
        "(Developer Engagement Lead Asia - Microsoft) and Renee Noble "
        "(Python Cloud Advocate - Microsoft).",
        "Iterative process and strategies for prompt development — "
        "Promptech is offering a one-hour workshop to help students "
        "understand the architecture of large language models, providing an "
        "introduction to prompt engineering. This virtual session will be "
        "held on Monday July 22nd at 6-7 pm NZT. Facilitator: Amir "
        "Mohammadi (Founder & Director - Promptech).",
        "Supercharge Your Solutions with Generative AI — Join us for an "
        "interactive session where we'll explore cutting-edge generative AI "
        "tools that can accelerate your projects. From idea generation to "
        "data analysis, discover how AI can enhance creativity and "
        "productivity. This session will be held on Saturday July 27th at "
        "12:00 NZT. Facilitator: Geri Harris (Senior Lecturer - AUT "
        "Business School).",
    ],
}

ESSENTIAL_INFO = {
    "type": "info",
    "title": "Essential Information",
    "content": [
        "Learning Resources: A wide range of learning resources is "
        "available for students, including free Azure for Students credits "
        "worth USD 100.",
        "Where to look for datasets? Access a diverse range of datasets, "
        "suitable for various use cases, including Free Public Data Sets for "
        "Analysis, Google Dataset Search, health statistics datasets, "
        "Kaggle healthcare datasets, LINZ Data Service, Machinehack, NZ "
        "Datasets and OpenML.",
    ],
}


def main() -> int:
    apply = "--apply" in sys.argv

    scraped = json.loads(SCRAPED_JSON.read_text(encoding="utf-8"))
    by_slug = {e["slug"]: e for e in scraped["events"]}
    fp = by_slug.get("f-p-hackathon")
    if not fp:
        print("f-p-hackathon not found")
        return 1
    dp = fp.setdefault("detailPageData", {})
    secs = dp.setdefault("specialSections", [])

    changed = 0
    existing_titles = {s.get("title") for s in secs}

    for sec in (AI_USE_CASES, READINESS_WORKSHOPS, ESSENTIAL_INFO):
        if sec["title"] in existing_titles:
            continue
        secs.append(sec)
        print(f"  [add-section] {sec['title']} ({len(sec['content'])} items)")
        changed += len(sec["content"])

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
