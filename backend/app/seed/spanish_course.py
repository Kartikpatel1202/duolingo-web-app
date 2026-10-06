"""Seed content: Spanish for English speakers — 3 units × 3 skills × 2 lessons × 7 exercises."""

from app.seed.specs import CourseSpec, LessonSpec, Sentence, SkillSpec, UnitSpec, Word

GREETINGS = SkillSpec(
    title="Greetings",
    icon="wave",
    description="Say hello, goodbye and thank you.",
    lessons=(
        LessonSpec(
            title="Hello!",
            words=(
                Word("hola", "hello", "👋"),
                Word("adiós", "goodbye", "🚶"),
                Word("gracias", "thank you", "🙏"),
                Word("por favor", "please", "🙂"),
            ),
            sentences=(
                Sentence(
                    "Hola, me llamo Ana.",
                    "Hello, my name is Ana.",
                    blank="llamo",
                    en_alt=("Hi, my name is Ana.",),
                    tip='"Me llamo" literally means "I call myself".',
                ),
                Sentence("Buenos días, señor.", "Good morning, sir.", blank="días"),
                Sentence(
                    "Muchas gracias.",
                    "Thank you very much.",
                    blank="gracias",
                    en_alt=("Thanks a lot.", "Many thanks."),
                ),
            ),
        ),
        LessonSpec(
            title="How are you?",
            words=(
                Word("sí", "yes", "✅"),
                Word("no", "no", "❌"),
                Word("buenas noches", "good night", "🌙"),
                Word("mañana", "tomorrow", "📅"),
            ),
            sentences=(
                Sentence("¿Cómo estás?", "How are you?", blank="estás"),
                Sentence(
                    "Estoy bien, gracias.",
                    "I am fine, thank you.",
                    blank="bien",
                    en_alt=("I'm fine, thank you.", "I am well, thank you.", "I am fine, thanks."),
                    tip='Use "estar" (estoy) for how you feel right now.',
                ),
                Sentence(
                    "Hasta mañana.",
                    "See you tomorrow.",
                    blank="mañana",
                    en_alt=("Until tomorrow.",),
                ),
            ),
        ),
    ),
)

PEOPLE = SkillSpec(
    title="People",
    icon="person",
    description="Talk about people and family.",
    lessons=(
        LessonSpec(
            title="Man and woman",
            words=(
                Word("el hombre", "the man", "👨"),
                Word("la mujer", "the woman", "👩"),
                Word("el niño", "the boy", "👦"),
                Word("la niña", "the girl", "👧"),
            ),
            sentences=(
                Sentence("Yo soy un hombre.", "I am a man.", blank="soy", en_alt=("I'm a man.",)),
                Sentence(
                    "Ella es una mujer.", "She is a woman.", blank="una", en_alt=("She's a woman.",)
                ),
                Sentence("El niño y la niña.", "The boy and the girl.", blank="y"),
            ),
        ),
        LessonSpec(
            title="Family",
            words=(
                Word("el amigo", "the friend", "🤝"),
                Word("la familia", "the family", "👪"),
                Word("el padre", "the father", "👨‍👧"),
                Word("la madre", "the mother", "👩‍👧"),
            ),
            sentences=(
                Sentence(
                    "Él es mi amigo.",
                    "He is my friend.",
                    blank="amigo",
                    en_alt=("He's my friend.",),
                ),
                Sentence("Mi madre es alta.", "My mother is tall.", blank="alta"),
                Sentence(
                    "Tengo una familia grande.",
                    "I have a big family.",
                    blank="familia",
                    es_alt=("Yo tengo una familia grande.",),
                    en_alt=("I have a large family.",),
                ),
            ),
        ),
    ),
)

