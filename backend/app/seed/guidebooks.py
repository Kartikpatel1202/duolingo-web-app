"""Guidebook content for Section 1 of the Spanish course (original material for this project).

One guidebook per unit: its key phrases come from that unit's lessons, followed by one or two
short tips about the grammar, vocabulary or pronunciation the unit introduces.
"""

from typing import Literal

from app.domain.enums import GuidebookEntryKind as Kind
from app.domain.enums import GuidebookSectionKind as Section
from app.seed.specs import GuidebookEntrySpec, GuidebookSectionSpec, GuidebookSpec

INTRODUCTION = "Explore grammar tips and key phrases for this unit"


def phrase(text: str, translation: str) -> GuidebookEntrySpec:
    return GuidebookEntrySpec(Kind.PHRASE, text, translation)


def term(text: str, translation: str) -> GuidebookEntrySpec:
    return GuidebookEntrySpec(Kind.TERM, text, translation)


def example(text: str, translation: str) -> GuidebookEntrySpec:
    return GuidebookEntrySpec(Kind.EXAMPLE, text, translation)


def key_phrases(*entries: GuidebookEntrySpec) -> GuidebookSectionSpec:
    return GuidebookSectionSpec(Section.KEY_PHRASES, "Key phrases", entries=entries)


def vocabulary(title: str, *entries: GuidebookEntrySpec) -> GuidebookSectionSpec:
    return GuidebookSectionSpec(Section.VOCABULARY, title, entries=entries)


def tip(
    title: str,
    body: str,
    *entries: GuidebookEntrySpec,
    headings: tuple[str, str] | None = None,
    highlights: tuple[str, ...] = (),
    footer: str | None = None,
    layout: Literal["default", "examples_first", "footer_last"] = "default",
) -> GuidebookSectionSpec:
    """A tip. `headings` names the table's two columns (default: the language and English);
    `highlights` are extra words to accent in the text (default: the table's first column);
    `footer` is a closing paragraph. `layout` orders the parts: "default" is table, footer,
    examples; "examples_first" is examples, footer, table; "footer_last" is table, examples,
    footer."""
    term_heading, translation_heading = headings or (None, None)
    return GuidebookSectionSpec(
        Section.TIP,
        title,
        body=body,
        entries=entries,
        term_heading=term_heading,
        translation_heading=translation_heading,
        highlights=highlights,
        footer=footer,
        layout=layout,
    )


def guidebook(*sections: GuidebookSectionSpec) -> GuidebookSpec:
    return GuidebookSpec(INTRODUCTION, sections)


UNIT_1 = guidebook(
    key_phrases(
        phrase("Un vaso de agua, por favor.", "A glass of water, please."),
        phrase("Hola, quiero un té con azúcar.", "Hello, I want a tea with sugar."),
        phrase("Quiero un helado y un vaso de agua.", "I want an ice cream and a glass of water."),
        phrase("¿Un café o un té?", "A coffee or a tea?"),
        phrase("Un sándwich y un café, por favor.", "A sandwich and a coffee, please."),
    ),
    tip(
        "Conjunctions: y & o",
        "Spanish uses y (and) and o (or) to connect words, just like in English.",
        term("y", "and"),
        term("o", "or"),
        example("Un café y un helado.", "A coffee and an ice cream."),
        example("¿Un café o un té?", "A coffee or a tea."),
    ),
)

UNIT_2 = guidebook(
    key_phrases(
        phrase("Buenos días, yo soy Luis.", "Good morning, I am Luis."),
        phrase("Hola, él es Pablo.", "Hello, he is Pablo."),
        phrase("Mucho gusto, Pablo.", "Nice to meet you, Pablo."),
        phrase("¿Qué tal?", "How's it going?"),
        phrase("¡Hasta luego!", "See you later!"),
    ),
    tip(
        "Using “ser” for introductions",
        "In Spanish, use the verb ser to introduce yourself or someone else. With yo (I), the "
        "verb becomes soy.",
        term("yo", "soy"),
        example("Yo soy María.", "I am María."),
        headings=("Subject", "Ser"),
        highlights=("ser", "yo", "soy"),
    ),
)

