<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/github/license/Sachin-pandey13/CodeElysium" />
</p>

<h1 align="center">⚡ CodeElysium</h1>

<p align="center">
  <strong>An immersive, full-stack competitive programming platform built for the next generation of developers.</strong><br/>
  Practice DSA problems, compete in 1v1 coding battles, explore curated learning paths,<br/>
  and get AI-powered assistance — all in one beautiful, gamified environment.
</p>

<p align="center">
  <a href="https://code-elysium.vercel.app"><strong>🌐 Live Demo →</strong></a>&nbsp;&nbsp;
  <a href="#-features"><strong>Features</strong></a>&nbsp;&nbsp;
  <a href="#-tech-stack"><strong>Tech Stack</strong></a>&nbsp;&nbsp;
  <a href="#-getting-started"><strong>Setup</strong></a>&nbsp;&nbsp;
  <a href="#-architecture"><strong>Architecture</strong></a>
</p>

---

## 🎯 Overview

CodeElysium is a **LeetCode-inspired** competitive programming platform that goes beyond traditional online judges. It combines a sleek, dark-themed UI with **3D visual elements**, an **AI-powered tutor**, **real-time code execution**, and **gamified learning paths** — making DSA practice engaging and accessible.

### What Sets It Apart

| Feature | Traditional OJs | CodeElysium |
|---------|:-:|:-:|
| 3D Interactive Landing Page | ❌ | ✅ |
| AI Tutor with Context Awareness | ❌ | ✅ |
| 1v1 Competitive Arena with Anti-Cheat | ❌ | ✅ |
| Career Skill Tree Visualization | ❌ | ✅ |
| Offline-First PWA with Mini-Games | ❌ | ✅ |
| YouTube-Integrated Learning Playlists | ❌ | ✅ |
| Time & Space Complexity Analysis | ❌ | ✅ |

---

## ✨ Features

### 🧩 Problem Workspace
- **Monaco Editor** with syntax highlighting, auto-completion, and multi-language support (C++, Java, Python, C)
- **Resizable split panels** — problem description, code editor, and output side by side
- **Real-time code execution** via Judge0 with detailed test case results
- **AI-powered code analysis** — get time/space complexity and optimization suggestions

### ⚔️ Competitive Arena
- **1v1 coding battles** with timed problem solving
- **Fullscreen enforcement** with anti-cheat detection (tab switching, copy-paste monitoring)
- **Live score tracking** and result comparison
- Game-like UI with immersive visual effects

### 🗺️ Career Skill Tree
- **Interactive skill tree** visualization for DSA learning paths
- Nodes represent topics (Arrays, Trees, Graphs, DP, etc.)
- **Progress tracking** with visual completion indicators
- Hover tooltips with topic descriptions and difficulty levels

### 📚 Explore & Learn
- **Curated YouTube playlists** for each DSA category
- **Notes upload system** — share and access study materials (stored as MongoDB binary)
- **Category-based browsing** with beautiful tile cards
- Integrated video player with playlist navigation

### 🤖 AI Tutor
- **Context-aware chatbot** powered by OpenAI GPT-4o-mini
- Remembers the current problem and conversation history
- Provides solutions, explanations, and complexity analysis
- Supports multi-language code generation

### 📊 Progress Dashboard
- **Visual progress tracking** with charts and statistics
- Problem-solving history and streaks
- Category-wise completion metrics
- Performance analytics

### 📴 Offline Mode (PWA)
- **Service Worker** for offline content caching
- **9 educational mini-games** — math challenges, periodic table quiz, geography, word matching, riddles, and more
- Offline lesson viewer with cached content
- Auto-sync when connection is restored

### 🎨 Visual Design
- **3D landing page** with React Three Fiber (Three.js)
- Glassmorphism panels with backdrop blur effects
- Smooth Framer Motion animations and page transitions
- Fully responsive dark theme with curated color palette

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | Full-stack React framework (App Router) |
| **React 19** | UI library with Server Components |
| **TypeScript** | Type safety across the codebase |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations and page transitions |
| **Monaco Editor** | VS Code-grade code editing |
| **React Three Fiber** | 3D scene rendering (Three.js) |
| **Zustand** | Lightweight state management |
| **React Rough Notation** | Animated text annotations |

### Backend & Services
| Technology | Purpose |
|-----------|---------|
| **Next.js API Routes** | Serverless backend (Vercel Functions) |
| **MongoDB Atlas** | Primary database (notes, submissions, users) |
| **Firebase Auth** | Google OAuth & email/password authentication |
| **Judge0 (RapidAPI)** | Secure code execution sandbox |
| **OpenAI API** | AI tutor, code analysis, complexity detection |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Vercel** | Hosting & CDN with edge deployment |
| **GitHub Actions** | CI/CD pipeline (lint → build → deploy) |
| **Service Workers** | PWA offline support |

---

## 📁 Project Structure

