"""Generate planet-in-sign placement rules."""
import json, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIGNS_FILE = os.path.join(BASE, 'generator', 'rules', 'psychological-sign-placements.json')
NODES_FILE = os.path.join(BASE, 'data', 'knowledge-graph', 'nodes.jsonl')

existing_nodes = set()
for line in open(NODES_FILE, encoding='utf-8'):
    if line.strip():
        existing_nodes.add(json.loads(line)['id'])

SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
         "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]

SIGN_KEYWORDS = {
    "Aries":       ("initiative, assertion, courage, independence, pioneering energy",
                    "инициатива, самоутверждение, смелость, независимость, первопроходческая энергия"),
    "Taurus":      ("stability, patience, sensory pleasure, material grounding, persistence",
                    "стабильность, терпение, чувственное удовольствие, материальная укоренённость, настойчивость"),
    "Gemini":      ("curiosity, communication, adaptability, mental agility, duality",
                    "любопытство, коммуникация, адаптивность, умственная гибкость, двойственность"),
    "Cancer":      ("emotional sensitivity, nurturing, home, memory, protective instinct",
                    "эмоциональная чувствительность, забота, дом, память, защитный инстинкт"),
    "Leo":         ("self-expression, creativity, generosity, warmth, need for recognition",
                    "самовыражение, творчество, щедрость, теплота, потребность в признании"),
    "Virgo":       ("precision, service, analysis, improvement, attention to detail",
                    "точность, служение, анализ, улучшение, внимание к деталям"),
    "Libra":       ("harmony, fairness, relationship, aesthetic sense, balance",
                    "гармония, справедливость, отношения, эстетическое чувство, равновесие"),
    "Scorpio":     ("depth, intensity, transformation, power, emotional honesty",
                    "глубина, интенсивность, трансформация, власть, эмоциональная честность"),
    "Sagittarius": ("expansion, meaning-seeking, freedom, philosophical vision, adventure",
                    "расширение, поиск смысла, свобода, философское видение, приключение"),
    "Capricorn":   ("ambition, discipline, structure, long-term purpose, mastery",
                    "амбиция, дисциплина, структура, долгосрочная цель, мастерство"),
    "Aquarius":    ("originality, independence, community vision, reform, detachment",
                    "оригинальность, независимость, коллективное видение, реформа, отстранённость"),
    "Pisces":      ("compassion, imagination, spiritual sensitivity, dissolution, transcendence",
                    "сострадание, воображение, духовная чувствительность, растворение, трансценденция"),
}

PLANET_PRINCIPLE = {
    "Sun":     ("identity, will, vitality, and self-expression",
                "идентичность, воля, жизненная сила и самовыражение"),
    "Moon":    ("emotional nature, instinct, security needs, and the inner world",
                "эмоциональная природа, инстинкт, потребность в безопасности и внутренний мир"),
    "Mercury": ("mind, communication, learning, and perception",
                "ум, коммуникация, обучение и восприятие"),
    "Venus":   ("love, beauty, values, and relational life",
                "любовь, красота, ценности и жизнь в отношениях"),
    "Mars":    ("will, drive, desire, and assertive action",
                "воля, драйв, желание и самоутверждающее действие"),
    "Jupiter": ("expansion, faith, meaning-making, and growth",
                "расширение, вера, создание смысла и рост"),
    "Saturn":  ("structure, discipline, limitation, and long-term mastery",
                "структура, дисциплина, ограничение и долгосрочное мастерство"),
    "Uranus":  ("awakening, individuation, and collective innovation",
                "пробуждение, индивидуация и коллективные инновации"),
    "Neptune": ("transcendence, imagination, compassion, and dissolution",
                "трансценденция, воображение, сострадание и растворение"),
    "Pluto":   ("transformation, depth, power, and generational shadow",
                "трансформация, глубина, власть и поколенческая тень"),
}

