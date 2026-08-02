/**
 * iBots Data - 77 AI Personalities in 7 Categories
 * Each category has 11 iBots representing world-renowned experts
 */

export interface IBot {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  specialty: string;
  description: string;
  avatar: string;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  color: string;
  icon: string;
  count: number;
}

export const categories: Category[] = [
  {
    id: "sales",
    name: "Prodej & Byznys",
    nameEn: "Sales & Business",
    description: "Strategie prodeje, škálování byznysu a growth hacking",
    color: "#D4AF37",
    icon: "Target",
    count: 11
  },
  {
    id: "therapy",
    name: "Terapie & Mindset",
    nameEn: "Therapy & Mindset",
    description: "Psychologie, osobní rozvoj a mentální zdraví",
    color: "#E879F9",
    icon: "Heart",
    count: 11
  },
  {
    id: "leadership",
    name: "Leadershíp",
    nameEn: "Leadership",
    description: "Vedení týmů, motivace a strategické myšlení",
    color: "#60A5FA",
    icon: "Crown",
    count: 11
  },
  {
    id: "wealth",
    name: "Bohatství & Finance",
    nameEn: "Wealth & Finance",
    description: "Investice, finanční svoboda a budování bohatství",
    color: "#34D399",
    icon: "Coins",
    count: 11
  },
  {
    id: "spirituality",
    name: "Spiritualita",
    nameEn: "Spirituality",
    description: "Duchovní růst, meditace a vnitřní mír",
    color: "#A78BFA",
    icon: "Sparkles",
    count: 11
  },
  {
    id: "health",
    name: "Zdraví & Wellness",
    nameEn: "Health & Wellness",
    description: "Fyzické zdraví, biohacking a optimalizace výkonu",
    color: "#F87171",
    icon: "Activity",
    count: 11
  },
  {
    id: "creativity",
    name: "Kreativita",
    nameEn: "Creativity",
    description: "Kreativní myšlení, umění a inovace",
    color: "#FBBF24",
    icon: "Lightbulb",
    count: 11
  }
];

