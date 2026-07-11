"""
Clean OCR artefacts in birthday-period-rules.json (in place).

Fixes, in order:
  1. Hyphenation line-breaks:  "ценно- стью" -> "ценностью"
  2. Embedded page headers/footers bleeding into body text
  3. Trailing zodiac-name page markers  ("— КОЗЕРОГ И ——")
  4. Runs of em-dashes / dangling dashes
  5. A few safe, unambiguous OCR word fixes
  6. Whitespace collapse
  7. Trim a dangling truncated sentence at the end of long fields

Usage: python scripts/clean_birthday_text.py [--dry-run]
Idempotent: running twice yields the same result.
"""
import json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE = os.path.join(BASE, "generator", "rules", "birthday-period-rules.json")
DRY  = "--dry-run" in sys.argv

ZODIAC = ("КОЗЕРОГ|ВОДОЛЕЙ|РЫБЫ|ОВЕН|ТЕЛЕЦ|БЛИЗНЕЦЫ|РАК|ЛЕВ|ДЕВА|ВЕСЫ|СКОРПИОН|СТРЕЛЕЦ")

def clean_ocr(text):
    if not text:
        return text
    s = text
    # 1. Embedded headers/footers (tolerant to OCR variants: ЯЗЫКЕ, АНЯ, ЙНЯ …)
    #    Done first so an orphaned hyphen it leaves behind is joined in step 2.
    s = re.sub(r"ТАЙНЫЙ\s+ЯЗЫ\w*\s+\wНЯ\s+РО[ЖШ]ДЕНИЯ", " ", s, flags=re.I)
    s = re.sub(r"ТАЙНЫЙ\s+язык\s+дн[яе]?\b", " ", s, flags=re.I)
    s = re.sub(r"НАЙДИ\s+СВОЙ\s+ДЕНЬ", " ", s, flags=re.I)
    s = re.sub(r"ОПИСАНИЕ\s+ЗНАКО[В]?\s+ЗОДИАКА", " ", s, flags=re.I)
    # 2. Join hyphenation: letter + hyphen + space(s) + next letter.
    #    First lowercase continuations, then OCR-capitalised mid-word ones.
    s = re.sub(r"([А-Яа-яЁё])[-‐‑]\s+([а-яё])", r"\1\2", s)
    s = re.sub(r"([а-яё])[-‐‑]\s+([А-ЯЁ][а-яё])", r"\1\2", s)
    # 3. Trailing zodiac page markers, e.g. "— КОЗЕРОГ И ——"
    s = re.sub(rf"[—–\-]{{1,2}}\s*(?:{ZODIAC})(?:\s+[ИИ])?\s*[—–\-]*\s*$", "", s, flags=re.I)
    # 4. Dash runs and dangling dashes
    s = re.sub(r"\s*[—–]{2,}\s*", " ", s)
    s = re.sub(r"\s*[—–]\s*$", "", s)
    # 5. Safe OCR word fixes
    s = re.sub(r"\b06 ([а-яё])", r"об \1", s)
    s = re.sub(r"\bзто\b", "это", s)
    # 6. Collapse whitespace
    s = re.sub(r"\s+", " ", s).strip()
    return s

def trim_dangling_sentence(text, min_len=200):
    """Drop a trailing fragment after the last sentence-ending punctuation.
    Only trims when the tail is clearly incomplete and enough text remains."""
    if not text or len(text) < min_len:
        return text
    if text[-1] in ".!?…":
        return text  # already ends cleanly
    matches = list(re.finditer(r"[.!?…]", text))
    if not matches:
        return text
    cut = text[: matches[-1].end()]
    return cut if len(cut) >= min_len else text

# Long free-text fields to clean fully (incl. sentence trim)
LONG_FIELDS = [
    ("simpleRu", "summary"),
    ("simpleRu", "advice"),
    ("simple",   "dayPortrait"),
    ("simple",   "growth"),
]

def main():
    rules = json.load(open(FILE, encoding="utf-8"))
    changed = 0
    samples = []
    for rule in rules:
        touched = False
        for sect, key in LONG_FIELDS:
            block = rule.get(sect)
            if not block or not block.get(key):
                continue
            before = block[key]
            after  = trim_dangling_sentence(clean_ocr(before))
            if after != before:
                block[key] = after
                touched = True
                if len(samples) < 3 and sect == "simpleRu" and key == "summary":
                    samples.append((rule["factor"], before, after))
        if touched:
            changed += 1

    print(f"Записей изменено: {changed} из {len(rules)}")
    for f, b, a in samples:
        print(f"\n--- {f['month']}/{f['day']} ---")
        print("ДО : ..." + b[-160:])
        print("ПОСЛЕ: ..." + a[-160:])

    if DRY:
        print("\n[DRY RUN] Файл не изменён.")
        return
    json.dump(rules, open(FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\nСохранено: {FILE}")

if __name__ == "__main__":
    main()
