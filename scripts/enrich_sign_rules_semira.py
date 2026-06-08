"""
Extract planet-in-sign descriptions from Semira 'Astrology and Mythology'
and update psychological-sign-placements.json with richer texts.
"""
import json, os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIGNS_FILE = os.path.join(BASE, 'generator', 'rules', 'psychological-sign-placements.json')
SEMIRA_FILE = os.path.join(BASE, 'data', 'extracted-text',
    '02-psychological-archetypal',
    'Семира-В-Веташ-Астрология-и-мифология-1998.txt')

rules = json.load(open(SIGNS_FILE, encoding='utf-8'))
text = open(SEMIRA_FILE, encoding='utf-8').read()

SIGN_RU = {
    'Aries': 'Овн', 'Taurus': 'Тельц', 'Gemini': 'Близнец',
    'Cancer': 'Рак', 'Leo': 'Льв', 'Virgo': 'Дев',
    'Libra': 'Весах', 'Scorpio': 'Скорпион', 'Sagittarius': 'Стрельц',
    'Capricorn': 'Козерог', 'Aquarius': 'Водолей', 'Pisces': 'Рыбах',
}
SIGN_RU_PREP = {
    'Aries': 'Овне', 'Taurus': 'Тельце', 'Gemini': 'Близнецах',
    'Cancer': 'Раке', 'Leo': 'Льве', 'Virgo': 'Деве',
    'Libra': 'Весах', 'Scorpio': 'Скорпионе', 'Sagittarius': 'Стрельце',
    'Capricorn': 'Козероге', 'Aquarius': 'Водолее', 'Pisces': 'Рыбах',
}
PLANET_RU_SECTION = {
    'Sun': 'СОЛНЦЕ',
    'Moon': 'ЛУНА',
    'Mercury': 'МЕРКУРИЙ',
    'Venus': 'ВЕНЕРА',
    'Mars': 'МАРС',
    'Jupiter': 'ЮПИТЕР',
    'Saturn': 'САТУРН',
}
PLANET_RU_PREFIX = {
    'Sun': 'Солнце',
    'Moon': 'Луна',
    'Mercury': 'Меркурий',
    'Venus': 'Венера',
    'Mars': 'Марс',
    'Jupiter': 'Юпитер',
    'Saturn': 'Сатурн',
}

def clean_text(t):
    """Remove PDF hyphenation artifacts and normalize whitespace."""
    # Remove soft hyphens and line-break hyphens
    t = re.sub(r'­\n\s*', '', t)
    t = re.sub(r'-\n\s*', '', t)
    # Normalize whitespace
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    # Remove page numbers on their own line
    t = re.sub(r'\n\d{3,4}\n', '\n', t)
    return t.strip()

def extract_planet_in_sign(planet_en, sign_en, body_text):
    """Extract the paragraph about a specific planet in a specific sign."""
    planet_ru = PLANET_RU_PREFIX[planet_en]
    sign_prep = SIGN_RU_PREP[sign_en]

    # Pattern: "Солнце в Овне." or "Солнце в Тельце." etc.
    header = f'{planet_ru}  в  {sign_prep}'
    header2 = f'{planet_ru} в {sign_prep}'

    pos = body_text.find(header)
    if pos < 0:
        pos = body_text.find(header2)
    if pos < 0:
        return None

    # Find the end — next planet-sign header or major section header
    next_patterns = []
    signs_prep = list(SIGN_RU_PREP.values())
    for sp in signs_prep:
        next_patterns.append(f'{planet_ru}  в  {sp}')
        next_patterns.append(f'{planet_ru} в {sp}')
    # Also look for next planet section
    for pr in PLANET_RU_PREFIX.values():
        next_patterns.append(f'\n{pr.upper()}\n')
        next_patterns.append(f'\n{pr}  в  ')
        next_patterns.append(f'\n{pr} в ')

    search_from = pos + len(header)
    end_pos = len(body_text)
    for np in next_patterns:
        np_pos = body_text.find(np, search_from)
        if np_pos > search_from and np_pos < end_pos:
            end_pos = np_pos

    excerpt = body_text[pos:end_pos]
    return clean_text(excerpt)

# Find body text start (after TOC, around char 15000)
body_start = text.find('ПРЕДИСЛОВИЕ')
if body_start < 0:
    body_start = 15000
body = text[body_start:]

# Find the planets-in-signs section (starts around 'СОЛНЦЕ' followed by 'в Овне')
# Search for the section header
planet_section_start = body.find('\nСОЛНЦЕ\n')
if planet_section_start < 0:
    planet_section_start = body.find('СОЛНЦЕ\n(характер')
    if planet_section_start < 0:
        planet_section_start = body.rfind('Солнце  в  Овне')
        if planet_section_start > 0:
            planet_section_start -= 500  # go back a bit

print(f'Planet section starts at body position {planet_section_start} (abs: {body_start + planet_section_start})')
planet_section = body[max(0, planet_section_start):]

# Extract and update
updated = 0
skipped = 0
for planet in ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']:
    for sign in ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                 'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']:
        excerpt = extract_planet_in_sign(planet, sign, planet_section)
        if not excerpt or len(excerpt) < 50:
            skipped += 1
            continue

        rid = f'rule-instance.western.{planet.lower()}-in-{sign.lower()}'
        rule = next((r for r in rules if r['id'] == rid), None)
        if not rule:
            skipped += 1
            continue

        # Use excerpt as enriched advanced.technical and as basis for simpleRu.summary
        # Keep the first 2 sentences as the summary
        sentences = re.split(r'(?<=[.!?])\s+', excerpt.replace('\n', ' '))
        short_summary = ' '.join(sentences[:2]) if len(sentences) >= 2 else excerpt[:300]

        rule['advancedRu']['technical'] = excerpt[:800]  # first 800 chars as technical reference
        rule['advancedRu']['method'] = (
            'Семира и Веташ трактуют знак как мифологическое поле, '
            'а планету — как архетипическую силу, действующую в этом поле. '
            'Интерпретация строится через мифологические образы и архетипические качества знака.'
        )
        rule['sourceIds'] = list(set(rule.get('sourceIds', []) + ['source.semira-vetash-symbolic']))
        rule['confidence'] = 'medium'

        # Enrich simpleRu summary if it was generic
        if 'Принцип' in rule['simpleRu']['summary'] and 'выражается через' in rule['simpleRu']['summary']:
            rule['simpleRu']['summary'] = short_summary[:300]

        updated += 1
        if updated <= 3:
            print(f'\n--- {planet} in {sign} ---')
            print(f'Excerpt (first 300): {excerpt[:300]}')

print(f'\nUpdated: {updated}, Skipped: {skipped}')
json.dump(rules, open(SIGNS_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('Saved.')
