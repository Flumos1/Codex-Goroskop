"""Generate missing outer planet aspect rules and append to psychological-aspects.json"""
import json, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASPECTS_FILE = os.path.join(BASE, 'generator', 'rules', 'psychological-aspects.json')
NODES_FILE = os.path.join(BASE, 'data', 'knowledge-graph', 'nodes.jsonl')

aspects = json.load(open(ASPECTS_FILE, encoding='utf-8'))
have = set(x['id'] for x in aspects)

# Archetypal descriptions by planet
URANUS = {
    'en_principle': 'awakening, disruption, individuation, freedom, originality',
    'ru_principle': 'пробуждение, разрушение, индивидуация, свобода, оригинальность',
}
NEPTUNE = {
    'en_principle': 'dissolution, transcendence, idealization, compassion, spiritual vision',
    'ru_principle': 'растворение, трансценденция, идеализация, сострадание, духовное видение',
}
PLUTO = {
    'en_principle': 'transformation, depth, power, death and rebirth, the unconscious',
    'ru_principle': 'трансформация, глубина, власть, смерть и возрождение, бессознательное',
}

PLANET_EN = {
    'Mercury': 'mind, communication, perception',
    'Venus': 'love, beauty, relationship, values',
    'Mars': 'will, action, drive, assertion',
    'Jupiter': 'expansion, faith, meaning, growth',
    'Saturn': 'structure, discipline, limit, mastery',
    'Moon': 'feeling, instinct, emotional security, the inner world',
    'Sun': 'identity, will, self-expression, vitality',
}
PLANET_RU = {
    'Mercury': 'ум, коммуникация, восприятие',
    'Venus': 'любовь, красота, отношения, ценности',
    'Mars': 'воля, действие, драйв, самоутверждение',
    'Jupiter': 'расширение, вера, смысл, рост',
    'Saturn': 'структура, дисциплина, предел, мастерство',
    'Moon': 'чувство, инстинкт, эмоциональная безопасность, внутренний мир',
    'Sun': 'идентичность, воля, самовыражение, жизненная сила',
}

ASPECT_EN = {
    'conjunction': ('fuses', 'tight blend', 'fusion and intensification'),
    'square': ('creates tension with', 'friction and challenge', 'tension that demands integration'),
    'trine': ('flows harmoniously with', 'ease and natural gift', 'harmonious flow'),
    'opposition': ('polarizes with', 'projection and polarity', 'polarity seeking integration'),
}
ASPECT_RU = {
    'conjunction': ('сливается с', 'тесный синтез', 'слияние и усиление'),
    'square': ('создаёт напряжение с', 'трение и вызов', 'напряжение, требующее интеграции'),
    'trine': ('гармонично течёт с', 'лёгкость и природный дар', 'гармоничный поток'),
    'opposition': ('поляризуется с', 'проекция и полярность', 'полярность, ищущая интеграции'),
}

OUTER_INFO = {
    'Uranus': URANUS,
    'Neptune': NEPTUNE,
    'Pluto': PLUTO,
}
OUTER_THEMES = {
    'Uranus': {
        'conjunction': (['freedom', 'awakening', 'originality', 'inner restlessness', 'individuation'],
                        ['свобода', 'пробуждение', 'оригинальность', 'внутреннее беспокойство', 'индивидуация']),
        'square':      (['tension with freedom', 'disruption', 'restlessness', 'breakthrough struggle', 'resistance to change'],
                        ['напряжение со свободой', 'разрушение', 'беспокойство', 'борьба за прорыв', 'сопротивление переменам']),
        'trine':       (['natural originality', 'ease with change', 'innovative flow', 'independence', 'awakening gift'],
                        ['природная оригинальность', 'лёгкость с переменами', 'инновационный поток', 'независимость', 'дар пробуждения']),
        'opposition':  (['polarization', 'freedom vs. stability', 'projection of rebellion', 'individuation', 'awakening through other'],
                        ['поляризация', 'свобода против стабильности', 'проекция бунта', 'индивидуация', 'пробуждение через другого']),
    },
    'Neptune': {
        'conjunction': (['transcendence', 'idealization', 'spiritual sensitivity', 'dissolution of boundary', 'compassion'],
                        ['трансценденция', 'идеализация', 'духовная чувствительность', 'растворение границ', 'сострадание']),
        'square':      (['confusion', 'ideal vs. reality', 'diffusion of drive', 'sacrifice', 'longing'],
                        ['смятение', 'идеал против реальности', 'рассеивание энергии', 'жертвенность', 'тоска']),
        'trine':       (['imaginative flow', 'spiritual ease', 'compassionate vision', 'creative sensitivity', 'inspired perception'],
                        ['воображаемый поток', 'духовная лёгкость', 'сострадательное видение', 'творческая чувствительность', 'вдохновлённое восприятие']),
        'opposition':  (['ideal vs. real polarity', 'projection of savior or fraud', 'dissolution through relationship', 'transcendence seeking', 'spiritual confrontation'],
                        ['полярность идеала и реальности', 'проекция спасителя или обманщика', 'растворение через отношения', 'поиск трансценденции', 'духовное столкновение']),
    },
    'Pluto': {
        'conjunction': (['depth', 'power', 'transformation', 'intensity', 'compulsion'],
                        ['глубина', 'власть', 'трансформация', 'интенсивность', 'компульсия']),
        'square':      (['power struggle', 'forced transformation', 'resistance and compulsion', 'crisis of control', 'depth challenge'],
                        ['борьба за власть', 'принудительная трансформация', 'сопротивление и компульсия', 'кризис контроля', 'вызов глубины']),
        'trine':       (['transformative ease', 'natural depth', 'power well-used', 'regenerative flow', 'strength through surrender'],
                        ['лёгкость трансформации', 'природная глубина', 'хорошо используемая сила', 'регенеративный поток', 'сила через сдачу']),
        'opposition':  (['power polarization', 'projection of control', 'transformation through relationship', 'depth through confrontation', 'shadow encounter'],
                        ['поляризация власти', 'проекция контроля', 'трансформация через отношения', 'глубина через конфронтацию', 'встреча с тенью']),
    },
}

