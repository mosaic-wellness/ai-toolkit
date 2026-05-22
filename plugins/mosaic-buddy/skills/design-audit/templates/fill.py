#!/usr/bin/env python3
"""Fill spider-chart.html from an audit JSON file.

This keeps the design-audit skill token-light: instead of re-emitting the
whole ~400-line HTML template, the model writes a small JSON file and runs
this script to produce the report HTML.

Usage:
    python3 fill.py <audit-data.json> [output.html]

If no output path is given, writes "_temp-audit.html" in the current dir.

The script derives everything that can be computed — overall score, letter
grade, every score colour, the card meter bars — so the JSON only needs the
raw audit data. See SKILL.md Step 4 for the JSON shape.
"""
import json
import os
import re
import sys

# Score -> colour. Same scale the skill uses everywhere (see SKILL.md).
SCORE_COLORS = [(4.5, "#15803d"), (3.5, "#65a30d"), (2.5, "#ca8a04"),
                (1.5, "#ea580c"), (0, "#dc2626")]
# Overall score -> letter grade band.
GRADE_BANDS = [(4.5, "A"), (4.0, "A−"), (3.5, "B+"), (3.0, "B"),
               (2.5, "C+"), (2.0, "C"), (1.5, "D"), (0, "F")]
# Brand -> primary CTA colour used for the radar fill.
BRAND_COLORS = {"little joys": "#009853",
                "man matters": "#005995",
                "be bodywise": "#005995"}
NEUTRAL_BAR = "#e5e5e5"


def score_color(s):
    for threshold, color in SCORE_COLORS:
        if s >= threshold:
            return color
    return SCORE_COLORS[-1][1]


def grade(s):
    for threshold, letter in GRADE_BANDS:
        if s >= threshold:
            return letter
    return "F"


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 fill.py <audit-data.json> [output.html]")

    data = json.load(open(sys.argv[1], encoding="utf-8"))
    out_path = sys.argv[2] if len(sys.argv) > 2 else "_temp-audit.html"
    template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                 "spider-chart.html")
    template = open(template_path, encoding="utf-8").read()

    domains = data["domains"]            # exactly 8, in canonical order
    if len(domains) != 8:
        sys.exit(f"Expected 8 domains, got {len(domains)}")

    # Overall = weighted average. Weights are percentages that sum to 100.
    overall = round(sum(d["score"] * d["weight"] for d in domains) / 100, 1)
    brand = data["brand_name"]
    brand_color = BRAND_COLORS.get(brand.strip().lower(), "#005995")

    result = template

    # 1. Repeat the finding block once per finding (no cap).
    match = re.search(r"<!-- FINDINGS_START.*?-->(.*?)<!-- FINDINGS_END -->",
                      template, re.S)
    if not match:
        sys.exit("Template is missing the FINDINGS_START/END markers")
    block = match.group(1).strip()
    rendered = []
    for f in data["findings"]:
        priority = f["priority"].upper()              # P1 / P2 / P3
        fb = block
        for key, val in (("FINDING_PILL_CLASS", priority.lower()),
                         ("FINDING_PRIORITY", priority),
                         ("FINDING_TITLE", f["title"]),
                         ("FINDING_DOMAIN", f["domain"]),
                         ("FINDING_ISSUE", f["issue"]),
                         ("FINDING_FIX", f["fix"])):
            fb = fb.replace(key, val)
        rendered.append(fb)
    result = (result[:match.start()] + "\n    ".join(rendered)
              + result[match.end():])

    # 2. Build the placeholder -> value map.
    repl = {
        "SCREEN_NAME": data["screen_name"],
        "BRAND_NAME": brand,
        "AUDIT_DATE": data["audit_date"],
        "OVERALL_SCORE": f"{overall:.1f}",
        "LETTER_GRADE": grade(overall),
        "OVERALL_COLOR": score_color(overall),
        "BRAND_COLOR": brand_color,
    }
    for i, d in enumerate(domains, 1):
        s = d["score"]
        repl[f"DOMAIN_{i}_NAME"] = d["name"]
        repl[f"DOMAIN_{i}_WEIGHT"] = str(d["weight"])
        repl[f"DOMAIN_{i}_SCORE"] = str(s)
        repl[f"DOMAIN_{i}_SUMMARY"] = d["summary"]
        repl[f"DOMAIN_{i}_COLOR"] = score_color(s)
        for bar in range(1, 6):
            repl[f"DOMAIN_{i}_BAR_{bar}"] = (
                score_color(s) if bar <= round(s) else NEUTRAL_BAR)
    for i, strength in enumerate(data["strengths"], 1):
        repl[f"STRENGTH_{i}"] = strength

    # 3. Substitute. Longest keys first so e.g. DOMAIN_1_SCORE is replaced
    #    before any shorter key could touch it.
    for key in sorted(repl, key=len, reverse=True):
        result = result.replace(key, str(repl[key]))

    open(out_path, "w", encoding="utf-8").write(result)
    print(f"Wrote {out_path} — overall {overall:.1f} ({grade(overall)}), "
          f"{len(data['findings'])} findings")


if __name__ == "__main__":
    main()
