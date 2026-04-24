"""Third batch of manual backfills focused on the two Google Educator
Conference events: backfilling empty speaker bios for 2023, and adding a
new Demo Facilitators group with 6 speakers for 2024.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRAPED_JSON = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"


SPEAKER_BIO_UPDATES: dict[tuple[str, str], dict] = {
    ("google-educator-conference-2023", "Lesieli Oliver"): {
        "bio": (
            "Lesieli, a proud Tongan, is founder and Chief Visionary Officer "
            "of Lālanga, dedicated to championing Māori-Pasifika student "
            "success. She recently completed her Masters Research, focusing "
            "on digital solutions to improve the success of Māori-Pasifika "
            "students, addressing issues such as truancy, wellbeing and "
            "academic challenges. Lālanga ToolBox is currently used by 2,000 "
            "primary students in Auckland decile one schools. She received "
            "the University of Auckland 2023 '40 Under 40' Inspiring Leaders "
            "Alumni Award and has launched a charity to empower Pasifika "
            "students and families through education."
        ),
    },
    ("google-educator-conference-2023", "Mehwish Hasan"): {
        "bio": (
            "Mehwish Hasan, a devoted educator and the Computer Science "
            "Curriculum Leader at ACG Sunderland in Auckland, is on a "
            "mission to bring excitement to students' learning. With a "
            "background in telecommunications engineering, Mehwish has become "
            "New Zealand's inaugural QuiverVision Ambassador, weaving "
            "technology into education. Through the Quiver App, students "
            "transform static, coloured images into dynamic, interactive "
            "augmented-reality marvels — sparking creativity and curiosity."
        ),
    },
    ("google-educator-conference-2023", "Nils Reardon"): {
        "bio": (
            "Nils has been the CEO of QuiverVision since 2014, bringing a "
            "wealth of experience with a background in commerce and law. "
            "With an LLB (first-class honours) and a Commerce Degree "
            "(economics major), he honed his skills during six years at "
            "some of New Zealand's leading law firms before joining "
            "QuiverVision. Nils is the driving force behind the company's "
            "success, setting its strategic direction and overseeing finance "
            "and business management."
        ),
    },
    ("google-educator-conference-2023", "Nischay Gupta"): {
        "bio": (
            "Nischay is an experienced consultant in the tech sector and "
            "has played a pivotal role in optimising operations and "
            "aligning strategies with QuiverVision's goals. He led the "
            "launch of a new interactive EdTech product at QuiverVision "
            "benefitting over 35,000 teachers and 100,000 students worldwide "
            "within its first year of rollout. He holds a Master's degree in "
            "Engineering (first-class honours) from the University of "
            "Auckland and is a research intern at the Empathic Computing Lab "
            "(Auckland Bioengineering Institute)."
        ),
    },
    ("google-educator-conference-2023", "Steve Smith"): {
        "bio": (
            "Steve has been a High School Social Studies and Geography "
            "teacher for the last 16 years in New Zealand since returning "
            "from teaching in London for two years. Steve worked to bring "
            "Google for Education tools into classrooms across Aotearoa and "
            "now serves as NZ Program Manager, Google for Education."
        ),
    },
    ("google-educator-conference-2023", "Claire Wigley"): {
        "bio": (
            "Claire is currently a teacher at the innovative Spotswood "
            "College in New Plymouth. With a focus on teaching 21st-century "
            "skills, Claire's background lies in textiles technology, with "
            "teaching experience spanning year 1 to year 10. Over the past "
            "eight years, she has expanded her knowledge to cover many areas "
            "of the Technology Curriculum, from cooking to coding and laser "
            "cutting. As an Inquiry Specialist teacher, Claire integrates "
            "Design Thinking into her lessons. In 2023 she took on the role "
            "of council member at TENZ."
        ),
    },
}


# New speaker group to ADD to google-educator-conference-2024.
GEC_2024_DEMO_FACILITATORS = {
    "heading": "Meet the Demo Facilitators",
    "speakers": [
        {
            "name": "Dr. David Parsons",
            "title": "Research Director, academyEX",
            "company": "academyEX",
            "bio": (
                "David Parsons is the Research Director at academyEX and "
                "Adjunct Professor at the University of Canterbury. His "
                "experience includes academic roles at Southampton Solent "
                "University in the UK and Massey University in New Zealand, "
                "and senior professional roles in the international software "
                "industry. He holds a PhD in Information Technology and has "
                "research interests in the role of AI and digital "
                "technologies in education, agile and lean thinking, "
                "curriculum design and contemporary software development. "
                "He has produced over 200 publications, including several "
                "books on software development and education."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Dr. Kara Kennedy",
            "title": "Principal - AI Literacy Institute",
            "company": "AI Literacy Institute",
            "bio": (
                "Kara Kennedy, PhD, is a scholar, author and educator in the "
                "areas of digital and AI literacy and science fiction. She "
                "launched the AI Literacy Institute for resources and "
                "guidance on Generative AI topics, and her AI guides have "
                "been shared and translated by educators around the world. "
                "She has presented on digital and AI literacy at conferences "
                "in the US, Australia and NZ and published journal articles "
                "on digital and information literacy and on the gender gap "
                "in Wikipedia."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Dr. Kathryn MacCallum",
            "title": "Associate Professor, University of Canterbury",
            "company": "University of Canterbury",
            "bio": (
                "Kathryn MacCallum is an Associate Professor of Digital "
                "Education Futures at the University of Canterbury. As "
                "Director of the Digital Education Futures Lab, she leads a "
                "community of researchers exploring digital technologies in "
                "education across all contexts, from kindergarten to "
                "tertiary education. Kathryn's research focuses on the role "
                "and impact of technology in education, particularly how "
                "emerging technologies like AI can support the development "
                "of digital literacies and how this shifts educational "
                "practices and norms."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Catherine Frost",
            "title": "Lead Writer Technology, Ministry of Education",
            "company": "Ministry of Education",
            "bio": (
                "Catherine is currently Lead Writer in the Technology "
                "learning area in the Ministry of Education for the "
                "curriculum refresh Te Mātaiaho. Teaching across all "
                "sectors — first in the 1990s in the UK and since 2004 in "
                "Aotearoa New Zealand — Catherine has almost 30 years' "
                "experience in Technology education, leadership, strategy "
                "and curriculum development. She is passionate about "
                "curriculum and the potential of emerging technologies to "
                "transform learning."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Dr. Mahsa McCauley (Mohaghegh)",
            "title": "Associate Professor at AUT and Chair AI Forum",
            "company": "She Sharp / AUT / AI Forum NZ",
            "bio": (
                "Dr. Mahsa McCauley is Founder and Director of She Sharp "
                "Charitable Trust. As Chair of AI Forum NZ and Associate "
                "Professor of AI at AUT, she researches AI, machine "
                "learning, IoT and cybersecurity. She serves on boards of "
                "NZTech, EdTechNZ and World Summit Awards, advancing AI "
                "strategy, education and SDG projects."
            ),
            "image": "",
            "linkedin": "",
        },
        {
            "name": "Munireh Rouget",
            "title": "Deputy Chair - TENZ Council",
            "company": "TENZ Council / Fraser High School",
            "bio": (
                "Munireh serves as Deputy Chair on the TENZ Council and is "
                "Poutakawaenga mō te Pūtake Whakawhanaungatanga — "
                "Facilitator for the Whakawhanaungatanga Principle. She "
                "earned her Master's in Computer Sciences from Université "
                "Paul Sabatier in France and began her career as a Software "
                "Engineer, crafting e-commerce websites for major "
                "international companies. In 2021 she became a teacher to "
                "enhance diversity and inclusion in Computer Sciences and "
                "Digital Technologies; she is now Leader of Learning for "
                "Digital Technology at Fraser High School."
            ),
            "image": "",
            "linkedin": "",
        },
    ],
}


FD_APPENDS: dict[str, list[str]] = {
    "google-educator-conference-2023": [
        "Previously known as CS4HS, the Google Educator Conference is back "
        "for 2023!",
    ],
    "google-educator-conference-2024": [
        "Previously known as CS4HS, the Google Educator Conference is back "
        "for 2024!",
    ],
}


def main() -> int:
    apply = "--apply" in sys.argv

    scraped = json.loads(SCRAPED_JSON.read_text(encoding="utf-8"))
    by_slug = {e["slug"]: e for e in scraped["events"]}

    changed = 0

    for (slug, name), fields in SPEAKER_BIO_UPDATES.items():
        event = by_slug.get(slug)
        if not event:
            print(f"  [skip] {slug}: not found")
            continue
        speakers = event.get("detailPageData", {}).get("speakers") or {}
        found = False
        for group in speakers.values():
            for sp in group.get("speakers") or []:
                if sp.get("name") == name:
                    for field, value in fields.items():
                        if sp.get(field) != value:
                            sp[field] = value
                            print(f"  [bio] {slug} / {name}")
                            changed += 1
                    found = True
                    break
            if found:
                break
        if not found:
            print(f"  [skip] {slug}: speaker {name!r} not found")

    # Add Demo Facilitators group to 2024 event.
    event_2024 = by_slug.get("google-educator-conference-2024")
    if event_2024:
        sp = event_2024.setdefault("detailPageData", {}).setdefault(
            "speakers", {}
        )
        if "guest_speakers" not in sp:
            sp["guest_speakers"] = GEC_2024_DEMO_FACILITATORS
            print(
                f"  [add-group] google-educator-conference-2024 / "
                f"guest_speakers ({len(GEC_2024_DEMO_FACILITATORS['speakers'])} speakers)"
            )
            changed += len(GEC_2024_DEMO_FACILITATORS["speakers"])
        else:
            print(
                "  [skip] google-educator-conference-2024 already has "
                "guest_speakers group"
            )

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
