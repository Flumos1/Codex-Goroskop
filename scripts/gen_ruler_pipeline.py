"""
Generate ruler-of-house-X-in-house-Y rules for the Western cusp-ruler pipeline.
This covers all 12×12 = 144 combinations.
"""
import json, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULER_FILE = os.path.join(BASE, 'generator', 'rules', 'psychological-ruler-pipeline.json')
NODES_FILE = os.path.join(BASE, 'data', 'knowledge-graph', 'nodes.jsonl')

existing_nodes = set()
for line in open(NODES_FILE, encoding='utf-8'):
    if line.strip():
        existing_nodes.add(json.loads(line)['id'])

HOUSE_TOPICS_EN = {
    1: 'self, body, first impression, identity',
    2: 'resources, values, self-worth, material security',
    3: 'communication, siblings, learning, local environment',
    4: 'home, roots, family of origin, private self',
    5: 'creativity, self-expression, children, play, joy',
    6: 'work, health, daily routine, service',
    7: 'relationship, partnership, the other',
    8: 'transformation, shared resources, depth, death and rebirth',
    9: 'meaning, philosophy, higher education, travel, belief',
    10: 'career, reputation, public life, authority',
    11: 'community, friendships, collective ideals, future vision',
    12: 'the unconscious, solitude, retreat, hidden patterns',
}
HOUSE_TOPICS_RU = {
    1: 'самость, тело, первое впечатление, идентичность',
    2: 'ресурсы, ценности, самооценка, материальная безопасность',
    3: 'коммуникация, братья/сёстры, обучение, ближайшее окружение',
    4: 'дом, корни, семья происхождения, приватная самость',
    5: 'творчество, самовыражение, дети, игра, радость',
    6: 'работа, здоровье, повседневный распорядок, служение',
    7: 'отношения, партнёрство, другой',
    8: 'трансформация, общие ресурсы, глубина, смерть и возрождение',
    9: 'смысл, философия, высшее образование, путешествия, убеждения',
    10: 'карьера, репутация, публичная жизнь, авторитет',
    11: 'сообщество, дружба, коллективные идеалы, видение будущего',
    12: 'бессознательное, уединение, отступление, скрытые паттерны',
}

def h(n):
    return {1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',
            7:'7th',8:'8th',9:'9th',10:'10th',11:'11th',12:'12th'}[n]

