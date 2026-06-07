import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Resilient Markdown-to-JSON Parser
function parseMarkdownToJSON(markdown: string) {
  const getSectionText = (title: string): string => {
    const lines = markdown.split("\n");
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(title.toLowerCase()) && lines[i].startsWith("##")) {
        startIndex = i;
        break;
      }
    }
    if (startIndex === -1) return "";
    
    const contentLines: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (lines[i].startsWith("##")) {
        break;
      }
      contentLines.push(lines[i]);
    }
    return contentLines.join("\n").trim();
  };

  // 1. Profile Summary
  const summaryText = getSectionText("PROFILE SUMMARY");
  const summary = summaryText.replace(/\n+/g, " ").trim() || "A customized career blueprint focused on hitting recruiter benchmarks.";

  // 2. Timeline
  const timelineText = getSectionText("ESTIMATED TIMELINE");
  const timelineEstimate = timelineText.replace(/\n+/g, " ").trim() || "6-12 Months";

  // 3. Success Probability
  const successSec = getSectionText("SUCCESS PROBABILITY");
  let percentage = 75;
  const pctMatch = successSec.match(/Percentage:\s*(\d+)/i);
  if (pctMatch) percentage = parseInt(pctMatch[1], 10);

  let analysis = "Based on typical performance of candidates in off-campus recruiting.";
  const analysisMatch = successSec.match(/Analysis:\s*([^\n]+)/i);
  if (analysisMatch) analysis = analysisMatch[1].trim();

  const keyStrengths: string[] = [];
  const areasToImprove: string[] = [];
  let parsingStrengths = false;
  let parsingImprove = false;

  for (const line of successSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.toLowerCase().includes("key strengths")) {
      parsingStrengths = true;
      parsingImprove = false;
      continue;
    }
    if (cleanLine.toLowerCase().includes("areas to improve")) {
      parsingStrengths = false;
      parsingImprove = true;
      continue;
    }
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const item = cleanLine.substring(1).trim();
      if (item) {
        if (parsingStrengths) keyStrengths.push(item);
        if (parsingImprove) areasToImprove.push(item);
      }
    }
  }
  if (keyStrengths.length === 0) keyStrengths.push("Solid foundational background", "Highly motivated target objective");
  if (areasToImprove.length === 0) areasToImprove.push("Practical cloud deployment experience", "Systems architecture designs");

  // 4. Skill Gap Analysis
  const gapSec = getSectionText("SKILL GAP ANALYSIS");
  let currentKnowledgeMatchScore = 70;
  const scoreMatch = gapSec.match(/Match Score:\s*(\d+)/i);
  if (scoreMatch) currentKnowledgeMatchScore = parseInt(scoreMatch[1], 10);

  let gapBrief = "Identified critical skills missing from current technical stack.";
  const gapMatch = gapSec.match(/Gap Brief:\s*([^\n]+)/i);
  if (gapMatch) gapBrief = gapMatch[1].trim();

  const missingSkills: { name: string; importance: string; reason: string }[] = [];
  let parsingSkills = false;
  for (const line of gapSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.toLowerCase().includes("missing skills")) {
      parsingSkills = true;
      continue;
    }
    if (parsingSkills && (cleanLine.startsWith("-") || cleanLine.startsWith("*"))) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 1 && parts[0]) {
        missingSkills.push({
          name: parts[0] || "Advanced Systems",
          importance: parts[1] || "Critical",
          reason: parts[2] || "Required to pass recruitment screening."
        });
      }
    }
  }
  if (missingSkills.length === 0) {
    missingSkills.push({
      name: "Docker & Kubernetes Containerization",
      importance: "Highly Recommended",
      reason: "Hiring managers seek production container patterns."
    });
  }

  // 5. Recruiter Expectations
  const recSec = getSectionText("RECRUITER EXPECTATIONS");
  let essentialCoreSkills: string[] = ["Algorithms", "System Design"];
  const skillsMatch = recSec.match(/Essential Core Skills:\s*([^\n]+)/i);
  if (skillsMatch) {
    essentialCoreSkills = skillsMatch[1].split(",").map(s => s.trim()).filter(Boolean);
  }

  let portfolioStandard = "Requires deployed, end-to-end cloud platforms with system architecture documents.";
  const portMatch = recSec.match(/Portfolio Standard:\s*([^\n]+)/i);
  if (portMatch) portfolioStandard = portMatch[1].trim();

  let minimumProjectsCount = 3;
  const countMatch = recSec.match(/Minimum Projects Count:\s*(\d+)/i);
  if (countMatch) minimumProjectsCount = parseInt(countMatch[1], 10);

  let dynamicInsights = "Hiring managers instantly reject un-deployed tutorial clones.";
  const insightsMatch = recSec.match(/Dynamic Insights:\s*([^\n]+)/i);
  if (insightsMatch) dynamicInsights = insightsMatch[1].trim();

  // 6. Learning Roadmap
  const roadmapSec = getSectionText("LEARNING TIMELINE ROADMAP");
  const roadmap: { phase: string; duration: string; focus: string; tasks: string[] }[] = [];
  let currentPhase: { phase: string; duration: string; focus: string; tasks: string[] } | null = null;

  for (const line of roadmapSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("###")) {
      const parts = cleanLine.replace(/^###\s*/, "").split("|").map(s => s.trim());
      currentPhase = {
        phase: parts[0] || "Initial Phase",
        duration: parts[1] || "4 weeks",
        focus: parts[2] || "Technical foundations",
        tasks: []
      };
      roadmap.push(currentPhase);
    } else if (currentPhase && (cleanLine.startsWith("-") || cleanLine.startsWith("*"))) {
      const task = cleanLine.substring(1).trim();
      if (task) currentPhase.tasks.push(task);
    }
  }
  if (roadmap.length === 0) {
    roadmap.push({
      phase: "Phase 1: Foundations",
      duration: "4 weeks",
      focus: "Build technical core",
      tasks: ["Master essential syntax", "Implement data structures"]
    });
  }

  // 7. Recommended Projects Difficulty
  const recommSec = getSectionText("RECOMMENDED PROJECTS DIFFICULTY");
  const recommendedProjectsDifficulty: { title: string; difficulty: string; objective: string; technologies: string[]; learningOutcome: string }[] = [];
  for (const line of recommSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 1 && parts[0]) {
        recommendedProjectsDifficulty.push({
          title: parts[0],
          difficulty: parts[1] || "Intermediate",
          objective: parts[2] || "Solve production scalability challenges.",
          technologies: parts[3] ? parts[3].split(",").map(t => t.trim()).filter(Boolean) : ["React", "TypeScript"],
          learningOutcome: parts[4] || "Demonstrates core systems execution abilities."
        });
      }
    }
  }
  if (recommendedProjectsDifficulty.length === 0) {
    recommendedProjectsDifficulty.push({
      title: "Distributed Task Scheduler",
      difficulty: "Advanced",
      objective: "Build a persistent background task executor with retry policies.",
      technologies: ["Node.js", "Redis", "TypeScript"],
      learningOutcome: "Proves concurrency, distributed transactions and systems expertise."
    });
  }

  // 8. Internship Playbook
  const playSec = getSectionText("INTERNSHIP PLAYBOOK");
  let applicationWindow = "Fall recruitment cycle (typically Sept-Nov)";
  const appMatch = playSec.match(/Application Window:\s*([^\n]+)/i);
  if (appMatch) applicationWindow = appMatch[1].trim();

  let skillsToCompleteFirst: string[] = ["Git", "Core Language Concepts"];
  const skListMatch = playSec.match(/Skills to Complete First:\s*([^\n]+)/i);
  if (skListMatch) {
    skillsToCompleteFirst = skListMatch[1].split(",").map(s => s.trim()).filter(Boolean);
  }

  let resumeProjectsRequired: string[] = ["Full Stack Platform", "Cloud Architecture System"];
  const resProjListMatch = playSec.match(/Resume Projects Required:\s*([^\n]+)/i);
  if (resProjListMatch) {
    resumeProjectsRequired = resProjListMatch[1].split(",").map(s => s.trim()).filter(Boolean);
  }

  const preparationTimeline: string[] = [];
  let parsingPrep = false;
  for (const line of playSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.toLowerCase().includes("preparation timeline")) {
      parsingPrep = true;
      continue;
    }
    if (parsingPrep && (cleanLine.startsWith("-") || cleanLine.startsWith("*"))) {
      const item = cleanLine.substring(1).trim();
      if (item) preparationTimeline.push(item);
    }
  }
  if (preparationTimeline.length === 0) {
    preparationTimeline.push("Month 1: Finalize portfolio project architecture", "Month 2: Set up professional LinkedIn and portfolio links", "Month 3: Active application submissions");
  }

  // 9. Student Strategy
  const stratSec = getSectionText("STUDENT STRATEGY");
  const focusNow: string[] = [];
  const ignoreForNow: string[] = [];
  const biggestMistakes: string[] = [];
  let fastestPathToJobReady = "Avoid tutorial hell, build dynamic open-source systems, and deploy live links.";

  let parsingFocus = false;
  let parsingIgnore = false;
  let parsingMistakes = false;

  for (const line of stratSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.toLowerCase().includes("focus now")) {
      parsingFocus = true; parsingIgnore = false; parsingMistakes = false;
      continue;
    }
    if (cleanLine.toLowerCase().includes("ignore for now")) {
      parsingFocus = false; parsingIgnore = true; parsingMistakes = false;
      continue;
    }
    if (cleanLine.toLowerCase().includes("biggest mistakes")) {
      parsingFocus = false; parsingIgnore = false; parsingMistakes = true;
      continue;
    }
    if (cleanLine.toLowerCase().includes("fastest path")) {
      parsingFocus = false; parsingIgnore = false; parsingMistakes = false;
      const pathParts = cleanLine.split(":");
      if (pathParts.length > 1) {
        fastestPathToJobReady = pathParts.slice(1).join(":").trim();
      }
      continue;
    }
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const item = cleanLine.substring(1).trim();
      if (item) {
        if (parsingFocus) focusNow.push(item);
        if (parsingIgnore) ignoreForNow.push(item);
        if (parsingMistakes) biggestMistakes.push(item);
      }
    }
  }
  if (focusNow.length === 0) focusNow.push("Build real systems", "Collaborate on GitHub", "Deploy to Cloud Run");
  if (ignoreForNow.length === 0) ignoreForNow.push("Vanity frameworks", "Complex web-3 hype", "Unnecessary microservices");
  if (biggestMistakes.length === 0) biggestMistakes.push("Copying YouTube templates", "Staying in tutorial loops", "No live deployed URLs");

  // 10. Standard Skills Matrix
  const skillsMatrixSec = getSectionText("STANDARD SKILLS MATRIX");
  const skillsList: { name: string; category: string; difficulty: string; description: string }[] = [];
  for (const line of skillsMatrixSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 1 && parts[0]) {
        skillsList.push({
          name: parts[0],
          category: parts[1] || "Core",
          difficulty: parts[2] || "Medium",
          description: parts[3] || "Critical industry-recognized competency."
        });
      }
    }
  }
  if (skillsList.length === 0) {
    skillsList.push({
      name: "TypeScript",
      category: "Core",
      difficulty: "Medium",
      description: "Non-negotiable modern type-safe programming language for web systems."
    });
  }

  // 11. Portfolio Labs
  const labsSec = getSectionText("PORTFOLIO LABS");
  const projectsList: { name: string; description: string; keyFeatures: string[]; techStack: string[]; level: string }[] = [];
  for (const line of labsSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 1 && parts[0]) {
        projectsList.push({
          name: parts[0],
          description: parts[1] || "End-to-end cloud platform solving specific business constraints.",
          keyFeatures: parts[2] ? parts[2].split(",").map(f => f.trim()).filter(Boolean) : ["Auth", "Dashboard"],
          techStack: parts[3] ? parts[3].split(",").map(t => t.trim()).filter(Boolean) : ["React", "Express"],
          level: parts[4] || "Intermediate"
        });
      }
    }
  }
  if (projectsList.length === 0) {
    projectsList.push({
      name: "Pathfinder Career Coach",
      description: "A comprehensive mentorship application mapping career journeys with zero-boilerplate deployment setups.",
      keyFeatures: ["Dynamic PDF Generation", "Offline Local Cache Sync"],
      techStack: ["React", "TypeScript", "Tailwind CSS"],
      level: "Intermediate"
    });
  }

  // 12. Certifications
  const certSec = getSectionText("CERTIFICATIONS");
  const certifications: { name: string; issuer: string; costEstimate: string; valueRating: string }[] = [];
  for (const line of certSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 4 && parts[0]) {
        certifications.push({
          name: parts[0],
          issuer: parts[1],
          costEstimate: parts[2],
          valueRating: parts[3]
        });
      }
    }
  }
  if (certifications.length === 0) {
    certifications.push({
      name: "AWS Certified Developer – Associate",
      issuer: "Amazon Web Services",
      costEstimate: "$150",
      valueRating: "High Value"
    });
  }

  // 13. Internship Strategies
  const intSec = getSectionText("INTERNSHIP STRATEGIES");
  const internships: { strategy: string; timeframe: string; actionItems: string[] }[] = [];
  for (const line of intSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 3 && parts[0]) {
        internships.push({
          strategy: parts[0],
          timeframe: parts[1] || "All semesters",
          actionItems: parts[2].split(",").map(a => a.trim()).filter(Boolean)
        });
      }
    }
  }
  if (internships.length === 0) {
    internships.push({
      strategy: "Targeted Cold Email Outreach",
      timeframe: "3-4 months before application window",
      actionItems: ["Find engineering leaders on LinkedIn", "Send high-signal custom markdown resumes"]
    });
  }

  // 14. Resume Tips
  const resumeSec = getSectionText("RESUME TIPS");
  const resumeTips: { section: string; advice: string }[] = [];
  for (const line of resumeSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 2 && parts[0]) {
        resumeTips.push({
          section: parts[0],
          advice: parts[1]
        });
      }
    }
  }
  if (resumeTips.length === 0) {
    resumeTips.push({
      section: "Experience Section",
      advice: "Always frame achievements through bullet metrics like: 'Optimized query efficiency by 40%.'"
    });
  }

  // 15. Placement Strategies
  const placSec = getSectionText("PLACEMENT STRATEGIES");
  const placementStrategy: { stage: string; recommendation: string }[] = [];
  for (const line of placSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 2 && parts[0]) {
        placementStrategy.push({
          stage: parts[0],
          recommendation: parts[1]
        });
      }
    }
  }
  if (placementStrategy.length === 0) {
    placementStrategy.push({
      stage: "On-Campus Screening",
      recommendation: "Focus deeply on data structures and standard OS networking fundamentals first."
    });
  }

  // 16. Interview Prepare Strategy
  const interviewSec = getSectionText("INTERVIEW PREPARE STRATEGY");
  const interviewStrategy: { roundType: string; prepAction: string; sampleQuestions: string[] }[] = [];
  for (const line of interviewSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 3 && parts[0]) {
        interviewStrategy.push({
          roundType: parts[0],
          prepAction: parts[1] || "Study scalable engineering architectures.",
          sampleQuestions: parts[2].split(",").map(q => q.trim()).filter(Boolean)
        });
      }
    }
  }
  if (interviewStrategy.length === 0) {
    interviewStrategy.push({
      roundType: "Technical Systems Round",
      prepAction: "Rebuild a production load balancer mentally. Review ACID versus BASE properties.",
      sampleQuestions: ["How would you structure a distributed rate limiter?", "Design some system diagrams representing cache invalidation schemes."]
    });
  }

  // 17. Open Source Guide
  const openSec = getSectionText("OPEN SOURCE GUIDE");
  const openSource: { platform: string; guide: string }[] = [];
  for (const line of openSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 2 && parts[0]) {
        openSource.push({
          platform: parts[0],
          guide: parts[1]
        });
      }
    }
  }
  if (openSource.length === 0) {
    openSource.push({
      platform: "GitHub Repositories",
      guide: "Find documentation bugs first inside active mid-sized packages, submit robust markdown edits, and proceed into PR development."
    });
  }

  // 18. LinkedIn Tips
  const linkSec = getSectionText("LINKEDIN TIPS");
  const linkedinTips: { area: string; tactic: string }[] = [];
  for (const line of linkSec.split("\n")) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
      const parts = cleanLine.substring(1).split("|").map(s => s.trim());
      if (parts.length >= 2 && parts[0]) {
        linkedinTips.push({
          area: parts[0],
          tactic: parts[1]
        });
      }
    }
  }
  if (linkedinTips.length === 0) {
    linkedinTips.push({
      area: "Profile Banner & Tagline",
      tactic: "Advertise concrete engineering problems solved: e.g., 'Core systems author | Node.js concurrency design.'"
    });
  }

  return {
    summary,
    timelineEstimate,
    successProbability: {
      percentage,
      analysis,
      keyStrengths,
      areasToImprove
    },
    skillGapAnalysis: {
      missingSkills,
      currentKnowledgeMatchScore,
      gapBrief
    },
    recruiterExpectations: {
      essentialCoreSkills,
      portfolioStandard,
      minimumProjectsCount,
      dynamicInsights
    },
    roadmap,
    recommendedProjectsDifficulty,
    internshipPlaybook: {
      applicationWindow,
      skillsToCompleteFirst,
      resumeProjectsRequired,
      preparationTimeline
    },
    studentStrategy: {
      focusNow,
      ignoreForNow,
      biggestMistakes,
      fastestJobReadyPath: fastestPathToJobReady,
      fastestPathToJobReady: fastestPathToJobReady
    },
    skills: skillsList,
    projects: projectsList,
    certifications,
    internships,
    resumeTips,
    placementStrategy,
    interviewStrategy,
    openSource,
    linkedinTips
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini client with server-side key protection
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", hasApiKey: !!apiKey });
  });

  // AI Roadmap generation endpoint
  app.post("/api/generate-roadmap", async (req, res) => {
    try {
      const { stage, careerGoal, skills, time, preference, region } = req.body;

      if (!stage || !careerGoal) {
        return res.status(400).json({ error: "Academic Stage and Target Career are required." });
      }

      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured in settings." });
      }

      const prompt = `
Generate an honest, highly realistic, and hyper-personalized career navigation blueprint for a student with this profile:
- **Current Academic Stage**: ${stage}
- **Target Career Goal**: ${careerGoal}
- **Current Skills**: ${skills || "None specified yet"}
- **Available Weekly Time commitment**: ${time}
- **Preferred Learning Style**: ${preference}
- **Target Job Market Region**: ${region}

Solve the critical problem: Students are constantly confused by conflicting noise from YouTube, social media influencers, coaching centers, seniors, and generic internet roadmaps. They waste months learning tools in the wrong order, building duplicate copycat repositories, and missing real recruiting cycles.

You MUST format your output strictly as a Markdown document with the exact headers and layout shown below. Do not add any conversational intro or outro text. Output only the Markdown sections.

REQUIRED MARKDOWN OUTLINE & FORMAT:

## 1. PROFILE SUMMARY
Provide a personalized 2-3 sentence overview profiling the career target, current gaps, and action plan.

## 2. ESTIMATED TIMELINE
Write only the estimated total months/years to reach target readiness (e.g. "6-8 Months") on a single line.

## 3. SUCCESS PROBABILITY
Percentage: [An integer percentage, e.g. 85]
Analysis: An honest assessment of the likelihood of securing the target role.
- Key Strengths:
* [Strength item 1]
* [Strength item 2]
- Areas to Improve:
* [Improvement item 1]
* [Improvement item 2]

## 4. SKILL GAP ANALYSIS
Match Score: [An integer score, e.g. 75]
Gap Brief: A detailed breakdown of how conflicting internet roadmaps delay them and which specific gap they must close first.
- Missing Skills:
* [Skill Name 1] | [Importance: 'Critical' or 'Highly Recommended'] | [Why recruiters search for this skill]
* [Skill Name 2] | [Importance: 'Critical' or 'Highly Recommended'] | [Why recruiters search for this skill]

## 5. RECRUITER EXPECTATIONS
Essential Core Skills: [Comma-separated non-negotiable core skills]
Portfolio Standard: Description of the precise portfolio caliber and system complexity needed to secure interviews.
Minimum Projects Count: [An integer count, e.g. 3]
Dynamic Insights: Recruiter dynamic insights (e.g. what they hate, what they expect).

## 6. LEARNING TIMELINE ROADMAP
Provide step-by-step phases or months showing a detailed learning journey. Each phase MUST start with '###' on a new line.
### [Phase or Month Name, e.g. Month 1-2] | [Duration, e.g. 6 weeks] | [Primary Focus Key Area]
* [Actionable task or toolset to learn]
* [Actionable task or toolset to learn]
### [Next Phase Name] | [Duration] | [Focus Area]
* [Actionable task or toolset to learn]

## 7. RECOMMENDED PROJECTS DIFFICULTY
* [Project Title 1] | [Difficulty: 'Beginner', 'Intermediate', or 'Advanced'] | [The core engineering problem it solves] | [Comma-separated stack] | [What unique engineering competency this proves]
* [Project Title 2] | [Difficulty: 'Beginner', 'Intermediate', or 'Advanced'] | [The core engineering problem it solves] | [Comma-separated stack] | [What unique engineering competency this proves]

## 8. INTERNSHIP PLAYBOOK
Application Window: [When they should submit applications based on academic stage]
Skills to Complete First: [Comma-separated skills]
Resume Projects Required: [Comma-separated projects]
Preparation Timeline:
* [Pragmatic preparation milestone 1]
* [Pragmatic preparation milestone 2]

## 9. STUDENT STRATEGY
- Focus Now:
* [Action or tool to prioritize 1]
* [Action or tool to prioritize 2]
- Ignore For Now:
* [Overhyped tech or buzzword to ignore 1]
* [Overhyped tech or buzzword to ignore 2]
- Biggest Mistakes:
* [Common trap or failure 1]
* [Common trap or failure 2]
Fastest Path to Job Ready: [Veterans advice on fastest strategy to build live proof of skills]

## 10. STANDARD SKILLS MATRIX
* [Skill Name] | [Classification: e.g. 'Core', 'Tooling', 'Advanced'] | [Difficulty: 'Easy', 'Medium', 'Hard'] | [How it impacts job chances]

## 11. PORTFOLIO LABS
* [Project Name] | [Description] | [Comma-separated key features] | [Comma-separated tech stack] | [Complexity: 'Beginner', 'Intermediate', 'Advanced']

## 12. CERTIFICATIONS
* [Cert Name] | [Issuer] | [Cost category or amount, e.g. 'Free' or '$150'] | [Value Rating: e.g. 'High Value', 'Recommended', 'Nice to Have']

## 13. INTERNSHIP STRATEGIES
* [Strategy Name] | [Timeframe] | [Comma-separated action items]

## 14. RESUME TIPS
* [Resume Section] | [Direct concrete formatting or content advice]

## 15. PLACEMENT STRATEGIES
* [Stage/Phase] | [Action to take]

## 16. INTERVIEW PREPARE STRATEGY
* [Interview Round Name] | [How to prepare exactly] | [Comma-separated sample questions]

## 17. OPEN SOURCE GUIDE
* [Target Repository/Platform] | [Detailed contribution strategy]

## 18. LINKEDIN TIPS
* [Core Focus Area] | [Actionable execution detail]
`;

      const systemInstruction = `You are Pathfinder: a hard-boiled veteran senior software engineer, direct hiring manager, and realistic career mentor.
Your job is to cut through the noise and give students the absolute truth about what it takes to get hired. 

CRITICAL DIRECTIVES & CONSTRAINTS:
- DO NOT provide generic motivational filler or shallow inspirational speak.
- STRICTLY PROHIBITED phrases and ideas: "Keep learning", "Stay consistent", "Believe in yourself", "Never give up", "Keep trying", or similar generic motivational copy. Replace all such fluff with harsh, real-world hiring realities and concrete actionable tasks.
- Prioritize practical usefulness, recruiter perspective, engineering depth, and honest expectations over vague encouragement.
- Treat every response with technical precision: specify what real recruiters scan for on GitHub portfolios, what code patterns excite seniors, and how candidates bypass HR filtering.
- Address local student struggles globally: keep recommendations useful globally, but acknowledge resource limitations, off-campus placement season timing, or high competition environments.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No text response from Gemini API.");
      }

      const parsedJSON = parseMarkdownToJSON(responseText);
      res.json(parsedJSON);

    } catch (error: any) {
      console.error("Error generating roadmap:", error);
      res.status(500).json({ error: error.message || "Failed to generate roadmap. Please try again." });
    }
  });

  // Vite in dev mode, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server was built successfully. Running on http://localhost:${PORT}`);
  });
}

startServer();
