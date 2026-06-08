"""Generate missing house placement rules."""
import json, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOUSES_FILE = os.path.join(BASE, 'generator', 'rules', 'psychological-house-placements.json')
NODES_FILE = os.path.join(BASE, 'data', 'knowledge-graph', 'nodes.jsonl')

houses = json.load(open(HOUSES_FILE, encoding='utf-8'))
have = set(x['id'] for x in houses)

existing_nodes = set()
for line in open(NODES_FILE, encoding='utf-8'):
    if line.strip():
        existing_nodes.add(json.loads(line)['id'])

HOUSE_NUM = {'1st':1,'2nd':2,'3rd':3,'4th':4,'5th':5,'6th':6,
             '7th':7,'8th':8,'9th':9,'10th':10,'11th':11,'12th':12}

HOUSE_TOPICS_EN = {
    1: 'self, body, first impression, identity',
    2: 'resources, values, self-worth, material security',
    3: 'communication, siblings, learning, local environment',
    4: 'home, roots, family of origin, private self',
    5: 'creativity, self-expression, children, play, joy',
    6: 'work, health, daily routine, service',
    7: 'relationship, partnership, the other, projection',
    8: 'transformation, shared resources, depth, death and rebirth',
    9: 'meaning, philosophy, higher education, travel, belief',
    10: 'career, reputation, public life, authority',
    11: 'community, friendships, collective ideals, future vision',
    12: 'the unconscious, solitude, retreat, hidden patterns, transcendence',
}
HOUSE_TOPICS_RU = {
    1: 'самость, тело, первое впечатление, идентичность',
    2: 'ресурсы, ценности, самооценка, материальная безопасность',
    3: 'коммуникация, братья/сёстры, обучение, ближайшее окружение',
    4: 'дом, корни, семья происхождения, приватная самость',
    5: 'творчество, самовыражение, дети, игра, радость',
    6: 'работа, здоровье, повседневный распорядок, служение',
    7: 'отношения, партнёрство, другой, проекция',
    8: 'трансформация, общие ресурсы, глубина, смерть и возрождение',
    9: 'смысл, философия, высшее образование, путешествия, убеждения',
    10: 'карьера, репутация, публичная жизнь, авторитет',
    11: 'сообщество, дружба, коллективные идеалы, видение будущего',
    12: 'бессознательное, уединение, отступление, скрытые паттерны, трансценденция',
}

PLANET_PRINCIPLE_EN = {
    'Sun': 'identity, will, vitality, and self-expression',
    'Moon': 'feeling, instinct, emotional security, and the inner life',
    'Mercury': 'mind, communication, perception, and learning',
    'Venus': 'love, beauty, values, and relationship',
    'Mars': 'will, action, drive, and assertion',
    'Jupiter': 'expansion, faith, meaning, and growth',
    'Pluto': 'transformation, depth, power, and the unconscious',
}
PLANET_PRINCIPLE_RU = {
    'Sun': 'идентичность, воля, жизненная сила и самовыражение',
    'Moon': 'чувство, инстинкт, эмоциональная безопасность и внутренняя жизнь',
    'Mercury': 'ум, коммуникация, восприятие и обучение',
    'Venus': 'любовь, красота, ценности и отношения',
    'Mars': 'воля, действие, драйв и самоутверждение',
    'Jupiter': 'расширение, вера, смысл и рост',
    'Pluto': 'трансформация, глубина, власть и бессознательное',
}

# Special summaries for notable placements
SPECIAL = {
    ('Moon', 12): {
        'simple_summary_en': 'Emotional life may be deeply private, intuitive, or connected to hidden or unconscious layers of feeling.',
        'simple_summary_ru': 'Эмоциональная жизнь может быть глубоко приватной, интуитивной или связанной со скрытыми или бессознательными слоями чувства.',
        'growth_en': 'The growth task is to honour the depth of inner feeling without hiding from it — to bring what is unconscious into compassionate awareness.',
        'growth_ru': 'Задача роста — уважать глубину внутреннего чувства, не скрываясь от него: привносить бессознательное в сострадательное осознание.',
    },
    ('Mars', 9): {
        'simple_summary_en': 'The drive for action may be directed toward meaning, philosophy, travel, or the pursuit of higher truth.',
        'simple_summary_ru': 'Стремление к действию может быть направлено к смыслу, философии, путешествиям или поиску высшей истины.',
        'growth_en': 'The growth task is to channel the Martian drive into genuine quest — moving toward real understanding rather than restless wandering.',
        'growth_ru': 'Задача роста — направить марсианский драйв в подлинный поиск: двигаться к реальному пониманию, а не беспокойному скитанию.',
    },
    ('Pluto', 1): {
        'simple_summary_en': 'There may be a powerful, intense quality to self-presentation — a presence that carries depth, transformation, and sometimes unconscious power dynamics.',
        'simple_summary_ru': 'В самопрезентации может быть мощное, интенсивное качество — присутствие, несущее глубину, трансформацию и иногда бессознательную динамику власти.',
        'growth_en': 'The growth task is to bring the Plutonic intensity into conscious relationship with the self — owning the depth without being driven by compulsion.',
        'growth_ru': 'Задача роста — привести плутоническую интенсивность в сознательные отношения с самим собой: принять глубину, не движимую компульсией.',
    },
    ('Pluto', 8): {
        'simple_summary_en': 'Pluto is in its natural field: transformation, depth, shared power, and the recurring encounter with loss and regeneration.',
        'simple_summary_ru': 'Плутон находится в своём природном поле: трансформация, глубина, общая власть и повторяющаяся встреча с потерей и возрождением.',
        'growth_en': 'The growth task is to meet the 8th house themes — death, merger, power — with conscious awareness rather than compulsion or avoidance.',
        'growth_ru': 'Задача роста — встретить темы 8-го дома — смерть, слияние, власть — с осознанным вниманием, а не компульсией или избеганием.',
    },
}

