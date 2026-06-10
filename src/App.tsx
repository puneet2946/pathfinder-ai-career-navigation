import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  Clock,
  RotateCcw,
  Copy,
  Printer,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  FileText,
  Compass,
  Code2,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  User,
  ExternalLink,
  ChevronRight,
  Sparkle
} from "lucide-react";
import { CareerRoadmapResponse, RoadmapPhase, ProjectItem, InternshipItem } from "./types";
import LivingBackground from "./components/LivingBackground";

// Suggested preset skills for quick entry based on goal
const PRESET_SKILLS: Record<string, string[]> = {
  "AI Engineer": ["Python", "PyTorch", "TensorFlow", "Pandas", "LLM Fine-Tuning", "Docker"],
  "Machine Learning Engineer": ["Python", "SciKit-Learn", "SQL", "MLOps", "Model Deployment", "Git"],
  "Data Scientist": ["Python", "SQL", "R", "Tableau", "Pandas", "Feature Engineering"],
  "Software Engineer": ["TypeScript", "React", "Node.js", "Java", "Docker", "Algorithms"],
  "Product Manager": ["User Research", "Agile", "Jira", "A/B Testing", "Figma", "Product Strategy"],
  "Cybersecurity Analyst": ["Linux", "Wireshark", "Bash", "Metasploit", "OWASP Top 10"],
  "Cloud Engineer": ["AWS", "Terraform", "Linux", "Kubernetes", "Shell Scripting"],
  "DevOps Engineer": ["CI/CD Pipelines", "Docker", "Kubernetes", "Ansible", "AWS"],
  "Startup Founder": ["MVP Strategy", "React", "Firebase", "Pitching", "UI/UX Basics"]
};

const ACADEMIC_STAGES = [
  "Class 12",
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Graduate"
];

const TARGET_CAREERS = [
  "AI Engineer",
  "Machine Learning Engineer",
  "Data Scientist",
  "Software Engineer",
  "Product Manager",
  "Cybersecurity Analyst",
  "Cloud Engineer",
  "DevOps Engineer",
  "Startup Founder"
];

const WEEKLY_COMMITMENTS = [
  "5 hours/week",
  "10 hours/week",
  "20 hours/week",
  "30+ hours/week"
];

const LOADING_PHRASES = [
  "Analyzing profile...",
  "Identifying skill gaps...",
  "Generating personalized roadmap..."
];