UNIT_3 = guidebook(
    key_phrases(
        phrase("Buenos días, yo soy de México.", "Good morning, I am from Mexico."),
        phrase("Encantado, Pablo, ¿de dónde eres?", "Nice to meet you, Pablo. Where are you from?"),
        phrase("Mi mamá es de Francia.", "My mom is from France."),
        phrase("Tú eres de Alemania, ¿verdad?", "You are from Germany, right?"),
        phrase("Hola, yo soy María, encantada.", "Hello, I am María, nice to meet you."),
    ),
    tip(
        "Ser de for origin",
        "To express where someone is from, use ser de (to be from).",
        term("yo", "soy de"),
        term("él / ella", "es de"),
        example("Yo soy de México.", "I am from Mexico."),
        example("Él es de México.", "He is from Mexico."),
        headings=("Subject", "Ser de"),
        highlights=("ser de", "soy de", "es de"),
    ),
)

UNIT_4 = guidebook(
    key_phrases(
        phrase("Yo tengo una hermana.", "I have a sister."),
        phrase("Sí, yo tengo un hijo.", "Yes, I have a son."),
        phrase("Laura es mi hermana y mi amiga.", "Laura is my sister and my friend."),
        phrase("Él es mi tío.", "He is my uncle."),
        phrase("En realidad, yo tengo un hijo y una hija.", "Actually, I have a son and a daughter."),
    ),
    tip(
        "Noun gender and articles",
        "In Spanish, nouns have grammatical gender. For people and animals, nouns ending in -o are "
        "typically masculine, while those ending in -a are typically feminine.",
        term("hermano", "hermana"),
        term("hijo", "hija"),
        term("tío", "tía"),
        example("un hijo", "a son"),
        example("una hija", "a daughter"),
        headings=("Masculine (-o)", "Feminine (-a)"),
        highlights=("-o", "-a", "un", "una"),
        footer=(
            "The indefinite article (“a” or “an” in English) must match the noun’s gender: un for "
            "masculine nouns and una for feminine nouns."
        ),
    ),
)

UNIT_5 = guidebook(
    key_phrases(
        phrase("Mi abuelo es gracioso.", "My grandfather is funny."),
        phrase("¿Cómo es tu amiga?", "What's your friend like?"),
        phrase("Mi esposa es simpática.", "My wife is nice."),
        phrase("Tu hermano es simpático, ¿verdad?", "Your brother is nice, right?"),
        phrase("Mi hija es tímida.", "My daughter is shy."),
    ),
    tip(
        "Gender agreement with adjectives",
        "In Spanish, adjectives must match the gender of the noun they describe. Many adjectives "
        "ending in -o are masculine, and change to -a for feminine nouns.",
        term("Mi tío es tímido", "Mi tía es tímida"),
        term("Mi novio es serio", "¿Tu mamá es seria?"),
        example("Él es amable. / Ella es alegre.", "He is kind. / She is cheerful."),
        headings=("Masculine", "Feminine"),
        highlights=("-o", "-a", "-e"),
        footer="Adjectives ending in -e or a consonant stay the same for both genders.",
    ),
)

UNIT_6 = guidebook(
    key_phrases(
        phrase("¿Dónde está mi cargador?", "Where is my charger?"),
        phrase("Mi maleta está aquí.", "My suitcase is here."),
        phrase("Yo tengo tu suéter y tu chaqueta.", "I have your sweater and your jacket."),
        phrase("Tranquila, tu pasaporte está aquí también.", "Relax, your passport is here too."),
        phrase("Creo que mi vestido no está aquí.", "I think that my dress is not here."),
    ),
    tip(
        "Using “estar” for location",
        "Use estar to express where someone or something is located. The third person singular "
        "form is está.",
        example("Ana está aquí.", "Ana is here."),
        example("¿Dónde está mi cartera?", "Where is my wallet?"),
        highlights=("estar", "está"),
    ),
    tip(
        "Negation with “no”",
        "To make a sentence negative, place no directly before the verb. Unlike English, no extra "
        "words like “do” or “does” are needed.",
        term("Yo no dibujo.", "I don’t draw."),
        term("Él no dibuja mal.", "He doesn’t draw badly."),
        highlights=("no",),
    ),
)

