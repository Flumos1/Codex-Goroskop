"""
Generate transit rules for fast planets: Moon, Mercury, Venus.
Moon: ~28-day cycle, orb 1°.  Mercury: weeks, orb 1°.  Venus: ~1yr, orb 1°.
"""
import json, os

BASE     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_FILE = os.path.join(BASE, 'generator', 'rules', 'psychological-fast-transit-rules.json')
NODES    = os.path.join(BASE, 'data', 'knowledge-graph', 'nodes.jsonl')

existing_nodes = set()
for line in open(NODES, encoding='utf-8'):
    if line.strip():
        existing_nodes.add(json.loads(line)['id'])

# ── Configuration ─────────────────────────────────────────────────────────────
TRANSIT_PLANETS = [
    ("Moon",    "Луна",    "moon",    1.0, "hours",   "несколько часов",
     "the emotional and instinctual mind",
     "эмоциональный и инстинктивный ум",
     "эмоциональный и инстинктивный ум"),
    ("Mercury", "Меркурий","mercury", 1.0, "days",    "1–3 дня",
     "the rational mind, communication, and commerce",
     "рациональный ум, коммуникация и мышление",
     "рациональный ум, коммуникация и мышление"),
    ("Venus",   "Венера",  "venus",   1.0, "days",    "3–7 дней",
     "the capacity for love, beauty, and relating",
     "способность к любви, красоте и отношениям",
     "способность к любви, красоте и отношениям"),
]

NATAL_POINTS = [
    ("Sun",     "Солнца",    "солнца"),
    ("Moon",    "Луны",      "луны"),
    ("Mercury", "Меркурия",  "меркурия"),
    ("Venus",   "Венеры",    "венеры"),
    ("Mars",    "Марса",     "марса"),
    ("Jupiter", "Юпитера",   "юпитера"),
    ("Saturn",  "Сатурна",   "сатурна"),
    ("ASC",     "Асцендента","асцендента"),
]

ASPECTS = [
    ("conjunction", "соединение",  "соединение",  0,   1.0),
    ("sextile",     "секстиль",    "секстиль",    60,  0.5),
    ("square",      "квадрат",     "квадрат",     90,  0.75),
    ("trine",       "трин",        "трин",        120, 0.5),
    ("opposition",  "оппозиция",   "оппозицию",   180, 0.75),
]

