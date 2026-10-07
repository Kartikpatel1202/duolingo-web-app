"""Seed content: Spanish for English speakers — Section 1, Units 1–10.

Every unit has three authored skills (two lessons each) plus a generated practice skill that
recombines the unit's own vocabulary (see `practice_skill`), so a unit is 4 skills / 8 lessons.
All teaching content here is original material written for this project.
"""

from dataclasses import replace

from app.seed import guidebooks
from app.seed.specs import (
    CourseSpec,
    GuidebookSpec,
    LessonSpec,
    Sentence,
    SkillSpec,
    UnitSpec,
    Word,
)

W = Word
S = Sentence

# Node icons on the path (keys the frontend maps to drawings).
STAR, BOOK, LISTEN, PRACTICE = "star", "book", "headphones", "dumbbell"


def lesson(
    title: str, words: tuple[Word, Word, Word, Word], sentences: tuple[Sentence, Sentence, Sentence]
) -> LessonSpec:
    return LessonSpec(title=title, words=words, sentences=sentences)


def practice_skill(title: str, skills: tuple[SkillSpec, ...]) -> SkillSpec:
    """A review skill built from a unit's authored lessons: no new vocabulary, just a remix.

    Lesson 1 takes the first words and the second sentences; lesson 2 takes the later words and
    the third sentences. Words are de-duplicated so every option and pair stays unambiguous.
    """
    lessons = [item for skill in skills for item in skill.lessons]

    def pick_words(start: int) -> tuple[Word, Word, Word, Word]:
        chosen: list[Word] = []
        for offset in range(len(lessons) * 4):
            source = lessons[(start + offset) % len(lessons)]
            word = source.words[(start + offset // len(lessons)) % 4]
            if all(word.es != w.es and word.en != w.en for w in chosen):
                chosen.append(word)
            if len(chosen) == 4:
                break
        first, second, third, fourth = chosen
        return (first, second, third, fourth)

    def pick_sentences(index: int, start: int) -> tuple[Sentence, Sentence, Sentence]:
        picked = [lessons[(start + 2 * n) % len(lessons)].sentences[index] for n in range(3)]
        return (picked[0], picked[1], picked[2])

    return SkillSpec(
        title=title,
        icon=PRACTICE,
        description="Practice everything from this unit.",
        lessons=(
            LessonSpec("Practice 1", pick_words(0), pick_sentences(1, 0)),
            LessonSpec("Practice 2", pick_words(2), pick_sentences(2, 1)),
        ),
    )


def unit(
    title: str,
    description: str,
    theme: str,
    skills: tuple[SkillSpec, SkillSpec, SkillSpec],
    practice_title: str,
    guidebook: GuidebookSpec,
    node_icons: tuple[str, str, str, str] | None = None,
) -> UnitSpec:
    """One unit: three authored skills plus a practice skill; `node_icons` sets the icon of
    each of the unit's four nodes (the units drawn to a reference screenshot use its icons)."""
    all_skills: tuple[SkillSpec, ...] = (*skills, practice_skill(practice_title, skills))
    if node_icons is not None:
        all_skills = tuple(
            replace(skill, icon=icon) for skill, icon in zip(all_skills, node_icons, strict=True)
        )
    return UnitSpec(
        title=title,
        description=description,
        theme=theme,
        skills=all_skills,
        guidebook=guidebook,
        section=1,
    )


# --- Unit 1 — Order at a café -------------------------------------------------------------------

DRINKS = SkillSpec(
    "Drinks",
    STAR,
    "Ask for coffee, tea and cold drinks.",
    (
        lesson(
            "Coffee and tea",
            (
                W("el café", "the coffee", "☕"),
                W("el té", "the tea", "🍵"),
                W("el agua", "the water", "💧"),
                W("la leche", "the milk", "🥛"),
            ),
            (
                S(
                    "Quiero un café, por favor.",
                    "I want a coffee, please.",
                    blank="Quiero",
                    tip='"Quiero" means "I want". Add "por favor" to be polite.',
                ),
                S("Un té con leche.", "A tea with milk.", blank="leche"),
                S(
                    "Ella bebe agua.",
                    "She drinks water.",
                    blank="bebe",
                    en_alt=("She is drinking water.",),
                ),
            ),
        ),
        lesson(
            "Cold drinks",
            (
                W("el jugo", "the juice", "🧃"),
                W("el hielo", "the ice", "🧊"),
                W("el vaso", "the glass", "🥤"),
                W("la limonada", "the lemonade", "🍋"),
            ),
            (
                S("Un vaso de agua, por favor.", "A glass of water, please.", blank="vaso"),
                S("Quiero un jugo de naranja.", "I want an orange juice.", blank="jugo"),
                S("La limonada está fría.", "The lemonade is cold.", blank="fría"),
            ),
        ),
    ),
)

SNACKS = SkillSpec(
    "Snacks",
    BOOK,
    "Order something to eat.",
    (
        lesson(
            "Something to eat",
            (
                W("el pan", "the bread", "🍞"),
                W("el queso", "the cheese", "🧀"),
                W("el sándwich", "the sandwich", "🥪"),
                W("la galleta", "the cookie", "🍪"),
            ),
            (
                S("Yo como pan.", "I eat bread.", blank="como", en_alt=("I am eating bread.",)),
                S("Un sándwich de queso.", "A cheese sandwich.", blank="queso"),
                S("La galleta es dulce.", "The cookie is sweet.", blank="dulce"),
            ),
        ),
        lesson(
            "Sweet things",
            (
                W("el pastel", "the cake", "🍰"),
                W("el azúcar", "the sugar", "🍬"),
                W("el helado", "the ice cream", "🍨"),
                W("el chocolate", "the chocolate", "🍫"),
            ),
            (
                S("Un café con azúcar.", "A coffee with sugar.", blank="azúcar"),
                S("Me gusta el helado.", "I like ice cream.", blank="gusta"),
                S("Quiero un pastel de chocolate.", "I want a chocolate cake.", blank="pastel"),
            ),
        ),
    ),
)

ORDERING = SkillSpec(
    "Ordering",
    LISTEN,
    "Be polite, count and ask for the check.",
    (
        lesson(
            "Please and thank you",
            (
                W("por favor", "please", "🙂"),
                W("gracias", "thank you", "🙏"),
                W("la cuenta", "the check", "🧾"),
                W("el mesero", "the waiter", "🤵"),
            ),
            (
                S("La cuenta, por favor.", "The check, please.", blank="cuenta"),
                S(
                    "Muchas gracias.",
                    "Thank you very much.",
                    blank="gracias",
                    en_alt=("Thanks a lot.", "Many thanks."),
                ),
                S("El mesero trae el café.", "The waiter brings the coffee.", blank="trae"),
            ),
        ),
        lesson(
            "How many?",
            (
                W("uno", "one", "1️⃣"),
                W("dos", "two", "2️⃣"),
                W("tres", "three", "3️⃣"),
                W("la mesa", "the table", "🍽️"),
            ),
            (
                S("Dos cafés, por favor.", "Two coffees, please.", blank="Dos"),
                S("Una mesa para tres.", "A table for three.", blank="mesa"),
                S("Quiero dos galletas.", "I want two cookies.", blank="galletas"),
            ),
        ),
    ),
)

# --- Unit 2 — Greet people and say goodbye ------------------------------------------------------

HELLO = SkillSpec(
    "Hello",
    STAR,
    "Greet people at any time of day.",
    (
        lesson(
            "Hello!",
            (
                W("hola", "hello", "👋"),
                W("buenos días", "good morning", "🌅"),
                W("buenas tardes", "good afternoon", "☀️"),
                W("buenas noches", "good night", "🌙"),
            ),
            (
                S("Hola, buenos días.", "Hello, good morning.", blank="Hola"),
                S("Buenas tardes, señora.", "Good afternoon, ma'am.", blank="tardes"),
                S("Buenas noches, mamá.", "Good night, mom.", blank="noches"),
            ),
        ),
        lesson(
            "My name is",
            (
                W("el nombre", "the name", "📛"),
                W("mucho gusto", "nice to meet you", "🤝"),
                W("señor", "sir", "🎩"),
                W("señora", "ma'am", "👒"),
            ),
            (
                S(
                    "Hola, me llamo Ana.",
                    "Hello, my name is Ana.",
                    blank="llamo",
                    en_alt=("Hi, my name is Ana.",),
                    tip='"Me llamo" literally means "I call myself".',
                ),
                S("Mucho gusto, señor.", "Nice to meet you, sir.", blank="gusto"),
                S(
                    "¿Cómo te llamas?",
                    "What is your name?",
                    blank="llamas",
                    en_alt=("What's your name?",),
                ),
            ),
        ),
    ),
)

HOW_ARE_YOU = SkillSpec(
    "How are you?",
    BOOK,
    "Ask how someone is and answer.",
    (
        lesson(
            "How are you?",
            (
                W("bien", "fine", "👍"),
                W("mal", "bad", "👎"),
                W("cansado", "tired", "😴"),
                W("contento", "glad", "😊"),
            ),
            (
                S("¿Cómo estás?", "How are you?", blank="estás"),
                S(
                    "Estoy bien, gracias.",
                    "I am fine, thank you.",
                    blank="bien",
                    en_alt=("I'm fine, thank you.", "I am fine, thanks."),
                ),
                S(
                    "Estoy muy cansado.",
                    "I am very tired.",
                    blank="cansado",
                    en_alt=("I'm very tired.",),
                ),
            ),
        ),
        lesson(
            "And you?",
            (
                W("sí", "yes", "✅"),
                W("no", "no", "❌"),
                W("perdón", "sorry", "🙇"),
                W("de nada", "you're welcome", "🤗"),
            ),
            (
                S("Sí, estoy bien.", "Yes, I am fine.", blank="estoy", en_alt=("Yes, I'm fine.",)),
                S("No, gracias.", "No, thank you.", blank="gracias", en_alt=("No, thanks.",)),
                S("Perdón, ¿y tú?", "Sorry, and you?", blank="tú"),
            ),
        ),
    ),
)

GOODBYE = SkillSpec(
    "Goodbye",
    LISTEN,
    "Say goodbye and be polite.",
    (
        lesson(
            "See you",
            (
                W("adiós", "goodbye", "🚶"),
                W("hasta luego", "see you later", "🕒"),
                W("mañana", "tomorrow", "📅"),
                W("pronto", "soon", "⏩"),
            ),
            (
                S("Adiós, hasta luego.", "Goodbye, see you later.", blank="luego"),
                S("Hasta mañana.", "See you tomorrow.", blank="mañana"),
                S("Hasta pronto, amigo.", "See you soon, friend.", blank="pronto"),
            ),
        ),
        lesson(
            "Polite words",
            (
                W("con permiso", "excuse me", "🙋"),
                W("lo siento", "I'm sorry", "😔"),
                W("bienvenido", "welcome", "🎉"),
                W("igualmente", "likewise", "🔁"),
            ),
            (
                S("Bienvenido a mi casa.", "Welcome to my house.", blank="casa"),
                S(
                    "Lo siento, señora.",
                    "I am sorry, ma'am.",
                    blank="siento",
                    en_alt=("I'm sorry, ma'am.",),
                ),
                S(
                    "Gracias, igualmente.",
                    "Thank you, likewise.",
                    blank="Gracias",
                    en_alt=("Thanks, likewise.",),
                ),
            ),
        ),
    ),
)

# --- Unit 3 — Say where you are from ------------------------------------------------------------

COUNTRIES = SkillSpec(
    "Countries",
    STAR,
    "Name countries and say where you are from.",
    (
        lesson(
            "Countries",
            (
                W("España", "Spain", "💃"),
                W("México", "Mexico", "🌮"),
                W("Estados Unidos", "the United States", "🗽"),
                W("el país", "the country", "🌍"),
            ),
            (
                S(
                    "Soy de España.",
                    "I am from Spain.",
                    blank="Soy",
                    en_alt=("I'm from Spain.",),
                    tip='"Soy de" + a place tells people where you are from.',
                ),
                S("México es un país grande.", "Mexico is a big country.", blank="país"),
                S(
                    "Ella es de Estados Unidos.",
                    "She is from the United States.",
                    blank="es",
                    en_alt=("She's from the United States.",),
                ),
            ),
        ),
        lesson(
            "Where are you from?",
            (
                W("dónde", "where", "❓"),
                W("aquí", "here", "📍"),
                W("lejos", "far", "🛣️"),
                W("la ciudad", "the city", "🏙️"),
            ),
            (
                S("¿De dónde eres?", "Where are you from?", blank="dónde"),
                S("Yo vivo aquí.", "I live here.", blank="vivo"),
                S("Mi ciudad es pequeña.", "My city is small.", blank="ciudad"),
            ),
        ),
    ),
)

NATIONALITIES = SkillSpec(
    "Nationalities",
    BOOK,
    "Say your nationality and where you live.",
    (
        lesson(
            "Nationalities",
            (
                W("español", "Spanish", "🥘"),
                W("mexicano", "Mexican", "🌵"),
                W("americano", "American", "🦅"),
                W("inglés", "English", "☂️"),
            ),
            (
                S("Yo soy mexicano.", "I am Mexican.", blank="mexicano", en_alt=("I'm Mexican.",)),
                S(
                    "Ella es española.",
                    "She is Spanish.",
                    blank="española",
                    en_alt=("She's Spanish.",),
                ),
                S("¿Eres americano?", "Are you American?", blank="Eres"),
            ),
        ),
        lesson(
            "Where I live",
            (
                W("la casa", "the house", "🏠"),
                W("la calle", "the street", "🛤️"),
                W("el barrio", "the neighborhood", "🏘️"),
                W("el pueblo", "the town", "⛪"),
            ),
            (
                S("Vivo en un pueblo.", "I live in a town.", blank="pueblo"),
                S("Mi casa está en esta calle.", "My house is on this street.", blank="calle"),
                S("Me gusta mi barrio.", "I like my neighborhood.", blank="gusta"),
            ),
        ),
    ),
)

INTRODUCTIONS = SkillSpec(
    "Introductions",
    LISTEN,
    "Tell people who you are.",
    (
        lesson(
            "Who I am",
            (
                W("el estudiante", "the student", "🎓"),
                W("el turista", "the tourist", "📸"),
                W("el vecino", "the neighbor", "🏡"),
                W("nuevo", "new", "✨"),
            ),
            (
                S(
                    "Soy estudiante.",
                    "I am a student.",
                    blank="estudiante",
                    en_alt=("I'm a student.",),
                ),
                S(
                    "Él es un turista.",
                    "He is a tourist.",
                    blank="turista",
                    en_alt=("He's a tourist.",),
                ),
                S("Soy nuevo aquí.", "I am new here.", blank="nuevo", en_alt=("I'm new here.",)),
            ),
        ),
        lesson(
            "North and south",
            (
                W("cerca", "near", "📏"),
                W("el norte", "the north", "⬆️"),
                W("el sur", "the south", "⬇️"),
                W("el mar", "the sea", "🌊"),
            ),
            (
                S("Vivo cerca del mar.", "I live near the sea.", blank="cerca"),
                S(
                    "Soy del norte.",
                    "I am from the north.",
                    blank="norte",
                    en_alt=("I'm from the north.",),
                ),
                S("Mi familia es del sur.", "My family is from the south.", blank="familia"),
            ),
        ),
    ),
)

# --- Unit 4 — Introduce family and friends ------------------------------------------------------

FAMILY = SkillSpec(
    "Family",
    BOOK,
    "Talk about parents, children and grandparents.",
    (
        lesson(
            "Parents",
            (
                W("el padre", "the father", "👨"),
                W("la madre", "the mother", "👩"),
                W("el hijo", "the son", "👦"),
                W("la hija", "the daughter", "👧"),
            ),
            (
                S(
                    "Ella es mi madre.",
                    "She is my mother.",
                    blank="madre",
                    en_alt=("She's my mother.",),
                ),
                S("Mi padre es alto.", "My father is tall.", blank="alto"),
                S("Tengo un hijo y una hija.", "I have a son and a daughter.", blank="Tengo"),
            ),
        ),
        lesson(
            "Brothers and sisters",
            (
                W("el hermano", "the brother", "🧑"),
                W("la hermana", "the sister", "👱‍♀️"),
                W("el abuelo", "the grandfather", "👴"),
                W("la abuela", "the grandmother", "👵"),
            ),
            (
                S("Tengo dos hermanos.", "I have two brothers.", blank="hermanos"),
                S("Mi abuela vive aquí.", "My grandmother lives here.", blank="vive"),
                S(
                    "Él es mi hermano.",
                    "He is my brother.",
                    blank="hermano",
                    en_alt=("He's my brother.",),
                ),
            ),
        ),
    ),
)

FRIENDS = SkillSpec(
    "Friends",
    STAR,
    "Introduce friends and partners.",
    (
        lesson(
            "My friends",
            (
                W("el amigo", "the friend", "🤝"),
                W("el novio", "the boyfriend", "💑"),
                W("la novia", "the girlfriend", "💕"),
                W("el compañero", "the classmate", "🧑‍🤝‍🧑"),
            ),
            (
                S(
                    "Él es mi amigo.",
                    "He is my friend.",
                    blank="amigo",
                    en_alt=("He's my friend.",),
                    tip='"Mi" means "my" and never changes: mi amigo, mi amiga.',
                ),
                S(
                    "Ella es mi novia.",
                    "She is my girlfriend.",
                    blank="novia",
                    en_alt=("She's my girlfriend.",),
                ),
                S("Mi compañero es simpático.", "My classmate is nice.", blank="compañero"),
            ),
        ),
        lesson(
            "This is…",
            (
                W("el bebé", "the baby", "👶"),
                W("el esposo", "the husband", "🤵"),
                W("la esposa", "the wife", "👰"),
                W("la gente", "the people", "👥"),
            ),
            (
                S("Este es mi esposo.", "This is my husband.", blank="esposo"),
                S(
                    "El bebé duerme.",
                    "The baby sleeps.",
                    blank="duerme",
                    en_alt=("The baby is sleeping.",),
                ),
                S(
                    "Ella es mi esposa.",
                    "She is my wife.",
                    blank="esposa",
                    en_alt=("She's my wife.",),
                ),
            ),
        ),
    ),
)

RELATIVES = SkillSpec(
    "Relatives",
    LISTEN,
    "Describe the people around you.",
    (
        lesson(
            "People",
            (
                W("el hombre", "the man", "🧔"),
                W("la mujer", "the woman", "👩‍🦰"),
                W("el niño", "the boy", "🧒"),
                W("la niña", "the girl", "👧🏽"),
            ),
            (
                S("Yo soy un hombre.", "I am a man.", blank="soy", en_alt=("I'm a man.",)),
                S("Ella es una mujer.", "She is a woman.", blank="una", en_alt=("She's a woman.",)),
                S("El niño y la niña.", "The boy and the girl.", blank="y"),
            ),
        ),
        lesson(
            "Big family",
            (
                W("la familia", "the family", "👪"),
                W("el primo", "the cousin", "🙋‍♂️"),
                W("el tío", "the uncle", "👨‍🦱"),
                W("la tía", "the aunt", "👩‍🦱"),
            ),
            (
                S("Tengo una familia grande.", "I have a big family.", blank="familia"),
                S("Mi tío vive en México.", "My uncle lives in Mexico.", blank="tío"),
                S("Mi primo es mi amigo.", "My cousin is my friend.", blank="primo"),
            ),
        ),
    ),
)

# --- Unit 5 — Describe people's personalities ---------------------------------------------------

PERSONALITY = SkillSpec(
    "Personality",
    BOOK,
    "Say what people are like.",
    (
        lesson(
            "Nice people",
            (
                W("simpático", "nice", "😊"),
                W("amable", "kind", "🤗"),
                W("divertido", "fun", "🎉"),
                W("serio", "serious", "😐"),
            ),
            (
                S("Mi amigo es simpático.", "My friend is nice.", blank="simpático"),
                S(
                    "Ella es muy amable.",
                    "She is very kind.",
                    blank="amable",
                    en_alt=("She's very kind.",),
                ),
                S("Mi padre es serio.", "My father is serious.", blank="serio"),
            ),
        ),
        lesson(
            "More traits",
            (
                W("tímido", "shy", "🙈"),
                W("inteligente", "smart", "🧠"),
                W("trabajador", "hardworking", "💪"),
                W("perezoso", "lazy", "🦥"),
            ),
            (
                S("Mi hermano es tímido.", "My brother is shy.", blank="tímido"),
                S(
                    "Eres muy inteligente.",
                    "You are very smart.",
                    blank="inteligente",
                    en_alt=("You're very smart.",),
                ),
                S("El gato es perezoso.", "The cat is lazy.", blank="perezoso"),
            ),
        ),
    ),
)

LOOKS = SkillSpec(
    "Looks",
    STAR,
    "Describe how people look.",
    (
        lesson(
            "Tall and short",
            (
                W("alto", "tall", "🦒"),
                W("bajo", "short", "🐭"),
                W("joven", "young", "🌱"),
                W("viejo", "old", "🧓"),
            ),
            (
                S(
                    "Mi madre es alta.",
                    "My mother is tall.",
                    blank="alta",
                    tip="Adjectives match the person: alto for a man, alta for a woman.",
                ),
                S("El niño es bajo.", "The boy is short.", blank="bajo"),
                S("Mi abuelo es viejo.", "My grandfather is old.", blank="viejo"),
            ),
        ),
        lesson(
            "Hair and eyes",
            (
                W("el pelo", "the hair", "💇"),
                W("los ojos", "the eyes", "👀"),
                W("rubio", "blond", "👱"),
                W("moreno", "dark-haired", "🧑‍🦱"),
            ),
            (
                S(
                    "Tiene el pelo rubio.",
                    "He has blond hair.",
                    blank="pelo",
                    en_alt=("She has blond hair.",),
                ),
                S("Ella tiene los ojos verdes.", "She has green eyes.", blank="ojos"),
                S("Mi hermana es morena.", "My sister is dark-haired.", blank="hermana"),
            ),
        ),
    ),
)

FEELINGS = SkillSpec(
    "Feelings",
    LISTEN,
    "Say how people feel today.",
    (
        lesson(
            "Happy and sad",
            (
                W("feliz", "happy", "😀"),
                W("triste", "sad", "😢"),
                W("enojado", "angry", "😠"),
                W("nervioso", "nervous", "😬"),
            ),
            (
                S(
                    "Hoy estoy feliz.",
                    "Today I am happy.",
                    blank="feliz",
                    en_alt=("I am happy today.", "Today I'm happy.", "I'm happy today."),
                ),
                S("¿Por qué estás triste?", "Why are you sad?", blank="triste"),
                S("Mi jefe está enojado.", "My boss is angry.", blank="enojado"),
            ),
        ),
        lesson(
            "Right now",
            (
                W("tranquilo", "calm", "😌"),
                W("ocupado", "busy", "📚"),
                W("enfermo", "sick", "🤒"),
                W("listo", "ready", "✅"),
            ),
            (
                S(
                    "Estoy muy ocupado.",
                    "I am very busy.",
                    blank="ocupado",
                    en_alt=("I'm very busy.",),
                ),
                S("El bebé está tranquilo.", "The baby is calm.", blank="tranquilo"),
                S("¿Estás listo?", "Are you ready?", blank="listo"),
            ),
        ),
    ),
)

# --- Unit 6 — Say where your things are ---------------------------------------------------------

MY_THINGS = SkillSpec(
    "My things",
    BOOK,
    "Name the things you carry and keep.",
    (
        lesson(
            "In my bag",
            (
                W("el libro", "the book", "📕"),
                W("el teléfono", "the phone", "📱"),
                W("la llave", "the key", "🔑"),
                W("la mochila", "the backpack", "🎒"),
            ),
            (
                S(
                    "¿Dónde está mi teléfono?",
                    "Where is my phone?",
                    blank="teléfono",
                    en_alt=("Where's my phone?",),
                ),
                S("Tengo un libro nuevo.", "I have a new book.", blank="libro"),
                S("La llave está aquí.", "The key is here.", blank="llave"),
            ),
        ),
        lesson(
            "Furniture",
            (
                W("la mesa", "the table", "🍽️"),
                W("la silla", "the chair", "🪑"),
                W("la cama", "the bed", "🛏️"),
                W("la caja", "the box", "📦"),
            ),
            (
                S(
                    "El gato duerme en la cama.",
                    "The cat sleeps on the bed.",
                    blank="cama",
                    en_alt=("The cat is sleeping on the bed.",),
                ),
                S("La caja es grande.", "The box is big.", blank="caja"),
                S("Mi mochila está en la silla.", "My backpack is on the chair.", blank="silla"),
            ),
        ),
    ),
)

WHERE_IS_IT = SkillSpec(
    "Where is it?",
    LISTEN,
    "Say where something is.",
    (
        lesson(
            "On, under, inside",
            (
                W("sobre", "on", "🔝"),
                W("debajo", "under", "⬇️"),
                W("dentro", "inside", "📥"),
                W("al lado", "next to", "↔️"),
            ),
            (
                S(
                    "El libro está sobre la mesa.",
                    "The book is on the table.",
                    blank="sobre",
                    tip='Use "está" (not "es") to say where something is.',
                ),
                S("El gato está debajo de la cama.", "The cat is under the bed.", blank="debajo"),
                S("La llave está dentro de la caja.", "The key is inside the box.", blank="dentro"),
            ),
        ),
        lesson(
            "Here and there",
            (
                W("aquí", "here", "📍"),
                W("allí", "there", "👉"),
                W("cerca", "near", "📏"),
                W("lejos", "far", "🛣️"),
            ),
            (
                S("Mi teléfono está aquí.", "My phone is here.", blank="aquí"),
                S("La mochila está allí.", "The backpack is there.", blank="allí"),
                S(
                    "Mi casa está lejos.",
                    "My house is far.",
                    blank="lejos",
                    en_alt=("My house is far away.",),
                ),
            ),
        ),
    ),
)

AT_HOME = SkillSpec(
    "At home",
    STAR,
    "Find your way around the house.",
    (
        lesson(
            "Rooms",
            (
                W("la casa", "the house", "🏠"),
                W("la puerta", "the door", "🚪"),
                W("la cocina", "the kitchen", "🍳"),
                W("el baño", "the bathroom", "🛁"),
            ),
            (
                S("Mi casa es pequeña.", "My house is small.", blank="pequeña"),
                S("La puerta está abierta.", "The door is open.", blank="abierta"),
                S(
                    "¿Dónde está el baño?",
                    "Where is the bathroom?",
                    blank="está",
                    en_alt=("Where's the bathroom?",),
                ),
            ),
        ),
        lesson(
            "Around the room",
            (
                W("la ventana", "the window", "🪟"),
                W("la lámpara", "the lamp", "💡"),
                W("el sofá", "the sofa", "🛋️"),
                W("el reloj", "the clock", "🕰️"),
            ),
            (
                S(
                    "Abro la ventana.",
                    "I open the window.",
                    blank="ventana",
                    en_alt=("I am opening the window.",),
                ),
                S("El reloj está en la cocina.", "The clock is in the kitchen.", blank="reloj"),
                S("Mi perro duerme en el sofá.", "My dog sleeps on the sofa.", blank="sofá"),
            ),
        ),
    ),
)

# --- Unit 7 — Talk about places in the city -----------------------------------------------------

PLACES = SkillSpec(
    "Places",
    LISTEN,
    "Name places around town.",
    (
        lesson(
            "Around town",
            (
                W("el banco", "the bank", "🏦"),
                W("el parque", "the park", "🌳"),
                W("la tienda", "the store", "🏪"),
                W("el hotel", "the hotel", "🏨"),
            ),
            (
                S("El banco está cerrado.", "The bank is closed.", blank="cerrado"),
                S(
                    "Vamos al parque.",
                    "We are going to the park.",
                    blank="parque",
                    en_alt=("Let's go to the park.", "We're going to the park."),
                    tip='"a" + "el" joins into "al": vamos al parque.',
                ),
                S("Necesito un hotel.", "I need a hotel.", blank="Necesito"),
            ),
        ),
        lesson(
            "Public places",
            (
                W("la escuela", "the school", "🏫"),
                W("el hospital", "the hospital", "🏥"),
                W("la biblioteca", "the library", "📚"),
                W("el museo", "the museum", "🖼️"),
            ),
            (
                S(
                    "Mi hermana está en la escuela.",
                    "My sister is at school.",
                    blank="escuela",
                    en_alt=("My sister is at the school.",),
                ),
                S("El museo abre hoy.", "The museum opens today.", blank="abre"),
                S("La biblioteca es grande.", "The library is big.", blank="biblioteca"),
            ),
        ),
    ),
)

GETTING_AROUND = SkillSpec(
    "Getting around",
    STAR,
    "Use trains, buses and streets.",
    (
        lesson(
            "Transport",
            (
                W("el tren", "the train", "🚆"),
                W("el autobús", "the bus", "🚌"),
                W("el taxi", "the taxi", "🚕"),
                W("la estación", "the station", "🚉"),
            ),
            (
                S("El tren llega tarde.", "The train arrives late.", blank="tarde"),
                S(
                    "Tomo el autobús.",
                    "I take the bus.",
                    blank="autobús",
                    en_alt=("I am taking the bus.",),
                ),
                S("¿Dónde está la estación?", "Where is the station?", blank="estación"),
            ),
        ),
        lesson(
            "Streets",
            (
                W("la calle", "the street", "🛤️"),
                W("la plaza", "the square", "⛲"),
                W("el puente", "the bridge", "🌉"),
                W("el centro", "downtown", "🏙️"),
            ),
            (
                S("Vivo en el centro.", "I live downtown.", blank="centro"),
                S(
                    "La plaza está cerca.",
                    "The square is near.",
                    blank="plaza",
                    en_alt=("The square is nearby.",),
                ),
                S(
                    "Cruzo el puente.",
                    "I cross the bridge.",
                    blank="puente",
                    en_alt=("I am crossing the bridge.",),
                ),
            ),
        ),
    ),
)

DIRECTIONS = SkillSpec(
    "Directions",
    BOOK,
    "Ask for and follow directions.",
    (
        lesson(
            "Left and right",
            (
                W("izquierda", "left", "⬅️"),
                W("derecha", "right", "➡️"),
                W("recto", "straight", "⬆️"),
                W("la esquina", "the corner", "📐"),
            ),
            (
                S(
                    "Gira a la izquierda.",
                    "Turn left.",
                    blank="izquierda",
                    en_alt=("Turn to the left.",),
                ),
                S("El banco está a la derecha.", "The bank is on the right.", blank="derecha"),
                S(
                    "Sigue todo recto.",
                    "Go straight ahead.",
                    blank="recto",
                    en_alt=("Keep going straight.",),
                ),
            ),
        ),
        lesson(
            "Finding places",
            (
                W("el mapa", "the map", "🗺️"),
                W("el restaurante", "the restaurant", "🍴"),
                W("el cine", "the movie theater", "🎬"),
                W("el mercado", "the market", "🧺"),
            ),
            (
                S(
                    "¿Dónde está el mercado?",
                    "Where is the market?",
                    blank="mercado",
                    en_alt=("Where's the market?",),
                ),
                S("Tengo un mapa.", "I have a map.", blank="mapa"),
                S("El cine está en la plaza.", "The movie theater is in the square.", blank="cine"),
            ),
        ),
    ),
)

# --- Unit 8 — Discuss languages -----------------------------------------------------------------

LANGUAGES = SkillSpec(
    "Languages",
    BOOK,
    "Say which languages you speak.",
    (
        lesson(
            "I speak",
            (
                W("el español", "Spanish", "🥘"),
                W("el inglés", "English", "☂️"),
                W("el francés", "French", "🥐"),
                W("el idioma", "the language", "🗣️"),
            ),
            (
                S(
                    "Hablo español.",
                    "I speak Spanish.",
                    blank="Hablo",
                    tip='The verb ending tells you who: "hablo" already means "I speak".',
                ),
                S("¿Hablas inglés?", "Do you speak English?", blank="inglés"),
                S(
                    "El francés es un idioma bonito.",
                    "French is a beautiful language.",
                    blank="idioma",
                ),
            ),
        ),
        lesson(
            "Learning",
            (
                W("hablar", "to speak", "💬"),
                W("estudiar", "to study", "📖"),
                W("aprender", "to learn", "🧠"),
                W("entender", "to understand", "💡"),
            ),
            (
                S("Estudio español todos los días.", "I study Spanish every day.", blank="Estudio"),
                S("Quiero aprender francés.", "I want to learn French.", blank="aprender"),
                S(
                    "No entiendo.",
                    "I do not understand.",
                    blank="entiendo",
                    en_alt=("I don't understand.",),
                ),
            ),
        ),
    ),
)

IN_CLASS = SkillSpec(
    "In class",
    STAR,
    "Talk about words, questions and homework.",
    (
        lesson(
            "Words and questions",
            (
                W("la palabra", "the word", "🔤"),
                W("la frase", "the sentence", "📝"),
                W("la pregunta", "the question", "❓"),
                W("la respuesta", "the answer", "✔️"),
            ),
            (
                S("Tengo una pregunta.", "I have a question.", blank="pregunta"),
                S("¿Qué significa esta palabra?", "What does this word mean?", blank="palabra"),
                S("La respuesta es correcta.", "The answer is correct.", blank="respuesta"),
            ),
        ),
        lesson(
            "The classroom",
            (
                W("el profesor", "the teacher", "👨‍🏫"),
                W("la clase", "the class", "🏫"),
                W("el examen", "the exam", "📄"),
                W("la tarea", "the homework", "📚"),
            ),
            (
                S("Mi profesor habla inglés.", "My teacher speaks English.", blank="habla"),
                S("La clase es divertida.", "The class is fun.", blank="clase"),
                S("Tengo mucha tarea.", "I have a lot of homework.", blank="tarea"),
            ),
        ),
    ),
)

HOW_WELL = SkillSpec(
    "How well?",
    LISTEN,
    "Say how well and how fast you speak.",
    (
        lesson(
            "A little, a lot",
            (
                W("un poco", "a little", "🤏"),
                W("mucho", "a lot", "💯"),
                W("despacio", "slowly", "🐢"),
                W("rápido", "fast", "🐇"),
            ),
            (
                S(
                    "Hablo un poco de español.",
                    "I speak a little Spanish.",
                    blank="poco",
                    en_alt=("I speak a bit of Spanish.", "I speak a little bit of Spanish."),
                ),
                S(
                    "Más despacio, por favor.",
                    "More slowly, please.",
                    blank="despacio",
                    en_alt=("Slower, please.",),
                ),
                S("Ella habla muy rápido.", "She speaks very fast.", blank="rápido"),
            ),
        ),
        lesson(
            "Easy or hard",
            (
                W("fácil", "easy", "👌"),
                W("difícil", "difficult", "🧗"),
                W("bonito", "beautiful", "🌸"),
                W("importante", "important", "⭐"),
            ),
            (
                S("El español es fácil.", "Spanish is easy.", blank="fácil"),
                S(
                    "El examen es difícil.",
                    "The exam is difficult.",
                    blank="difícil",
                    en_alt=("The exam is hard.",),
                ),
                S(
                    "Es un idioma importante.",
                    "It is an important language.",
                    blank="importante",
                    en_alt=("It's an important language.",),
                ),
            ),
        ),
    ),
)

# --- Unit 9 — Talk about the weather ------------------------------------------------------------

WEATHER = SkillSpec(
    "Weather",
    BOOK,
    "Say what the weather is like.",
    (
        lesson(
            "Sun and rain",
            (
                W("el sol", "the sun", "☀️"),
                W("la lluvia", "the rain", "🌧️"),
                W("el viento", "the wind", "💨"),
                W("la nieve", "the snow", "❄️"),
            ),
            (
                S(
                    "Hace sol.",
                    "It is sunny.",
                    blank="sol",
                    en_alt=("It's sunny.",),
                    tip='Spanish uses "hace" (it makes) for weather: hace sol, hace frío.',
                ),
                S(
                    "Me gusta la lluvia.",
                    "I like the rain.",
                    blank="lluvia",
                    en_alt=("I like rain.",),
                ),
                S(
                    "Hay mucho viento.",
                    "It is very windy.",
                    blank="viento",
                    en_alt=("It's very windy.", "There is a lot of wind."),
                ),
            ),
        ),
        lesson(
            "Hot and cold",
            (
                W("el calor", "the heat", "🥵"),
                W("el frío", "the cold", "🥶"),
                W("la nube", "the cloud", "☁️"),
                W("el cielo", "the sky", "🌌"),
            ),
            (
                S(
                    "Hace mucho calor.",
                    "It is very hot.",
                    blank="calor",
                    en_alt=("It's very hot.",),
                ),
                S(
                    "Hoy hace frío.",
                    "It is cold today.",
                    blank="frío",
                    en_alt=("Today it is cold.", "It's cold today.", "Today it's cold."),
                ),
                S("El cielo es azul.", "The sky is blue.", blank="azul"),
            ),
        ),
    ),
)

SEASONS = SkillSpec(
    "Seasons",
    LISTEN,
    "Talk about the seasons and when things happen.",
    (
        lesson(
            "The four seasons",
            (
                W("el verano", "the summer", "🏖️"),
                W("el invierno", "the winter", "⛄"),
                W("la primavera", "the spring", "🌷"),
                W("el otoño", "the fall", "🍂"),
            ),
            (
                S(
                    "En verano hace calor.",
                    "In summer it is hot.",
                    blank="verano",
                    en_alt=(
                        "It is hot in summer.",
                        "In the summer it is hot.",
                        "It's hot in summer.",
                    ),
                ),
                S(
                    "Me gusta la primavera.",
                    "I like spring.",
                    blank="primavera",
                    en_alt=("I like the spring.",),
                ),
                S(
                    "En invierno nieva.",
                    "In winter it snows.",
                    blank="invierno",
                    en_alt=("It snows in winter.", "In the winter it snows."),
                ),
            ),
        ),
        lesson(
            "Today and tomorrow",
            (
                W("hoy", "today", "📍"),
                W("mañana", "tomorrow", "📅"),
                W("siempre", "always", "♾️"),
                W("nunca", "never", "🚫"),
            ),
            (
                S(
                    "Hoy llueve.",
                    "Today it is raining.",
                    blank="llueve",
                    en_alt=("It is raining today.", "It's raining today.", "Today it rains."),
                ),
                S(
                    "Mañana hace sol.",
                    "Tomorrow it is sunny.",
                    blank="Mañana",
                    en_alt=(
                        "It is sunny tomorrow.",
                        "Tomorrow it's sunny.",
                        "Tomorrow will be sunny.",
                    ),
                ),
                S(
                    "Aquí nunca nieva.",
                    "It never snows here.",
                    blank="nunca",
                    en_alt=("Here it never snows.",),
                ),
            ),
        ),
    ),
)

WHAT_TO_WEAR = SkillSpec(
    "What to wear",
    STAR,
    "Dress for the weather.",
    (
        lesson(
            "Rainy days",
            (
                W("el abrigo", "the coat", "🧥"),
                W("el paraguas", "the umbrella", "☂️"),
                W("el sombrero", "the hat", "👒"),
                W("las botas", "the boots", "🥾"),
            ),
            (
                S("Necesito un paraguas.", "I need an umbrella.", blank="paraguas"),
                S(
                    "Llevo un abrigo.",
                    "I am wearing a coat.",
                    blank="abrigo",
                    en_alt=("I wear a coat.", "I'm wearing a coat."),
                ),
                S("Mis botas son nuevas.", "My boots are new.", blank="botas"),
            ),
        ),
        lesson(
            "How it feels",
            (
                W("caliente", "hot", "🔥"),
                W("fresco", "cool", "🍃"),
                W("húmedo", "humid", "💦"),
                W("seco", "dry", "🏜️"),
            ),
            (
                S("El café está caliente.", "The coffee is hot.", blank="caliente"),
                S("La noche está fresca.", "The night is cool.", blank="noche"),
                S(
                    "El clima es seco.",
                    "The weather is dry.",
                    blank="seco",
                    en_alt=("The climate is dry.",),
                ),
            ),
        ),
    ),
)

# --- Unit 10 — Shop for fruits at the market ----------------------------------------------------

FRUITS = SkillSpec(
    "Fruits",
    BOOK,
    "Name the fruit on the stall.",
    (
        lesson(
            "Apples and oranges",
            (
                W("la manzana", "the apple", "🍎"),
                W("la naranja", "the orange", "🍊"),
                W("el plátano", "the banana", "🍌"),
                W("la uva", "the grape", "🍇"),
            ),
            (
                S("La manzana es roja.", "The apple is red.", blank="roja"),
                S("Quiero una naranja.", "I want an orange.", blank="naranja"),
                S(
                    "Como un plátano.",
                    "I eat a banana.",
                    blank="plátano",
                    en_alt=("I am eating a banana.",),
                ),
            ),
        ),
        lesson(
            "More fruit",
            (
                W("la fresa", "the strawberry", "🍓"),
                W("el limón", "the lemon", "🍋"),
                W("la pera", "the pear", "🍐"),
                W("la sandía", "the watermelon", "🍉"),
            ),
            (
                S(
                    "Las fresas son dulces.",
                    "The strawberries are sweet.",
                    blank="dulces",
                    en_alt=("Strawberries are sweet.",),
                ),
                S("El limón es amarillo.", "The lemon is yellow.", blank="amarillo"),
                S("La sandía es grande.", "The watermelon is big.", blank="sandía"),
            ),
        ),
    ),
)

AT_THE_MARKET = SkillSpec(
    "At the market",
    STAR,
    "Ask prices and choose the best fruit.",
    (
        lesson(
            "How much?",
            (
                W("el mercado", "the market", "🧺"),
                W("el dinero", "the money", "💰"),
                W("la bolsa", "the bag", "🛍️"),
                W("el kilo", "the kilo", "⚖️"),
            ),
            (
                S(
                    "¿Cuánto cuesta?",
                    "How much does it cost?",
                    blank="cuesta",
                    en_alt=("How much is it?",),
                    tip='"¿Cuánto cuesta?" is for one thing; for several say "¿Cuánto cuestan?".',
                ),
                S(
                    "Un kilo de manzanas, por favor.",
                    "A kilo of apples, please.",
                    blank="kilo",
                    en_alt=("One kilo of apples, please.",),
                ),
                S("Necesito una bolsa.", "I need a bag.", blank="bolsa"),
            ),
        ),
        lesson(
            "Cheap and fresh",
            (
                W("barato", "cheap", "🏷️"),
                W("caro", "expensive", "💎"),
                W("fresco", "fresh", "🌿"),
                W("maduro", "ripe", "🥭"),
            ),
            (
                S(
                    "Las uvas son baratas.",
                    "The grapes are cheap.",
                    blank="baratas",
                    en_alt=("Grapes are cheap.",),
                ),
                S("Este plátano está maduro.", "This banana is ripe.", blank="maduro"),
                S("La fruta es fresca.", "The fruit is fresh.", blank="fruta"),
            ),
        ),
    ),
)

BUYING = SkillSpec(
    "Buying",
    LISTEN,
    "Buy, pay and ask for more.",
    (
        lesson(
            "Buy and pay",
            (
                W("comprar", "to buy", "🛒"),
                W("pagar", "to pay", "💳"),
                W("vender", "to sell", "🏪"),
                W("querer", "to want", "🙋"),
            ),
            (
                S("Quiero comprar fresas.", "I want to buy strawberries.", blank="comprar"),
                S(
                    "Pago con tarjeta.",
                    "I pay by card.",
                    blank="tarjeta",
                    en_alt=("I pay with a card.", "I am paying by card.", "I pay with card."),
                ),
                S("Ella vende fruta.", "She sells fruit.", blank="vende"),
            ),
        ),
        lesson(
            "More or less",
            (
                W("más", "more", "➕"),
                W("menos", "less", "➖"),
                W("otro", "another", "🔁"),
                W("todo", "everything", "🧺"),
            ),
            (
                S("Quiero más uvas.", "I want more grapes.", blank="más"),
                S("Otra manzana, por favor.", "Another apple, please.", blank="manzana"),
                S("¿Es todo?", "Is that everything?", blank="todo", en_alt=("Is that all?",)),
            ),
        ),
    ),
)

SPANISH_COURSE = CourseSpec(
    slug="es-en",
    title="Spanish",
    learning_language="es",
    from_language="en",
    description="Learn Spanish from English: order, greet, describe, find your way and shop.",
    units=(
        unit(
            "Order at a café",
            "Ask for drinks and snacks, count, and pay the check.",
            "lime",
            (DRINKS, SNACKS, ORDERING),
            "Café practice",
            guidebooks.UNIT_1,
            node_icons=(STAR, STAR, STAR, STAR),
        ),
        unit(
            "Greet people and say goodbye",
            "Say hello at any time of day, ask how people are, and say goodbye.",
            "purple",
            (HELLO, HOW_ARE_YOU, GOODBYE),
            "Greetings practice",
            guidebooks.UNIT_2,
            node_icons=(STAR, STAR, LISTEN, STAR),
        ),
        unit(
            "Say where you are from",
            "Name countries and nationalities and say where you live.",
            "teal",
            (COUNTRIES, NATIONALITIES, INTRODUCTIONS),
            "Origins practice",
            guidebooks.UNIT_3,
            node_icons=(STAR, LISTEN, LISTEN, STAR),
        ),
        unit(
            "Introduce family and friends",
            "Talk about your family, friends and the people around you.",
            "lime",
            (FAMILY, FRIENDS, RELATIVES),
            "Family practice",
            guidebooks.UNIT_4,
            node_icons=(BOOK, STAR, LISTEN, PRACTICE),
        ),
        unit(
            "Describe people's personalities",
            "Say what people are like, how they look and how they feel.",
            "sky",
            (PERSONALITY, LOOKS, FEELINGS),
            "People practice",
            guidebooks.UNIT_5,
            node_icons=(BOOK, STAR, PRACTICE, LISTEN),
        ),
        unit(
            "Say where your things are",
            "Name your things and say where they are at home.",
            "pink",
            (MY_THINGS, WHERE_IS_IT, AT_HOME),
            "Things practice",
            guidebooks.UNIT_6,
            node_icons=(BOOK, LISTEN, STAR, PRACTICE),
        ),
        unit(
            "Talk about places in the city",
            "Name places in town, get around and follow directions.",
            "lime",
            (PLACES, GETTING_AROUND, DIRECTIONS),
            "City practice",
            guidebooks.UNIT_7,
            node_icons=(LISTEN, STAR, LISTEN, PRACTICE),
        ),
        unit(
            "Discuss languages",
            "Say which languages you speak and talk about learning them.",
            "ember",
            (LANGUAGES, IN_CLASS, HOW_WELL),
            "Languages practice",
            guidebooks.UNIT_8,
            node_icons=(BOOK, STAR, LISTEN, PRACTICE),
        ),
        unit(
            "Talk about the weather",
            "Describe the weather and the seasons, and dress for them.",
            "cherry",
            (WEATHER, SEASONS, WHAT_TO_WEAR),
            "Weather practice",
            guidebooks.UNIT_9,
            node_icons=(BOOK, LISTEN, STAR, PRACTICE),
        ),
        unit(
            "Shop for fruits at the market",
            "Name fruit, ask prices and buy what you need.",
            "lime",
            (FRUITS, AT_THE_MARKET, BUYING),
            "Market practice",
            guidebooks.UNIT_10,
            node_icons=(BOOK, STAR, LISTEN, PRACTICE),
        ),
    ),
)