export const ibots: IBot[] = [
  // SALES & BUSINESS (11)
  {
    id: "alex-hormozi",
    name: "Alex Hormozi",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Business Growth & Offers",
    description: "Autor $100M Offers. Specialista na tvorbu neodolatelných nabídek a škálování byznysu.",
    avatar: "🚀",
    tags: ["offers", "scaling", "gym launch", "acquisition"]
  },
  {
    id: "grant-cardone",
    name: "Grant Cardone",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Sales Mastery",
    description: "10X Rule autor. Expert na prodejní techniky a agresivní růst.",
    avatar: "💪",
    tags: ["sales", "10x", "real estate", "closing"]
  },
  {
    id: "russell-brunson",
    name: "Russell Brunson",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Funnels & Marketing",
    description: "Zakladatel ClickFunnels. Mistr prodejních funnelů a online marketingu.",
    avatar: "🎯",
    tags: ["funnels", "marketing", "copywriting", "webinars"]
  },
  {
    id: "gary-vaynerchuk",
    name: "Gary Vaynerchuk",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Social Media & Branding",
    description: "CEO VaynerMedia. Expert na sociální média a osobní branding.",
    avatar: "📱",
    tags: ["social media", "branding", "hustle", "content"]
  },
  {
    id: "dan-kennedy",
    name: "Dan Kennedy",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Direct Response Marketing",
    description: "Legenda direct response marketingu. Autor No B.S. série.",
    avatar: "✉️",
    tags: ["copywriting", "direct mail", "marketing", "persuasion"]
  },
  {
    id: "sam-ovens",
    name: "Sam Ovens",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Consulting Business",
    description: "Zakladatel Consulting.com. Expert na budování konzultačního byznysu.",
    avatar: "💼",
    tags: ["consulting", "coaching", "high-ticket", "systems"]
  },
  {
    id: "frank-kern",
    name: "Frank Kern",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Internet Marketing",
    description: "Pionýr internetového marketingu. Specialista na automatizaci prodeje.",
    avatar: "🌐",
    tags: ["automation", "launches", "email", "webinars"]
  },
  {
    id: "tai-lopez",
    name: "Tai Lopez",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Knowledge Business",
    description: "Investor a podnikatel. Expert na monetizaci znalostí.",
    avatar: "📚",
    tags: ["knowledge", "courses", "investing", "lifestyle"]
  },
  {
    id: "patrick-bet-david",
    name: "Patrick Bet-David",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Entrepreneurship",
    description: "Zakladatel Valuetainment. Expert na podnikatelské strategie.",
    avatar: "🎬",
    tags: ["entrepreneurship", "strategy", "leadership", "insurance"]
  },
  {
    id: "jordan-belfort",
    name: "Jordan Belfort",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Straight Line Selling",
    description: "Wolf of Wall Street. Tvůrce Straight Line Persuasion systému.",
    avatar: "🐺",
    tags: ["persuasion", "closing", "tonality", "sales"]
  },
  {
    id: "leila-hormozi",
    name: "Leila Hormozi",
    category: "Sales & Business",
    categoryId: "sales",
    specialty: "Operations & Scaling",
    description: "CEO Acquisition.com. Expertka na operace a škálování firem.",
    avatar: "👑",
    tags: ["operations", "hiring", "scaling", "systems"]
  },

  // THERAPY & MINDSET (11)
  {
    id: "carl-jung",
    name: "Carl Jung",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Shadow Work & Archetypes",
    description: "Zakladatel analytické psychologie. Expert na práci se stínem a archetypy.",
    avatar: "🧠",
    tags: ["shadow", "archetypes", "dreams", "unconscious"]
  },
  {
    id: "sigmund-freud",
    name: "Sigmund Freud",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Psychoanalysis",
    description: "Otec psychoanalýzy. Expert na nevědomí a interpretaci snů.",
    avatar: "🛋️",
    tags: ["psychoanalysis", "dreams", "ego", "id"]
  },
  {
    id: "jordan-peterson",
    name: "Jordan Peterson",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Personal Responsibility",
    description: "Klinický psycholog. Autor 12 Rules for Life.",
    avatar: "🦞",
    tags: ["responsibility", "meaning", "order", "chaos"]
  },
  {
    id: "brene-brown",
    name: "Brené Brown",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Vulnerability & Courage",
    description: "Výzkumnice zranitelnosti. Expertka na odvahu a autenticitu.",
    avatar: "❤️",
    tags: ["vulnerability", "shame", "courage", "connection"]
  },
  {
    id: "gabor-mate",
    name: "Gabor Maté",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Trauma & Addiction",
    description: "Expert na trauma a závislosti. Autor When the Body Says No.",
    avatar: "🩺",
    tags: ["trauma", "addiction", "attachment", "healing"]
  },
  {
    id: "esther-perel",
    name: "Esther Perel",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Relationships",
    description: "Terapeutka vztahů. Expertka na intimitu a nevěru.",
    avatar: "💑",
    tags: ["relationships", "intimacy", "desire", "infidelity"]
  },
  {
    id: "viktor-frankl",
    name: "Viktor Frankl",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Meaning & Logotherapy",
    description: "Zakladatel logoterapie. Autor Man's Search for Meaning.",
    avatar: "✨",
    tags: ["meaning", "purpose", "suffering", "logotherapy"]
  },
  {
    id: "albert-ellis",
    name: "Albert Ellis",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Rational Thinking",
    description: "Zakladatel REBT. Expert na racionální myšlení.",
    avatar: "🎯",
    tags: ["rational", "beliefs", "emotions", "behavior"]
  },
  {
    id: "irvin-yalom",
    name: "Irvin Yalom",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Existential Therapy",
    description: "Existenciální terapeut. Expert na smrt, svobodu a izolaci.",
    avatar: "🌌",
    tags: ["existential", "death", "freedom", "meaning"]
  },
  {
    id: "marshall-rosenberg",
    name: "Marshall Rosenberg",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Nonviolent Communication",
    description: "Tvůrce NVC. Expert na empatickou komunikaci.",
    avatar: "🕊️",
    tags: ["communication", "empathy", "needs", "feelings"]
  },
  {
    id: "david-burns",
    name: "David Burns",
    category: "Therapy & Mindset",
    categoryId: "therapy",
    specialty: "Cognitive Therapy",
    description: "Autor Feeling Good. Expert na kognitivní terapii deprese.",
    avatar: "😊",
    tags: ["depression", "anxiety", "cognitive", "distortions"]
  },

  // LEADERSHIP (11)
  {
    id: "tony-robbins",
    name: "Tony Robbins",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Peak Performance",
    description: "Světový lídr osobního rozvoje. Expert na transformaci a motivaci.",
    avatar: "⚡",
    tags: ["motivation", "state", "strategy", "story"]
  },
  {
    id: "simon-sinek",
    name: "Simon Sinek",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Purpose & Why",
    description: "Autor Start With Why. Expert na inspirativní leadership.",
    avatar: "🎯",
    tags: ["why", "purpose", "trust", "infinite game"]
  },
  {
    id: "john-maxwell",
    name: "John Maxwell",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Leadership Development",
    description: "Autor 21 Laws of Leadership. Expert na rozvoj lídrů.",
    avatar: "📈",
    tags: ["influence", "growth", "team", "character"]
  },
  {
    id: "jocko-willink",
    name: "Jocko Willink",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Extreme Ownership",
    description: "Bývalý Navy SEAL. Expert na disciplínu a odpovědnost.",
    avatar: "🎖️",
    tags: ["discipline", "ownership", "military", "decentralized"]
  },
  {
    id: "brene-brown-leadership",
    name: "Brené Brown",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Brave Leadership",
    description: "Autorka Dare to Lead. Expertka na odvážné vedení.",
    avatar: "🦁",
    tags: ["brave", "vulnerability", "trust", "values"]
  },
  {
    id: "ray-dalio",
    name: "Ray Dalio",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Principles-Based Leadership",
    description: "Zakladatel Bridgewater. Expert na principy a radikální transparentnost.",
    avatar: "📊",
    tags: ["principles", "transparency", "meritocracy", "mistakes"]
  },
  {
    id: "jim-collins",
    name: "Jim Collins",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Good to Great",
    description: "Autor Good to Great. Expert na transformaci firem.",
    avatar: "🚀",
    tags: ["flywheel", "hedgehog", "level 5", "discipline"]
  },
  {
    id: "peter-drucker",
    name: "Peter Drucker",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Management",
    description: "Otec moderního managementu. Expert na efektivitu.",
    avatar: "📋",
    tags: ["management", "effectiveness", "innovation", "knowledge"]
  },
  {
    id: "stephen-covey",
    name: "Stephen Covey",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "7 Habits",
    description: "Autor 7 Habits. Expert na osobní efektivitu.",
    avatar: "⭐",
    tags: ["habits", "proactive", "synergy", "win-win"]
  },
  {
    id: "marcus-aurelius",
    name: "Marcus Aurelius",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Stoic Leadership",
    description: "Římský císař a filosof. Expert na stoickou moudrost.",
    avatar: "🏛️",
    tags: ["stoicism", "virtue", "control", "duty"]
  },
  {
    id: "sun-tzu",
    name: "Sun Tzu",
    category: "Leadership",
    categoryId: "leadership",
    specialty: "Strategic Thinking",
    description: "Autor Art of War. Expert na strategii a taktiku.",
    avatar: "⚔️",
    tags: ["strategy", "warfare", "deception", "terrain"]
  },

  // WEALTH & FINANCE (11)
  {
    id: "warren-buffett",
    name: "Warren Buffett",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Value Investing",
    description: "Oracle of Omaha. Expert na hodnotové investování.",
    avatar: "💰",
    tags: ["value", "compounding", "moat", "patience"]
  },
  {
    id: "charlie-munger",
    name: "Charlie Munger",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Mental Models",
    description: "Partner Warrena Buffetta. Expert na mentální modely.",
    avatar: "🧠",
    tags: ["mental models", "inversion", "multidisciplinary", "rationality"]
  },
  {
    id: "ray-dalio-wealth",
    name: "Ray Dalio",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Macro Investing",
    description: "Zakladatel největšího hedge fondu. Expert na ekonomické cykly.",
    avatar: "📈",
    tags: ["cycles", "diversification", "debt", "all-weather"]
  },
  {
    id: "robert-kiyosaki",
    name: "Robert Kiyosaki",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Financial Education",
    description: "Autor Rich Dad Poor Dad. Expert na finanční gramotnost.",
    avatar: "🏠",
    tags: ["assets", "liabilities", "cashflow", "real estate"]
  },
  {
    id: "dave-ramsey",
    name: "Dave Ramsey",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Debt Freedom",
    description: "Expert na oddlužení. Tvůrce Baby Steps systému.",
    avatar: "💳",
    tags: ["debt", "budget", "emergency fund", "snowball"]
  },
  {
    id: "peter-lynch",
    name: "Peter Lynch",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Stock Picking",
    description: "Legendární správce Magellan Fund. Expert na výběr akcií.",
    avatar: "📊",
    tags: ["stocks", "research", "growth", "tenbagger"]
  },
  {
    id: "benjamin-graham",
    name: "Benjamin Graham",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Security Analysis",
    description: "Otec hodnotového investování. Autor Intelligent Investor.",
    avatar: "📚",
    tags: ["margin of safety", "intrinsic value", "mr market", "analysis"]
  },
  {
    id: "naval-ravikant",
    name: "Naval Ravikant",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Wealth Creation",
    description: "Angel investor. Expert na leverage a specifické znalosti.",
    avatar: "🚀",
    tags: ["leverage", "specific knowledge", "judgment", "equity"]
  },
  {
    id: "morgan-housel",
    name: "Morgan Housel",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Psychology of Money",
    description: "Autor Psychology of Money. Expert na behaviorální finance.",
    avatar: "🎭",
    tags: ["behavior", "luck", "risk", "compounding"]
  },
  {
    id: "ramit-sethi",
    name: "Ramit Sethi",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Personal Finance",
    description: "Autor I Will Teach You To Be Rich. Expert na automatizaci financí.",
    avatar: "💎",
    tags: ["automation", "conscious spending", "negotiation", "systems"]
  },
  {
    id: "george-soros",
    name: "George Soros",
    category: "Wealth & Finance",
    categoryId: "wealth",
    specialty: "Reflexivity",
    description: "Legendární hedge fund manager. Expert na reflexivitu trhů.",
    avatar: "🌍",
    tags: ["reflexivity", "macro", "currencies", "boom-bust"]
  },

  // SPIRITUALITY (11)
  {
    id: "eckhart-tolle",
    name: "Eckhart Tolle",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Presence & Now",
    description: "Autor Power of Now. Expert na přítomný okamžik.",
    avatar: "🧘",
    tags: ["presence", "ego", "pain body", "consciousness"]
  },
  {
    id: "dalai-lama",
    name: "Dalai Lama",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Compassion",
    description: "Duchovní vůdce tibetského buddhismu. Expert na soucit.",
    avatar: "☸️",
    tags: ["compassion", "happiness", "peace", "wisdom"]
  },
  {
    id: "thich-nhat-hanh",
    name: "Thich Nhat Hanh",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Mindfulness",
    description: "Zen mistr. Expert na všímavost a meditaci.",
    avatar: "🪷",
    tags: ["mindfulness", "breathing", "walking", "interbeing"]
  },
  {
    id: "ram-dass",
    name: "Ram Dass",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Be Here Now",
    description: "Autor Be Here Now. Expert na duchovní probuzení.",
    avatar: "🕉️",
    tags: ["awareness", "love", "service", "guru"]
  },
  {
    id: "alan-watts",
    name: "Alan Watts",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Eastern Philosophy",
    description: "Filosof a interpret východní moudrosti pro Západ.",
    avatar: "☯️",
    tags: ["zen", "tao", "ego", "play"]
  },
  {
    id: "sadhguru",
    name: "Sadhguru",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Inner Engineering",
    description: "Jogín a mystik. Expert na vnitřní transformaci.",
    avatar: "🙏",
    tags: ["yoga", "meditation", "inner engineering", "consciousness"]
  },
  {
    id: "deepak-chopra",
    name: "Deepak Chopra",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Mind-Body Connection",
    description: "Expert na spojení mysli a těla. Autor mnoha bestsellerů.",
    avatar: "✨",
    tags: ["quantum", "healing", "meditation", "ayurveda"]
  },
  {
    id: "michael-singer",
    name: "Michael Singer",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Untethered Soul",
    description: "Autor Untethered Soul. Expert na vnitřní svobodu.",
    avatar: "🦋",
    tags: ["surrender", "witness", "energy", "freedom"]
  },
  {
    id: "rupert-spira",
    name: "Rupert Spira",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Non-Duality",
    description: "Učitel neduality. Expert na povahu vědomí.",
    avatar: "💫",
    tags: ["awareness", "non-duality", "consciousness", "presence"]
  },
  {
    id: "mooji",
    name: "Mooji",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Self-Inquiry",
    description: "Duchovní učitel. Expert na sebezkoumání.",
    avatar: "🌟",
    tags: ["self-inquiry", "being", "silence", "truth"]
  },
  {
    id: "adyashanti",
    name: "Adyashanti",
    category: "Spirituality",
    categoryId: "spirituality",
    specialty: "Awakening",
    description: "Americký duchovní učitel. Expert na probuzení.",
    avatar: "🌅",
    tags: ["awakening", "liberation", "truth", "embodiment"]
  },

  // HEALTH & WELLNESS (11)
  {
    id: "andrew-huberman",
    name: "Andrew Huberman",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Neuroscience",
    description: "Neurovědec ze Stanfordu. Expert na optimalizaci mozku.",
    avatar: "🔬",
    tags: ["neuroscience", "sleep", "focus", "dopamine"]
  },
  {
    id: "peter-attia",
    name: "Peter Attia",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Longevity",
    description: "Lékař zaměřený na dlouhověkost. Expert na metabolické zdraví.",
    avatar: "⏳",
    tags: ["longevity", "metabolic", "exercise", "nutrition"]
  },
  {
    id: "david-sinclair",
    name: "David Sinclair",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Anti-Aging",
    description: "Harvardský profesor. Expert na biologii stárnutí.",
    avatar: "🧬",
    tags: ["aging", "sirtuins", "nad", "epigenetics"]
  },
  {
    id: "rhonda-patrick",
    name: "Rhonda Patrick",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Nutrition Science",
    description: "Biomedical scientist. Expertka na nutriční vědu.",
    avatar: "🥗",
    tags: ["nutrition", "micronutrients", "sauna", "cold"]
  },
  {
    id: "wim-hof",
    name: "Wim Hof",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Cold & Breathing",
    description: "The Iceman. Expert na dechové techniky a otužování.",
    avatar: "❄️",
    tags: ["cold", "breathing", "immune", "mindset"]
  },
  {
    id: "ben-greenfield",
    name: "Ben Greenfield",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Biohacking",
    description: "Biohacker a fitness expert. Specialista na optimalizaci výkonu.",
    avatar: "🏃",
    tags: ["biohacking", "fitness", "supplements", "recovery"]
  },
  {
    id: "mark-hyman",
    name: "Mark Hyman",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Functional Medicine",
    description: "Průkopník funkční medicíny. Expert na root cause přístup.",
    avatar: "🩺",
    tags: ["functional", "gut", "inflammation", "detox"]
  },
  {
    id: "matthew-walker",
    name: "Matthew Walker",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Sleep Science",
    description: "Autor Why We Sleep. Expert na vědu o spánku.",
    avatar: "😴",
    tags: ["sleep", "dreams", "circadian", "memory"]
  },
  {
    id: "jason-fung",
    name: "Jason Fung",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Fasting",
    description: "Nefrolog. Expert na intermitentní půst a diabetes.",
    avatar: "⏰",
    tags: ["fasting", "insulin", "diabetes", "obesity"]
  },
  {
    id: "david-goggins",
    name: "David Goggins",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Mental Toughness",
    description: "Ultra-maratonec a Navy SEAL. Expert na mentální odolnost.",
    avatar: "🔥",
    tags: ["discipline", "suffering", "callusing", "accountability"]
  },
  {
    id: "kelly-starrett",
    name: "Kelly Starrett",
    category: "Health & Wellness",
    categoryId: "health",
    specialty: "Mobility",
    description: "Fyzioterapeut. Expert na mobilitu a prevenci zranění.",
    avatar: "🤸",
    tags: ["mobility", "movement", "pain", "performance"]
  },

  // CREATIVITY (11)
  {
    id: "seth-godin",
    name: "Seth Godin",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Marketing & Ideas",
    description: "Marketing guru. Expert na šíření nápadů a Purple Cow.",
    avatar: "💡",
    tags: ["marketing", "tribes", "permission", "remarkable"]
  },
  {
    id: "steven-pressfield",
    name: "Steven Pressfield",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Overcoming Resistance",
    description: "Autor War of Art. Expert na překonávání odporu.",
    avatar: "⚔️",
    tags: ["resistance", "muse", "professional", "creativity"]
  },
  {
    id: "austin-kleon",
    name: "Austin Kleon",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Creative Stealing",
    description: "Autor Steal Like an Artist. Expert na kreativní proces.",
    avatar: "🎨",
    tags: ["stealing", "remix", "show work", "creativity"]
  },
  {
    id: "james-clear",
    name: "James Clear",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Atomic Habits",
    description: "Autor Atomic Habits. Expert na budování návyků.",
    avatar: "⚛️",
    tags: ["habits", "systems", "identity", "improvement"]
  },
  {
    id: "tim-ferriss",
    name: "Tim Ferriss",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Lifestyle Design",
    description: "Autor 4-Hour Work Week. Expert na životní design.",
    avatar: "🎯",
    tags: ["lifestyle", "learning", "experiments", "optimization"]
  },
  {
    id: "elizabeth-gilbert",
    name: "Elizabeth Gilbert",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Big Magic",
    description: "Autorka Eat Pray Love. Expertka na kreativní život.",
    avatar: "✨",
    tags: ["creativity", "curiosity", "fear", "passion"]
  },
  {
    id: "rick-rubin",
    name: "Rick Rubin",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Creative Act",
    description: "Legendární producent. Expert na kreativní proces.",
    avatar: "🎵",
    tags: ["music", "awareness", "source", "craft"]
  },
  {
    id: "david-lynch",
    name: "David Lynch",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Catching Ideas",
    description: "Filmový režisér. Expert na meditaci a kreativitu.",
    avatar: "🎬",
    tags: ["meditation", "ideas", "intuition", "art"]
  },
  {
    id: "julia-cameron",
    name: "Julia Cameron",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Artist's Way",
    description: "Autorka Artist's Way. Expertka na kreativní obnovu.",
    avatar: "📝",
    tags: ["morning pages", "artist date", "blocks", "recovery"]
  },
  {
    id: "csikszentmihalyi",
    name: "Mihaly Csikszentmihalyi",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Flow State",
    description: "Otec konceptu Flow. Expert na optimální prožívání.",
    avatar: "🌊",
    tags: ["flow", "creativity", "happiness", "engagement"]
  },
  {
    id: "brene-brown-creativity",
    name: "Brené Brown",
    category: "Creativity",
    categoryId: "creativity",
    specialty: "Creative Courage",
    description: "Expertka na zranitelnost v kreativním procesu.",
    avatar: "❤️",
    tags: ["vulnerability", "shame", "creativity", "courage"]
  }
];

export const getIBotsByCategory = (categoryId: string): IBot[] => {
  return ibots.filter(bot => bot.categoryId === categoryId);
};

export const getIBotById = (id: string): IBot | undefined => {
  return ibots.find(bot => bot.id === id);
};

export const searchIBots = (query: string): IBot[] => {
  const lowercaseQuery = query.toLowerCase();
  return ibots.filter(bot => 
    bot.name.toLowerCase().includes(lowercaseQuery) ||
    bot.specialty.toLowerCase().includes(lowercaseQuery) ||
    bot.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};
