"""Refresh models-gdpval.json from Artificial Analysis.

The file is meant to be hand-edited — add a model the day it ships. This is for
the other case: pulling the whole board again when the leaderboard moves.

    python3 tools/refresh-gdpval.py

It only collects models and their two numbers. Working out the dial is the
site's job, and is done in one place: lib/dial.ts.
"""

import datetime
import json
import re
import urllib.request
from pathlib import Path

# Any model page carries the whole comparison set in its payload.
SOURCE = "https://artificialanalysis.ai/models/claude-sonnet-5"
LEADERBOARD = "https://artificialanalysis.ai/evaluations/gdpval-aa"
OUT = Path(__file__).resolve().parent.parent / "models-gdpval.json"

#: Artificial Analysis reports GDPval cost weighted for its Intelligence Index.
#: Times five is the published dollars-per-task; verified against all 18 rows
#: the leaderboard labels, exact to five decimals.
WEIGHTED_TO_TASK = 5

#: our CLI slug and effort -> the leaderboard row it is. Hand-checked. A model
#: with no exact row is left out rather than matched to something near it.
MODELS = [
    ("claude", "claude-opus-5", "max", "Claude Opus 5 (Adaptive Reasoning, Max Effort)"),
    ("claude", "claude-opus-5", "xhigh", "Claude Opus 5 (Adaptive Reasoning, Xhigh Effort)"),
    ("claude", "claude-opus-5", "high", "Claude Opus 5 (Adaptive Reasoning, High Effort)"),
    ("claude", "claude-opus-5", "medium", "Claude Opus 5 (Adaptive Reasoning, Medium Effort)"),
    ("claude", "claude-opus-5", "low", "Claude Opus 5 (Adaptive Reasoning, Low Effort)"),
    ("claude", "claude-sonnet-5", "max", "Claude Sonnet 5 (Adaptive Reasoning, Max Effort)"),
    ("claude", "claude-haiku-4-5-20251001", "", "Claude 4.5 Haiku (Reasoning)"),
    ("openai", "gpt-5.6-sol", "max", "GPT-5.6 Sol (max)"),
    ("openai", "gpt-5.6-sol", "xhigh", "GPT-5.6 Sol (xhigh)"),
    ("openai", "gpt-5.6-sol", "high", "GPT-5.6 Sol (high)"),
    ("openai", "gpt-5.6-sol", "medium", "GPT-5.6 Sol (medium)"),
    ("openai", "gpt-5.6-sol", "low", "GPT-5.6 Sol (low)"),
    ("openai", "gpt-5.6-terra", "max", "GPT-5.6 Terra (max)"),
    ("openai", "gpt-5.6-terra", "xhigh", "GPT-5.6 Terra (xhigh)"),
    ("openai", "gpt-5.6-terra", "high", "GPT-5.6 Terra (high)"),
    ("openai", "gpt-5.6-terra", "medium", "GPT-5.6 Terra (medium)"),
    ("openai", "gpt-5.6-terra", "low", "GPT-5.6 Terra (low)"),
    ("openai", "gpt-5.6-luna", "max", "GPT-5.6 Luna (max)"),
    ("openai", "gpt-5.6-luna", "xhigh", "GPT-5.6 Luna (xhigh)"),
    ("openai", "gpt-5.6-luna", "high", "GPT-5.6 Luna (high)"),
    ("openai", "gpt-5.6-luna", "medium", "GPT-5.6 Luna (medium)"),
    ("openai", "gpt-5.6-luna", "low", "GPT-5.6 Luna (low)"),
    ("openai", "gpt-5.5", "xhigh", "GPT-5.5 (xhigh)"),
    ("openai", "gpt-5.5", "high", "GPT-5.5 (high)"),
    ("openai", "gpt-5.5", "medium", "GPT-5.5 (medium)"),
    ("openai", "gpt-5.5", "low", "GPT-5.5 (low)"),
    ("openai", "gpt-5.4", "xhigh", "GPT-5.4 (xhigh)"),
    ("openai", "gpt-5.4-mini", "xhigh", "GPT-5.4 mini (xhigh)"),
    ("google", "gemini-3.7-flash-high", "", "Gemini 3.7 Flash (high)"),
    ("google", "gemini-3.7-flash-medium", "", "Gemini 3.7 Flash (medium)"),
    ("google", "gemini-3.7-flash-low", "", "Gemini 3.7 Flash (low)"),
    ("google", "gemini-3.6-flash-high", "", "Gemini 3.6 Flash (high)"),
    ("google", "gemini-3.5-flash-high", "", "Gemini 3.5 Flash (high)"),
]


def payload(url: str) -> str:
    """A page's Next.js flight payload, decoded."""
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        html = response.read().decode("utf-8", "replace")
    chunks = re.findall(r'self\.__next_f\.push\(\[1,\s*("(?:[^"\\]|\\.)*")\]\)', html)
    return "".join(json.loads(chunk) for chunk in chunks)


def objects(blob: str, marker: str):
    """Every balanced JSON object in ``blob`` that contains ``marker``."""
    for found in re.finditer(marker, blob):
        depth, start = 0, None
        for i in range(found.start(), -1, -1):
            if blob[i] == "}":
                depth += 1
            elif blob[i] == "{":
                if depth == 0:
                    start = i
                    break
                depth -= 1
        if start is None:
            continue
        depth = 0
        for j in range(start, len(blob)):
            if blob[j] == "{":
                depth += 1
            elif blob[j] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        yield json.loads(blob[start : j + 1])
                    except json.JSONDecodeError:
                        pass
                    break


def cost(record: dict):
    """Dollars per GDPval task, as Artificial Analysis measured it."""
    node = record.get("intelligenceIndexCostPerTask") or {}
    for entry in node.get("evaluations") or []:
        if entry.get("slug") == "gdpval-aa":
            return round(entry["weightedCostPerTask"] * WEIGHTED_TO_TASK, 4)
    return None


if __name__ == "__main__":
    print(f"reading {SOURCE}")
    rows = {r["name"]: r for r in objects(payload(SOURCE), r'"gdpval":\s*-?\d') if "gdpval" in r}
    models, missing = [], []
    for provider, model, effort, name in MODELS:
        row = rows.get(name)
        price = cost(row) if row else None
        if price is None:
            missing.append(name)
            continue
        models.append(
            {
                "provider": provider,
                "model": model,
                "effort": effort,
                "score": round(row["gdpval"], 1),
                "price": price,
            }
        )
    models.sort(key=lambda m: (-m["score"], m["price"]))
    if missing:
        print(f"  no score or cost, skipped: {', '.join(missing)}")

    doc = json.loads(OUT.read_text())
    doc["source"] = dict(
        doc.get("source", {}),
        benchmark="GDPval-AA v2, Artificial Analysis",
        url=LEADERBOARD,
        captured=datetime.date.today().isoformat(),
    )
    doc["models"] = models
    OUT.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {OUT} ({len(models)} models)")
