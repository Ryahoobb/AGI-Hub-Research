#!/usr/bin/env python3
"""
Update prediction-data.json from Metaculus API.

Fetches latest values for:
- Q5121 (Will we have AGI by 2030?) — community probability
- Q3479 (When will the first AGI be created?) — median year + p25/p75

Run weekly via GitHub Actions. Local invocation:
    python3 scripts/update-prediction-data.py
"""

from __future__ import annotations

import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "prediction-data.json"

QUESTIONS = {
    "q5121": {
        "id": 5121,
        "type": "binary",  # community probability for Yes
    },
    "q3479": {
        "id": 3479,
        "type": "date",  # median year + percentiles
    },
}

API_BASE = "https://www.metaculus.com/api/posts/{}/"
USER_AGENT = "AGI-Hub-DataUpdater/1.0 (github.com/Ryahoobb/AGI-hub)"


def fetch(qid: int) -> dict:
    req = urllib.request.Request(API_BASE.format(qid), headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def extract_aggregation(post: dict) -> dict | None:
    """Find the latest community-weighted aggregation."""
    q = post.get("question") or {}
    aggs = q.get("aggregations") or {}
    # Prefer recency_weighted, fall back to unweighted
    for key in ("recency_weighted", "unweighted", "metaculus_prediction"):
        agg = aggs.get(key) or {}
        latest = agg.get("latest")
        if latest:
            return latest
    return None


def update_q5121(post: dict, target: dict) -> None:
    """Binary question: extract probability for Yes."""
    latest = extract_aggregation(post)
    if not latest:
        print("[q5121] no aggregation found, skipping probability update", file=sys.stderr)
    else:
        # binary: centers is [P(Yes)]
        centers = latest.get("centers") or []
        if centers:
            target["probability_pct"] = round(float(centers[0]) * 100)
            print(f"[q5121] probability_pct = {target['probability_pct']}")

    nr = post.get("question", {}).get("nr_forecasters")
    if isinstance(nr, int):
        target["forecasters"] = nr
        print(f"[q5121] forecasters = {nr}")


def update_q3479(post: dict, target: dict) -> None:
    """Date question: extract median (p50) + p25 + p75 as years."""
    q = post.get("question") or {}
    latest = extract_aggregation(post)
    if not latest:
        print("[q3479] no aggregation found, skipping year update", file=sys.stderr)
    else:
        # date: centers may be epoch seconds OR an ISO string depending on API version
        def to_year(val):
            if val is None:
                return None
            if isinstance(val, (int, float)):
                # Epoch seconds (Metaculus uses seconds)
                return datetime.fromtimestamp(float(val), tz=timezone.utc).year
            if isinstance(val, str):
                try:
                    return datetime.fromisoformat(val.replace("Z", "+00:00")).year
                except ValueError:
                    return None
            return None

        centers = latest.get("centers") or []
        lows = latest.get("interval_lower_bounds") or []
        highs = latest.get("interval_upper_bounds") or []
        if centers:
            y = to_year(centers[0])
            if y:
                target["median_year"] = y
                print(f"[q3479] median_year = {y}")
        if lows:
            y = to_year(lows[0])
            if y:
                target["p25_year"] = y
                print(f"[q3479] p25_year = {y}")
        if highs:
            y = to_year(highs[0])
            if y:
                target["p75_year"] = y
                print(f"[q3479] p75_year = {y}")

    nr = q.get("nr_forecasters")
    if isinstance(nr, int):
        target["forecasters"] = nr
        print(f"[q3479] forecasters = {nr}")


def main() -> int:
    if not DATA_PATH.exists():
        print(f"data file not found: {DATA_PATH}", file=sys.stderr)
        return 1

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    before = json.dumps(data, sort_keys=True)

    for key, meta in QUESTIONS.items():
        try:
            post = fetch(meta["id"])
        except Exception as e:
            print(f"[{key}] fetch failed: {e}", file=sys.stderr)
            continue

        target = data.setdefault("metaculus", {}).setdefault(key, {})
        if meta["type"] == "binary":
            update_q5121(post, target)
        elif meta["type"] == "date":
            update_q3479(post, target)

    data["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data["source"] = "auto-updated by GitHub Actions weekly from Metaculus API"

    after = json.dumps(data, sort_keys=True)
    if before == after.replace(data["last_updated"], "").strip() and "auto-updated" in before:
        # No real change, only timestamp would move — skip the write to avoid noise commits.
        # Note: still update last_updated since timestamp changed; comment kept for clarity.
        pass

    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {DATA_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