export default function App() {
  const [hasRoadmap, setHasRoadmap] = useState(false);
  
  // Form Inputs
  const [stage, setStage] = useState(ACADEMIC_STAGES[2]); // Second Year
  const [careerGoal, setCareerGoal] = useState(TARGET_CAREERS[0]); // AI Engineer
  const [skills, setSkills] = useState("");
  const [timeCommitment, setTimeCommitment] = useState(WEEKLY_COMMITMENTS[1]); // 10 hours/week

  // Backend response & loading states
  const [loading, setLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [roadmapData, setRoadmapData] = useState<CareerRoadmapResponse | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Client milestones checklist tracking
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  // Cycle through slow progress of loading phrases with quiet step indicator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingPhraseIndex(0);
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev < LOADING_PHRASES.length - 1 ? prev + 1 : prev));
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const handleAddSkillChip = (chip: string) => {
    if (!skills) {
      setSkills(chip);
    } else {
      const existing = skills.split(",").map(s => s.trim().toLowerCase());
      if (!existing.includes(chip.toLowerCase())) {
        setSkills(skills.trim() ? `${skills.trim()}, ${chip}` : chip);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(null);
    setRoadmapData(null);
    setCompletedTasks({});
    setCopySuccess(false);

    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          careerGoal,
          skills,
          time: timeCommitment,
          preference: "Mixed", // Clean internal default to simplify UI
          region: "Global" // Clean internal default to simplify UI
        })
      });

      if (!response.ok) {
        let errMsg = "Something went wrong while generating your roadmap. Please try again.";
        try {
          const errorVal = await response.json();
          errMsg = errorVal.error || errMsg;
        } catch (parseErr) {
          const statusTextLower = (response.statusText || "").toLowerCase();
          if (response.status === 503 || statusTextLower.includes("unavailable") || statusTextLower.includes("overloaded")) {
            errMsg = "Google AI is currently experiencing high demand. Please try again in a few moments.";
          } else if (response.status === 429 || statusTextLower.includes("rate limit") || statusTextLower.includes("too many requests")) {
            errMsg = "Too many requests are being processed right now. Please wait a moment and try again.";
          } else if (response.status === 504 || response.status === 502 || statusTextLower.includes("timeout") || statusTextLower.includes("gateway")) {
            errMsg = "Unable to connect to the AI service. Please check your connection and try again.";
          }
        }
        throw new Error(errMsg);
      }

      const parsedData = await response.json();
      
      // Handle the serverless function wrapped error payload inside 200 OK responses
      if (parsedData && parsedData.error) {
        throw new Error(parsedData.error);
      }

      setRoadmapData(parsedData);
      setHasRoadmap(true);
    } catch (err: any) {
      console.error("Client side generate roadmap error:", err);
      let displayError = err.message || "Something went wrong while generating your roadmap. Please try again.";
      const errText = displayError.toLowerCase();
      if (errText.includes("failed to fetch") || 
          errText.includes("network error") || 
          errText.includes("timeout") || 
          errText.includes("fetch") || 
          errText.includes("unexpected token") || 
          errText.includes("is not valid json") || 
          errText.includes("json parse")) {
        displayError = "Unable to connect to the AI service. Please check your connection and try again.";
      }
      setErrorStatus(displayError);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!roadmapData) return;
    
    let md = `# PATHFINDER CAREER BLUEPRINT: ${careerGoal}\n\n`;
    md += `## PROFILE SUMMARY\n${roadmapData.summary}\n`;
    md += `Academic Stage: ${stage} | Weekly Target commitment: ${timeCommitment} | Expected Timeline: ${roadmapData.timelineEstimate}\n\n`;
    
    if (roadmapData.skillGapAnalysis) {
      md += `## PROFILE COMPETENCE ASSESSMENT (SKILL GAP ANALYSIS)\n`;
      md += `Knowledge Match Score: ${roadmapData.skillGapAnalysis.currentKnowledgeMatchScore}%\n`;
      md += `Gap Brief: ${roadmapData.skillGapAnalysis.gapBrief}\n\n`;
      md += `### Critical Missing Skills:\n`;
      roadmapData.skillGapAnalysis.missingSkills.forEach((s) => {
        md += `- **${s.name}** [${s.importance}] - ${s.reason}\n`;
      });
      md += `\n`;
    }

    if (roadmapData.recruiterExpectations) {
      md += `## INDUSTRY EXPECTATIONS (WHAT RECRUITERS EXPECT)\n`;
      md += `- Essential Core Skills checklist: ${roadmapData.recruiterExpectations.essentialCoreSkills.join(", ")}\n`;
      md += `- Portfolio Complexity standard: ${roadmapData.recruiterExpectations.portfolioStandard}\n`;
      md += `- Expected count of live production-ready systems: ${roadmapData.recruiterExpectations.minimumProjectsCount}\n`;
      md += `- Recruiter dynamic observations: ${roadmapData.recruiterExpectations.dynamicInsights}\n\n`;
    }

    md += `## 1. LEARNING TIMELINE ROADMAP\n`;
    roadmapData.roadmap.forEach((r) => {
      md += `### ${r.phase} (${r.duration})\n`;
      md += `Focus: ${r.focus}\n`;
      r.tasks.forEach((t) => md += `- [ ] ${t}\n`);
      md += `\n`;
    });

    if (roadmapData.recommendedProjectsDifficulty) {
      md += `## 2. PORTFOLIO LABS (DIFFICULTY SORTED PROJECT RECOMMENDATIONS)\n`;
      roadmapData.recommendedProjectsDifficulty.forEach((p) => {
        md += `### ${p.title} (${p.difficulty})\n`;
        md += `Objective: ${p.objective}\n`;
        md += `Tech Stack: ${p.technologies.join(", ")}\n`;
        md += `Resume Proof Competency: ${p.learningOutcome}\n\n`;
      });
    } else {
      md += `## 2. PORTFOLIO LABS\n`;
      roadmapData.projects.forEach((p) => {
        md += `### Project: ${p.name} (Complexity: ${p.level})\n`;
        md += `${p.description}\n`;
        md += `Tech Stack Suggested: ${p.techStack.join(", ")}\n`;
        md += `Key Technical Features:\n`;
        p.keyFeatures.forEach((f) => md += `  - ${f}\n`);
        md += `\n`;
      });
    }

    if (roadmapData.internshipPlaybook) {
      md += `## 3. INTERNSHIP & JOB STRATEGY PLAYBOOK\n`;
      md += `- Application Window: ${roadmapData.internshipPlaybook.applicationWindow}\n`;
      md += `- Complete FIRST these skills: ${roadmapData.internshipPlaybook.skillsToCompleteFirst.join(", ")}\n`;
      md += `- Projects that bypass filters: ${roadmapData.internshipPlaybook.resumeProjectsRequired.join(", ")}\n`;
      md += `### Preparation Timeline:\n`;
      roadmapData.internshipPlaybook.preparationTimeline.forEach((t) => md += `- ${t}\n`);
      md += `\n`;
    } else {
      md += `## 3. INTERNSHIPS STRATEGY\n`;
      roadmapData.internships.forEach((intern) => {
        md += `### Strategy: ${intern.strategy} (${intern.timeframe})\n`;
        intern.actionItems.forEach((item) => md += `- ${item}\n`);
        md += `\n`;
      });
    }

    if (roadmapData.studentStrategy) {
      md += `## 4. MENTOR'S STRATEGIC PLAYBOOK\n`;
      md += `### Focus Right Now:\n`;
      roadmapData.studentStrategy.focusNow.forEach((f) => md += `- ${f}\n`);
      md += `### Ignore Right Now (Noise to avoid):\n`;
      roadmapData.studentStrategy.ignoreForNow.forEach((i) => md += `- ${i}\n`);
      md += `### Common Student Traps & Mistakes to Avoid:\n`;
      roadmapData.studentStrategy.biggestMistakes.forEach((m) => md += `- ${m}\n`);
      md += `### Optimal shortcut to job readiness:\n"${roadmapData.studentStrategy.fastestPathToJobReady}"\n\n`;
    }

    md += `## 5. SKILLS & RECOMMENDATIONS MATRIX\n`;
    roadmapData.skills.forEach((s) => {
      md += `- **${s.name}** [Difficulty: ${s.difficulty}] - ${s.description}\n`;
    });

    navigator.clipboard.writeText(md);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setHasRoadmap(false);
    setRoadmapData(null);
    setCompletedTasks({});
    setCopySuccess(false);
  };

  const toggleTaskChecked = (phaseIdx: number, taskIdx: number) => {
    const key = `${phaseIdx}-${taskIdx}`;
    setCompletedTasks((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const activePhrasePercentage = Math.min(100, Math.floor(((loadingPhraseIndex + 1) / LOADING_PHRASES.length) * 100));

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#f3f4f6] selection:bg-violet-600/35 selection:text-white flex flex-col justify-between overflow-hidden">
      
      {/* Visual Stars Canvas Living Background & Gradient Orbs */}
      <LivingBackground />

      {/* Top micro-line indicator */}
      <div className="relative h-[2px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent w-full z-10" />

      {/* Navigation Bar / Branding */}
      <header className="relative py-6 px-6 md:px-12 border-b border-white/[0.02] bg-[#050505]/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-4 h-4 text-violet-400" />
            <span className="font-semibold text-sm tracking-tight text-white font-sans uppercase">
              Pathfinder
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-500 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/[0.01]">
              AI-powered career navigation for students
            </span>
          </div>

          <div className="flex items-center gap-4">
            {hasRoadmap && (
              <button
                id="btn-restart-form"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                Change Profile
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative flex-grow max-w-5xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col justify-center z-10">
        
        <AnimatePresence mode="wait">
          {!hasRoadmap ? (
            /* LUXURY MINIMAL LANDING & FORM */
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-16 md:space-y-24"
            >
              
              {/* HERO SECTION - Addressing the Real-World Problem */}
              <section className="text-center space-y-6 max-w-3xl mx-auto py-4 md:py-8">
                <span className="inline-flex text-[10px] font-mono text-violet-400 bg-violet-950/15 border border-violet-500/10 px-3.5 py-1 rounded-full uppercase tracking-widest font-medium">
                  AI-powered career navigation for students &bull; Bypass Confusion
                </span>
                
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-2xl mx-auto select-none font-sans">
                  Stop guessing <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    your career path.
                  </span>
                </h1>
                
                <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed font-light max-w-xl mx-auto">
                  Identify your skill gaps, discover relevant projects, and build a personalized roadmap tailored to your specific goals and academic stage.
                </p>
              </section>

              {/* FORM CONTAINER - Focused beautiful standalone luxury grid structure */}
              <section className="max-w-xl mx-auto">
                <form 
                  onSubmit={handleFormSubmit}
                  className="glass-panel rounded-3xl p-6 md:p-10 space-y-8 shadow-2xl relative overflow-visible"
                >
                  {/* Subtle top interior glow border line */}
                  <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

                  {errorStatus && (
                    <div className="p-4 rounded-xl bg-red-950/25 border border-red-900/30 text-xs text-red-200 flex items-start gap-3 animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Unable to formulate blueprint</p>
                        <p className="text-red-300/80 mt-1 leading-relaxed">{errorStatus}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* TWO-COLUMN DROPDOWNS: ACADEMIC STAGE & TARGET CAREER */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10.5px] font-medium text-slate-400 uppercase tracking-widest mb-2.5">
                          Academic Stage
                        </label>
                        <div className="relative">
                          <select
                            id="field-stage"
                            value={stage}
                            onChange={(e) => setStage(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-white/10 hover:border-white/15 focus:border-violet-500/50 rounded-xl px-4 py-3 text-xs text-white outline-none transition appearance-none cursor-pointer"
                          >
                            {ACADEMIC_STAGES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-medium text-slate-400 uppercase tracking-widest mb-2.5">
                          Career Goal
                        </label>
                        <div className="relative">
                          <select
                            id="field-career2"
                            value={careerGoal}
                            onChange={(e) => setCareerGoal(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-white/10 hover:border-white/15 focus:border-violet-500/50 rounded-xl px-4 py-3 text-xs text-white outline-none transition appearance-none cursor-pointer"
                          >
                            {TARGET_CAREERS.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* TEXTAREA: SKILLS */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10.5px] font-medium text-slate-400 uppercase tracking-widest">
                          Current Skills & Tools
                        </label>
                        <span className="text-[9px] text-slate-500 font-mono">Optional • Comma separated</span>
                      </div>
                      <textarea
                        id="field-skills-list"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="e.g. Python, SQL, Git, Basic Algorithms"
                        rows={3}
                        className="w-full bg-[#0A0A0A] border border-white/10 hover:border-white/15 focus:border-violet-500/50 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-slate-600 outline-none transition resize-none leading-relaxed"
                      />
                      
                      {/* Quiet elegant presets */}
                      <div className="mt-3.5 space-y-2">
                        <span className="text-[9.5px] text-slate-500 font-medium block uppercase tracking-wider">
                          Suggested tools for {careerGoal}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_SKILLS[careerGoal]?.map((skill) => {
                            const isIncluded = skills.toLowerCase().includes(skill.toLowerCase());
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => handleAddSkillChip(skill)}
                                className={`px-2.5 py-1 text-[10px] rounded-md border transition-all ${
                                  isIncluded
                                    ? "bg-violet-500/10 border-violet-500/30 text-violet-300 cursor-default"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10 text-slate-400 hover:text-white cursor-pointer"
                                }`}
                              >
                                {isIncluded ? "✓" : "+"} {skill}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* WEEKLY COMMITMENT */}
                    <div>
                      <label className="block text-[10.5px] font-medium text-slate-400 uppercase tracking-widest mb-2.5">
                        Weekly Focus Time
                      </label>
                      <div className="relative">
                        <select
                          id="field-weekly-time"
                          value={timeCommitment}
                          onChange={(e) => setTimeCommitment(e.target.value)}
                          className="w-full bg-[#0A0A0A] border border-white/10 hover:border-white/15 focus:border-violet-500/50 rounded-xl px-4 py-3 text-xs text-white outline-none transition appearance-none cursor-pointer"
                        >
                          {WEEKLY_COMMITMENTS.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-form-generate"
                    type="submit"
                    className="relative w-full group overflow-hidden bg-white text-black font-semibold py-3.5 rounded-xl transition duration-300 cursor-pointer text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(139,92,246,0.15)] flex items-center justify-center gap-2 hover:bg-neutral-100 hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] active:scale-[0.99]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-600 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Generate My Roadmap</span>
                  </button>
                </form>
              </section>

              {/* THE PROBLEM vs THE SOLUTION */}
              <section className="max-w-xl mx-auto pt-10 border-t border-white/[0.04] space-y-6">
                <div className="text-center space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                    The Blueprint Strategy
                  </span>
                  <h4 className="text-sm font-semibold text-slate-300">
                    Why standard career roadmaps fail students
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 text-xs font-light">
                  <div className="p-5 rounded-2xl bg-[#080808]/80 border border-white/[0.02] space-y-2.5">
                    <div className="flex items-center gap-2 text-rose-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      The Conflicting Advice Trap
                    </div>
                    <p className="text-slate-400 leading-relaxed text-left text-[11px] font-light">
                      Students often get stuck in tutorial loops, purchasing redundant courses or copying generic projects that senior engineers and hiring managers immediately filter out.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-violet-950/10 border border-violet-500/10 space-y-2.5">
                    <div className="flex items-center gap-2 text-violet-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      The Practical Pathfinder Approach
                    </div>
                    <p className="text-slate-300 leading-relaxed text-left text-[11px] font-light">
                      We analyze your specific goals and skills to construct an honest timeline. Pathfinder maps difficulty-sorted portfolio projects, details non-negotiable hiring expectation checklists, and outlines chronological preparation milestones.
                    </p>
                  </div>
                </div>
              </section>

            </motion.div>
          ) : (
            /* RESULTS PAGE - 4 BESPOKE LUXURY SECTIONS */
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-20 md:space-y-28 max-w-4xl mx-auto"
            >
              
              {/* RESULTS HEADER */}
              <div className="border-b border-white/[0.06] pb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4 max-w-2xl">
                  {/* Stage-Pill meta labels */}
                  <div className="inline-flex items-center gap-2 text-[10px] font-mono text-violet-400 uppercase tracking-widest bg-violet-950/15 border border-violet-500/10 px-3 py-1 rounded-full">
                    <span>{stage}</span>
                    <span className="w-1 h-1 rounded-full bg-violet-400/40" />
                    <span>{timeCommitment} Target</span>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
                    {careerGoal} Path
                  </h2>
                  
                  <p className="text-slate-400 text-sm leading-relaxed font-light">
                    {roadmapData?.summary}
                  </p>
                </div>

                {/* EXPORT OPTIONS */}
                <div className="flex gap-2.5 flex-shrink-0 self-start md:self-end">
                  <button
                    id="btn-action-copy"
                    onClick={handleCopyMarkdown}
                    className="px-4 py-2 bg-[#0A0A0A] border border-white/10 hover:border-violet-500/30 hover:bg-white/[0.02] rounded-xl text-[11px] uppercase tracking-wider font-semibold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    {copySuccess ? "Copied!" : "Copy Markdown"}
                  </button>
                  <button
                    id="btn-action-print"
                    onClick={handlePrint}
                    className="px-4 py-2 bg-[#0A0A0A] border border-white/10 hover:border-violet-500/30 hover:bg-white/[0.02] rounded-xl text-[11px] uppercase tracking-wider font-semibold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    Save Blueprint
                  </button>
                </div>
              </div>

              {/* SECTION 1: COMPETENCE ASSESSMENT (SKILL GAP + RECRUITER REALITY CHECK) */}
              {roadmapData && (roadmapData.skillGapAnalysis || roadmapData.recruiterExpectations) && (
                <section id="result-assessment" className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block font-medium">
                      01 // Competence Assessment
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      Skill Gap & Recruiter Reality Check
                    </h3>
                    <p className="text-xs text-slate-400 font-light max-w-2xl">
                      A personalized assessment of your skill deficits alongside direct, unvarnished standards of what recruiters actually demand.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* SKILL GAP ANALYSIS */}
                    {roadmapData.skillGapAnalysis && (
                      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block">
                            Section A // What You're Missing
                          </span>
                          <h4 className="text-lg font-bold text-white">Skill Gap Analysis</h4>
                        </div>

                        {/* Knowledge score meter */}
                        <div className="space-y-2 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Knowledge Match Score</span>
                            <span className="font-mono text-violet-400 font-bold">{roadmapData.skillGapAnalysis.currentKnowledgeMatchScore}%</span>
                          </div>
                          <div className="relative w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full" 
                              style={{ width: `${roadmapData.skillGapAnalysis.currentKnowledgeMatchScore}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed pt-1.5 font-light text-justify">
                            {roadmapData.skillGapAnalysis.gapBrief}
                          </p>
                        </div>

                        {/* List of missing skills */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500 font-bold block">Deficit Checklist</span>
                          <div className="space-y-2.5">
                            {roadmapData.skillGapAnalysis.missingSkills.map((s, idx) => (
                              <div key={idx} className="p-3.5 bg-red-950/[0.03] border border-red-900/10 rounded-xl space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-rose-300 font-mono">{s.name}</span>
                                  <span className="text-[8px] font-mono uppercase bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded border border-rose-500/15 font-bold">
                                    {s.importance}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-light text-justify">
                                  {s.reason}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RECRUITER EXPECTATIONS */}
                    {roadmapData.recruiterExpectations && (
                      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block">
                            Section B // What Recruiters Expect
                          </span>
                          <h4 className="text-lg font-bold text-white">Hiring Standards</h4>
                        </div>

                        {/* System portfolio standard */}
                        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-3.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Target Portfolio Standard</span>
                            <span className="font-mono text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded font-bold uppercase text-[9px]">
                              {roadmapData.recruiterExpectations.minimumProjectsCount}+ Projects Required
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-light text-justify">
                            {roadmapData.recruiterExpectations.portfolioStandard}
                          </p>
                        </div>

                        {/* Essential core checks */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500 font-bold block">First-Pass Resume Screening Checklist</span>
                          <div className="flex flex-wrap gap-2">
                            {roadmapData.recruiterExpectations.essentialCoreSkills.map((skill, idx) => (
                              <span key={idx} className="text-[11px] font-mono text-slate-300 bg-white/[0.02] border border-white/5 py-1 px-3 rounded-lg flex items-center gap-1.5 font-light">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-200" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Veteran Observations */}
                        <div className="p-4 bg-violet-950/[0.08] border border-violet-500/10 rounded-xl space-y-1.5">
                          <span className="text-[9.5px] font-mono uppercase text-[#8b5cf6] font-bold block">Insider Recruiter Truth</span>
                          <p className="text-xs text-slate-400 leading-relaxed font-light text-justify italic">
                            "{roadmapData.recruiterExpectations.dynamicInsights}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* SECTION 2: ROADMAP TIMELINE */}
              {roadmapData?.roadmap && (
                <section id="result-roadmap" className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block font-medium">
                      02 // Learning Timeline
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      Month-by-Month Iterations
                    </h3>
                    <p className="text-xs text-slate-400 font-light max-w-2xl">
                      A sequential, adaptive learning path tailor-routed for your available hours and background.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {roadmapData.roadmap.map((phase, pIdx) => {
                      const completedTasksCount = phase.tasks.filter((_, tIdx) => completedTasks[`${pIdx}-${tIdx}`]).length;
                      const isAllDone = completedTasksCount === phase.tasks.length && phase.tasks.length > 0;
                      
                      return (
                        <div 
                          key={pIdx} 
                          className={`glass-panel rounded-2xl p-6 md:p-8 transition-all duration-300 relative overflow-hidden ${
                            isAllDone ? "border-emerald-500/20 bg-emerald-500/[0.01]" : ""
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/[0.04]">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-[9.5px] uppercase font-mono tracking-widest text-[#8b5cf6] bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full font-bold">
                                  {phase.phase}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  Duration: {phase.duration}
                                </span>
                              </div>
                              <h4 className="text-lg font-bold text-white tracking-tight">
                                {phase.focus}
                              </h4>
                            </div>

                            <div className="text-[10px] font-mono text-slate-400 bg-white/[0.03] border border-white/5 px-3 py-1 rounded inline-flex self-start sm:self-auto items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${isAllDone ? "bg-emerald-400" : "bg-violet-400 animate-pulse"}`} />
                              {completedTasksCount} of {phase.tasks.length} Completed
                            </div>
                          </div>

                          {/* Interactive list checkboxes */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {phase.tasks.map((task, tIdx) => {
                              const isChecked = !!completedTasks[`${pIdx}-${tIdx}`];
                              return (
                                <div 
                                  key={tIdx}
                                  onClick={() => toggleTaskChecked(pIdx, tIdx)}
                                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all duration-200 ${
                                    isChecked 
                                      ? "bg-emerald-500/[0.03] border-emerald-500/25 text-emerald-200/95" 
                                      : "bg-white/[0.01] hover:bg-white/[0.03] border-white/[0.03] hover:border-white/[0.08] text-slate-300"
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all mt-0.5 ${
                                    isChecked
                                      ? "bg-emerald-500 border-transparent text-black" 
                                      : "border-slate-700 bg-black/60"
                                  }`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className={`text-xs leading-normal ${isChecked ? "line-through text-slate-500 font-light" : "font-normal"}`}>
                                    {task}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* SECTION 3: PROJECT RECOMMENDATION ENGINE */}
              {roadmapData?.recommendedProjectsDifficulty && (
                <section id="result-projects-engine" className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block font-medium">
                      03 // Project Recommendation Engine
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      Targeted Practice Portfolio
                    </h3>
                    <p className="text-xs text-slate-400 font-light max-w-2xl">
                      Bypass typical copycat tutorials. Build these custom-tailored projects mapped by strict technical difficulty to stand out.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {roadmapData.recommendedProjectsDifficulty.map((proj, pIdx) => {
                      const diffColors: Record<string, string> = {
                        "Beginner": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                        "Intermediate": "text-amber-400 bg-amber-500/10 border-amber-500/20",
                        "Advanced": "text-rose-400 bg-rose-500/10 border-rose-500/20"
                      };
                      const colorClass = diffColors[proj.difficulty] || "text-violet-400 bg-violet-500/10 border-violet-500/20";
                      
                      return (
                        <div 
                          key={pIdx}
                          className="glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 hover:border-white/10"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9.5px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${colorClass}`}>
                                {proj.difficulty}
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            </div>

                            <h4 className="text-base font-bold text-white leading-snug">
                              {proj.title}
                            </h4>

                            <div className="space-y-1.5">
                              <div className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-semibold">Objective</div>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-light text-justify">
                                {proj.objective}
                              </p>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <div className="text-[9px] font-mono tracking-widest text-[#8b5cf6] uppercase font-bold">Resume Proof Value</div>
                              <p className="text-[11px] text-slate-400 font-light leading-relaxed text-justify">
                                {proj.learningOutcome}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/[0.04]">
                            <div className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mb-2">Build Tech Stack</div>
                            <div className="flex flex-wrap gap-1.5">
                              {proj.technologies.map((tech) => (
                                <span 
                                  key={tech} 
                                  className="text-[9.5px] font-mono text-slate-300 bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* SECTION 4: INTERNSHIP TARGET PLAYBOOK */}
              {roadmapData?.internshipPlaybook ? (
                <section id="result-internships-playbook" className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block font-medium">
                      04 // Internship Timeline Playbook
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      Acquisition Timeline & Blueprint
                    </h3>
                    <p className="text-xs text-slate-400 font-light max-w-2xl">
                      Actionable timeline and requirements to prepare for and convert high-fidelity internship cycles.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Window & Required Skills */}
                    <div className="glass-panel rounded-2xl p-6 space-y-6">
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Ideal Application Window</div>
                        <div className="p-3.5 bg-violet-950/10 border border-violet-500/10 rounded-xl">
                          <span className="text-white text-xs font-semibold block">{roadmapData.internshipPlaybook.applicationWindow}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Complete First Before Applying</div>
                        <div className="flex flex-wrap gap-1.5">
                          {roadmapData.internshipPlaybook.skillsToCompleteFirst.map((skill, idx) => (
                            <span key={idx} className="text-[10.5px] font-mono bg-white/[0.02] border border-white/5 text-slate-300 px-2.5 py-1 rounded-lg">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Resume Highlight Projects */}
                    <div className="glass-panel rounded-2xl p-6 space-y-4">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Recommended Resume Matchmakers</div>
                      <div className="space-y-2.5">
                        {roadmapData.internshipPlaybook.resumeProjectsRequired.map((proj, idx) => (
                          <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-start gap-2.5">
                            <span className="text-violet-400 text-xs font-mono select-none mt-0.5">•</span>
                            <p className="text-[11px] text-slate-300 leading-normal font-light">{proj}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Chronological Preparation Timeline */}
                    <div className="glass-panel rounded-2xl p-6 space-y-4">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Preparation & Outreach Schedule</div>
                      <div className="space-y-3.5 relative before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-[1px] before:bg-white/5">
                        {roadmapData.internshipPlaybook.preparationTimeline.map((step, idx) => (
                          <div key={idx} className="relative pl-6 flex items-start gap-2">
                            <span className="absolute left-[3.5px] top-[5px] w-2 h-2 rounded-full bg-[#8b5cf6] border border-black" />
                            <p className="text-[11px] text-slate-300 leading-relaxed font-light">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                roadmapData?.internships && (
                  <section id="result-internships" className="space-y-8">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block font-medium">
                        04 // Experience Playbooks
                      </span>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                        Internship Acquisition Strategies
                      </h3>
                      <p className="text-xs text-slate-400 font-light max-w-2xl">
                        Granular networking blueprints to source roles and early engineering experience.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {roadmapData.internships.map((intern, iIdx) => (
                        <div 
                          key={iIdx}
                          className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-start gap-6 transition-all duration-300 hover:border-white/10"
                        >
                          <div className="md:w-1/3 space-y-2 flex-shrink-0">
                            <h4 className="text-base font-bold text-white tracking-tight">
                              {intern.strategy}
                            </h4>
                            <div className="inline-flex text-[10px] font-mono text-slate-400 items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              Target: {intern.timeframe}
                            </div>
                          </div>

                          <div className="md:w-2/3 space-y-3">
                            {intern.actionItems.map((action, aIdx) => (
                              <div key={aIdx} className="flex gap-3 items-start text-xs text-slate-300 font-light leading-relaxed">
                                <span className="text-violet-400/80 mt-0.5 font-mono select-none text-[10px]">0{aIdx + 1}.</span>
                                <p>{action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              )}

              {/* SECTION 5: MENTOR'S STRATEGIC PLAYBOOK (STUDENT STRATEGY) */}
              {roadmapData?.studentStrategy && (
                <section id="result-student-strategy" className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block font-medium">
                      05 // Mentor's Strategic Playbook
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      No-Nonsense Career Rules
                    </h3>
                    <p className="text-xs text-slate-400 font-light max-w-2xl">
                      Veteran advice to keep you laser-focused. Shut down the noise and accelerate your preparation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Focus vs Ignore */}
                    <div className="glass-panel rounded-2xl p-6 space-y-6 md:col-span-1">
                      <div className="space-y-3.5">
                        <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">What to Focus On Now</div>
                        <div className="space-y-2">
                          {roadmapData.studentStrategy.focusNow.map((item, idx) => (
                            <div key={idx} className="p-2.5 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl text-xs text-neutral-200 font-light flex items-start gap-2 text-justify">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3.5 pt-4 border-t border-white/[0.04]">
                        <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">What to Ignore For Now (Noise)</div>
                        <div className="space-y-2">
                          {roadmapData.studentStrategy.ignoreForNow.map((item, idx) => (
                            <div key={idx} className="p-2.5 bg-red-500/[0.02] border border-red-500/10 rounded-xl text-xs text-neutral-300 font-light flex items-start gap-2 text-justify">
                              <span className="text-red-400 font-bold">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Biggest Mistakes */}
                    <div className="glass-panel rounded-2xl p-6 space-y-4 md:col-span-1 border border-amber-500/5">
                      <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">Biggest Mistakes to Avoid</div>
                      <div className="space-y-3">
                        {roadmapData.studentStrategy.biggestMistakes.map((mistake, idx) => (
                          <div key={idx} className="p-3 bg-[#0c0a09] border border-amber-500/10 rounded-xl flex items-start gap-2.5">
                            <span className="text-amber-400 text-xs font-mono font-bold">0{idx + 1}.</span>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-light text-justify">{mistake}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fastest Path to becoming Job-Ready */}
                    <div className="glass-panel rounded-2xl p-6 space-y-4 md:col-span-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="text-[10px] font-mono text-violet-400 uppercase tracking-wider font-bold">Fastest Path to Job-Ready</div>
                        <h4 className="text-sm font-bold text-white tracking-tight">The Mentor's Golden Rule</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-light text-justify p-4 bg-violet-950/10 border border-violet-500/10 rounded-xl italic">
                          "{roadmapData.studentStrategy.fastestPathToJobReady}"
                        </p>
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono italic">
                        * Decisive preparation trumps random certificates.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 6: AUXILIARY PROFESSIONAL STRATEGY SUITE */}
              <section id="result-strategy" className="space-y-12">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest block font-medium">
                    06 // Placement Preparedness Summary
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    Professional Strategy Suite
                  </h3>
                  <p className="text-xs text-slate-400 font-light max-w-2xl">
                    Final credentials, LinkedIn exposure, portfolio polishing, and custom strength matrices.
                  </p>
                </div>

                {/* Grid container combining key subcomponents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Skill Certifications */}
                  {roadmapData?.certifications && roadmapData.certifications.length > 0 && (
                    <div className="glass-panel rounded-2xl p-6 space-y-5">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-violet-400" />
                          Target Certifications
                        </h4>
                        <p className="text-[11px] text-slate-400 font-light">Accredited certifications containing proven market weight.</p>
                      </div>

                      <div className="space-y-3.5">
                        {roadmapData.certifications.map((certs, cIdx) => (
                          <div key={cIdx} className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-xs font-bold text-white leading-normal">{certs.name}</h5>
                              <span className="text-[8.5px] font-mono text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded font-bold shrink-0">
                                {certs.costEstimate}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span>Issuer: {certs.issuer}</span>
                              <span className="text-violet-400">Value: {certs.valueRating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ATS Resume Alignment tips */}
                  {roadmapData?.resumeTips && roadmapData.resumeTips.length > 0 && (
                    <div className="glass-panel rounded-2xl p-6 space-y-5">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-400" />
                          Resume Calibration
                        </h4>
                        <p className="text-[11px] text-slate-400 font-light">Structure corrections to survive Applicant Tracking Systems (ATS).</p>
                      </div>

                      <div className="space-y-3.5">
                        {roadmapData.resumeTips.map((tips, tIdx) => (
                          <div key={tIdx} className="space-y-1.5 p-3.5 bg-white/[0.01] border border-white/5 rounded-xl">
                            <div className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest">{tips.section} alignment</div>
                            <p className="text-xs text-slate-300 font-light leading-relaxed text-justify">
                              {tips.advice}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional tips (from LinkedIn and placements) */}
                {(roadmapData?.linkedinTips || roadmapData?.interviewStrategy) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* LinkedIn & Outreach tacticals */}
                    {roadmapData?.linkedinTips && roadmapData.linkedinTips.length > 0 && (
                      <div className="glass-panel rounded-2xl p-6 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-violet-400" />
                            LinkedIn Outreach Tactic
                          </h4>
                          <p className="text-[11px] text-slate-400 font-light">Build professional visibility and trigger referral requests.</p>
                        </div>
                        <div className="space-y-2.5">
                          {roadmapData.linkedinTips.slice(0, 3).map((tip, idx) => (
                            <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
                              <span className="text-[8px] font-mono uppercase text-violet-300 font-bold">{tip.area}</span>
                              <p className="text-xs text-slate-300 leading-relaxed font-light">{tip.tactic}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interview Tactics round tips */}
                    {roadmapData?.interviewStrategy && roadmapData.interviewStrategy.length > 0 && (
                      <div className="glass-panel rounded-2xl p-6 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-violet-400" />
                            Interview Round Playbook
                          </h4>
                          <p className="text-[11px] text-slate-400 font-light">Targeted steps and technical drills for technical interviews.</p>
                        </div>
                        <div className="space-y-2.5 font-light">
                          {roadmapData.interviewStrategy.slice(0, 2).map((strat, idx) => (
                            <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                              <div className="text-xs font-bold text-slate-200">{strat.roundType}</div>
                              <p className="text-xs text-slate-400 leading-relaxed text-justify">{strat.prepAction}</p>
                              <div className="space-y-1 pt-1.5 border-t border-white/[0.04]">
                                <span className="text-[9px] font-mono uppercase text-[#8b5cf6] font-bold block">Complex Prep Drill</span>
                                <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                                  {strat.sampleQuestions.slice(0, 2).map((q, qidx) => (
                                    <li key={qidx} className="text-[11px]">{q}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </section>

              {/* FLOATING ACTION TOOLBAR AT BOTTOM OF REPORT */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 glass-panel bg-[#050505]/70 rounded-2xl">
                <div className="text-xs text-slate-400 font-light flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Successfully printed with career goal: <strong className="text-slate-200">{careerGoal}</strong>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-white text-black font-semibold rounded-xl text-xs hover:bg-slate-200 transition active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    Build Another Roadmap
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="relative py-8 px-6 border-t border-white/[0.04] bg-[#050505]/60 block text-center mt-20 z-10">
        <div className="max-w-6xl mx-auto space-y-1.5">
          <p className="text-[11px] text-slate-500 font-light tracking-wide">
            Pathfinder &bull; AI-powered career navigation for students
          </p>
          <p className="text-[10px] text-slate-600 font-sans tracking-wide">
            Powered by Google Gemini to help students make informed career decisions. Built with real-world career planning frameworks.
          </p>
        </div>
      </footer>

      {/* RE-DESIGNED EXQUISITE FULL-SCREEN BLUR LOADING SEQUENCE */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 select-none"
          >
            <div className="max-w-md w-full space-y-8 text-center relative">
              {/* Glass container wrapping the loading assets */}
              <div className="glass-panel rounded-3xl p-8 md:p-12 space-y-6 shadow-2xl relative">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />

                {/* Elegant subtle pulse-glow spinner wrapper */}
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500/10 animate-ping opacity-60" />
                  <div className="absolute inset-2 rounded-full border border-violet-500/20" />
                  <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-mono tracking-widest text-[#8b5cf6] font-bold">
                    Formulating Blueprint
                  </h3>
                  
                  <div className="space-y-2">
                    {/* Ticking phrase selector */}
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={loadingPhraseIndex}
                        initial={{ opacity: 0, y: 5, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -5, filter: "blur(4px)" }}
                        transition={{ duration: 0.3 }}
                        className="text-lg font-semibold tracking-wide text-white"
                      >
                        {LOADING_PHRASES[loadingPhraseIndex]}
                      </motion.p>
                    </AnimatePresence>
                    
                    <p className="text-xs text-slate-500 font-light leading-relaxed max-w-xs mx-auto">
                      Designing specialized capstone portfolios, ATS alignments, and placement playbooks...
                    </p>
                  </div>
                </div>

                {/* Minimalist Micro Progress Bar */}
                <div className="space-y-2 pt-2">
                  <div className="relative w-full h-[2px] bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute top-0 bottom-0 left-0 bg-violet-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${activePhrasePercentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Calculations complete: {activePhrasePercentage}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