UNIT_7 = guidebook(
    key_phrases(
        phrase("¿Hay un centro comercial por aquí?", "Is there a mall around here?"),
        phrase("Hay un banco y una panadería.", "There is a bank and a bakery."),
        phrase("Mira, hay un parque aquí.", "Look, there is a park here."),
        phrase("¿Hay un teatro en tu ciudad?", "Is there a theater in your city?"),
        phrase("Sí, hay una cafetería en mi ciudad.", "Yes, there is a coffee shop in my city."),
    ),
    tip(
        "Existential “hay”",
        "Hay means there is or there are. Unlike English, the same word is used for both singular "
        "and plural.",
        term("Hay un banco.", "There is a bank."),
        term("Hay una cafetería.", "There is a café."),
        example("Hay un museo.", "There is a museum."),
        highlights=("Hay", "hay", "un", "una"),
        footer=(
            "Hay is typically used with indefinite articles (un, una) to talk about the existence "
            "of something."
        ),
        layout="examples_first",
    ),
    tip(
        "Preposition “en” for location",
        "Use en to indicate location, similar to in or at in English.",
        example("Hay un banco en mi barrio.", "There is a bank in my neighborhood."),
        highlights=("en", "in", "at"),
    ),
)

UNIT_8 = guidebook(
    key_phrases(
        phrase("Yo estudio español por la noche.", "I study Spanish at night."),
        phrase("Tú estudias alemán, ¿verdad?", "You study German, right?"),
        phrase("Yo hablo inglés y español.", "I speak English and Spanish."),
        phrase("¿Dónde está tu escuela?", "Where is your school?"),
        phrase("Yo estudio portugués y español también.", "I study Portuguese and Spanish too."),
    ),
    tip(
        "Present tense -ar verbs",
        "Spanish verbs change their endings based on who is doing the action. For verbs ending in "
        "-ar, remove the -ar and add the appropriate ending:",
        term("yo", "bailo"),
        term("tú", "bailas"),
        example("¡Yo bailo!", "I dance!"),
        example("Tú viajas cerca.", "You travel nearby."),
        headings=("Subject", "bailar (to dance)"),
        highlights=("-ar", "yo", "tú"),
        footer=(
            "Because the verb ending indicates the subject, pronouns like yo and tú are often "
            "optional in Spanish."
        ),
        layout="footer_last",
    ),
)

UNIT_9 = guidebook(
    key_phrases(
        phrase("Hace frío en otoño aquí.", "It is cold in the fall here."),
        phrase("Yo uso un abrigo por la noche.", "I wear a coat at night."),
        phrase("¿Hace viento en invierno?", "Is it windy in the winter?"),
        phrase("Hace buen tiempo, ¿no crees?", "The weather is nice, don't you think?"),
        phrase("Sí, hace calor en verano.", "Yes, it is hot in the summer."),
    ),
    tip(
        "Weather expressions with “hacer”",
        "Spanish uses hace (from hacer, “to make/do”) for many weather expressions. Unlike "
        "English, there's no subject like “it.”",
        term("Hace frío", "It's cold"),
        term("Hace viento", "It's windy"),
        highlights=("hace", "hacer"),
    ),
    tip(
        "Seasons and months with “en”",
        "Use en to say “in” with seasons and months.",
        example("Hace frío en otoño.", "It's cold in autumn."),
        highlights=("en",),
    ),
    tip(
        "Yes/no questions",
        "To form a yes/no question, you can simply use statement word order with rising "
        "intonation. No extra words like “do” are needed.",
        example("¿Estudias árabe?", "Do you study Arabic?"),
        example("¿Es de Italia?", "Is he/she from Italy?"),
    ),
)

UNIT_10 = guidebook(
    key_phrases(
        phrase("Quiero una botella de agua, por favor.", "I want a bottle of water, please."),
        phrase(
            "¿Cuánto cuesta una piña en tu mercado?", "How much does a pineapple cost at your market?"
        ),
        phrase("Yo necesito dos duraznos.", "I need two peaches."),
        phrase("Hay un mercado aquí.", "There is a market here."),
        phrase("Sí, yo necesito tres piñas.", "Yes, I need three pineapples."),
    ),
    tip(
        "Plural nouns",
        "For nouns ending in a vowel, simply add -s to form the plural.",
        term("piña", "piñas"),
        term("sandía", "sandías"),
        term("mango", "mangos"),
        headings=("Singular", "Plural"),
        highlights=("-s",),
    ),
    tip(
        "Asking yes/no questions",
        "In Spanish, you can form a yes/no question simply by changing your intonation—no need to "
        "change the word order. In writing, just add question marks.",
        example("¿Estudias árabe?", "Do you study Arabic?"),
        example("¿Tú pintas bien?", "Do you paint well?"),
    ),
    tip(
        "Hay (there is / there are)",
        "Use hay to express “there is” or “there are.” The same form is used for both singular "
        "and plural.",
        example("Hay un mango aquí.", "There is a mango here."),
        example("Hay dos mercados cerca.", "There are two markets nearby."),
        highlights=("hay", "Hay"),
    ),
)