def make_ruler_rule(from_house, to_house):
    rid = f'rule-instance.western.ruler-of-{from_house}-in-{to_house}'
    t_from_en = HOUSE_TOPICS_EN[int(from_house.replace('st','').replace('nd','').replace('rd','').replace('th',''))]
    t_to_en = HOUSE_TOPICS_EN[int(to_house.replace('st','').replace('nd','').replace('rd','').replace('th',''))]
    t_from_ru = HOUSE_TOPICS_RU[int(from_house.replace('st','').replace('nd','').replace('rd','').replace('th',''))]
    t_to_ru = HOUSE_TOPICS_RU[int(to_house.replace('st','').replace('nd','').replace('rd','').replace('th',''))]
    same_house = from_house == to_house

    if same_house:
        summary_en = f"The ruler of the {from_house} house is in its own house, strengthening and focusing {t_from_en} themes."
        summary_ru = f"Управитель {from_house} дома находится в собственном доме, усиливая и фокусируя темы {t_from_ru}."
        pattern_en = "When a house ruler is in its own house, the life themes of that house tend to be self-contained, strongly emphasized, and directly expressed."
        pattern_ru = "Когда управитель дома находится в собственном доме, жизненные темы этого дома, как правило, самодостаточны, сильно подчёркнуты и выражены напрямую."
        growth_en = f"The growth task is to engage fully with {t_from_en} without turning them into a closed loop."
        growth_ru = f"Задача роста — полностью включиться в {t_from_ru}, не превращая их в замкнутый круг."
    else:
        summary_en = f"The ruler of the {from_house} house is placed in the {to_house} house, connecting the themes of {t_from_en} with {t_to_en}."
        summary_ru = f"Управитель {from_house} дома расположен в {to_house} доме, связывая темы {t_from_ru} с темами {t_to_ru}."
        pattern_en = f"This placement creates a thematic bridge: the life area of {t_from_en} tends to express itself through or find its outlet in {t_to_en}."
        pattern_ru = f"Это положение создаёт тематический мост: жизненная область {t_from_ru} выражает себя через или находит выход в {t_to_ru}."
        growth_en = f"The growth task is to consciously use the link between {t_from_en} and {t_to_en} rather than letting one dominate or undermine the other."
        growth_ru = f"Задача роста — осознанно использовать связь между {t_from_ru} и {t_to_ru}, не позволяя одной стороне доминировать или подрывать другую."

    return {
        "id": rid,
        "system": "western",
        "methodFamily": "psychological-natal",
        "factor": {"rulerOfHouse": from_house, "placedInHouse": to_house},
        "sourceRules": ["rule.western.cusp-ruler-resident-pipeline"],
        "sourceIds": ["source.agafonov-school-urania", "source.levin-school-set"],
        "themes": [w.strip() for w in (t_from_en + ', ' + t_to_en).split(',')][:5],
        "themesRu": [w.strip() for w in (t_from_ru + ', ' + t_to_ru).split(',')][:5],
        "simple": {
            "summary": summary_en,
            "pattern": pattern_en,
            "growth": growth_en,
            "reflection": f"How does your experience of {t_from_en} connect to and flow through {t_to_en}?",
        },
        "simpleRu": {
            "summary": summary_ru,
            "pattern": pattern_ru,
            "growth": growth_ru,
            "reflection": f"Как ваш опыт {t_from_ru} связывается и течёт через {t_to_ru}?",
        },
        "advanced": {
            "technical": f"Ruler of {from_house} house in {to_house} house: the planetary ruler of the {from_house} house (determined by the sign on its cusp) is placed in the {to_house} house.",
            "method": "Cusp-ruler-resident pipeline: identify the sign on the cusp of the source house, find its traditional ruler, and locate that ruler by house position.",
            "caution": "The actual planet involved depends on the birth chart — this rule describes the archetypal tendency. The specific planet and its aspects modify the expression significantly.",
            "constructiveChannel": f"Conscious integration of {t_from_en} through the medium of {t_to_en}, finding purpose and expression across both life areas.",
        },
        "advancedRu": {
            "technical": f"Управитель {from_house} дома в {to_house} доме: планетарный управитель {from_house} дома (определяемый знаком на кюспиде) расположен в {to_house} доме.",
            "method": "Пайплайн управителя: определите знак на кюспиде исходного дома, найдите его традиционного управителя и найдите этого управителя по позиции в доме.",
            "caution": "Конкретная планета зависит от натальной карты — правило описывает архетипическую тенденцию. Конкретная планета и её аспекты существенно модифицируют выражение.",
            "constructiveChannel": f"Сознательная интеграция {t_from_ru} через посредство {t_to_ru}, нахождение цели и выражения в обеих жизненных областях.",
        },
        "confidence": "medium",
    }

houses = [h(n) for n in range(1, 13)]
rules = [make_ruler_rule(fh, th) for fh in houses for th in houses]
print(f'Generated {len(rules)} ruler pipeline rules')
json.dump(rules, open(RULER_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('Saved', RULER_FILE)

new_nodes = []
for r in rules:
    if r['id'] not in existing_nodes:
        fh = r['factor']['rulerOfHouse']
        th = r['factor']['placedInHouse']
        new_nodes.append(json.dumps({
            "id": r['id'], "type": "rule",
            "label": f"Ruler of {fh} house in {th} house",
            "system": "western", "status": "draft"
        }, ensure_ascii=False) + '\n')
with open(NODES_FILE, 'a', encoding='utf-8') as f:
    f.writelines(new_nodes)
print(f'Added {len(new_nodes)} nodes')
print('Done.')
