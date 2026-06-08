"""Generate transit interpretation rules."""
import json, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRANSIT_FILE = os.path.join(BASE, 'generator', 'rules', 'psychological-transit-rules.json')
NODES_FILE = os.path.join(BASE, 'data', 'knowledge-graph', 'nodes.jsonl')

existing_nodes = set()
for line in open(NODES_FILE, encoding='utf-8'):
    if line.strip():
        existing_nodes.add(json.loads(line)['id'])

# Transit planets with approximate duration and orb
TRANSIT_PLANETS = {
    'Jupiter': {'orb': 2, 'duration_en': 'weeks to a few months', 'duration_ru': 'недели — несколько месяцев'},
    'Saturn':  {'orb': 2, 'duration_en': 'one to three months', 'duration_ru': 'один-три месяца'},
    'Uranus':  {'orb': 2, 'duration_en': 'months to over a year', 'duration_ru': 'месяцы — более года'},
    'Neptune': {'orb': 1, 'duration_en': 'one to two years', 'duration_ru': 'один-два года'},
    'Pluto':   {'orb': 1, 'duration_en': 'one to several years', 'duration_ru': 'один — несколько лет'},
    'Saturn':  {'orb': 2, 'duration_en': 'one to three months', 'duration_ru': 'один-три месяца'},
}
# Re-define cleanly
TRANSIT_PLANETS = {
    'Jupiter': (2,  'weeks to a few months',  'недели — несколько месяцев'),
    'Saturn':  (2,  'one to three months',     'один-три месяца'),
    'Uranus':  (2,  'months to over a year',   'месяцы — более года'),
    'Neptune': (1,  'one to two years',         'один-два года'),
    'Pluto':   (1,  'one to several years',     'один — несколько лет'),
    'Mars':    (1,  'days to one week',         'дни — одна неделя'),
    'Sun':     (1,  'a few days',               'несколько дней'),
}

# Natal points
NATAL_POINTS = {
    # (english_nominative, russian_genitive_for_"oblast' X")
    'Sun':     ('identity, will, vitality', 'идентичности, воли и жизненной силы'),
    'Moon':    ('emotional life, instincts, security', 'эмоциональной жизни, инстинктов и безопасности'),
    'Mercury': ('mind, communication, perception', 'ума, коммуникации и восприятия'),
    'Venus':   ('love, values, relationship', 'любви, ценностей и отношений'),
    'Mars':    ('will, action, assertiveness', 'воли, действия и самоутверждения'),
    'Jupiter': ('expansion, faith, growth', 'расширения, веры и роста'),
    'Saturn':  ('structure, discipline, limitation', 'структуры, дисциплины и ограничения'),
    'ASC':     ('self-presentation, body, first impression', 'самопрезентации, тела и первого впечатления'),
}

TRANSIT_PRINCIPLE = {
    # (english_nominative, russian_genitive_for_"printsip X", russian_nominative_for_themes)
    'Jupiter': ('expansion, opportunity, growth, and faith', 'расширения, возможности, роста и веры', 'расширение, возможность, рост, вера'),
    'Saturn':  ('structure, discipline, limitation, and testing', 'структуры, дисциплины, ограничения и испытания', 'структура, дисциплина, ограничение, испытание'),
    'Uranus':  ('awakening, disruption, liberation, and sudden change', 'пробуждения, разрушения, освобождения и внезапных перемен', 'пробуждение, разрушение, освобождение, перемены'),
    'Neptune': ('dissolution, transcendence, idealization, and spiritual opening', 'растворения, трансценденции, идеализации и духовного открытия', 'растворение, трансценденция, идеализация, духовность'),
    'Pluto':   ('transformation, depth, power, and unavoidable change', 'трансформации, глубины, власти и неизбежных перемен', 'трансформация, глубина, власть, неизбежность'),
    'Mars':    ('activation, urgency, assertion, and challenge', 'активации, срочности, самоутверждения и вызова', 'активация, срочность, самоутверждение, вызов'),
    'Sun':     ('focus, vitality, and conscious attention', 'фокуса, жизненной силы и осознанного внимания', 'фокус, жизненная сила, осознанность'),
}

ASPECT_QUALITY = {
    'conjunction': ('fuses with and intensifies',       'activating and intensifying',       'соединяется с и усиливает',       'активация и интенсификация'),
    'square':      ('creates productive tension with',  'challenging and demanding change',  'создаёт напряжение с',            'вызов и требование перемен'),
    'trine':       ('flows harmoniously into',          'supporting and enabling',           'гармонично поддерживает',         'поддержка и раскрытие возможностей'),
    'opposition':  ('stands in polarity with',          'polarizing and bringing awareness', 'создаёт полярность с',            'поляризация и осознание'),
    'sextile':     ('opens a gentle doorway toward',    'offering opportunity with effort',  'открывает мягкую возможность к',  'возможность при сознательном усилии'),
}

ASPECT_GROWTH = {
    'conjunction': ('integrate the activated energy consciously rather than being overwhelmed by it',
                    'интегрировать активированную энергию осознанно, не будучи захлёстнутым ею'),
    'square':      ('meet the challenge with awareness — the friction is an invitation to grow',
                    'встретить вызов осознанно — трение является приглашением к росту'),
    'trine':       ('use the available ease actively rather than letting the opportunity pass unexplored',
                    'активно использовать доступную лёгкость, не позволяя возможности пройти мимо'),
    'opposition':  ('find the middle ground between the two poles rather than identifying with only one',
                    'найти среднее между двумя полюсами, а не отождествляться лишь с одним'),
    'sextile':     ('take deliberate steps toward the opportunity — sextiles reward conscious effort',
                    'предпринять целенаправленные шаги к возможности — секстили вознаграждают осознанное усилие'),
}