FOOD = SkillSpec(
    title="Food",
    icon="apple",
    description="Order food and drinks.",
    lessons=(
        LessonSpec(
            title="Bread and water",
            words=(
                Word("la manzana", "the apple", "🍎"),
                Word("el pan", "the bread", "🍞"),
                Word("el agua", "the water", "💧"),
                Word("la leche", "the milk", "🥛"),
            ),
            sentences=(
                Sentence(
                    "Yo como pan.",
                    "I eat bread.",
                    blank="como",
                    en_alt=("I am eating bread.", "I'm eating bread."),
                ),
                Sentence(
                    "Ella bebe agua.",
                    "She drinks water.",
                    blank="bebe",
                    en_alt=("She is drinking water.",),
                    tip='"Agua" is feminine, but takes "el" because it starts with a stressed "a".',
                ),
                Sentence("La manzana es roja.", "The apple is red.", blank="roja"),
            ),
        ),
        LessonSpec(
            title="At the café",
            words=(
                Word("el café", "the coffee", "☕"),
                Word("el queso", "the cheese", "🧀"),
                Word("la sopa", "the soup", "🍲"),
                Word("el pollo", "the chicken", "🍗"),
            ),
            sentences=(
                Sentence(
                    "Quiero un café, por favor.",
                    "I want a coffee, please.",
                    blank="Quiero",
                    en_alt=("I would like a coffee, please.", "I'd like a coffee, please."),
                ),
                Sentence("La sopa está caliente.", "The soup is hot.", blank="caliente"),
                Sentence(
                    "Nosotros comemos pollo.",
                    "We eat chicken.",
                    blank="comemos",
                    es_alt=("Comemos pollo.",),
                    en_alt=("We are eating chicken.",),
                ),
            ),
        ),
    ),
)

HOME = SkillSpec(
    title="Home",
    icon="house",
    description="Describe your home.",
    lessons=(
        LessonSpec(
            title="My house",
            words=(
                Word("la casa", "the house", "🏠"),
                Word("la puerta", "the door", "🚪"),
                Word("la mesa", "the table", "🍽️"),
                Word("la cama", "the bed", "🛏️"),
            ),
            sentences=(
                Sentence(
                    "Mi casa es pequeña.",
                    "My house is small.",
                    blank="pequeña",
                    en_alt=("My home is small.",),
                ),
                Sentence("La puerta está abierta.", "The door is open.", blank="abierta"),
                Sentence(
                    "El gato duerme en la cama.",
                    "The cat sleeps on the bed.",
                    blank="cama",
                    en_alt=("The cat sleeps in the bed.", "The cat is sleeping on the bed."),
                ),
            ),
        ),
        LessonSpec(
            title="Rooms",
            words=(
                Word("la cocina", "the kitchen", "🍳"),
                Word("el baño", "the bathroom", "🛁"),
                Word("la ventana", "the window", "🪟"),
                Word("la silla", "the chair", "🪑"),
            ),
            sentences=(
                Sentence(
                    "La cocina es grande.",
                    "The kitchen is big.",
                    blank="grande",
                    en_alt=("The kitchen is large.",),
                ),
                Sentence(
                    "Abro la ventana.",
                    "I open the window.",
                    blank="ventana",
                    es_alt=("Yo abro la ventana.",),
                    en_alt=("I am opening the window.", "I'm opening the window."),
                ),
                Sentence(
                    "¿Dónde está el baño?",
                    "Where is the bathroom?",
                    blank="está",
                    en_alt=("Where's the bathroom?",),
                ),
            ),
        ),
    ),
)

