# Pathfinder

AI-powered career navigation for students.

Pathfinder helps students identify skill gaps, discover relevant projects, plan internships, and build personalized career roadmaps using Google's Gemini API.

---

## Problem

Students often receive conflicting career advice from social media, online communities, and generic roadmaps.

As a result, they:

* Learn skills in the wrong order
* Build repetitive projects
* Miss internship opportunities
* Struggle to understand industry expectations

---

## Solution

Pathfinder analyzes:

* Academic stage
* Current skills
* Career goals
* Weekly commitment

and generates:

* Personalized learning roadmaps
* Skill gap analysis
* Recruiter expectations
* Project recommendations
* Internship strategies
* Career guidance

using Google's Gemini API.

---

## Features

* **Personalized Career Roadmaps**: Phase-by-phase chronological learning pathways tailored to student profiles.
* **Skill Gap Identification**: Contrast current skills with crucial industry-standard targets matching the target career path.
* **Recruiter Expectations Analysis**: Understand portfolio benchmarks, expected project complexity, and essential core expectations.
* **Internship Planning**: Actionable cyclical application windows, specific skills milestones, and timeline-based preparation steps.
* **Project Recommendations**: Discover targeted portfolio projects mapped directly by beginner, intermediate, and advanced difficulities.
* **Career Strategy Guidance**: Immediate focus actions, pitfalls/mistakes to ignore, and specific off-campus success strategies.
* **Responsive Premium UI**: Modern aesthetic designed with dark/glassmorphic slate UI patterns and seamless transitions.

---

## Technology Stack

**Frontend:**
* React + TypeScript
* Tailwind CSS
* Motion (for layout micro-interactions)
* Lucide Icons

**Backend:**
* Node.js + Express
* ESBuild (for high-speed production packaging)

**AI:**
* Google Gemini API (`@google/genai` TypeScript SDK)

---

## Getting Started

### Prerequisites

Ensure you have Node.js (v18 or higher) and npm installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/puneet2946/pathfinder.git
   cd pathfinder
   ```

2. Install the system dependencies:
   ```bash
   npm install
   ```

### Environment Variable Setup

Copy the template configuration environment file to set up your keys:
```bash
cp .env.example .env
```

Open the newly created `.env` file and insert your credentials:
```env
# Google Gemini API key used for generating pathfinding roadmaps
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# The complete public-facing hosting URL of your application
APP_URL="http://localhost:3000"
```

### Local Development

Launch the integrated concurrent development server (Express frontend server and hot-reloading asset processor):
```bash
npm run dev
```

The application will now be running and accessible locally at [http://localhost:3000](http://localhost:3000).

### Production Deployment

1. Build and compile the full-stack bundle:
   ```bash
   npm run build
   ```
   This will compile client-side React assets into the `dist/` folder and pack the Express `server.ts` into a fast, standalone `dist/server.cjs` bundle.

2. Launch the compiled production server:
   ```bash
   npm run start
   ```

---

## Future Improvements

* **Resume analysis**: Drag-and-drop resume PDF parses to automatically identify current skillset alignments.
* **Career progress tracking**: Real-time checklist interfaces to cross off roadmap items as you complete them.
* **Interview preparation modules**: Scenario questions and mock interactive coding playgrounds custom tailored to target careers.
* **Industry trend integration**: Direct scraping or API hookups mapping live trending skills matching regional job openings.

---

## Author

Puneet Kumar
