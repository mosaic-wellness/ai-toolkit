#!/usr/bin/env python3
"""
Mosaic Mixpanel Lexicon query tool.

The lexicon JSON (Mosaic_events_mapped.json) lives in the mosaic-meta-repo
at docs/resources/mixpanel/lexicon/. This script answers questions against
it without loading the whole 10MB file into Claude's context.

Usage:
  lexicon-query.py [--lexicon PATH] <command> [args]

Commands:
  list-flows
      Show all flow names with event counts.

  list-events <flow> [--top N] [--brand KEY]
      List event names in a flow, optionally filtered to a brand and
      truncated to the top-N by volume.

  event <event_name>
      Full event metadata (without the properties array).

  event-properties <event_name> [--brand KEY]
      Properties for an event. With --brand, only properties that brand
      emits.

  search <keyword> [--flow F] [--brand KEY]
      Substring search across event_name + description.

  top <N> [--flow F] [--brand KEY]
      Top-N events by volume (org-wide or scoped).

  resolve-event <freeform>
      Heuristic: given a human description like "add to cart" or
      "purchase", return the most likely canonical event names.

Output: JSON to stdout. Errors to stderr with a non-zero exit code.

Path resolution (when --lexicon not given), in order:
  1. $MOSAIC_LEXICON_JSON env var
  2. ../mosaic-meta-repo/docs/resources/mixpanel/lexicon/Mosaic_events_mapped.json
     relative to $CLAUDE_PROJECT_DIR or $PWD
  3. $HOME/Desktop/repositories/mosaic/mosaic-meta-repo/docs/resources/mixpanel/lexicon/Mosaic_events_mapped.json
  4. Search ../*/docs/resources/mixpanel/lexicon/Mosaic_events_mapped.json from CWD
  5. Error with a clear message telling the user to set MOSAIC_LEXICON_JSON.

Brand keys: little_joys | man_matters | absolute_sciences
(These are the lexicon's internal keys, NOT the Mixpanel project IDs or
the Kai brand codes. Mapping:
  little_joys       ↔ Mixpanel project 2707205 ↔ Kai LJ
  man_matters       ↔ Mixpanel project 2764907 ↔ Kai MM
  absolute_sciences ↔ Mixpanel project 3858545 ↔ Kai AS-IN
)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any


# --- path resolution ---


def candidate_paths() -> list[Path]:
    cwd = Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())
    home = Path.home()
    rel = "docs/resources/mixpanel/lexicon/Mosaic_events_mapped.json"
    candidates: list[Path] = []

    env = os.environ.get("MOSAIC_LEXICON_JSON")
    if env:
        candidates.append(Path(env))

    # Sibling meta-repo
    candidates.append(cwd.parent / "mosaic-meta-repo" / rel)
    # Inside current cwd (if we're already in the meta-repo)
    candidates.append(cwd / rel)
    # Known dev box location
    candidates.append(
        home / "Desktop/repositories/mosaic/mosaic-meta-repo" / rel
    )

    # Broaden sibling search: any sibling directory
    if cwd.parent.exists():
        for sib in cwd.parent.iterdir():
            if sib.is_dir() and sib.name != cwd.name:
                p = sib / rel
                if p not in candidates:
                    candidates.append(p)

    return candidates


def resolve_lexicon(explicit: str | None) -> Path:
    if explicit:
        p = Path(explicit).expanduser()
        if not p.exists():
            die(f"Lexicon path does not exist: {p}")
        return p
    for p in candidate_paths():
        if p.exists():
            return p
    die(
        "Could not locate Mosaic_events_mapped.json. Set "
        "$MOSAIC_LEXICON_JSON to its absolute path, or pass "
        "--lexicon PATH. See the mixpanel-mcp SKILL for the "
        "canonical location (mosaic-meta-repo/docs/resources/mixpanel/lexicon/)."
    )


# --- helpers ---


def die(msg: str, code: int = 2) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def load_lexicon(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        die(f"Failed to read lexicon at {path}: {exc}")
        raise  # for type-checker


def brand_volume(event: dict[str, Any], brand: str | None) -> int:
    if brand is None:
        return int(event.get("volume_total") or 0)
    for b in event.get("brands", []) or []:
        if b.get("key") == brand:
            return int(b.get("volume") or 0)
    return 0


def event_in_brand(event: dict[str, Any], brand: str | None) -> bool:
    if brand is None:
        return True
    return any(
        (b or {}).get("key") == brand
        for b in (event.get("brands") or [])
    )


def find_event_by_name(
    lex: dict[str, Any], name: str
) -> tuple[str, dict[str, Any]] | None:
    """Returns (flow_name, event_dict) or None."""
    target = name.strip().lower()
    for flow, events in (lex.get("events_by_flow") or {}).items():
        for e in events:
            if (e.get("event_name") or "").strip().lower() == target:
                return flow, e
    return None


def strip_properties(event: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in event.items() if k != "properties"}


def emit(data: Any) -> None:
    json.dump(data, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")


# --- commands ---


def cmd_list_flows(lex: dict[str, Any], args) -> None:
    flows = lex.get("events_by_flow") or {}
    out = [
        {"flow": name, "event_count": len(events)}
        for name, events in flows.items()
    ]
    emit(out)


def cmd_list_events(lex: dict[str, Any], args) -> None:
    flow = args.flow
    flows = lex.get("events_by_flow") or {}
    if flow not in flows:
        die(
            f"Unknown flow: {flow}. Use `list-flows` to see all flows."
        )
    events = flows[flow]
    if args.brand:
        events = [e for e in events if event_in_brand(e, args.brand)]
    events = sorted(
        events,
        key=lambda e: brand_volume(e, args.brand),
        reverse=True,
    )
    if args.top:
        events = events[: args.top]
    out = [
        {
            "event_name": e.get("event_name"),
            "surface": e.get("surface"),
            "volume": brand_volume(e, args.brand),
            "property_count": e.get("property_count"),
        }
        for e in events
    ]
    emit({"flow": flow, "brand": args.brand, "count": len(out), "events": out})


def cmd_event(lex: dict[str, Any], args) -> None:
    found = find_event_by_name(lex, args.event_name)
    if found is None:
        die(
            f"Event not found: {args.event_name}. Try `search <keyword>` or "
            "`resolve-event <freeform>` to discover the canonical name."
        )
    flow, e = found
    out = strip_properties(e)
    out["flow"] = flow
    emit(out)


def cmd_event_properties(lex: dict[str, Any], args) -> None:
    found = find_event_by_name(lex, args.event_name)
    if found is None:
        die(f"Event not found: {args.event_name}")
    _, e = found
    props = e.get("properties") or []
    if args.brand:
        props = [
            p
            for p in props
            if args.brand in (p.get("brands_seen") or [])
        ]
    emit(
        {
            "event_name": e.get("event_name"),
            "brand": args.brand,
            "property_count": len(props),
            "properties": props,
        }
    )


def cmd_search(lex: dict[str, Any], args) -> None:
    needle = args.keyword.strip().lower()
    flows = lex.get("events_by_flow") or {}
    hits: list[dict[str, Any]] = []
    for flow, events in flows.items():
        if args.flow and flow != args.flow:
            continue
        for e in events:
            name = (e.get("event_name") or "").lower()
            desc = (e.get("description") or "").lower()
            if needle in name or needle in desc:
                if args.brand and not event_in_brand(e, args.brand):
                    continue
                hits.append(
                    {
                        "event_name": e.get("event_name"),
                        "flow": flow,
                        "surface": e.get("surface"),
                        "volume": brand_volume(e, args.brand),
                        "description": e.get("description"),
                    }
                )
    hits.sort(key=lambda h: h["volume"], reverse=True)
    emit({"keyword": args.keyword, "count": len(hits), "matches": hits})


def cmd_top(lex: dict[str, Any], args) -> None:
    flows = lex.get("events_by_flow") or {}
    pool: list[tuple[str, dict[str, Any]]] = []
    for flow, events in flows.items():
        if args.flow and flow != args.flow:
            continue
        for e in events:
            if args.brand and not event_in_brand(e, args.brand):
                continue
            pool.append((flow, e))
    pool.sort(key=lambda fe: brand_volume(fe[1], args.brand), reverse=True)
    pool = pool[: args.n]
    out = [
        {
            "event_name": e.get("event_name"),
            "flow": flow,
            "surface": e.get("surface"),
            "volume": brand_volume(e, args.brand),
        }
        for flow, e in pool
    ]
    emit({"brand": args.brand, "flow": args.flow, "top": args.n, "events": out})


def cmd_resolve_event(lex: dict[str, Any], args) -> None:
    """Heuristic: match freeform user phrase to canonical event names."""
    needle = args.freeform.strip().lower()
    needle_words = {w for w in needle.split() if len(w) > 2}
    flows = lex.get("events_by_flow") or {}
    scored: list[tuple[int, str, dict[str, Any]]] = []
    for flow, events in flows.items():
        for e in events:
            name = (e.get("event_name") or "").lower()
            desc = (e.get("description") or "").lower()
            score = 0
            if needle in name:
                score += 100
            if needle in desc:
                score += 30
            for w in needle_words:
                if w in name:
                    score += 10
                if w in desc:
                    score += 3
            if score > 0:
                scored.append((score, flow, e))
    scored.sort(key=lambda s: (s[0], s[2].get("volume_total") or 0), reverse=True)
    scored = scored[:10]
    emit(
        {
            "freeform": args.freeform,
            "candidates": [
                {
                    "event_name": e.get("event_name"),
                    "flow": flow,
                    "surface": e.get("surface"),
                    "volume_total": e.get("volume_total"),
                    "score": score,
                    "description": e.get("description"),
                }
                for score, flow, e in scored
            ],
        }
    )


# --- entry ---


def main() -> None:
    p = argparse.ArgumentParser(
        prog="lexicon-query.py",
        description="Query the Mosaic Mixpanel lexicon (Mosaic_events_mapped.json).",
    )
    p.add_argument(
        "--lexicon",
        help="Absolute path to Mosaic_events_mapped.json. "
        "Defaults to $MOSAIC_LEXICON_JSON or a sibling mosaic-meta-repo search.",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list-flows", help="List all flows with event counts.")

    le = sub.add_parser("list-events", help="List events in a flow.")
    le.add_argument("flow")
    le.add_argument("--top", type=int, help="Limit to top-N by volume.")
    le.add_argument(
        "--brand",
        choices=["little_joys", "man_matters", "absolute_sciences"],
        help="Filter to a single brand.",
    )

    ev = sub.add_parser("event", help="Full event metadata (no properties).")
    ev.add_argument("event_name")

    ep = sub.add_parser("event-properties", help="List properties for an event.")
    ep.add_argument("event_name")
    ep.add_argument(
        "--brand",
        choices=["little_joys", "man_matters", "absolute_sciences"],
    )

    sr = sub.add_parser("search", help="Substring search across all events.")
    sr.add_argument("keyword")
    sr.add_argument("--flow")
    sr.add_argument(
        "--brand",
        choices=["little_joys", "man_matters", "absolute_sciences"],
    )

    tp = sub.add_parser("top", help="Top-N events by volume.")
    tp.add_argument("n", type=int)
    tp.add_argument("--flow")
    tp.add_argument(
        "--brand",
        choices=["little_joys", "man_matters", "absolute_sciences"],
    )

    rs = sub.add_parser(
        "resolve-event",
        help="Resolve a freeform phrase to candidate canonical event names.",
    )
    rs.add_argument("freeform")

    args = p.parse_args()
    lex_path = resolve_lexicon(args.lexicon)
    lex = load_lexicon(lex_path)

    handlers = {
        "list-flows": cmd_list_flows,
        "list-events": cmd_list_events,
        "event": cmd_event,
        "event-properties": cmd_event_properties,
        "search": cmd_search,
        "top": cmd_top,
        "resolve-event": cmd_resolve_event,
    }
    handlers[args.cmd](lex, args)


if __name__ == "__main__":
    main()