ANIMALS = SkillSpec(
    title="Animals",
    icon="paw",
    description="Name animals and what they do.",
    lessons=(
        LessonSpec(
            title="Pets",
            words=(
                Word("el perro", "the dog", "🐶"),
                Word("el gato", "the cat", "🐱"),
                Word("el pájaro", "the bird", "🐦"),
                Word("el caballo", "the horse", "🐴"),
            ),
            sentences=(
                Sentence(
                    "El perro come.", "The dog eats.", blank="perro", en_alt=("The dog is eating.",)
                ),
                Sentence(
                    "Tengo un gato negro.",
                    "I have a black cat.",
                    blank="negro",
                    es_alt=("Yo tengo un gato negro.",),
                    tip="In Spanish, colours usually come after the noun.",
                ),
                Sentence(
                    "El pájaro canta.",
                    "The bird sings.",
                    blank="canta",
                    en_alt=("The bird is singing.",),
                ),
            ),
        ),
        LessonSpec(
            title="On the farm",
            words=(
                Word("el pez", "the fish", "🐟"),
                Word("la vaca", "the cow", "🐮"),
                Word("el ratón", "the mouse", "🐭"),
                Word("el oso", "the bear", "🐻"),
            ),
            sentences=(
                Sentence(
                    "La vaca bebe agua.",
                    "The cow drinks water.",
                    blank="vaca",
                    en_alt=("The cow is drinking water.",),
                ),
                Sentence(
                    "El oso es grande.",
                    "The bear is big.",
                    blank="oso",
                    en_alt=("The bear is large.",),
                ),
                Sentence(
                    "El ratón come queso.",
                    "The mouse eats cheese.",
                    blank="queso",
                    en_alt=("The mouse is eating cheese.",),
                ),
            ),
        ),
    ),
)

COLORS = SkillSpec(
    title="Colors",
    icon="palette",
    description="Describe things with colours.",
    lessons=(
        LessonSpec(
            title="Primary colors",
            words=(
                Word("rojo", "red", "🔴"),
                Word("azul", "blue", "🔵"),
                Word("verde", "green", "🟢"),
                Word("amarillo", "yellow", "🟡"),
            ),
            sentences=(
                Sentence("El cielo es azul.", "The sky is blue.", blank="azul"),
                Sentence("La casa es verde.", "The house is green.", blank="verde"),
                Sentence(
                    "Me gusta el rojo.",
                    "I like red.",
                    blank="gusta",
                    en_alt=("I like the color red.",),
                ),
            ),
        ),
        LessonSpec(
            title="More colors",
            words=(
                Word("blanco", "white", "⚪"),
                Word("negro", "black", "⚫"),
                Word("rosa", "pink", "🌸"),
                Word("naranja", "orange", "🟠"),
            ),
            sentences=(
                Sentence(
                    "La leche es blanca.",
                    "The milk is white.",
                    blank="blanca",
                    tip='Adjectives agree with the noun: "blanco" becomes "blanca".',
                ),
                Sentence("Mi coche es negro.", "My car is black.", blank="coche"),
                Sentence("Las flores son rosas.", "The flowers are pink.", blank="flores"),
            ),
        ),
    ),
)

TRAVEL = SkillSpec(
    title="Travel",
    icon="plane",
    description="Get around on holiday.",
    lessons=(
        LessonSpec(
            title="Getting there",
            words=(
                Word("el tren", "the train", "🚆"),
                Word("el avión", "the plane", "✈️"),
                Word("el hotel", "the hotel", "🏨"),
                Word("la playa", "the beach", "🏖️"),
            ),
            sentences=(
                Sentence(
                    "Vamos a la playa.",
                    "We are going to the beach.",
                    blank="playa",
                    en_alt=("We're going to the beach.", "Let's go to the beach."),
                ),
                Sentence(
                    "El tren llega tarde.",
                    "The train arrives late.",
                    blank="tarde",
                    en_alt=("The train is late.",),
                ),
                Sentence(
                    "Necesito un hotel.",
                    "I need a hotel.",
                    blank="Necesito",
                    es_alt=("Yo necesito un hotel.",),
                ),
            ),
        ),
        LessonSpec(
            title="Packing",
            words=(
                Word("el pasaporte", "the passport", "🛂"),
                Word("la maleta", "the suitcase", "🧳"),
                Word("el billete", "the ticket", "🎫"),
                Word("el mapa", "the map", "🗺️"),
            ),
            sentences=(
                Sentence(
                    "¿Dónde está mi pasaporte?",
                    "Where is my passport?",
                    blank="pasaporte",
                    en_alt=("Where's my passport?",),
                ),
                Sentence("Mi maleta es pesada.", "My suitcase is heavy.", blank="pesada"),
                Sentence(
                    "Un billete, por favor.",
                    "One ticket, please.",
                    blank="billete",
                    en_alt=("A ticket, please.",),
                ),
            ),
        ),
    ),
)

