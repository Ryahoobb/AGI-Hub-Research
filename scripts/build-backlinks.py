#!/usr/bin/env python3
"""
AGI HUB backlinks builder.

Scans articles/*.html, extracts inter-article links from <main> (excluding
Prev/Next navigation), and writes edges to backlinks.json as the single
source of truth. Backlinks are derived at runtime by the client from this
edges array.

Output schema:
    {
      "generated_at": "2026-04-22T22:00:00+09:00",
      "edges": [
        {"from": "01-ai-alignment.html", "to": "02-agi-evolution.html"},
        ...
      ]
    }
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = ROOT / "articles"
OUTPUT_PATH = ROOT / "backlinks.json"

ARTICLE_SLUG_RE = re.compile(r"^(\d+)-[a-z0-9-]+\.html$", re.IGNORECASE)
JST = timezone(timedelta(hours=9))


def is_prev_next_link(link_text: str) -> bool:
    """Detect Prev/Next navigation links by symbol + keyword co-occurrence.

    Handles plain forms ("← Prev", "Next →") and title-appended forms
    ("← Prev · No.01 ...", "Next · No.03 → ..."). A body link that happens to
    contain either "Prev" or "Next" alone will not be caught because it lacks
    the ← / → symbol.
    """
    has_prev_arrow = "←" in link_text
    has_next_arrow = "→" in link_text
    return (has_prev_arrow and "Prev" in link_text) or (
        has_next_arrow and "Next" in link_text
    )


def extract_outbound_slugs(html_path: Path, valid_slugs: set[str]) -> set[str]:
    """Return the set of article slugs this article links to (from <main>)."""
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
    main = soup.find("main")
    if main is None:
        return set()

    self_slug = html_path.name
    outbound: set[str] = set()

    for a in main.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith(("http://", "https://", "//", "mailto:", "#", "../", "/")):
            continue
        if "/" in href:
            continue
        if not ARTICLE_SLUG_RE.match(href):
            continue
        if href == self_slug:
            continue

        link_text = a.get_text(strip=True)
        if is_prev_next_link(link_text):
            continue
        classes = a.get("class") or []
        if any(c in {"prev", "next", "nav-arrow"} for c in classes):
            continue

        if href in valid_slugs:
            outbound.add(href)

    return outbound


def build() -> dict:
    if not ARTICLES_DIR.is_dir():
        print(f"error: {ARTICLES_DIR} not found", file=sys.stderr)
        sys.exit(1)

    article_paths = sorted(
        p for p in ARTICLES_DIR.glob("*.html") if ARTICLE_SLUG_RE.match(p.name)
    )
    valid_slugs = {p.name for p in article_paths}

    edges: list[dict[str, str]] = []
    for src_path in article_paths:
        outbound = extract_outbound_slugs(src_path, valid_slugs)
        for dst in sorted(outbound):
            edges.append({"from": src_path.name, "to": dst})

    return {
        "generated_at": datetime.now(JST).isoformat(timespec="seconds"),
        "edges": edges,
    }


def main() -> None:
    data = build()
    OUTPUT_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"wrote {OUTPUT_PATH.relative_to(ROOT)}: "
        f"{len(data['edges'])} edges across "
        f"{len(set(e['from'] for e in data['edges']))} source articles"
    )


if __name__ == "__main__":
    main()
