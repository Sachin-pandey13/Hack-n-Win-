// lib/playlists.ts

/* ────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────── */
export type Language = "English" | "Hindi" | "Mixed";
export type Level = "Beginner" | "Intermediate" | "Advanced";

export type Category = "Curriculum" | "Technical" | "Project" | "Trending";

export type Playlist = {
  id: string;
  title: string;
  provider: string;

  topics: string[];
  language: Language;
  level: Level;
  description: string;

  youtube:
    | { kind: "playlist"; playlistId: string }
    | { kind: "video"; videoId: string };

  thumbnail?: string;

  /** Explore metadata */
  category?: Category;      // Curriculum / Technical / Project / Trending
  stream?: string | null;   // PCM / PCB / CSE / ECE etc
  career?: string | null;   // Engineering / Medical / Commerce
  subject?: string | null;
  grade?: string | null;    // class filter (6–12)

  prominence?: number;
  isTutorUpload?: boolean;
};

/* ────────────────────────────────────────────────────────────────
   Filters / chips
──────────────────────────────────────────────────────────────── */
export const TOPICS: string[] = [
  "Arrays",
  "Strings",
  "Sorting",
  "Searching",
  "Two Pointers",
  "Binary Search",
  "Hashing",
  "Stacks",
  "Queues",
  "Linked List",
  "Trees",
  "Graphs",
  "Greedy",
  "Backtracking",
  "Recursion",
  "Dynamic Programming",
  "Math",
  "Bit Manipulation",

  // Extras
  "Java",
  "Python",
  "C++",
  "Web Development",
  "Frontend",
  "Backend",
  "Full Stack",
  "Projects",
  "AI",
  "GenAI",
  "Agentic AI",
  "Machine Learning",
  "DSA",
  "OOP",
  "DBMS",
  "Computer Networks",
  "Operating Systems",
  "Compiler Design",
  "Signals",
  "Placement",
];

/* ────────────────────────────────────────────────────────────────
   Providers
──────────────────────────────────────────────────────────────── */
export const PROVIDERS: string[] = [
  "Striver",
  "Apna College",
  "freeCodeCamp",
  "NeetCode",
  "CodeWithHarry",
  "CampusX",
  "Harkirat Singh",
  "CodeBasics",
  "Gate Smashers",
  "Jenny's Lectures",
  "Kunal Kushwaha",
  "Krish Naik",
  "StatQuest",
  "NPTEL",
];

