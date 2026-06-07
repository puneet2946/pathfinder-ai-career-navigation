export interface RoadmapPhase {
  phase: string;
  duration: string;
  focus: string;
  tasks: string[];
}

export interface SkillItem {
  name: string;
  category: string;
  difficulty: string;
  description: string;
}

export interface ProjectItem {
  name: string;
  description: string;
  keyFeatures: string[];
  techStack: string[];
  level: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  costEstimate: string;
  valueRating: string;
}

export interface InternshipItem {
  strategy: string;
  timeframe: string;
  actionItems: string[];
}

export interface ResumeTip {
  section: string;
  advice: string;
}

export interface PlacementStrategy {
  stage: string;
  recommendation: string;
}

export interface InterviewStrategy {
  roundType: string;
  prepAction: string;
  sampleQuestions: string[];
}

export interface OpenSourceStrategy {
  platform: string;
  guide: string;
}

export interface LinkedInTip {
  area: string;
  tactic: string;
}

export interface SuccessProbability {
  percentage: number;
  analysis: string;
  keyStrengths: string[];
  areasToImprove: string[];
}

export interface SkillGapItem {
  name: string;
  importance: string;
  reason: string;
}

export interface SkillGapAnalysis {
  missingSkills: SkillGapItem[];
  currentKnowledgeMatchScore: number;
  gapBrief: string;
}

export interface RecruiterExpectations {
  essentialCoreSkills: string[];
  portfolioStandard: string;
  minimumProjectsCount: number;
  dynamicInsights: string;
}

export interface RecommendedProject {
  title: string;
  difficulty: string;
  objective: string;
  technologies: string[];
  learningOutcome: string;
}

export interface InternshipPlaybook {
  applicationWindow: string;
  skillsToCompleteFirst: string[];
  resumeProjectsRequired: string[];
  preparationTimeline: string[];
}

export interface StudentStrategy {
  focusNow: string[];
  ignoreForNow: string[];
  biggestMistakes: string[];
  fastestJobReadyPath: string;
}

export interface CareerRoadmapResponse {
  summary: string;
  roadmap: RoadmapPhase[];
  skills: SkillItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  internships: InternshipItem[];
  resumeTips: ResumeTip[];
  placementStrategy: PlacementStrategy[];
  interviewStrategy: InterviewStrategy[];
  openSource: OpenSourceStrategy[];
  linkedinTips: LinkedInTip[];
  timelineEstimate: string;
  successProbability: SuccessProbability;
  skillGapAnalysis?: SkillGapAnalysis;
  recruiterExpectations?: RecruiterExpectations;
  recommendedProjectsDifficulty?: RecommendedProject[];
  internshipPlaybook?: InternshipPlaybook;
  studentStrategy?: StudentStrategy;
}
