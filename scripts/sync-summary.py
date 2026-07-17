#!/usr/bin/env python3
"""Sync map.html summary table from skeptics-field-guide.html (canonical).

Both pages hardcode the same 38 denial claims. SFG is the source of truth.
Run before commit (or via pre-commit hook) so map.html never drifts.

Returns 0 if no change, 1 if map.html was updated.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SFG = ROOT / 'skeptics-field-guide.html'
MAP = ROOT / 'map.html'

SFG_RE = re.compile(
    r'<tr><td class="sn">(\d+)</td>(?:<td class="sb">.*?</td>)?'
    r'<td class="sq"><a href="#c\d+">([^<]+)</a></td>'
    r'<td class="sf">(.*?)</td><td class="sa">(.*?)</td></tr>',
    re.DOTALL,
)
MAP_RE = re.compile(
    r'(<tr><td class="sn">)(\d+)'
    r'(</td><td class="sq"><a href="skeptics-field-guide\.html#c\d+">)([^<]+)'
    r'(</a></td><td class="sf">)(.*?)'
    r'(</td><td class="sa">)(.*?)(</td></tr>)',
    re.DOTALL,
)


def main() -> int:
    sfg = SFG.read_text()
    sfg_rows = SFG_RE.findall(sfg)
    if len(sfg_rows) != 38:
        print(f'sync-summary: expected 38 rows in SFG, got {len(sfg_rows)}', file=sys.stderr)
        return 2
    canonical = {n: (claim, sf, sa) for n, claim, sf, sa in sfg_rows}

    mp_before = MAP.read_text()
    mp_after = mp_before
    for parts in MAP_RE.findall(mp_before):
        n = parts[1]
        if n not in canonical:
            continue
        claim, sf, sa = canonical[n]
        old = ''.join(parts)
        new = parts[0] + n + parts[2] + claim + parts[4] + sf + parts[6] + sa + parts[8]
        mp_after = mp_after.replace(old, new, 1)

    if mp_after == mp_before:
        return 0
    MAP.write_text(mp_after)
    print('sync-summary: map.html updated from skeptics-field-guide.html')
    return 1


if __name__ == '__main__':
    sys.exit(main())