# ── Per-combination interpretations ───────────────────────────────────────────
# Key: (transit_planet, aspect, natal_point)
# Value: (summary_en, summary_ru, pattern_ru, growth_ru)
INTERP = {
# ── MOON transits ─────────────────────────────────────────────────────────────
("Moon","conjunction","Sun"):
 ("A moment of emotional alignment with your core identity — you feel most yourself right now.",
  "Момент эмоциональной согласованности с вашей сущностью. Чувства и воля временно указывают в одном направлении.",
  "Краткое окно, когда внутренний мир кажется целостным. Подходит для решений, требующих и чуткости, и решимости.",
  "Используйте эту ясность для действия — она продлится лишь несколько часов."),
("Moon","conjunction","Moon"):
 ("Lunar return energy: heightened sensitivity, intuition, and emotional receptivity.",
  "Лунное соединение — пик эмоциональной восприимчивости и интуиции. Старые чувства могут всплывать на поверхность.",
  "Усиленная чуткость к себе и окружающим. Хорошее время для рефлексии, не для крупных решений.",
  "Доверяйте интуиции — и дайте себе пространство для чувств без немедленной интерпретации."),
("Moon","conjunction","Mercury"):
 ("Feelings and thoughts merge — communication is more emotional and intuitive than usual.",
  "Мысли и чувства сливаются. Разговоры становятся более личными и окрашенными эмоцией.",
  "Подходит для честных разговоров о том, что важно. Следите за тем, чтобы эмоция не захлёстывала ясность.",
  "Говорите из сердца — но оставляйте паузу между чувством и словом."),
("Moon","conjunction","Venus"):
 ("A tender, pleasurable moment — heightened appreciation for beauty, warmth, and connection.",
  "Мягкий, чувственный момент: повышенная восприимчивость к красоте, теплу и близости.",
  "Подходит для встреч, творчества и всего, что требует эстетической чуткости.",
  "Позвольте себе получить удовольствие без вины — это не легкомыслие, а питание."),
("Moon","conjunction","Mars"):
 ("Emotional energy surges into action — drive and feeling are momentarily unified.",
  "Эмоциональная энергия устремляется в действие. Чувства и воля временно слиты — можно действовать быстро.",
  "Хороший момент для начала, но риск реактивности — убедитесь, что действуете из намерения, а не из раздражения.",
  "Действуйте — но сделайте паузу перед словом, которое нельзя взять обратно."),
("Moon","conjunction","Jupiter"):
 ("A buoyant, optimistic feeling — emotional generosity and openness flow easily.",
  "Лёгкое, оптимистичное настроение. Эмоциональная щедрость и открытость приходят без усилий.",
  "Подходит для планирования, обучения, контактов с людьми, которых вы хотите вдохновить.",
  "Используйте подъём для расширения — не откладывайте на потом то, что можно начать сейчас."),
("Moon","conjunction","Saturn"):
 ("A sobering, grounding moment — feelings are quieter, more serious, or restricted.",
  "Момент заземления или ограничения. Чувства приглушены, на поверхность выходит ответственность и серьёзность.",
  "Подходит для структурной работы, завершения дел и обдумывания того, что требует терпения.",
  "Позвольте этой серьёзности помочь, а не давить — иногда лучшее, что можно сделать, — это сделать то, что нужно."),
("Moon","conjunction","ASC"):
 ("Personal emotional peak — you are more visible and emotionally present to others right now.",
  "Личный эмоциональный пик — вы более заметны и присутствуете для других именно сейчас.",
  "Другие воспринимают ваши чувства острее обычного. Момент для подлинного самопредъявления.",
  "Позвольте себе быть увиденным таким, какой вы есть — не только таким, каким должны быть."),
# Moon sextiles (harmonious, mild)
("Moon","sextile","Sun"):
 ("Easy emotional flow — feeling and will work together without friction.",
  "Гармоничный момент: чувства и воля не противоречат друг другу. Лёгкое внутреннее согласие.",
  "Небольшой попутный ветер для любого дела, которое требует и сердца, и решимости.",
  "Используйте эту мягкую поддержку — даже небольшой шаг сейчас даётся легче."),
("Moon","sextile","Moon"):
 ("Gentle emotional support — a quiet sense of inner harmony.",
  "Мягкая внутренняя гармония. Небольшая, но приятная согласованность с собственным ритмом.",
  "Хорошее время для заботы о себе или других.",
  "Сделайте что-то маленькое и приятное — это тоже питает."),
("Moon","sextile","Mercury"):
 ("Clear, empathic thinking — good for conversations that need both logic and feeling.",
  "Ясное, эмпатичное мышление. Голова и сердце работают вместе без напряжения.",
  "Подходит для коммуникации, обучения и письма.",
  "Напишите, что давно хотели сказать — сейчас это придёт легче."),
("Moon","sextile","Venus"):
 ("A pleasant, harmonious moment — small pleasures are available.",
  "Приятный гармоничный момент. Маленькие удовольствия доступны без усилий.",
  "Хорошо подходит для творчества, встреч и всего связанного с красотой.",
  "Позвольте дню быть немного красивее — это законно."),
("Moon","sextile","Mars"):
 ("Emotional energy supports constructive action — good momentum.",
  "Эмоциональная энергия поддерживает конструктивное действие. Небольшой импульс.",
  "Подходит для начала несложных, но нужных дел.",
  "Сделайте то небольшое дело, которое откладывалось — сейчас самое время."),
("Moon","sextile","Jupiter"):
 ("Mild optimism — things feel possible and open.",
  "Мягкий оптимизм. Всё кажется немного более возможным и открытым.",
  "Хорошее время для позитивного разговора или планирования.",
  "Позвольте себе немного помечтать — и запишите, что придёт."),
("Moon","sextile","Saturn"):
 ("Calm, focused — able to handle responsibilities with less resistance than usual.",
  "Спокойная, сосредоточенная энергия. Ответственность переносится чуть легче обычного.",
  "Подходит для методичной работы и завершения незаконченного.",
  "Сделайте один сложный, нужный шаг — сейчас он даётся легче."),
("Moon","sextile","ASC"):
 ("Comfortable self-expression — others receive you well.",
  "Комфортное самопредъявление. Другие воспринимают вас хорошо и без напряжения.",
  "Хорошее время для встреч и публичного общения.",
  "Будьте собой — сейчас это принимается."),
# Moon squares (tension, activation)
("Moon","square","Sun"):
 ("Internal tension between feeling and will — you may feel pulled in two directions.",
  "Внутреннее напряжение между чувством и волей. Возможен конфликт между тем, что хотите, и тем, что чувствуете.",
  "Трудность в принятии решений — ни один вариант не кажется полностью правильным.",
  "Не торопитесь с решением — напряжение рассеется, и картина прояснится."),
("Moon","square","Moon"):
 ("Emotional restlessness — inner needs and outer circumstances are at odds.",
  "Эмоциональное беспокойство. Внутренние потребности и внешние обстоятельства не совпадают.",
  "Трудно найти покой — что-то мешает полностью расслабиться.",
  "Признайте дискомфорт без необходимости немедленно его разрешить."),
("Moon","square","Mercury"):
 ("Emotional static in thinking — feelings cloud clarity or words come out wrong.",
  "Эмоциональный шум в мышлении. Чувства мешают ясности или слова выходят не так, как задумано.",
  "Риск недопонимания или сказать больше, чем нужно.",
  "Отложите важный разговор до завтра, если можете."),
("Moon","square","Venus"):
 ("Relational tension or dissatisfaction — something in connection or pleasure feels off.",
  "Напряжение в отношениях или неудовлетворённость. Что-то в связи или удовольствии не ладится.",
  "Небольшие разочарования могут казаться значительнее, чем они есть.",
  "Не принимайте серьёзных решений в отношениях в этот краткий период."),
("Moon","square","Mars"):
 ("Emotional-physical friction — frustration, irritability, or reactive energy.",
  "Эмоционально-физическое трение. Раздражение, нетерпение или реактивность повышены.",
  "Высокий риск конфликта или слова, о котором пожалеете.",
  "Направьте энергию в физическое действие — спорт, уборка — прежде чем говорить."),
("Moon","square","Jupiter"):
 ("Emotional excess or overestimation — things may feel bigger than they are.",
  "Эмоциональная преувеличенность. Всё кажется немного больше или важнее, чем есть на самом деле.",
  "Риск решений, основанных на преувеличенном оптимизме или тревоге.",
  "Подождите с крупными обещаниями до завтра."),
("Moon","square","Saturn"):
 ("Emotional heaviness or restriction — sadness, duty, or loneliness may surface.",
  "Эмоциональная тяжесть или ограничение. Грусть, долг или одиночество выходят на поверхность.",
  "Трудно найти радость или легкость. Прошлые ограничения могут ощущаться острее.",
  "Это пройдёт — позаботьтесь о себе просто."),
("Moon","square","ASC"):
 ("Self-presentation feels difficult — you may feel misunderstood or less visible than usual.",
  "Самопредъявление даётся с трудом. Возможное ощущение, что вас не так понимают.",
  "Трудно быть «в образе» — внутреннее состояние не совпадает с тем, как вы хотите выглядеть.",
  "Позвольте себе быть не в лучшей форме — это временно."),
# Moon trines (flowing, supportive)
("Moon","trine","Sun"):
 ("Emotional and vital energies flow harmoniously — you feel at ease being yourself.",
  "Эмоциональная и витальная энергия в гармонии. Быть собой легко и естественно.",
  "Внутренняя согласованность делает этот период благоприятным для самовыражения.",
  "Делайте то, что любите — сейчас это подкреплено."),
("Moon","trine","Moon"):
 ("Emotional ease and inner harmony — a natural moment of self-acceptance.",
  "Эмоциональная лёгкость и внутренняя гармония. Естественный момент самопринятия.",
  "Хорошо для всего связанного с заботой, уютом и питанием.",
  "Проведите время с теми, кого любите — или наедине с собой."),
("Moon","trine","Mercury"):
 ("Thinking and feeling work together seamlessly — empathic, clear communication.",
  "Мышление и чувство работают вместе без усилий. Эмпатичная, ясная коммуникация.",
  "Хороший момент для важных разговоров, письма и обучения.",
  "Скажите то, что давно хотели — сейчас это будет услышано."),
("Moon","trine","Venus"):
 ("Love, beauty, and pleasure flow easily — a naturally enjoyable period.",
  "Любовь, красота и удовольствие приходят без усилий. Естественно приятный период.",
  "Подходит для творчества, свиданий и любого опыта красоты.",
  "Позвольте себе наслаждаться — вы заслуживаете этого."),
("Moon","trine","Mars"):
 ("Emotional energy supports decisive, constructive action — good drive.",
  "Эмоциональная энергия поддерживает решительное, конструктивное действие.",
  "Подходит для начинаний, спорта и всего, что требует физической или эмоциональной смелости.",
  "Действуйте на то, что важно — энергия есть."),
("Moon","trine","Jupiter"):
 ("Warm optimism and emotional generosity — others respond well.",
  "Тёплый оптимизм и эмоциональная щедрость. Другие хорошо откликаются.",
  "Хорошо для встреч, обучения, планирования и всего, что требует уверенности.",
  "Поделитесь чем-то хорошим — щедрость сейчас возвращается."),
("Moon","trine","Saturn"):
 ("Emotional steadiness and practical clarity — grounded, productive energy.",
  "Эмоциональная устойчивость и практическая ясность. Заземлённая, продуктивная энергия.",
  "Хорошее время для структурных задач, завершения дел и ответственных решений.",
  "Завершите что-то важное — сейчас терпение и результат идут вместе."),
("Moon","trine","ASC"):
 ("Comfortable, easy self-expression — others see you well.",
  "Комфортное, лёгкое самопредъявление. Другие видят вас хорошо и принимают.",
  "Подходит для публичных встреч, презентаций и установления связей.",
  "Будьте собой — сейчас это работает."),
# Moon oppositions
("Moon","opposition","Sun"):
 ("Peak of the lunar cycle — tension between inner need and outer expression.",
  "Пик лунного цикла: напряжение между внутренней потребностью и внешним выражением.",
  "Момент максимальной интенсивности — чувства и воля тянут в разные стороны.",
  "Используйте напряжение для осознания — что именно внутри требует признания?"),
("Moon","opposition","Moon"):
 ("Full emotional intensity — heightened sensitivity and possible emotional flooding.",
  "Полная эмоциональная интенсивность. Повышенная чуткость, возможное эмоциональное переполнение.",
  "Ощущения могут быть сильнее обычного — позаботьтесь об эмоциональных границах.",
  "Дайте себе пространство для чувств — и ограничьте стимулы, если возможно."),
("Moon","opposition","Mercury"):
 ("Emotional-rational split — hard to think clearly when feelings are strong.",
  "Разрыв между эмоцией и разумом. Сложно думать ясно, когда чувства сильны.",
  "Риск недопонимания или чрезмерно эмоциональной коммуникации.",
  "Запишите, что чувствуете — прежде чем говорить."),
("Moon","opposition","Venus"):
 ("Relational tension surfaces — unmet needs in connection or pleasure.",
  "Напряжение в отношениях выходит на поверхность. Неудовлетворённые потребности в близости или удовольствии.",
  "Что-то в отношениях требует честного разговора — или честного взгляда.",
  "Что вам действительно нужно прямо сейчас от других?"),
("Moon","opposition","Mars"):
 ("Emotional-physical peak — high reactivity, strong drive, possible conflict.",
  "Эмоционально-физический пик. Высокая реактивность, сильное стремление, риск конфликта.",
  "Энергия есть — но направить её продуктивно важнее, чем когда-либо.",
  "Направьте интенсивность в физическое действие или творчество — прежде чем в слова."),
("Moon","opposition","Jupiter"):
 ("Emotional excess or restlessness — the need for more feels acute.",
  "Эмоциональная преувеличенность или беспокойство. Потребность в большем ощущается острее.",
  "Риск переоценки или решений, продиктованных нетерпением.",
  "Подождите с расширением до завтра — оцените то, что уже есть."),
("Moon","opposition","Saturn"):
 ("Emotional weight peaks — feelings of limitation, responsibility, or aloneness.",
  "Эмоциональная тяжесть в пике. Ощущение ограничения, ответственности или одиночества.",
  "Прошлые ограничения могут ощущаться особенно остро.",
  "Это пройдёт — сделайте что-то маленькое и заботливое для себя."),
("Moon","opposition","ASC"):
 ("Others' needs feel pressing — difficulty finding your own ground.",
  "Потребности других кажутся настойчивыми. Трудно найти собственную почву.",
  "Баланс между собой и другими временно нарушен.",
  "Назовите одну вещь, которая нужна вам — и позвольте себе её хотеть."),
}