# Specific theme sets per planet × sign (inner planets — detailed; outer — generational note)
# Format: (themes_en_list, themes_ru_list, summary_en, summary_ru, growth_en, growth_ru)
SPECIFIC = {
("Sun","Aries"):       (["identity","pioneering","assertion","courage","impatience"],
    ["идентичность","первопроходство","самоутверждение","смелость","нетерпеливость"],
    "Identity tends to be direct, assertive, and oriented toward new beginnings.",
    "Идентичность, как правило, прямая, самоутверждающаяся и ориентированная на новые начинания.",
    "The growth task is to channel the pioneering drive into sustained action rather than impulse.",
    "Задача роста — направить первопроходческий порыв в устойчивое действие, а не импульс."),
("Sun","Taurus"):      (["identity","groundedness","patience","sensory pleasure","persistence"],
    ["идентичность","укоренённость","терпение","чувственное удовольствие","настойчивость"],
    "Identity tends toward stability, reliability, and a deep connection to the material and sensory world.",
    "Идентичность тяготеет к стабильности, надёжности и глубокой связи с материальным и чувственным миром.",
    "The growth task is to allow change when stability becomes rigidity.",
    "Задача роста — допускать перемены, когда стабильность становится жёсткостью."),
("Sun","Gemini"):      (["identity","curiosity","versatility","communication","duality"],
    ["идентичность","любопытство","разносторонность","коммуникация","двойственность"],
    "Identity tends to be curious, communicative, and expressed through many facets and roles.",
    "Идентичность, как правило, любопытная, коммуникативная и выражающаяся через множество граней и ролей.",
    "The growth task is to integrate the many threads of self into a coherent inner experience.",
    "Задача роста — интегрировать многочисленные нити самости в целостный внутренний опыт."),
("Sun","Cancer"):      (["identity","emotional depth","protection","home","memory"],
    ["идентичность","эмоциональная глубина","защита","дом","память"],
    "Identity tends to be deeply connected to feeling, family, home, and the emotional past.",
    "Идентичность глубоко связана с чувством, семьёй, домом и эмоциональным прошлым.",
    "The growth task is to move beyond protective shell without losing emotional depth.",
    "Задача роста — выйти за пределы защитного панциря, не теряя эмоциональной глубины."),
("Sun","Leo"):         (["identity","self-expression","creativity","generosity","recognition"],
    ["идентичность","самовыражение","творчество","щедрость","признание"],
    "Identity tends toward self-expression, creative warmth, and a natural desire to shine and be recognized.",
    "Идентичность тяготеет к самовыражению, творческой теплоте и природному желанию сиять и быть признанным.",
    "The growth task is to find authentic expression that does not depend on external validation.",
    "Задача роста — найти подлинное самовыражение, не зависящее от внешнего признания."),
("Sun","Virgo"):       (["identity","service","precision","improvement","discernment"],
    ["идентичность","служение","точность","совершенствование","различение"],
    "Identity tends toward careful discernment, service, and a deep drive toward refinement and usefulness.",
    "Идентичность тяготеет к тщательному различению, служению и глубокому стремлению к утончённости и полезности.",
    "The growth task is to serve without losing the self in relentless self-critique.",
    "Задача роста — служить, не теряя себя в неустанной самокритике."),
("Sun","Libra"):       (["identity","harmony","relationship","fairness","aesthetic sense"],
    ["идентичность","гармония","отношения","справедливость","эстетическое чувство"],
    "Identity tends to be shaped through relationship, the search for harmony, and an innate sense of fairness.",
    "Идентичность формируется через отношения, поиск гармонии и врождённое чувство справедливости.",
    "The growth task is to maintain a clear sense of self within the relational field.",
    "Задача роста — сохранять ясное ощущение себя в пространстве отношений."),
("Sun","Scorpio"):     (["identity","depth","transformation","intensity","power"],
    ["идентичность","глубина","трансформация","интенсивность","власть"],
    "Identity tends toward depth, intensity, and a persistent desire to penetrate beneath the surface.",
    "Идентичность тяготеет к глубине, интенсивности и устойчивому стремлению проникнуть за поверхность.",
    "The growth task is to transform compulsion into conscious depth — to choose depth rather than be driven by it.",
    "Задача роста — преобразовать компульсию в осознанную глубину: выбирать глубину, а не быть ею влекомым."),
("Sun","Sagittarius"): (["identity","meaning","adventure","freedom","philosophical vision"],
    ["идентичность","смысл","приключение","свобода","философское видение"],
    "Identity tends toward expansion, the search for meaning, and a natural orientation toward larger truths.",
    "Идентичность тяготеет к расширению, поиску смысла и природной ориентации на более широкие истины.",
    "The growth task is to root the search for meaning in sustained commitment, not just restless seeking.",
    "Задача роста — укоренить поиск смысла в устойчивой приверженности, а не только в беспокойном искании."),
("Sun","Capricorn"):   (["identity","ambition","discipline","long-term purpose","mastery"],
    ["идентичность","амбиция","дисциплина","долгосрочная цель","мастерство"],
    "Identity tends toward achievement, discipline, and building something that endures over time.",
    "Идентичность тяготеет к достижению, дисциплине и созданию чего-то, что выдерживает испытание временем.",
    "The growth task is to honour the drive for mastery without making achievement the sole measure of worth.",
    "Задача роста — чтить стремление к мастерству, не превращая достижение в единственную меру ценности."),
("Sun","Aquarius"):    (["identity","originality","independence","collective vision","reform"],
    ["идентичность","оригинальность","независимость","коллективное видение","реформа"],
    "Identity tends toward originality, independence, and an orientation toward what lies beyond the individual.",
    "Идентичность тяготеет к оригинальности, независимости и ориентации на то, что выходит за пределы индивида.",
    "The growth task is to remain genuinely human in pursuit of the collective ideal.",
    "Задача роста — оставаться подлинно человечным в погоне за коллективным идеалом."),
("Sun","Pisces"):      (["identity","compassion","imagination","dissolution","spiritual sensitivity"],
    ["идентичность","сострадание","воображение","растворение","духовная чувствительность"],
    "Identity tends toward compassion, spiritual openness, and a deep sensitivity to what lies beyond the ordinary.",
    "Идентичность тяготеет к состраданию, духовной открытости и глубокой чувствительности к тому, что выходит за рамки обыденного.",
    "The growth task is to give this sensitivity a clear channel so it becomes vision rather than confusion.",
    "Задача роста — дать этой чувствительности ясный канал, чтобы она стала видением, а не смятением."),
}

