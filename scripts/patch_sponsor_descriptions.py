"""Extract sponsor company descriptions from cached old-site HTML and patch
`lib/data/json/shesharp_events_v3.json` so each sponsor entry has a `description`
field matching the old-site content.

Heuristics:
  * For every event, look up its cached HTML under scripts/.cache/old-site-html/
    (the file name is the first 16 hex chars of sha1("https://shesharp.org.nz/
    events/<slug>")).
  * Strip header/footer/nav. For every current sponsor (from scraped JSON),
    search the HTML for a <p> whose leading 40 chars start with the sponsor
    name followed by descriptive text; fallback: search for the sponsor name
    inside <p> text, excluding very short paragraphs.
  * Store the full matching paragraph as description, up to 1200 chars.

Run:
    python scripts/patch_sponsor_descriptions.py          # dry-run, shows diff
    python scripts/patch_sponsor_descriptions.py --apply  # writes JSON
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

from bs4 import BeautifulSoup

REPO_ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = REPO_ROOT / "scripts" / ".cache" / "old-site-html"
EVENTS_JSON = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"
OLD_SITE = "https://shesharp.org.nz"


def cache_file_for(slug: str) -> Path:
    url = f"{OLD_SITE}/events/{slug}"
    h = hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]
    return CACHE_DIR / f"{h}.html"


def strip_chrome(soup: BeautifulSoup) -> None:
    for tag in soup.find_all(["header", "footer", "nav"]):
        tag.decompose()
    for el in list(soup.find_all(attrs={"class": True})):
        if not hasattr(el, "get"):
            continue
        try:
            classes = el.get("class") or []
        except Exception:
            continue
        if any(
            c in ("w-condition-invisible", "w-dyn-hide", "w-dyn-empty")
            for c in classes
        ):
            el.decompose()


def normalize_name(name: str) -> str:
    s = unicodedata.normalize("NFKC", name).lower().strip()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s


# Aliases for sponsor names so the matcher can recognize paragraphs that use
# the parent-company or full name while the sponsor entry uses the short form.
SPONSOR_ALIASES: dict[str, list[str]] = {
    "aws": ["amazon web services"],
    "countdown": ["woolworths new zealand", "woolworths"],
    "fp healthcare": ["fisher  paykel healthcare"],
    "fisher  paykel healthcare": ["fisher and paykel healthcare"],
    "hewlett packard enterprise hpe": [
        "hewlett packard enterprise",
        "hpe",
    ],
    "ai forum newzealand": [
        "ai forum nz",
        "ai forum is hosting",
        "ai forum",
    ],
    "aut  google": ["aut", "google"],
    "orion health": ["orion"],
}


# Boilerplate that should never be treated as a sponsor description.
BOILERPLATE_PATTERNS = [
    re.compile(r"^\s*come to our next event", re.I),
    re.compile(r"^\s*brought to you by", re.I),
    re.compile(r"^\s*our event sponsor", re.I),
    re.compile(r"^\s*upcoming event", re.I),
    re.compile(r"^\s*a taste of the event", re.I),
]

# For sponsor names that are very generic (like "AUT" or "Google"), require a
# stricter match — the paragraph must START with the sponsor name, not just
# contain it somewhere.
GENERIC_NAMES = {
    "aut", "google", "myob", "aws", "anz", "bnz", "asb", "westpac",
    "centrality", "microsoft", "ibm", "amazon", "spark", "vodafone",
    "xero", "trademe", "fisher  paykel", "fonterra", "orion health",
    "datacom", "kpmg", "ey", "deloitte", "pushpay", "kiwibank",
    "countdown", "hcltech", "randstad", "potentia", "cisco",
    "air new zealand", "trade me", "academyex", "academy ex",
    "metlifecare", "quivervision", "ieee wie", "ai forum newzealand",
    "ai forum nz", "ai forum", "cares", "centre for automation",
}


def find_sponsor_description(
    html: str, sponsor_name: str
) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    strip_chrome(soup)

    nname = normalize_name(sponsor_name)
    if not nname:
        return None

    # Collect candidate paragraphs (>=60 chars, not boilerplate).
    candidates: list[str] = []
    for p in soup.find_all("p"):
        text = p.get_text(" ", strip=True)
        if not text or len(text) < 60:
            continue
        if any(pat.search(text) for pat in BOILERPLATE_PATTERNS):
            continue
        candidates.append(text)

    # Collect all names we'll try to match: primary name + aliases.
    all_names = [nname]
    all_names.extend(SPONSOR_ALIASES.get(nname, []))
    best: tuple[int, str] | None = None

    # A sponsor/company-description paragraph must start with the sponsor name
    # (or an alias or one of a few preposition-led company openings) within
    # the first ~40 characters. Speaker bios start with a person's first name,
    # event summaries start with "She", "SheSharp", "This event", "We", etc.
    for text in candidates:
        # Reject obvious event-summary / speaker-bio openings.
        if re.match(
            r"^\s*(we had|we have|we are|in this|come along|join us|"
            r"she#|shesharp|she sharp|the event|this event|our first|"
            r"our event|across the|about \d+|the first|the awesome|"
            r"a workshop|a regular|a joint|the google|sheSharp|"
            r"✨|🎉|‌|‍)",
            text,
            re.I,
        ):
            continue

        ntxt = normalize_name(text[:60])
        matched_name = None
        for cand in all_names:
            if not cand:
                continue
            # Paragraph must START with the sponsor name, or start with
            # "at <name>", "since YYYY", "founded <name>", etc. plus the name
            # appearing in the first 60 chars.
            if ntxt.startswith(cand + " ") or ntxt.startswith(cand + ","):
                matched_name = cand
                break
            # Prepositional company openings: "At ANZ our purpose is...",
            # "Since 2006 Amazon Web Services has...", "Founded in 2010...".
            if re.match(r"^(at|since|founded|established)\s", ntxt) and cand in ntxt:
                matched_name = cand
                break
        if not matched_name:
            continue

        # Reject paragraphs containing clear event / speaker markers even if
        # they start with the sponsor name (e.g. "Fonterra is proud to host
        # this She Sharp event tonight").
        if re.search(
            r"\b(host(ed|ing)?|held\b|took place\b|this evening\b|"
            r"tonight\b|the panel\b|the speakers?\b)",
            text,
            re.I,
        ):
            continue
        # Reject paragraphs that read like a person bio (first two words are a
        # capitalized full name followed by "is/has/was").
        first_two = re.match(
            r"^\s*([A-Z][\w'.-]+\s+[A-Z][\w'.-]+)\s+(is|was|has|began|leads|works|"
            r"founded|leading|brings|serves|started|received)\b",
            text,
        )
        if first_two and matched_name not in normalize_name(first_two.group(1)):
            continue

        score = 1000 - abs(len(text) - 350)
        if best is None or score > best[0]:
            best = (score, text)

    if best is None:
        return None

    text = best[1]
    if len(text) > 1200:
        text = text[:1197].rstrip() + "…"
    return text


def main() -> int:
    apply = "--apply" in sys.argv
    slug_filter = [a for a in sys.argv[1:] if not a.startswith("--")]

    data = json.loads(EVENTS_JSON.read_text(encoding="utf-8"))
    events = data.get("events") or []

    patches = []  # (slug, sponsor_name, description)

    for event in events:
        slug = event.get("slug") or ""
        if slug_filter and slug not in slug_filter:
            continue
        cache = cache_file_for(slug)
        if not cache.exists():
            continue
        html = cache.read_text(encoding="utf-8", errors="replace")

        dp = event.get("detailPageData") or {}
        sponsors = dp.get("sponsors") or {}

        for group_key in ("main", "other"):
            group = sponsors.get(group_key) or []
            for sp in group:
                name = sp.get("name") or ""
                if sp.get("description"):
                    continue
                desc = find_sponsor_description(html, name)
                if not desc:
                    continue
                patches.append((slug, group_key, name, desc))
                if apply:
                    sp["description"] = desc

    print(f"Found {len(patches)} sponsor description(s)")
    for slug, group, name, desc in patches:
        print(f"  [{slug}] {group}/{name}: {desc[:100]}{'…' if len(desc) > 100 else ''}")

    if apply and patches:
        EVENTS_JSON.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"\nApplied {len(patches)} patch(es) to {EVENTS_JSON}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
