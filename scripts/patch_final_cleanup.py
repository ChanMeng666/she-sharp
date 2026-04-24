"""Final cleanup pass for the bullet-list audit: align a handful of bios,
titles and agenda items with the old-site wording verbatim so the audit
stops flagging near-duplicates.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRAPED_JSON = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"
CUSTOM_JSON = REPO_ROOT / "lib/data/json/events-custom.json"


SPEAKER_UPDATES: dict[tuple[str, str], dict] = {
    # her-waka — align Abe Naus bio with old-site wording (colon-delimited
    # expertise list so the audit normaliser matches).
    ("her-waka", "Abe Naus"): {
        "bio": (
            "Abe Naus is General Manager of Potentia. He works as the "
            "Kaitiaki for the Auckland business driving the growth, success "
            "and cultural alignment of the Auckland consulting teams, "
            "ensuring they're building the right future proofed business. "
            "He is an experienced IT, Projects and Change Recruiter who has "
            "been working in recruitment for the past 16 years. His "
            "recruitment team's areas of expertise: Project Services, "
            "DevOps, Big Data & Analytics, Architects, Developers, Test "
            "Analysts, Business Analysts, AI, Agile skilled individuals."
        ),
    },
    # her-waka — align Paul Kelly bio with the old-site third-person opening
    # so the substring match succeeds.
    ("her-waka", "Paul Kelly"): {
        "bio": (
            "Paul Kelly is Business Manager for Auckland at Randstad Digital, "
            "brings over a decade of experience in recruitment, particularly "
            "within the banking, finance, insurance, and government "
            "industries. He is passionate about connecting top talent with "
            "leading organisations and has a proven ability to build strong "
            "relationships with both clients and candidates."
        ),
    },
    # her-waka-april Abe — same expertise list fix.
    ("her-waka-april-2026", "Abe Naus"): {
        "bio": (
            "Abe Naus is General Manager of Potentia. He works as the "
            "Kaitiaki for the Auckland business driving the growth, success "
            "and cultural alignment of the Auckland consulting teams, "
            "ensuring they're building the right future proofed business. "
            "His recruitment team's areas of expertise: Project Services, "
            "DevOps, Big Data & Analytics, Architects, Developers, Test "
            "Analysts, Business Analysts, AI, Agile skilled individuals."
        ),
    },
    # her-waka-april Anabella — first-person verbatim bio and fixed title.
    ("her-waka-april-2026", "Anabella Bianchi"): {
        "title": "Director Consultant of Elevate Consulting",
        "bio": (
            "Born in Argentina and settled in NZ since 2005, I have worked "
            "in the resourcing industry for nearly 20 years dealing with a "
            "wide range of industries and sectors both within NZ and "
            "internationally. Each role has given me skills, knowledge, "
            "experience and passion to deliver exceptional performance and "
            "an ability to refine and enhance a smarter and better working "
            "environment. In the last nine years, I joined the ICT industry "
            "and I am extremely passionate about helping our customers with "
            "the best resourcing options and their projects' roadmaps to "
            "make them successful."
        ),
    },
    # google-educator-conference-2023 — align Lesieli bio opener.
    ("google-educator-conference-2023", "Lesieli Oliver"): {
        "bio": (
            "Lesieli, a proud Tongan, founder and Chief visionary officer of "
            "Lālanga, is dedicated to championing Māori-Pasifika student "
            "success. Lālanga empowers educators and school leaders with "
            "innovative mentoring programs, products like the Lālanga "
            "ToolBox, and tech solutions. Lesieli recently completed her "
            "Masters Research, focusing on digital solutions to improve the "
            "success of Māori-Pasifika students, addressing issues such as "
            "truancy, wellbeing and academic challenges. Lālanga ToolBox is "
            "currently used by 2,000 primary students in Auckland decile "
            "one schools. She received the University of Auckland 2023 '40 "
            "Under 40' Alumni Inspiring Leaders Award and has launched a "
            "charity to empower Pasifika students and families through "
            "education."
        ),
    },
    # google-educator-conference-2023 — restore the Mehwish title string the
    # old site used ("Introduction to Augment Reality Workshop Lead").
    ("google-educator-conference-2023", "Mehwish Hasan"): {
        "title": "Introduction to Augment Reality Workshop Lead",
    },
    # google-educator-conference-2023 — extend Nils bio with second paragraph.
    ("google-educator-conference-2023", "Nils Reardon"): {
        "bio": (
            "Nils has been the CEO of QuiverVision since 2014, who brings a "
            "wealth of experience with a background in commerce and law. "
            "With an LLB (first class hons.) and a Commerce Degree "
            "(economics major), he honed his skills during six years at "
            "some of New Zealand's leading law firms before embarking on "
            "his journey with QuiverVision. Nils is the driving force "
            "behind the company's success and sets the course for its "
            "strategic direction. He also oversees the domains of finance "
            "and business management, ensuring the organisation operates "
            "at its peak potential."
        ),
    },
    # google-educator-conference-2023 — extend Nischay bio with "pivotal role"
    # + "new interactive EdTech product" wording.
    ("google-educator-conference-2023", "Nischay Gupta"): {
        "bio": (
            "Nischay is an experienced consultant in the tech sector. He "
            "has played a pivotal role in optimising operations & aligning "
            "strategies with QuiverVision's goals & objectives. Nischay led "
            "the launch of a new interactive EdTech product at QuiverVision "
            "to enable engaging learning experience, benefitting over "
            "35,000+ teachers & 100,000+ students worldwide within the "
            "first year of rollout. He holds a Master's degree in "
            "Engineering (1st-class hons.) at the University of Auckland."
        ),
    },
    # google-educator-conference-2024 — Munireh Rouget full bio.
    ("google-educator-conference-2024", "Munireh Rouget"): {
        "title": "Deputy Chair - TENZ Council",
        "bio": (
            "Munireh serves as the Deputy Chair on the TENZ council and is "
            "Poutakawaenga mō te Pūtake Whakawhanaungatanga - Facilitator "
            "for the Whakawhanaungatanga Principle. She earned her Master's "
            "in Computer Sciences from Université Paul Sabatier in France "
            "and began her career as a Software Engineer, crafting "
            "e-commerce websites for major international companies. In "
            "2021 she made the exciting decision to become a teacher, "
            "aiming to enhance diversity and inclusion in Computer Sciences "
            "and Digital Technologies. Now, as the Leader of Learning for "
            "Digital Technology at Fraser High School, she strives to "
            "empower learners."
        ),
    },
    # google-educator-conference-2024 — Claire Wigley full bio (had short one).
    ("google-educator-conference-2024", "Claire Wigley"): {
        "bio": (
            "Claire is a dedicated teacher at Spotswood College in New "
            "Plymouth, focused on teaching 21st-century skills. With a "
            "background in textiles technology, she has expanded her "
            "expertise to encompass various areas of the Technology "
            "Curriculum, ranging from cooking to coding and laser cutting. "
            "As an Inquiry Specialist teacher, Claire integrates Design "
            "Thinking into her lessons and in 2023 took on the role of "
            "council member at TENZ."
        ),
    },
    # she-sharp-candice-murray — extended Candice bio with AWS / Spark / AUT.
    (
        "she-sharp-candice-murray-own-your-energy",
        "Candice Murray",
    ): {
        "bio": (
            "Candice Murray is a Career Mindset Coach and has been "
            "recognised as one of Influence Digest Media's Top Coaches in "
            "Auckland for 2025 and 2024. With a down-to-earth approach and "
            "real-world expertise, Candice blends practical tools with "
            "mindset work to help professionals show up with confidence, "
            "clarity and calm — especially in the moments that matter most. "
            "She has delivered workshops for organisations including AWS, "
            "Spark New Zealand, and AUT University, supporting "
            "professionals to build confidence, clarity and momentum. "
            "Candice speaks regularly at industry events and facilitates "
            "leadership programmes across Aotearoa."
        ),
    },
    # the-truths-to-gaming — Melanie Langlotz secondary title line.
    (
        "the-truths-to-gaming-and-start-up",
        "Melanie Langlotz",
    ): {
        "title": "Interaction and Play Designer | Playwright | Actor",
    },
}


FD_APPENDS: dict[str, list[str]] = {
    # her-waka-april — make sure the scraper's "Navigating pathways into "
    # sustainable employment" heading + long HER WAKA intro paragraph are
    # present in the haystack.
    "her-waka-april-2026": [
        "Navigating pathways into sustainable employment.",
    ],
    # ai-hackathon-festival-2025 — restore the "Become hack-fit" series date
    # wording as a single paragraph so the audit picks it up.
    "ai-hackathon-festival-2025": [
        "Join us for \"Become hack-fit\" — your first step to hackathon "
        "readiness. Mark the dates for the rest of the series: ➡️ 22 July — "
        "Tell the Story with AI; ➡️ 24 July — Design Thinking with AI; "
        "➡️ 29 July — Accessible Futures; ➡️ 31 July — Agentic Frameworks. "
        "Join us in preparing to solve problems that really matter.",
    ],
    # she-sharp-candice-murray — agenda wording variants and venue line.
    "she-sharp-candice-murray-own-your-energy": [
        "Event Flow: 5pm to 5:30pm - Registration & Networking; 5:30pm to "
        "6pm - Welcome & Opening Remarks; 6pm to 7:15pm - Workshop with "
        "Candice; 7:15pm to 7:30pm - Closing and Continued Networking.",
        "You'll learn powerful, easy-to-use tools that help you shift your "
        "energy on demand — so you can perform at your best in moments that "
        "matter, from important conversations to everyday deadlines.",
        "This session is designed to be interactive, supportive and fun, "
        "creating a safe space to reflect, participate and experiment with "
        "new ways of thinking and responding.",
        "📅 Thursday 16 April ⏰ 5:00pm – 7:30pm 📍 Venue: Metlifecare, "
        "Level 4, 110 Carlton Gore Road, Newmarket, Auckland, 1023.",
    ],
}


def main() -> int:
    apply = "--apply" in sys.argv

    scraped = json.loads(SCRAPED_JSON.read_text(encoding="utf-8"))
    custom = json.loads(CUSTOM_JSON.read_text(encoding="utf-8"))

    by_slug_scraped = {e["slug"]: e for e in scraped["events"]}
    by_slug_custom = {e["slug"]: e for e in custom["events"]}

    def find_event(slug):
        return by_slug_custom.get(slug) or by_slug_scraped.get(slug)

    changed = 0

    for (slug, name), fields in SPEAKER_UPDATES.items():
        event = find_event(slug)
        if not event:
            print(f"  [skip] {slug}: not found")
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
        if not found:
            print(f"  [skip] {slug}: speaker {name!r} not found")

    for slug, paras in FD_APPENDS.items():
        event = find_event(slug)
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
        CUSTOM_JSON.write_text(
            json.dumps(custom, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print("Written.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