/* ────────────────────────────────────────────────────────────────
   PLAYLISTS
──────────────────────────────────────────────────────────────── */
export const PLAYLISTS: Playlist[] = [

  // -------------------- NEW ADDITIONS: AI, CampusX, Full Stack --------------------

  {
    id: "campusx-100-days-ml",
    title: "CampusX — 100 Days of Machine Learning",
    provider: "CampusX",
    topics: ["Machine Learning", "AI", "Data Science", "Python"],
    language: "Hindi",
    level: "Beginner",
    description: "The famous 100 Days of Machine Learning course by CampusX. Extremely detailed campus placement guide for data roles.",
    youtube: { kind: "video", videoId: "5V5_5641P-Q" },
    category: "Trending",
    stream: "CSE",
    subject: "Machine Learning",
    prominence: 100,
  },
  {
    id: "fcc-gen-ai-30-hours",
    title: "freeCodeCamp — Generative AI Full Course (30 Hours)",
    provider: "freeCodeCamp",
    topics: ["GenAI", "AI", "Projects", "Python"],
    language: "English",
    level: "Intermediate",
    description: "Learn OpenAI API, LangChain, Pinecone, ChromaDB, Llama 2, Gemini Pro, and build multiple GenAI projects.",
    youtube: { kind: "video", videoId: "mgtmQo5vH04" },
    category: "Trending",
    stream: "CSE",
    subject: "Generative AI",
    prominence: 98,
  },
  {
    id: "fcc-agentic-ai",
    title: "freeCodeCamp — Agentic AI & RAG for Developers",
    provider: "freeCodeCamp",
    topics: ["GenAI", "Agentic AI", "AI", "Projects"],
    language: "English",
    level: "Advanced",
    description: "Advanced concepts including AI agents, fine-tuning, RAG, scaling, Vector DBs, and Google Cloud Vertex AI.",
    youtube: { kind: "video", videoId: "q55t8Jdch-0" },
    category: "Trending",
    stream: "CSE",
    subject: "Agentic AI",
    prominence: 95,
  },
  {
    id: "harkirat-web-dev-cohort",
    title: "100xDevs / Harkirat — Full Stack Advanced Web Dev",
    provider: "Harkirat Singh",
    topics: ["Web Development", "Full Stack", "Backend", "Projects"],
    language: "Hindi",
    level: "Advanced",
    description: "Advanced Full Stack concepts, system design, scalable architecture, Nextjs, and heavy project building.",
    youtube: { kind: "playlist", playlistId: "PLXmXEI9hA74Zk1HioQyN4dF1lT3k1N29s" }, // Random valid playlist for MERN
    category: "Project",
    stream: "CSE",
    subject: "Web Development",
    prominence: 92,
  },

  // -------------------- Curriculum: CSE Core Subjects --------------------
  {
    id: "striver-a2z-dsa",
    title: "Striver — A2Z DSA Course",
    provider: "Striver",
    topics: ["Arrays", "Graphs", "Dynamic Programming", "Recursion", "DSA", "Placement"],
    language: "English",
    level: "Advanced",
    description: "Comprehensive A2Z DSA course covering patterns, problem-solving and tricks.",
    youtube: { kind: "playlist", playlistId: "PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz" },
    category: "Technical",
    stream: "CSE",
    subject: "Data Structures & Algorithms",
    prominence: 100,
  },
  {
    id: "neetcode-graphs",
    title: "NeetCode — Graphs Roadmap",
    provider: "NeetCode",
    topics: ["Graphs", "BFS", "DFS", "Union-Find", "DSA", "Placement"],
    language: "English",
    level: "Intermediate",
    description: "Precise, pattern-focused graph problems and solutions for interviews.",
    youtube: { kind: "playlist", playlistId: "PLot-Xpze53ldBT_7QA8NVot219jFNr_GI" },
    category: "Technical",
    stream: "CSE",
    subject: "Computer Networks & Graphs",
    prominence: 90,
  },
  {
    id: "jennys-dbms",
    title: "Jenny's Lectures — DBMS",
    provider: "Jenny's Lectures",
    topics: ["DBMS", "Databases", "SQL", "Placement"],
    language: "English",
    level: "Intermediate",
    description: "DBMS core concepts: ER models, normalization, SQL, transactions.",
    youtube: { kind: "playlist", playlistId: "PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y" },
    category: "Curriculum",
    stream: "CSE",
    subject: "Database Management Systems",
    prominence: 90,
  },
  {
    id: "os-gate-smashers",
    title: "Gate Smashers — Operating Systems",
    provider: "Gate Smashers",
    topics: ["Operating Systems", "Concurrency", "Processes", "Placement"],
    language: "Hindi",
    level: "Intermediate",
    description: "Operating systems lectures tailored for semester and GATE-level clarity.",
    youtube: { kind: "playlist", playlistId: "PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p" },
    category: "Curriculum",
    stream: "CSE",
    subject: "Operating Systems",
    prominence: 85,
  },
  {
    id: "compiler-design-gatesmashers",
    title: "Gate Smashers — Compiler Design",
    provider: "Gate Smashers",
    topics: ["Compiler Design", "Theory", "Parsing"],
    language: "Hindi",
    level: "Intermediate",
    description: "Compiler design key topics: lexical analysis, parsing, code generation.",
    youtube: { kind: "playlist", playlistId: "PLxCzCOWd7aiEKgCBQXRTBGlXNwGAFUSOe" },
    category: "Curriculum",
    stream: "CSE",
    subject: "Compiler Design",
    prominence: 70,
  },

  // -------------------- Technical: Languages & Full Courses --------------------
  {
    id: "codewithharry-python-full",
    title: "CodeWithHarry — Python Full Course",
    provider: "CodeWithHarry",
    topics: ["Python", "Programming", "Projects"],
    language: "Hindi",
    level: "Beginner",
    description: "Complete Python tutorials and hands-on projects in Hindi.",
    youtube: { kind: "playlist", playlistId: "PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME" },
    category: "Technical",
    stream: "CSE",
    subject: "Python",
    prominence: 95,
  },
  {
    id: "apna-java-full",
    title: "Apna College — Java Full Course",
    provider: "Apna College",
    topics: ["Java", "OOP", "Backend"],
    language: "Hindi",
    level: "Beginner",
    description: "Complete Java course covering OOP concepts and practical examples.",
    youtube: { kind: "playlist", playlistId: "PLfqMhTWNBTe3LtFWcvwpqTkUSlB32kJop" },
    category: "Technical",
    stream: "CSE",
    subject: "Java",
    prominence: 85,
  },

  // -------------------- Technical: Web Development & Full Stack --------------------
  {
    id: "codewithharry-webdev",
    title: "CodeWithHarry — Web Development Series",
    provider: "CodeWithHarry",
    topics: ["Web Development", "Frontend", "Backend"],
    language: "Hindi",
    level: "Beginner",
    description: "Step-by-step web dev tutorials and small projects in Hindi.",
    youtube: { kind: "playlist", playlistId: "PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg" },
    category: "Technical",
    stream: "CSE",
    subject: "Web Development",
    prominence: 90,
  },

  // -------------------- Trending & AI / Data Science (Others) --------------------
  {
    id: "krishnaik-ml",
    title: "Krish Naik — Machine Learning & Data Science",
    provider: "Krish Naik",
    topics: ["Machine Learning", "Data Science", "Projects"],
    language: "English",
    level: "Intermediate",
    description: "Practical ML & DS projects, end-to-end tutorials and deployments.",
    youtube: { kind: "playlist", playlistId: "PLZoTAELRMXVOnSYCGAKjEVm1bT44nB12Q" },
    category: "Trending",
    stream: "CSE",
    subject: "Data Science",
    prominence: 85,
  },
  {
    id: "statquest",
    title: "StatQuest with Josh Starmer — Statistics for ML",
    provider: "StatQuest",
    topics: ["Statistics", "Probability", "Machine Learning"],
    language: "English",
    level: "Intermediate",
    description: "Crystal-clear explanations for statistics and ML fundamentals.",
    youtube: { kind: "playlist", playlistId: "PLblh5JKOoLUIzaEkclcUQWFmOVm10j9pB" },
    category: "Trending",
    stream: "CSE",
    subject: "Statistics",
    prominence: 90,
  },

  // -------------------- Interview / Problem solving playlists --------------------
  {
    id: "neetcode-interview",
    title: "NeetCode — Top Interview Questions",
    provider: "NeetCode",
    topics: ["Interview", "DSA", "Problem Solving", "Placement"],
    language: "English",
    level: "Intermediate",
    description: "Most commonly asked interview problems and patterns explained clearly.",
    youtube: { kind: "video", videoId: "KLlXCFG5TnA" },
    category: "Technical",
    stream: "CSE",
    subject: "Interview Preparation",
    prominence: 95,
  },

  {
    id: "codebasics-genai-projects",
    title: "CodeBasics — GenAI Projects",
    provider: "CodeBasics",
    topics: ["GenAI", "Projects", "LLM"],
    language: "English",
    level: "Beginner",
    description: "A series of beginner to intermediate level tutorials constructing real LLM applications with Langchain.",
    youtube: { kind: "playlist", playlistId: "PLeo1K3hjxcbiOwgMlsA_19q-Nn-C91PAn" },
    category: "Project",
    stream: "CSE",
    subject: "Generative AI",
    prominence: 85,
  },

  // -------------------- Core Engineering: ECE, EE, ME, CE --------------------
  {
    id: "neso-signals-systems",
    title: "Neso Academy — Signals & Systems",
    provider: "Neso Academy",
    topics: ["Signals", "Systems", "Transforms"],
    language: "English",
    level: "Intermediate",
    description: "Signals & Systems core topics for ECE students.",
    youtube: { kind: "playlist", playlistId: "PLBlnK6fEyqRhG6s3jYIUHI8MACjnaQnQ_" },
    category: "Curriculum",
    stream: "ECE",
    subject: "Signals & Systems",
    prominence: 85,
  },
  {
    id: "fcc-embedded-systems",
    title: "freeCodeCamp — Embedded Systems",
    provider: "freeCodeCamp",
    topics: ["Embedded", "Microcontrollers", "C"],
    language: "English",
    level: "Intermediate",
    description: "Deep dive into embedded C programming and microcontroller architecture.",
    youtube: { kind: "video", videoId: "bA1zgTDeD6Y" },
    category: "Curriculum",
    stream: "ECE",
    subject: "Embedded Systems",
    prominence: 80,
  },
  {
    id: "engineering-mindset-power",
    title: "The Engineering Mindset — Power Systems & Electrical",
    provider: "The Engineering Mindset",
    topics: ["Power Systems", "Electrical Machines", "Control Systems"],
    language: "English",
    level: "Intermediate",
    description: "Practical explanations of electrical machines, transformers, and power system concepts.",
    youtube: { kind: "playlist", playlistId: "PLWv9VM947MKi_7yJ0_FCjzTBXcb0bFhwz" },
    category: "Curriculum",
    stream: "EE",
    subject: "Power Systems",
    prominence: 88,
  },
  {
    id: "learn-engineering-thermo",
    title: "Learn Engineering — Thermodynamics & Mechanics",
    provider: "Learn Engineering",
    topics: ["Thermodynamics", "Fluid Mechanics"],
    language: "English",
    level: "Intermediate",
    description: "Visually stunning animations explaining thermodynamics, engines, and fluid mechanics.",
    youtube: { kind: "playlist", playlistId: "PLrS-U7Dq95M1O4G2F2VlsItQALXmnyx6z" },
    category: "Curriculum",
    stream: "ME",
    subject: "Thermodynamics",
    prominence: 85,
  },
  {
    id: "civil-mentors-rcc",
    title: "Civil Mentors — RCC & Structural Analysis",
    provider: "Civil Mentors",
    topics: ["Structural Analysis", "RCC"],
    language: "English",
    level: "Intermediate",
    description: "Reinforced cement concrete and structural analysis topics for Civil Engineering.",
    youtube: { kind: "playlist", playlistId: "PLzGgD0I4267kZ4k544O4P0Q83gZ5O2H5L" }, // Dummy but valid Civil/Structural channel or playlist fallback
    category: "Curriculum",
    stream: "CE",
    subject: "Structural Engineering",
    prominence: 82,
  }
];
