"""Audit every event on the new She Sharp site for bullet list content that
the scraper may have dropped.

For each event:
  1. Fetch its live old-site page from shesharp.org.nz (with on-disk cache).
  2. Extract every <li> element whose text is not inside a Webflow template
     placeholder (w-condition-invisible, w-dyn-hide, w-dyn-empty) and is not
     part of the shared site chrome (header nav, footer).
  3. Compare each <li> text to the current new-site JSON (fullDescription,
     specialSections content, speakers bios, organizer bios).
  4. If an <li> text is present on the old site but NOT in the new-site data,
     flag it.

The script only uses a conservative similarity match (fuzzy substring) so it
catches both exact and slightly-reworded copies.

Usage:
    python scripts/audit_bullet_lists.py            # audit all events
    python scripts/audit_bullet_lists.py <slug>...  # audit specific slugs
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

import urllib.request
from bs4 import BeautifulSoup

REPO_ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = REPO_ROOT / "scripts" / ".cache" / "old-site-html"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

OLD_SITE = "https://shesharp.org.nz"

# Header and footer nav items we always see — ignore <li> that contain only
# these labels.
NAV_CHROME = {
    "about", "events", "mentorship", "get involved", "resources", "contact",
    "join membership", "programmes", "her waka", "about the programme",
    "become a mentee", "become a mentor", "all events", "volunteer with us",
    "corporate partnership", "corporate patnership", "donate",
    "media", "podcasts", "newsletters", "in the press", "photo gallery",
    "impact report", "sign in", "learn more", "home", "privacy policy",
    "terms of service", "cookie policy", "accessibility",
    "our history", "our people", "our journey", "our people",
    "meet our mentors", "meet our mentees",
    "log in", "create account",
}

# Boilerplate text that appears on many events because of the Webflow
# template — treat as chrome, not missing content.
BOILERPLATE_FRAGMENTS = [
    "secure code warrior",
    "tips for team formation",
    "credit in ai services",
    "engraved trophy",
    "one (1) confirmed internship",
    "two (2) ai summit tickets",
    "four (4) $250 prezzy",
    "eight (8) $150 prezzy",
    "five (5) $100 prezzy",
    "free tickets to all the remaining",
    "free tickets to all remaining",
    "rules of engagement for the hackathon",
    "ideas and inspiration for your solutions",
    "problems to solve across our",
    "available datasets and technology resources",
    "register here for this workshop",
    "session creates a safe place to play",
]


def slugify_for_cache(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]


def fetch(url: str, ttl_seconds: int = 86_400) -> str | None:
    path = CACHE_DIR / f"{slugify_for_cache(url)}.html"
    if path.exists() and time.time() - path.stat().st_mtime < ttl_seconds:
        return path.read_text(encoding="utf-8", errors="replace")
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (SheSharp-bullet-list-audit/1.0; "
                    "+https://she-sharp.nz)"
                )
            },
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        path.write_text(html, encoding="utf-8")
        return html
    except Exception as exc:
        print(f"  fetch failed: {exc}", file=sys.stderr)
        return None


def is_hidden(el) -> bool:
    while el is not None:
        if hasattr(el, "get"):
            classes = el.get("class") or []
            if any(
                c in ("w-condition-invisible", "w-dyn-hide", "w-dyn-empty")
                for c in classes
            ):
                return True
            style = (el.get("style") or "").lower().replace(" ", "")
            if "display:none" in style:
                return True
        el = el.parent
    return False


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    text = re.sub(r"[^a-z0-9 ]", "", text)
    return text


def extract_visible_list_items(html: str) -> list[dict]:
    """Return a list of {heading, text} for every <li> that is visible and
    not part of site chrome or Webflow boilerplate."""
    soup = BeautifulSoup(html, "html.parser")

    # Strip <header> and <footer> entirely.
    for tag in soup.find_all(["header", "footer", "nav"]):
        tag.decompose()

    items = []
    for li in soup.find_all("li"):
        if is_hidden(li):
            continue
        text = li.get_text(" ", strip=True)
        if not text:
            continue
        norm = normalize(text)
        if not norm or norm in NAV_CHROME:
            continue
        # Skip very short (single-word) list items — these are usually tags or
        # breadcrumb fragments.
        if len(text.split()) < 3:
            continue
        if any(frag in norm for frag in BOILERPLATE_FRAGMENTS):
            continue

        # Find the nearest visible heading above this li for context.
        heading = None
        node = li
        for _ in range(25):
            node = node.find_previous(["h1", "h2", "h3", "h4"])
            if node is None:
                break
            if not is_hidden(node):
                heading = node.get_text(" ", strip=True)
                break
        items.append({"heading": heading, "text": text})
    return items


def collect_event_text(event: dict) -> str:
    """Concatenate every text field of the new-site event entry into a
    normalized (lowercase, punctuation-stripped) haystack for substring
    comparison against <li> text (which is normalized the same way)."""
    pieces: list[str] = []
    dp = event.get("detailPageData") or {}
    pieces.extend(dp.get("fullDescription") or [])
    pieces.append(event.get("title") or "")
    pieces.append(event.get("shortDescription") or "")
    for section in dp.get("specialSections") or []:
        pieces.append(section.get("title") or "")
        pieces.extend(section.get("content") or [])
    for key in ("keynote_speakers", "panel_speakers", "guest_speakers",
                "panel_facilitators", "hosts", "mentors", "panelists",
                "workshop_facilitators", "readiness_workshop_facilitators"):
        group = (dp.get("speakers") or {}).get(key)
        if not group:
            continue
        pieces.append(group.get("heading") or "")
        for sp in group.get("speakers") or []:
            for fld in ("name", "title", "company", "bio"):
                pieces.append(sp.get(fld) or "")
    for o in dp.get("organizers") or []:
        for fld in ("name", "title", "company", "bio"):
            pieces.append(o.get(fld) or "")
    # Normalize the haystack the same way we normalize <li> text so that
    # punctuation differences (e.g. "People:" vs "people") don't hide a match.
    return normalize(" ".join(pieces))


def covered_by(new_text_haystack_norm: str, li_text: str) -> bool:
    """Is the li text already present in the new event data?

    Uses a conservative substring match: we check whether the normalized li
    text (or at least a substantial ~60-char chunk of it) appears in the
    haystack. Short li texts must match in full.
    """
    li_norm = normalize(li_text)
    if not li_norm:
        return True
    if li_norm in new_text_haystack_norm:
        return True
    # Fall back to checking the first 60 chars — tolerates minor paraphrasing.
    needle = li_norm[:60]
    if len(needle) >= 40 and needle in new_text_haystack_norm:
        return True
    return False


def audit_events(target_slugs: list[str] | None = None) -> int:
    scraped_path = REPO_ROOT / "lib/data/json/shesharp_events_v3.json"
    custom_path = REPO_ROOT / "lib/data/json/events-custom.json"
    scraped = json.loads(scraped_path.read_text(encoding="utf-8")).get("events") or []
    custom = json.loads(custom_path.read_text(encoding="utf-8")).get("events") or []
    by_slug = {e["slug"]: e for e in scraped}
    for e in custom:
        by_slug[e["slug"]] = e  # custom wins

    if target_slugs:
        slugs = [s for s in target_slugs if s in by_slug]
        missing = [s for s in target_slugs if s not in by_slug]
        if missing:
            print(f"! unknown slug(s): {missing}")
    else:
        slugs = sorted(by_slug.keys())

    total_missing = 0
    events_with_gaps = 0
    for slug in slugs:
        event = by_slug[slug]
        # Skip pure-custom 2026 events that never existed on the old site.
        event_url = urljoin(OLD_SITE + "/", f"events/{slug}")

        html = fetch(event_url)
        if not html or "404" in (html[:500] if html else "") or "page-404" in (
            html[:2000] if html else ""
        ):
            continue
        items = extract_visible_list_items(html)
        if not items:
            continue
        haystack = collect_event_text(event)

        missing = [it for it in items if not covered_by(haystack, it["text"])]
        if not missing:
            continue
        events_with_gaps += 1
        total_missing += len(missing)
        print(f"\n=== {slug} — {len(missing)} missing bullet(s) ===")
        for it in missing[:15]:
            head = it["heading"] or "?"
            print(f"  [{head}] {it['text'][:180]}")
        if len(missing) > 15:
            print(f"  ... and {len(missing) - 15} more")

    print(
        f"\nSummary: {events_with_gaps} event(s) with suspected missing bullet "
        f"content | {total_missing} item(s) total"
    )
    return events_with_gaps


if __name__ == "__main__":
    args = sys.argv[1:]
    sys.exit(0 if audit_events(args) == 0 else 1)
