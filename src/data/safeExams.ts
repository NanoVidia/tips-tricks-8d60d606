// Categorized non-clinical exam packs for SAFE_MODE.
// 100% lifestyle / general-knowledge content. NO medical, NO clinical, NO drug
// names, NO procedures, NO body systems, NO diagnoses. Strictly entertainment.

export type ExamCategoryId =
  | "language"
  | "history"
  | "logic"
  | "communication"
  | "world_culture";

export interface ExamCategory {
  id: ExamCategoryId;
  title: string;
  blurb: string;
  emoji: string;
  questions: SafeExamQuestion[];
}

export interface SafeExamQuestion {
  id: number;
  q: string;
  options: string[];
  answer: number;
  explain?: string;
}

export const SAFE_EXAMS: ExamCategory[] = [
  {
    id: "language",
    title: "Language & Vocabulary",
    blurb: "Words, etymology, idioms",
    emoji: "📚",
    questions: [
      { id: 1, q: "What does the idiom 'break the ice' mean?", options: ["Start a conversation", "Cool a drink", "Cancel a meeting", "Skip a queue"], answer: 0 },
      { id: 2, q: "Which word means 'a strong desire to travel'?", options: ["Solitude", "Wanderlust", "Stagnation", "Reverie"], answer: 1 },
      { id: 3, q: "An 'ephemeral' moment is one that is…", options: ["Loud", "Permanent", "Short-lived", "Painful"], answer: 2 },
      { id: 4, q: "The plural of 'crisis' is…", options: ["Crisises", "Crises", "Crisi", "Crisus"], answer: 1 },
      { id: 5, q: "Which language gives us the word 'kindergarten'?", options: ["French", "Italian", "German", "Dutch"], answer: 2 },
      { id: 6, q: "'Quintessential' most nearly means…", options: ["Old-fashioned", "The most perfect example", "Loudest", "Smallest"], answer: 1 },
      { id: 7, q: "Choose the synonym of 'meticulous':", options: ["Careless", "Thorough", "Loud", "Hasty"], answer: 1 },
      { id: 8, q: "An antonym of 'verbose' is…", options: ["Wordy", "Concise", "Bright", "Cheerful"], answer: 1 },
      { id: 9, q: "What is a palindrome?", options: ["A long poem", "A word read the same backwards", "A type of song", "A foreign loanword"], answer: 1 },
      { id: 10, q: "Which of these is an oxymoron?", options: ["Bittersweet", "Quickly", "Mountain", "Lovely"], answer: 0 },
      { id: 11, q: "'Pen is mightier than the sword' is an example of a…", options: ["Riddle", "Proverb", "Pun", "Limerick"], answer: 1 },
      { id: 12, q: "The word 'robot' originates from which language?", options: ["Russian", "Czech", "Polish", "Greek"], answer: 1 },
    ],
  },
  {
    id: "history",
    title: "History & Civilizations",
    blurb: "People, places, eras",
    emoji: "🏛️",
    questions: [
      { id: 1, q: "Which ancient civilization built Machu Picchu?", options: ["Maya", "Aztec", "Inca", "Olmec"], answer: 2 },
      { id: 2, q: "The Great Wall is located in…", options: ["Japan", "China", "Mongolia", "Korea"], answer: 1 },
      { id: 3, q: "Who painted the ceiling of the Sistine Chapel?", options: ["Raphael", "Donatello", "Michelangelo", "Botticelli"], answer: 2 },
      { id: 4, q: "The Renaissance began in which country?", options: ["France", "Spain", "England", "Italy"], answer: 3 },
      { id: 5, q: "Cleopatra ruled which kingdom?", options: ["Persia", "Egypt", "Rome", "Babylon"], answer: 1 },
      { id: 6, q: "The first humans to land on the Moon arrived in which year?", options: ["1965", "1969", "1972", "1959"], answer: 1 },
      { id: 7, q: "The Eiffel Tower was built for which event?", options: ["Olympics", "World's Fair", "Coronation", "Royal Wedding"], answer: 1 },
      { id: 8, q: "Who wrote 'Romeo and Juliet'?", options: ["Chaucer", "Shakespeare", "Milton", "Dickens"], answer: 1 },
      { id: 9, q: "The Berlin Wall fell in…", options: ["1985", "1989", "1991", "1995"], answer: 1 },
      { id: 10, q: "Which empire was ruled by Suleiman the Magnificent?", options: ["Mughal", "Ottoman", "Persian", "Roman"], answer: 1 },
      { id: 11, q: "Sahara is the largest hot desert on which continent?", options: ["Asia", "Africa", "Australia", "South America"], answer: 1 },
      { id: 12, q: "Who was the first female Prime Minister of the United Kingdom?", options: ["Theresa May", "Margaret Thatcher", "Liz Truss", "Indira Gandhi"], answer: 1 },
    ],
  },
  {
    id: "logic",
    title: "Logic & Brain Teasers",
    blurb: "Patterns, math, reasoning",
    emoji: "🧠",
    questions: [
      { id: 1, q: "Which number comes next: 2, 4, 8, 16, …?", options: ["20", "24", "32", "30"], answer: 2 },
      { id: 2, q: "If all roses are flowers and some flowers fade quickly, then…", options: ["All roses fade quickly", "Some roses might fade quickly", "No roses fade", "All flowers are roses"], answer: 1 },
      { id: 3, q: "A clock shows 3:15. The angle between the hands is closest to…", options: ["0°", "7.5°", "30°", "90°"], answer: 1 },
      { id: 4, q: "Which shape has the most sides?", options: ["Hexagon", "Pentagon", "Octagon", "Heptagon"], answer: 2 },
      { id: 5, q: "Half of a number plus 10 is 25. The number is…", options: ["20", "30", "40", "15"], answer: 1 },
      { id: 6, q: "Which is the odd one out?", options: ["Triangle", "Square", "Circle", "Pentagon"], answer: 2, explain: "All others are polygons; a circle has no straight sides." },
      { id: 7, q: "If today is Wednesday, what day will it be 100 days from now?", options: ["Monday", "Tuesday", "Friday", "Saturday"], answer: 2 },
      { id: 8, q: "What comes next in the pattern: A, C, E, G, …?", options: ["H", "I", "J", "K"], answer: 1 },
      { id: 9, q: "If a train travels 60 km in 1 hour, how far in 2.5 hours?", options: ["120 km", "150 km", "180 km", "100 km"], answer: 1 },
      { id: 10, q: "How many minutes are in a quarter of a day?", options: ["180", "240", "360", "300"], answer: 2 },
    ],
  },
  {
    id: "communication",
    title: "Soft Skills & Communication",
    blurb: "Etiquette, teamwork, listening",
    emoji: "💬",
    questions: [
      { id: 1, q: "Active listening primarily means…", options: ["Talking more", "Fully focusing on the speaker", "Interrupting politely", "Taking detailed notes"], answer: 1 },
      { id: 2, q: "When giving feedback, the 'sandwich' approach pairs criticism with…", options: ["Silence", "Positives", "Jokes", "Numbers"], answer: 1 },
      { id: 3, q: "An effective email subject line should be…", options: ["Vague", "Long", "Clear and specific", "Written in caps"], answer: 2 },
      { id: 4, q: "Which body language signals openness?", options: ["Crossed arms", "Avoiding eye contact", "Open palms", "Looking at phone"], answer: 2 },
      { id: 5, q: "In a team meeting, the best way to disagree is to…", options: ["Stay silent", "Address ideas, not people", "Leave the room", "Send an angry message later"], answer: 1 },
      { id: 6, q: "Empathy is best described as…", options: ["Pity", "Fixing problems for others", "Understanding another's feelings", "Agreeing with everyone"], answer: 2 },
      { id: 7, q: "A SMART goal is Specific, Measurable, Achievable, Relevant, and…", options: ["Tough", "Time-bound", "Tested", "Trendy"], answer: 1 },
      { id: 8, q: "Which is a good open-ended question?", options: ["Did you like it?", "Yes or no?", "What did you enjoy most?", "Are we done?"], answer: 2 },
      { id: 9, q: "A constructive way to handle a conflict is to…", options: ["Avoid the person", "Find common ground", "Win at all costs", "Send a long voice note"], answer: 1 },
      { id: 10, q: "When presenting, the rule of thumb is roughly one slide per…", options: ["15 seconds", "1–2 minutes", "10 minutes", "20 minutes"], answer: 1 },
    ],
  },
  {
    id: "world_culture",
    title: "World Culture & Geography",
    blurb: "Countries, capitals, customs",
    emoji: "🌍",
    questions: [
      { id: 1, q: "The capital of Australia is…", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: 2 },
      { id: 2, q: "Which river runs through Cairo?", options: ["Tigris", "Euphrates", "Nile", "Jordan"], answer: 2 },
      { id: 3, q: "Sushi is a traditional dish of…", options: ["China", "Korea", "Japan", "Thailand"], answer: 2 },
      { id: 4, q: "The currency of the United Kingdom is the…", options: ["Euro", "Pound sterling", "Krona", "Franc"], answer: 1 },
      { id: 5, q: "Mount Kilimanjaro is in which country?", options: ["Kenya", "Tanzania", "Uganda", "Ethiopia"], answer: 1 },
      { id: 6, q: "Flamenco music originated in…", options: ["Portugal", "Italy", "Spain", "Mexico"], answer: 2 },
      { id: 7, q: "The Amazon rainforest is mostly in which country?", options: ["Peru", "Colombia", "Venezuela", "Brazil"], answer: 3 },
      { id: 8, q: "Which country is famous for the tulip festival?", options: ["Belgium", "Netherlands", "Sweden", "Denmark"], answer: 1 },
      { id: 9, q: "Petra, the ancient rose-red city, is located in…", options: ["Egypt", "Jordan", "Iraq", "Lebanon"], answer: 1 },
      { id: 10, q: "Which sea is the saltiest large body of water on Earth?", options: ["Red Sea", "Dead Sea", "Black Sea", "Caspian Sea"], answer: 1 },
      { id: 11, q: "The Taj Mahal is in which Indian city?", options: ["Delhi", "Jaipur", "Agra", "Mumbai"], answer: 2 },
      { id: 12, q: "Which continent has no permanent residents?", options: ["Australia", "Antarctica", "Greenland", "Africa"], answer: 1 },
    ],
  },
];

// ---- Companion robot tips (no clinical content) ----
export const COMPANION_TIPS: string[] = [
  "Take a slow breath before opening your next message — clarity follows calm.",
  "A tidy desk often leads to a tidy mind. Move just one item.",
  "Write down one thing you learned this week. Future-you will smile.",
  "Drink a glass of water — your focus likes it.",
  "Stretch your shoulders for ten seconds. They've been working hard.",
  "Plan tomorrow's first task tonight. Mornings get easier.",
  "Say one kind sentence to yourself in the mirror.",
  "Step away from the screen for two minutes. The world is wider than a window.",
  "Listen to one song that always makes you smile.",
  "Send a thank-you message to someone who helped you recently.",
  "Read one paragraph of a book before scrolling.",
  "Write tomorrow's top three priorities on a sticky note.",
];

// ---- Mood options for the wellness check-in ----
export const MOODS = [
  { id: "great", label: "Great", emoji: "🤩" },
  { id: "good", label: "Good", emoji: "🙂" },
  { id: "okay", label: "Okay", emoji: "😐" },
  { id: "tired", label: "Tired", emoji: "😴" },
  { id: "stressed", label: "Stressed", emoji: "😣" },
] as const;