TIME = SkillSpec(
    title="Time",
    icon="clock",
    description="Days, dates and telling the time.",
    lessons=(
        LessonSpec(
            title="Days",
            words=(
                Word("lunes", "Monday", "1️⃣"),
                Word("martes", "Tuesday", "2️⃣"),
                Word("hoy", "today", "📍"),
                Word("ayer", "yesterday", "⏪"),
            ),
            sentences=(
                Sentence("Hoy es lunes.", "Today is Monday.", blank="lunes"),
                Sentence("Ayer fue martes.", "Yesterday was Tuesday.", blank="fue"),
                Sentence(
                    "Mañana es sábado.",
                    "Tomorrow is Saturday.",
                    blank="sábado",
                    tip="Days of the week are not capitalised in Spanish.",
                ),
            ),
        ),
        LessonSpec(
            title="What time is it?",
            words=(
                Word("el día", "the day", "☀️"),
                Word("la semana", "the week", "🗓️"),
                Word("el mes", "the month", "📆"),
                Word("el año", "the year", "🎆"),
            ),
            sentences=(
                Sentence("¿Qué hora es?", "What time is it?", blank="hora"),
                Sentence(
                    "Son las tres.",
                    "It is three o'clock.",
                    blank="tres",
                    en_alt=("It's three o'clock.", "It is three."),
                ),
                Sentence(
                    "Trabajo todos los días.",
                    "I work every day.",
                    blank="días",
                    es_alt=("Yo trabajo todos los días.",),
                ),
            ),
        ),
    ),
)

SHOPPING = SkillSpec(
    title="Shopping",
    icon="bag",
    description="Buy things and talk about prices.",
    lessons=(
        LessonSpec(
            title="At the store",
            words=(
                Word("la tienda", "the store", "🏪"),
                Word("el dinero", "the money", "💰"),
                Word("la camisa", "the shirt", "👕"),
                Word("los zapatos", "the shoes", "👟"),
            ),
            sentences=(
                Sentence(
                    "¿Cuánto cuesta?",
                    "How much does it cost?",
                    blank="cuesta",
                    en_alt=("How much is it?",),
                ),
                Sentence(
                    "La tienda está cerrada.",
                    "The store is closed.",
                    blank="cerrada",
                    en_alt=("The shop is closed.",),
                ),
                Sentence(
                    "Quiero comprar zapatos.",
                    "I want to buy shoes.",
                    blank="comprar",
                    es_alt=("Yo quiero comprar zapatos.",),
                ),
            ),
        ),
        LessonSpec(
            title="Prices",
            words=(
                Word("barato", "cheap", "🏷️"),
                Word("caro", "expensive", "💎"),
                Word("grande", "big", "🐘"),
                Word("pequeño", "small", "🐭"),
            ),
            sentences=(
                Sentence("Esta camisa es barata.", "This shirt is cheap.", blank="barata"),
                Sentence("Los zapatos son caros.", "The shoes are expensive.", blank="caros"),
                Sentence(
                    "Pago con tarjeta.",
                    "I pay by card.",
                    blank="tarjeta",
                    es_alt=("Yo pago con tarjeta.",),
                    en_alt=("I pay with a card.", "I am paying by card."),
                ),
            ),
        ),
    ),
)

SPANISH_COURSE = CourseSpec(
    slug="es-en",
    title="Spanish",
    learning_language="es",
    from_language="en",
    description="Learn Spanish from English: greetings, food, home, travel and more.",
    units=(
        UnitSpec(
            "Unit 1",
            "Greet people, introduce yourself and order food",
            "leaf",
            (GREETINGS, PEOPLE, FOOD),
        ),
        UnitSpec(
            "Unit 2",
            "Talk about your home, pets and favourite colours",
            "sky",
            (HOME, ANIMALS, COLORS),
        ),
        UnitSpec(
            "Unit 3", "Travel, tell the time and go shopping", "grape", (TRAVEL, TIME, SHOPPING)
        ),
    ),
)