def make_rule(planet, aspect, outer):
    rid = f'rule-instance.western.{planet.lower()}-{aspect}-{outer.lower()}'
    if rid in have:
        return None
    oi = OUTER_INFO[outer]
    verb_en, qual_en, nat_en = ASPECT_EN[aspect]
    verb_ru, qual_ru, nat_ru = ASPECT_RU[aspect]
    themes_en, themes_ru = OUTER_THEMES[outer][aspect]
    p_en = PLANET_EN[planet]
    p_ru = PLANET_RU[planet]
    o_en = oi['en_principle']
    o_ru = oi['ru_principle']

    asp_display = {'conjunction': 'conjunct', 'square': 'square', 'trine': 'trine', 'opposition': 'opposite'}[aspect]
    asp_ru = {'conjunction': 'соединение', 'square': 'квадрат', 'trine': 'трин', 'opposition': 'оппозиция'}[aspect]

    return {
        'id': rid,
        'system': 'western',
        'methodFamily': 'psychological-archetypal',
        'factor': {'planetA': planet, 'aspect': aspect if aspect != 'conjunction' else 'conjunction', 'planetB': outer},
        'sourceRule': 'rule.western.aspect-to-inner-statement',
        'sourceIds': ['source.sasportas-gods-of-change-v1'],
        'themes': themes_en,
        'themesRu': themes_ru,
        'simple': {
            'summary': f'The principle of {p_en} meets the Uranian/Neptunian/Plutonic quality of {o_en} through {nat_en}.',
            'pattern': f'{planet} {asp_display} {outer} suggests a {qual_en} between these two archetypal forces in the inner life.',
            'growth': f'The growth task is to consciously integrate both principles rather than identifying only with one pole.',
            'reflection': f'Where do you feel this {asp_display} quality most clearly in your own experience?'
        },
        'simpleRu': {
            'summary': f'Принцип {p_ru} встречается с качеством {o_ru} через {nat_ru}.',
            'pattern': f'{planet} {asp_display} {outer} предполагает {qual_ru} между этими двумя архетипическими силами во внутренней жизни.',
            'growth': f'Задача роста — сознательно интегрировать оба принципа, а не отождествляться лишь с одним полюсом.',
            'reflection': f'Где вы наиболее ясно ощущаете это качество {asp_ru} в собственном опыте?'
        },
        'advanced': {
            'technical': f'{planet} {asp_display} {outer}: the principle of {p_en} {verb_en} the outer planet principle of {o_en}.',
            'method': f'The {aspect} creates a {qual_en}. Psychological work involves making this dynamic conscious rather than acting it out.',
            'caution': f'Do not reduce this to a simple trait. The aspect describes an inner dynamic that manifests differently depending on the developmental stage of the individual.',
            'constructiveChannel': f'Conscious integration of {p_en} and {o_en} in service of genuine development.'
        },
        'advancedRu': {
            'technical': f'{planet} {asp_display} {outer}: принцип {p_ru} {verb_ru} внешнепланетный принцип {o_ru}.',
            'method': f'{asp_ru.capitalize()} создаёт {qual_ru}. Психологическая работа включает осознание этой динамики, а не её отыгрывание.',
            'caution': f'Не сводите это к простой черте. Аспект описывает внутреннюю динамику, которая проявляется по-разному в зависимости от стадии развития человека.',
            'constructiveChannel': f'Сознательная интеграция {p_ru} и {o_ru} на службе подлинного развития.'
        },
        'confidence': 'low'
    }