def make_transit_rule(t_planet, aspect, n_point):
    rid = f'transit-rule.western.{t_planet.lower()}-{aspect}-natal-{n_point.lower()}'
    orb, dur_en, dur_ru = TRANSIT_PLANETS[t_planet]
    tp_en, tp_ru_gen, tp_ru_nom = TRANSIT_PRINCIPLE[t_planet]
    np_en, np_ru_gen = NATAL_POINTS[n_point]
    tp_ru = tp_ru_gen  # genitive — used after "принцип"
    np_ru = np_ru_gen  # genitive — used after "область"
    av_en, aq_en, av_ru, aq_ru = ASPECT_QUALITY[aspect]
    growth_en, growth_ru = ASPECT_GROWTH[aspect]
    asp_display = {'conjunction':'conjunct','square':'square','trine':'trine',
                   'opposition':'opposite','sextile':'sextile'}[aspect]
    asp_ru_d = {'conjunction':'соединение','square':'квадрат','trine':'трин',
                'opposition':'оппозицию','sextile':'секстиль'}[aspect]

    return {
        'id': rid,
        'system': 'western',
        'methodFamily': 'psychological-transit',
        'factor': {
            'transitPlanet': t_planet,
            'aspect': aspect,
            'natalPoint': n_point,
            'orbDegrees': orb,
        },
        'timing': {
            'typicalDuration': dur_en,
            'typicalDurationRu': dur_ru,
            'phases': ['building', 'exact', 'separating'],
        },
        'sourceRule': 'rule.western.transit-to-natal-statement',
        'sourceIds': ['source.sasportas-gods-of-change-v1', 'source.agafonov-school-urania'],
        'themes': [t_planet.lower(), n_point.lower(), aspect, 'activation', 'timing'],
        'themesRu': [t_planet, n_point, aspect, 'активация', 'время'],
        'simple': {
            'summary': f'Transiting {t_planet} {asp_display} natal {n_point}: the principle of {tp_en} activates the domain of {np_en}.',
            'pattern': f'This transit is {aq_en}. It typically lasts {dur_en}.',
            'growth': f'The growth task during this transit is to {growth_en}.',
            'reflection': f'What is being activated or challenged in your relationship to {np_en} right now?',
        },
        'simpleRu': {
            'summary': f'Транзитный {t_planet} формирует {asp_ru_d} с натальным {n_point}: принцип {tp_ru} активирует область {np_ru}.',
            'pattern': f'Этот транзит характеризуется {aq_ru}. Он обычно длится {dur_ru}.',
            'growth': f'Задача роста в этот период — {growth_ru}.',
            'reflection': f'Что сейчас активируется или оспаривается в вашем отношении к {np_ru}?',
        },
        'advanced': {
            'technical': f'Transit {t_planet} {asp_display} natal {n_point}: the transiting planet principle ({tp_en}) forms a {aspect} with the natal point ({np_en}).',
            'method': 'Transit-to-natal interpretation: the transiting planet acts as a current activation of the natal point. The natal point describes what is being touched; the transit planet describes the nature of the activation.',
            'timing': f'Orb used: ±{orb}°. Duration: {dur_en}. The transit peaks at exact contact (0° orb) and is most consciously felt as it approaches exactness.',
            'caution': 'Transits describe inner developmental pressure, not external events. The same transit can manifest very differently depending on the individual\'s level of self-awareness and life circumstances.',
            'constructiveChannel': f'Use the energy of {tp_en} as a catalyst for intentional development of {np_en}. The more consciously you engage with this transit, the more its pressure becomes productive.',
        },
        'advancedRu': {
            'technical': f'Транзит {t_planet} {asp_display} натальный {n_point}: принцип транзитной планеты ({tp_ru_nom}) формирует {asp_ru_d} с натальной точкой ({np_ru}).',
            'method': 'Интерпретация транзит-к-натальному: транзитная планета выступает как текущая активация натальной точки. Натальная точка описывает то, что затрагивается; транзитная планета — природу активации.',
            'timing': f'Используемый орб: ±{orb}°. Длительность: {dur_ru}. Транзит достигает пика при точном контакте (0° орб) и наиболее ясно ощущается при приближении к точности.',
            'caution': 'Транзиты описывают внутреннее давление развития, а не внешние события. Один и тот же транзит может проявляться очень по-разному в зависимости от уровня самосознания человека и жизненных обстоятельств.',
            'constructiveChannel': f'Используйте принцип {tp_ru} как катализатор для осознанного развития области {np_ru}. Чем более сознательно вы работаете с этим транзитом, тем продуктивнее становится его давление.',
        },
        'confidence': 'medium',
    }

rules = []
for t_planet in TRANSIT_PLANETS:
    for aspect in ['conjunction', 'square', 'trine', 'opposition', 'sextile']:
        for n_point in NATAL_POINTS:
            rules.append(make_transit_rule(t_planet, aspect, n_point))

print(f'Generated {len(rules)} transit rules')
json.dump(rules, open(TRANSIT_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('Saved', TRANSIT_FILE)

new_nodes = []
for r in rules:
    if r['id'] not in existing_nodes:
        new_nodes.append(json.dumps({
            'id': r['id'], 'type': 'rule',
            'label': f"Transit {r['factor']['transitPlanet']} {r['factor']['aspect']} natal {r['factor']['natalPoint']}",
            'system': 'western', 'status': 'draft'
        }, ensure_ascii=False) + '\n')
with open(NODES_FILE, 'a', encoding='utf-8') as f:
    f.writelines(new_nodes)
print(f'Added {len(new_nodes)} nodes')
print('Done.')
