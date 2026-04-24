"""Extract visible sponsors/partners from an old She Sharp event page HTML dump.

Usage:
    python scripts/extract_sponsors.py <path-to-html>

Prints one line per visible CDN-hosted image with its nearest section heading.
Filters out Webflow template placeholders (w-condition-invisible, w-dyn-hide, w-dyn-empty).
"""
from bs4 import BeautifulSoup
import sys


def is_hidden(el):
    while el is not None:
        if hasattr(el, "get"):
            classes = el.get("class") or []
            if any(c in ("w-condition-invisible", "w-dyn-hide", "w-dyn-empty") for c in classes):
                return True
        el = el.parent
    return False


def main():
    path = sys.argv[1]
    with open(path, encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    seen = set()
    for img in soup.find_all("img"):
        src = img.get("src", "")
        if "website-files.com" not in src:
            continue
        if is_hidden(img):
            continue
        alt = (img.get("alt") or "").strip() or "?"
        key = (alt, src[:80])
        if key in seen:
            continue
        seen.add(key)

        heading = None
        el = img
        for _ in range(20):
            if el.parent is None:
                break
            el = el.parent
            for h in el.find_all(["h1", "h2", "h3", "h4"], recursive=True):
                if not is_hidden(h):
                    heading = h.get_text(strip=True)
                    break
            if heading:
                break
        print(f"{heading or '?'} | {alt} | {src[:120]}")


if __name__ == "__main__":
    main()