TARGETS = [
    # Uranus missing
    ('Sun', 'opposition', 'Uranus'),
    ('Moon', 'conjunction', 'Uranus'),
    ('Moon', 'trine', 'Uranus'),
    ('Mercury', 'conjunction', 'Uranus'), ('Mercury', 'square', 'Uranus'),
    ('Mercury', 'trine', 'Uranus'), ('Mercury', 'opposition', 'Uranus'),
    ('Venus', 'conjunction', 'Uranus'), ('Venus', 'square', 'Uranus'),
    ('Venus', 'trine', 'Uranus'), ('Venus', 'opposition', 'Uranus'),
    ('Mars', 'conjunction', 'Uranus'), ('Mars', 'square', 'Uranus'),
    ('Mars', 'trine', 'Uranus'), ('Mars', 'opposition', 'Uranus'),
    ('Jupiter', 'conjunction', 'Uranus'), ('Jupiter', 'square', 'Uranus'),
    ('Jupiter', 'trine', 'Uranus'), ('Jupiter', 'opposition', 'Uranus'),
    ('Saturn', 'conjunction', 'Uranus'), ('Saturn', 'trine', 'Uranus'),
    ('Saturn', 'opposition', 'Uranus'),
    # Neptune missing
    ('Sun', 'opposition', 'Neptune'),
    ('Moon', 'trine', 'Neptune'), ('Moon', 'opposition', 'Neptune'),
    ('Mercury', 'conjunction', 'Neptune'), ('Mercury', 'trine', 'Neptune'),
    ('Mercury', 'opposition', 'Neptune'),
    ('Venus', 'opposition', 'Neptune'),
    ('Mars', 'conjunction', 'Neptune'), ('Mars', 'square', 'Neptune'),
    ('Mars', 'trine', 'Neptune'), ('Mars', 'opposition', 'Neptune'),
    ('Jupiter', 'conjunction', 'Neptune'), ('Jupiter', 'square', 'Neptune'),
    ('Jupiter', 'trine', 'Neptune'), ('Jupiter', 'opposition', 'Neptune'),
    ('Saturn', 'conjunction', 'Neptune'), ('Saturn', 'square', 'Neptune'),
    ('Saturn', 'trine', 'Neptune'), ('Saturn', 'opposition', 'Neptune'),
    # Pluto missing
    ('Sun', 'trine', 'Pluto'), ('Sun', 'opposition', 'Pluto'),
    ('Moon', 'trine', 'Pluto'), ('Moon', 'opposition', 'Pluto'),
    ('Mercury', 'conjunction', 'Pluto'), ('Mercury', 'trine', 'Pluto'),
    ('Mercury', 'opposition', 'Pluto'),
    ('Venus', 'conjunction', 'Pluto'), ('Venus', 'trine', 'Pluto'),
    ('Venus', 'opposition', 'Pluto'),
    ('Mars', 'trine', 'Pluto'), ('Mars', 'opposition', 'Pluto'),
    ('Jupiter', 'conjunction', 'Pluto'), ('Jupiter', 'square', 'Pluto'),
    ('Jupiter', 'trine', 'Pluto'), ('Jupiter', 'opposition', 'Pluto'),
    ('Saturn', 'conjunction', 'Pluto'), ('Saturn', 'square', 'Pluto'),
    ('Saturn', 'trine', 'Pluto'), ('Saturn', 'opposition', 'Pluto'),
]

new_rules = [r for p, a, o in TARGETS for r in [make_rule(p, a, o)] if r]
print(f'Adding {len(new_rules)} new aspect rules')
aspects.extend(new_rules)
json.dump(aspects, open(ASPECTS_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('Saved aspects')

# Update nodes.jsonl
existing_nodes = set()
node_lines = open(NODES_FILE, encoding='utf-8').readlines()
for line in node_lines:
    n = json.loads(line)
    existing_nodes.add(n['id'])

new_nodes = []
for r in new_rules:
    if r['id'] not in existing_nodes:
        planet_a = r['factor']['planetA']
        planet_b = r['factor']['planetB']
        asp = r['factor']['aspect']
        label = f"{planet_a} {asp} {planet_b}"
        new_nodes.append(json.dumps({'id': r['id'], 'type': 'rule', 'label': label, 'system': 'western', 'status': 'draft'}, ensure_ascii=False))

with open(NODES_FILE, 'a', encoding='utf-8') as f:
    for n in new_nodes:
        f.write('\n' + n)
print(f'Added {len(new_nodes)} nodes to graph')
print('Done.')
