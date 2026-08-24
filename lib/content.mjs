export const EXAM_PAGES = [
  {
    slug: "ssc-cgl-typing-test",
    title: "SSC CGL DEST Typing Practice",
    description: "Practice speed, accuracy, punctuation and exam stamina with SSC-style typing sessions.",
    examMode: "ssc",
    tips: [
      "Build accuracy above 95% before chasing speed.",
      "Use full-length sessions regularly so your pace remains stable.",
      "Practice capitals, numbers and punctuation because real office text is rarely plain words only.",
    ],
  },
  {
    slug: "ssc-chsl-typing-test",
    title: "SSC CHSL Typing Practice",
    description: "Structured English typing practice for CHSL aspirants with timed mocks and progress tracking.",
    examMode: "chsl",
    tips: [
      "Keep your wrists relaxed and return fingers to the home row.",
      "Avoid looking at the keyboard during easy passages.",
      "Use the weak-key report after every few sessions.",
    ],
  },
  {
    slug: "railway-typing-test",
    title: "Railway NTPC Typing Practice",
    description: "Timed railway-oriented typing practice with progress history, difficulty filters and mock mode.",
    examMode: "railway",
    tips: [
      "Prefer steady rhythm over bursts of speed.",
      "Repeat moderate passages until your accuracy becomes consistent.",
      "Use strict exam simulation for final-stage preparation.",
    ],
  },
  {
    slug: "banking-typing-test",
    title: "Banking Typing Practice",
    description: "Practice numbers, formal text and accuracy for banking and office-based computer tests.",
    examMode: "bank",
    tips: [
      "Train number-row accuracy along with normal words.",
      "Do not ignore commas, full stops and capital letters.",
      "Review your progress graph weekly instead of judging one test.",
    ],
  },
  {
    slug: "wbpsc-typing-test",
    title: "WBPSC & State PSC Typing Practice",
    description: "Exam-style typing practice for state-level clerical, PSC and police recruitment preparation.",
    examMode: "psc",
    tips: [
      "Use longer passages to build endurance.",
      "Track weak characters and deliberately practise them.",
      "Take one daily challenge to maintain a consistent habit.",
    ],
  },
];

export const LEARN_ARTICLES = [
  {
    slug: "how-to-reach-35-wpm",
    title: "How to Reach 35 WPM Without Sacrificing Accuracy",
    description: "A practical progression from slow accurate typing to reliable exam speed.",
    sections: [
      ["Start with accuracy", "Aim for 95% or better accuracy at a comfortable speed. Repeating mistakes at high speed teaches the wrong movement pattern."],
      ["Use short focused blocks", "Ten to fifteen minutes of deliberate practice is often more useful than a long distracted session. Rotate easy, moderate and hard passages."],
      ["Measure trends", "Judge progress from several recent tests. A single unusually fast or slow attempt is less useful than your average and consistency."],
      ["Build exam stamina", "Once your short-test speed is stable, add full-length exam sessions so concentration remains steady under time pressure."],
    ],
  },
  {
    slug: "improve-typing-accuracy",
    title: "How to Improve Typing Accuracy",
    description: "Reduce repeated mistakes by using weak-key analysis, slower drills and better rhythm.",
    sections: [
      ["Identify patterns", "Look for the letters, spaces, numbers or punctuation marks that appear most often in your mistake report."],
      ["Slow down deliberately", "Reduce speed until the difficult key combination becomes clean. Increase pace only after several accurate repetitions."],
      ["Keep a stable rhythm", "A smooth rhythm produces fewer errors than alternating between very fast bursts and sudden corrections."],
      ["Review weekly", "Use your progress history to check whether accuracy is improving across many tests rather than only one passage."],
    ],
  },
  {
    slug: "touch-typing-home-row-guide",
    title: "Touch Typing Home Row Guide",
    description: "Understand finger placement, return points and practical movement rules for a QWERTY keyboard.",
    sections: [
      ["Home row", "Rest the left fingers on A S D F and the right fingers on J K L ;. The raised marks on F and J help you find position without looking."],
      ["Move one finger at a time", "Reach from the home row using the assigned finger, press the key lightly and return to the home position."],
      ["Use both Shift keys", "For a capital letter, prefer the Shift key on the opposite hand. This keeps the typing hand free to strike the letter."],
      ["Practise troublesome zones", "Numbers, punctuation and the outer columns often need separate practice because they require larger reaches."],
    ],
  },
  {
    slug: "typing-exam-day-checklist",
    title: "Typing Exam Day Checklist",
    description: "A calm, practical checklist for timed computer typing tests.",
    sections: [
      ["Before the test", "Confirm the instructions, permitted corrections, timing method and any required formatting before you begin."],
      ["First minute", "Start slightly below maximum speed. Establish rhythm and verify that your hands are positioned correctly."],
      ["During the test", "Keep your eyes on the source text, avoid panic after a small error and maintain a steady pace."],
      ["Final moments", "If the interface allows review, correct obvious errors without destroying your rhythm or creating new mistakes."],
    ],
  },
  {
    slug: "accuracy-vs-speed",
    title: "Accuracy vs Speed: What Should You Train First?",
    description: "Why exam-ready typing requires both speed and low error rate, and how to balance them.",
    sections: [
      ["Accuracy builds the base", "When key movements are reliable, speed usually rises naturally. High error rates create corrections and reduce effective speed."],
      ["Speed needs controlled pressure", "Once accuracy is stable, short timed sessions can push pace without turning every session into a race."],
      ["Use Net WPM", "Gross WPM shows raw speed, while Net WPM and accuracy better reflect how much usable text you produced."],
      ["Train both", "Use easy passages for speed, moderate passages for consistency and hard passages for punctuation, numbers and control."],
    ],
  },
];

export function findExamPage(slug) {
  return EXAM_PAGES.find((item) => item.slug === slug) || null;
}

export function findLearnArticle(slug) {
  return LEARN_ARTICLES.find((item) => item.slug === slug) || null;
}
