import json
import sys
from pathlib import Path

path = Path(sys.argv[1] if len(sys.argv) > 1 else "lighthouse-desktop.json")
d = json.loads(path.read_text(encoding="utf-8"))
print(path.name.upper())
for k, v in d["categories"].items():
    score = v.get("score")
    print(f"  {k}: {round(score * 100) if score is not None else 'n/a'}")

failing = []
for aid, a in d["audits"].items():
    if a.get("score") is not None and a["score"] < 1 and a.get("scoreDisplayMode") in (
        "binary",
        "numeric",
        "metricSavings",
    ):
        if a["score"] < 0.9:
            failing.append((aid, a.get("title"), a.get("displayValue"), a["score"]))

print("  notable audits:")
for aid in [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "speed-index",
    "color-contrast",
    "document-title",
    "meta-description",
    "image-alt",
    "link-name",
    "button-name",
    "html-has-lang",
]:
    a = d["audits"].get(aid)
    if a:
        print(f"    {aid}: {a.get('score')} {a.get('displayValue') or ''}")

print("  low-scoring audits (<0.9):")
for aid, title, disp, score in sorted(failing, key=lambda x: x[3])[:15]:
    print(f"    {score:.2f} {aid} — {title} {disp or ''}")
