import Anthropic from '@anthropic-ai/sdk';
import { Candidate, RawApplicantData } from '@/types';
import { SPLIT_APPLICANTS_PROMPT, buildAnalyzePrompt } from '@/lib/prompts';
import { generateId } from '@/lib/utils';

// Initialize client - API key from environment
const anthropic = new Anthropic();

// Retry helper for handling rate limits and transient errors
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const apiError = error as { status?: number; headers?: { get?: (key: string) => string | null } };
      const isRateLimit = apiError?.status === 429;
      const isRetryable = apiError?.status === 500 || isRateLimit;

      if (!isRetryable || attempt === maxRetries) throw error;

      // Use retry-after header if available, otherwise exponential backoff
      const retryAfter = apiError?.headers?.get?.('retry-after');
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : baseDelayMs * Math.pow(2, attempt);

      console.log(`[AI] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

export interface ApplicantBoundary {
  name: string;
  email?: string;
  startPage: number;
  endPage: number;
  hasResume: boolean;
  hasCoverLetter: boolean;
  hasTranscript: boolean;
}

export interface SplitResult {
  applicants: ApplicantBoundary[];
}

export interface AnalysisResult {
  overallScore: number;
  scores: {
    skillsMatch: number;
    experience: number;
    education: number;
    cultureFit: number;
  };
  gpa?: number;
  keySkills: string[];
  pros: string[];
  cons: string[];
  summary: string;
}

// Stage 1: Identify applicant boundaries in the PDF
export async function identifyApplicants(fullText: string, totalPages: number): Promise<SplitResult> {
  console.log('[AI] Identifying applicants...');
  console.log('[AI] Total pages:', totalPages);
  console.log('[AI] Text length:', fullText.length);
  console.log('[AI] Text preview:', fullText.slice(0, 500));

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${SPLIT_APPLICANTS_PROMPT}\n\nTotal pages in PDF: ${totalPages}\n\n<pdf_content>\n${fullText.slice(0, 500000)}\n</pdf_content>`
      }
    ]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  console.log('[AI] Claude response:', responseText);

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[AI] Failed to find JSON in response:', responseText);
    throw new Error('Failed to parse applicant boundaries from AI response');
  }

  const result = JSON.parse(jsonMatch[0]) as SplitResult;
  console.log('[AI] Parsed applicants:', JSON.stringify(result, null, 2));
  return result;
}

// Stage 2: Analyze a single candidate
export async function analyzeCandidate(
  applicantData: RawApplicantData,
  applicantInfo: ApplicantBoundary,
  jobDescription: string
): Promise<Candidate> {
  const candidateDocuments = `
Name: ${applicantInfo.name}
${applicantInfo.email ? `Email: ${applicantInfo.email}` : ''}

=== RESUME ===
${applicantData.resumeText || 'Not provided'}

=== COVER LETTER ===
${applicantData.coverLetterText || 'Not provided'}

=== TRANSCRIPT ===
${applicantData.transcriptText || 'Not provided'}
`.trim();

  const prompt = buildAnalyzePrompt(jobDescription, candidateDocuments);

  const message = await withRetry(() =>
    anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  );

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse analysis for ${applicantInfo.name}`);
  }

  const analysis = JSON.parse(jsonMatch[0]) as AnalysisResult;

  return {
    id: generateId(),
    name: applicantInfo.name,
    email: applicantInfo.email,
    pageRange: applicantData.pageRange,
    resumeText: applicantData.resumeText || '',
    coverLetterText: applicantData.coverLetterText || '',
    transcriptText: applicantData.transcriptText || '',
    overallScore: analysis.overallScore,
    scores: analysis.scores,
    gpa: analysis.gpa,
    keySkills: analysis.keySkills,
    pros: analysis.pros,
    cons: analysis.cons,
    aiSummary: analysis.summary,
    isTopPick: analysis.overallScore >= 75 // Auto-mark high scorers
  };
}

// Batch analyze multiple candidates with progress callback
export async function analyzeAllCandidates(
  applicantsData: Array<{ data: RawApplicantData; info: ApplicantBoundary }>,
  jobDescription: string,
  onProgress?: (current: number, total: number) => void
): Promise<Candidate[]> {
  const candidates: Candidate[] = [];
  const total = applicantsData.length;

  for (let i = 0; i < applicantsData.length; i++) {
    const { data, info } = applicantsData[i];

    try {
      const candidate = await analyzeCandidate(data, info, jobDescription);
      candidates.push(candidate);
    } catch (error) {
      console.error(`Failed to analyze candidate ${info.name}:`, error);
      // Create a placeholder candidate with error state
      candidates.push({
        id: generateId(),
        name: info.name,
        email: info.email,
        pageRange: data.pageRange,
        resumeText: data.resumeText || '',
        coverLetterText: data.coverLetterText || '',
        transcriptText: data.transcriptText || '',
        overallScore: 0,
        scores: { skillsMatch: 0, experience: 0, education: 0, cultureFit: 0 },
        keySkills: [],
        pros: [],
        cons: ['Analysis failed - please review manually'],
        aiSummary: 'Analysis could not be completed',
        isTopPick: false
      });
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  // Sort by overall score descending
  return candidates.sort((a, b) => b.overallScore - a.overallScore);
}