def make_interp(t_planet, t_ru, t_nature_en, t_nature_ru, t_nature_ru_gen,
                asp, asp_ru, asp_ru_acc, n_point, n_ru_gen, duration_ru):
    key = (t_planet, asp, n_point)
    if key in INTERP:
        s_en, s_ru, p_ru, g_ru = INTERP[key]
    else:
        s_en = f'Transit {t_planet} {asp} natal {n_point}: {t_nature_en} briefly activates this natal focal point.'
        s_ru = f'Транзитный {t_ru} формирует {asp_ru_acc} с натальным {n_ru_gen}: принцип {t_nature_ru_gen} активирует эту область на {duration_ru}.'
        p_ru = f'Период транзита — {duration_ru}. Влияние усиливается вблизи точного соединения.'
        g_ru = f'Используйте этот краткий период для осознанного действия в области {t_nature_ru_gen}.'
    return s_en, s_ru, p_ru, g_ru

rules = []
new_nodes = []

for (t_planet, t_ru, t_slug, orb, dur_en, dur_ru, t_nature_en, t_nature_ru, t_nature_ru_gen) in TRANSIT_PLANETS:
    for (n_point, n_ru_gen, n_ru_gen2) in NATAL_POINTS:
        for (asp, asp_ru, asp_ru_acc, asp_angle, asp_intensity) in ASPECTS:
            rid = f'fast-transit.{t_slug}.{asp}.natal-{n_point.lower()}'
            s_en, s_ru, p_ru, g_ru = make_interp(
                t_planet, t_ru, t_nature_en, t_nature_ru, t_nature_ru_gen,
                asp, asp_ru, asp_ru_acc, n_point, n_ru_gen, dur_ru
            )
            rule = {
                'id': rid,
                'system': 'western',
                'methodFamily': 'psychological-transit-fast',
                'factor': {
                    'transitPlanet': t_planet,
                    'aspect': asp,
                    'natalPoint': n_point,
                    'orbDegrees': orb,
                },
                'timing': {
                    'typicalDuration': dur_en,
                    'typicalDurationRu': dur_ru,
                    'orbDegrees': orb,
                },
                'themes': [t_slug, asp, n_point.lower()],
                'sourceIds': ['source.general-transit-methodology'],
                'simple': {
                    'summary': s_en,
                    'pattern': f'Transit {t_planet} {asp} natal {n_point}: a brief {dur_en} activation.',
                    'growth': f'Use this {dur_en} window consciously.',
                    'reflection': f'How does {t_nature_en} express through your natal {n_point} right now?',
                },
                'simpleRu': {
                    'summary': s_ru,
                    'pattern': p_ru,
                    'growth': g_ru,
                    'reflection': f'Как {t_nature_ru_gen} выражается через ваш натальный {n_ru_gen2} прямо сейчас?',
                },
                'advanced': {
                    'technical': f'{t_planet} {asp} natal {n_point}. Orb: {orb}°. Duration: {dur_en}.',
                    'method': 'Fast-planet transit: transit planet forms aspect to natal point. Due to fast motion, influence is brief but significant near exact.',
                    'caution': f'Fast planet transits ({t_planet}) are brief and often felt as mood shifts rather than major life events.',
                    'constructiveChannel': f'Direct the {t_nature_en} energy consciously during this {dur_en} window.',
                },
                'confidence': 'medium',
            }
            rules.append(rule)
            if rid not in existing_nodes:
                new_nodes.append({'id': rid, 'type': 'rule', 'label': f'{t_ru} {asp_ru} нат. {n_point}', 'system': 'western', 'status': 'draft'})

print(f'Generated {len(rules)} fast transit rules ({len(TRANSIT_PLANETS)} planets × {len(NATAL_POINTS)} natal points × {len(ASPECTS)} aspects)')
json.dump(rules, open(OUT_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('Saved:', OUT_FILE)

with open(NODES, 'a', encoding='utf-8') as f:
    for n in new_nodes:
        f.write(json.dumps(n, ensure_ascii=False) + '\n')
print(f'Added {len(new_nodes)} graph nodes')