def make_sign_rule(planet, sign):
    rid = f'rule-instance.western.{planet.lower()}-in-{sign.lower()}'
    sk_en, sk_ru = SIGN_KEYWORDS[sign]
    pp_en, pp_ru = PLANET_PRINCIPLE[planet]
    is_outer = planet in ("Uranus","Neptune","Pluto")
    confidence = "low" if is_outer else "medium"

    specific = SPECIFIC.get((planet, sign))
    if specific:
        themes_en, themes_ru, summary_en, summary_ru, growth_en, growth_ru = specific
    else:
        themes_en = [w.strip() for w in sk_en.split(",")][:5]
        themes_ru = [w.strip() for w in sk_ru.split(",")][:5]
        if is_outer:
            summary_en = f"This is a generational placement. The principle of {pp_en} takes on the quality of {sk_en} at the collective level."
            summary_ru = f"Это поколенческое положение. Принцип {pp_ru} приобретает качество {sk_ru} на коллективном уровне."
            growth_en = "The growth task is to embody this generational principle consciously rather than acting it out collectively."
            growth_ru = "Задача роста — воплощать этот поколенческий принцип осознанно, а не отыгрывать его коллективно."
        else:
            summary_en = f"The principle of {pp_en} is expressed through the quality of {sk_en}."
            summary_ru = f"Принцип {pp_ru} выражается через качество {sk_ru}."
            growth_en = f"The growth task is to express {planet}'s principle through the {sign} quality consciously and purposefully."
            growth_ru = f"Задача роста — выражать принцип {planet} через качество {sign} осознанно и целенаправленно."

    return {
        "id": rid,
        "system": "western",
        "methodFamily": "psychological-natal",
        "factor": {"planet": planet, "sign": sign},
        "sourceRules": ["rule.western.sign-quality-layer"],
        "sourceIds": ["source.agafonov-school-urania", "source.semira-vetash-symbolic"],
        "themes": themes_en,
        "themesRu": themes_ru,
        "simple": {
            "summary": summary_en,
            "pattern": f"{planet} in {sign} combines the archetypal principle of {pp_en} with the sign quality of {sk_en}.",
            "growth": growth_en,
            "reflection": f"How does the {sign} quality shape the way {planet}'s principle expresses in your life?",
        },
        "simpleRu": {
            "summary": summary_ru,
            "pattern": f"{planet} в {sign} соединяет архетипический принцип {pp_ru} с качеством знака {sk_ru}.",
            "growth": growth_ru,
            "reflection": f"Как качество {sign} формирует то, как принцип {planet} выражается в вашей жизни?",
        },
        "advanced": {
            "technical": f"{planet} in {sign}: the principle of {pp_en} operates through the modality and element of {sign}, characterized by {sk_en}.",
            "method": "Sign-quality interpretation: the sign acts as the medium or mode through which the planetary archetype expresses.",
            "caution": "The sign describes the style of expression, not the strength or presence of the planet. Avoid reducing this to a simple personality type.",
            "constructiveChannel": f"Constructive integration: {pp_en} fully expressed through the distinctive quality of {sign}.",
        },
        "advancedRu": {
            "technical": f"{planet} в {sign}: принцип {pp_ru} действует через модус и элемент {sign}, характеризуемый {sk_ru}.",
            "method": "Интерпретация по качеству знака: знак выступает как среда или модус, через которые выражается планетарный архетип.",
            "caution": "Знак описывает стиль выражения, а не силу или наличие планеты. Избегайте сведения к простому типу личности.",
            "constructiveChannel": f"Конструктивная интеграция: {pp_ru} в полную силу, выраженный через отличительное качество {sign}.",
        },
        "confidence": confidence,
    }

planets = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"]
rules = [make_sign_rule(p, s) for p in planets for s in SIGNS]
print(f"Generated {len(rules)} sign placement rules")
json.dump(rules, open(SIGNS_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print("Saved", SIGNS_FILE)

# Add nodes
new_nodes = []
for r in rules:
    if r['id'] not in existing_nodes:
        new_nodes.append(json.dumps({
            "id": r['id'], "type": "rule", "label": f"{r['factor']['planet']} in {r['factor']['sign']}",
            "system": "western", "status": "draft"
        }, ensure_ascii=False) + '\n')
with open(NODES_FILE, 'a', encoding='utf-8') as f:
    f.writelines(new_nodes)
print(f"Added {len(new_nodes)} nodes")
print("Done.")