def h_label(n):
    return {1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',
            7:'7th',8:'8th',9:'9th',10:'10th',11:'11th',12:'12th'}[n]

def make_house_rule(planet, house_str):
    n = HOUSE_NUM[house_str]
    rid = f'rule-instance.western.{planet.lower()}-in-{house_str}-house'
    if rid in have:
        return None
    t_en = HOUSE_TOPICS_EN[n]
    t_ru = HOUSE_TOPICS_RU[n]
    p_en = PLANET_PRINCIPLE_EN[planet]
    p_ru = PLANET_PRINCIPLE_RU[planet]
    sp = SPECIAL.get((planet, n), {})

    summary_en = sp.get('simple_summary_en', f'The principle of {p_en} is active in the field of {t_en}.')
    summary_ru = sp.get('simple_summary_ru', f'Принцип {p_ru} активен в поле {t_ru}.')
    growth_en = sp.get('growth_en', f'The growth task is to bring {planet}\'s energy into the {house_str} house arena consciously and purposefully.')
    growth_ru = sp.get('growth_ru', f'Задача роста — привнести энергию {planet} в арену {house_str} дома осознанно и целенаправленно.')

    return {
        'id': rid,
        'system': 'western',
        'methodFamily': 'psychological-natal',
        'factor': {'planet': planet, 'house': n},
        'sourceRules': ['rule.western.house-topic-layer', 'rule.western.cusp-ruler-resident-pipeline'],
        'sourceIds': ['source.ushkova-zakharova-houses-life-path'],
        'themes': [w.strip() for w in t_en.split(',')][:5],
        'themesRu': [w.strip() for w in t_ru.split(',')][:5],
        'simple': {
            'summary': summary_en,
            'pattern': f'{planet} in the {house_str} house brings its archetypal quality into the life area of {t_en}.',
            'growth': growth_en,
            'reflection': f'How does the energy of {planet} show up in your experience of the {house_str} house themes?'
        },
        'simpleRu': {
            'summary': summary_ru,
            'pattern': f'{planet} в {house_str} доме привносит своё архетипическое качество в жизненную область {t_ru}.',
            'growth': growth_ru,
            'reflection': f'Как энергия {planet} проявляется в вашем опыте тем {house_str} дома?'
        },
        'advanced': {
            'technical': f'{planet} in the {n}th house: the principle of {p_en} operates within the field of {t_en}.',
            'method': 'House-topic interpretation: the planet as archetype shapes how the life area associated with that house is experienced.',
            'caution': 'Do not reduce this to a single outcome or event. It describes an archetypal orientation, not a guaranteed biography.',
            'constructiveChannel': f'The constructive expression is {planet}\'s principle fully alive in the {house_str} house arena: purposeful, integrated, and consciously directed.'
        },
        'advancedRu': {
            'technical': f'{planet} в {n}-м доме: принцип {p_ru} действует в поле {t_ru}.',
            'method': 'Интерпретация по теме дома: планета как архетип формирует переживание жизненной области, связанной с этим домом.',
            'caution': 'Не сводите это к единственному исходу или событию. Это описывает архетипическую ориентацию, а не гарантированную биографию.',
            'constructiveChannel': f'Конструктивное выражение — принцип {planet} в полную силу в арене {house_str} дома: целенаправленный, интегрированный и сознательно направленный.'
        },
        'confidence': 'medium'
    }

TARGETS = [
    # Sun missing
    ('Sun','2nd'),('Sun','3rd'),('Sun','4th'),('Sun','5th'),('Sun','6th'),('Sun','8th'),('Sun','11th'),('Sun','12th'),
    # Moon missing
    ('Moon','12th'),
    # Mercury missing
    ('Mercury','1st'),('Mercury','2nd'),('Mercury','4th'),('Mercury','5th'),('Mercury','7th'),
    ('Mercury','8th'),('Mercury','10th'),('Mercury','11th'),('Mercury','12th'),
    # Venus missing
    ('Venus','3rd'),('Venus','6th'),('Venus','7th'),('Venus','8th'),('Venus','9th'),
    # Mars missing
    ('Mars','9th'),
    # Jupiter missing
    ('Jupiter','4th'),('Jupiter','7th'),('Jupiter','10th'),('Jupiter','12th'),
    # Pluto all missing except 8th (already there)
    ('Pluto','1st'),('Pluto','2nd'),('Pluto','3rd'),('Pluto','4th'),('Pluto','5th'),('Pluto','6th'),
    ('Pluto','7th'),('Pluto','9th'),('Pluto','10th'),('Pluto','11th'),('Pluto','12th'),
]

new_rules = [r for p, h in TARGETS for r in [make_house_rule(p, h)] if r]
print(f'Adding {len(new_rules)} new house placement rules')
houses.extend(new_rules)
json.dump(houses, open(HOUSES_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('Saved house placements')

new_nodes = []
for r in new_rules:
    if r['id'] not in existing_nodes:
        planet = r['factor']['planet']
        house = r['factor']['house']
        label = f"{planet} in {h_label(house)} House"
        new_nodes.append(json.dumps({'id': r['id'], 'type': 'rule', 'label': label, 'system': 'western', 'status': 'draft'}, ensure_ascii=False))

with open(NODES_FILE, 'a', encoding='utf-8') as f:
    for n in new_nodes:
        f.write(n + '\n')
print(f'Added {len(new_nodes)} nodes')
print('Done.')