```
CodeElysium/
├── app/                          # Next.js App Router pages
│   ├── api/                      # Serverless API routes
│   │   ├── analyze/              # Code analysis (OpenAI)
│   │   ├── chat/                 # AI tutor endpoint
│   │   ├── complexity/groq/      # Complexity analysis
│   │   ├── judge/                # Code execution (Judge0)
│   │   ├── notes/                # Notes CRUD
│   │   ├── pdf/[id]/             # PDF download
│   │   ├── problems/[id]/        # Problem lookup
│   │   └── upload/               # File upload (MongoDB binary)
│   ├── arena/                    # 1v1 competitive arena
│   ├── explore/                  # Course & playlist explorer
│   ├── login/ & signup/          # Authentication pages
│   ├── offline/                  # PWA offline hub + 9 mini-games
│   ├── problems/                 # Problem list & workspace
│   │   ├── [category]/           # Category-filtered view
│   │   └── [category]/[id]/      # Problem solver with editor
│   ├── profile/                  # User profile & stats
│   ├── progress/                 # Progress dashboard
│   ├── quiz/                     # Quiz arena (coming soon)
│   ├── setup/                    # Onboarding wizard
│   └── tree/                     # Career skill tree
├── components/                   # Reusable UI components
│   ├── animations/               # Framer Motion wrappers
│   ├── arena/                    # Arena-specific components
│   ├── cards/                    # Card components
│   ├── charts/                   # Data visualization
│   ├── explore/                  # Explorer components
│   ├── fx/                       # Visual effects
│   ├── nav/                      # Navigation components
│   ├── panels/                   # Layout panels
│   ├── problem/                  # Problem workspace UI
│   ├── three/                    # 3D scene components
│   ├── transitions/              # Page transitions
│   ├── tree/                     # Skill tree components
│   └── ui/                       # Shared UI primitives
├── data/                         # Static data (problems, career tree)
├── lib/                          # Utility functions & configs
│   ├── firebase.ts               # Firebase initialization
│   ├── mongodb.ts                # MongoDB connection (lazy init)
│   ├── problem.ts                # Problem data utilities
│   └── storage.ts                # Offline storage & sync
├── store/                        # Zustand state stores
├── types/                        # TypeScript type definitions
├── public/                       # Static assets & PWA files
├── .github/workflows/            # CI/CD pipeline
├── vercel.json                   # Vercel deployment config
└── next.config.js                # Next.js configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0
- **MongoDB Atlas** account ([free tier](https://www.mongodb.com/cloud/atlas))
- **Firebase** project ([console](https://console.firebase.google.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Sachin-pandey13/CodeElysium.git
cd CodeElysium

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=codeelysium

# Firebase (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MSG_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Judge0 (Code Execution)
RAPIDAPI_KEY=your_rapidapi_key

# OpenAI (AI Features)
OPENAI_API_KEY=your_openai_key
```

> 📝 See [`.env.example`](.env.example) for the full template with descriptions.

### Run Locally

```bash
# Development server
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌─────────┐  ┌──────────┐  ┌───────┐  ┌────────────────┐  │
│  │ React   │  │ Monaco   │  │ Three │  │ Service Worker │  │
│  │ + Zustand│  │ Editor   │  │ .js   │  │ (PWA Offline)  │  │
│  └────┬────┘  └────┬─────┘  └───┬───┘  └───────┬────────┘  │
│       │            │            │               │            │
├───────┴────────────┴────────────┴───────────────┴────────────┤
│                   Next.js App Router                         │
│              (SSR + Client Components)                       │
├──────────────────────────────────────────────────────────────┤
│                  API Routes (Serverless)                      │
│  ┌────────┐  ┌────────┐  ┌─────────┐  ┌──────────────┐     │
│  │ /judge │  │ /chat  │  │/analyze │  │ /notes,/pdf  │     │
│  │ Judge0 │  │ OpenAI │  │ OpenAI  │  │  MongoDB     │     │
│  └───┬────┘  └───┬────┘  └────┬────┘  └──────┬───────┘     │
├──────┴───────────┴───────────┴───────────────┴──────────────┤
│                    External Services                         │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐   │
│  │ Judge0  │  │ OpenAI  │  │ Firebase │  │  MongoDB    │   │
│  │ RapidAPI│  │ GPT-4o  │  │ Auth     │  │  Atlas      │   │
│  └─────────┘  └─────────┘  └──────────┘  └─────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard
4. Add your Vercel domain to [Firebase Authorized Domains](https://console.firebase.google.com)
5. Ensure MongoDB Atlas has `0.0.0.0/0` in Network Access whitelist

### CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that runs on every push:

```
Push to main → Quality Checks (lint) → Production Build → Deploy to Vercel
```

---

## 🎮 Offline Mini-Games

CodeElysium includes **9 educational games** playable without internet:

| Game | Description |
|------|-------------|
| 🧮 Math Challenge | Mental math under time pressure |
| ⚡ Circuit Builder | Logic circuit simulation |
| 🌍 Geography Quiz | World capitals and landmarks |
| 🔢 Grid Puzzle | Number grid logic puzzles |
| 🎯 Guess Game | Number guessing with hints |
| 🧪 Periodic Table | Element identification quiz |
| 🧩 Riddles | Programming-themed brain teasers |
| 📝 Word Match | Technical term matching |
| 💰 Budget Planner | Financial literacy simulation |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and TypeScript patterns
- Place new components in the appropriate subdirectory under `components/`
- Add new API routes in `app/api/` using the Next.js Route Handler format
- Use Zustand stores for shared client-side state
- Test builds locally with `npm run build` before pushing

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Sachin-pandey13">Sachin Pandey</a>
</p>
