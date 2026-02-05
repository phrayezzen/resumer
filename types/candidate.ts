export interface CandidateScores {
  skillsMatch: number;
  experience: number;
  education: number;
  cultureFit: number;
}

export interface PageRange {
  start: number;
  end: number;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  pageRange: PageRange;

  // Extracted content
  resumeText: string;
  coverLetterText: string;
  transcriptText: string;

  // AI Analysis
  overallScore: number; // 0-100
  scores: CandidateScores;
  gpa?: number;
  keySkills: string[];
  pros: string[];
  cons: string[];
  aiSummary: string;

  // User overrides
  userScore?: number;
  userNotes?: string;
  isTopPick: boolean;
}

export interface RawApplicantData {
  pageRange: PageRange;
  text: string;
  resumeText?: string;
  coverLetterText?: string;
  transcriptText?: string;
}
