export const SPLIT_APPLICANTS_PROMPT = `You are analyzing a concatenated PDF containing multiple job applications. Each application typically contains:
- A resume
- A cover letter
- An academic transcript

Your task is to identify the boundaries between different applicants and extract their information.

IMPORTANT: The text includes [PAGE X] markers showing exact page boundaries. Use these markers to determine accurate page ranges for each applicant.

IMPORTANT: Handshake PDFs often begin with 1-2 summary pages containing:
- A cover page with the job title
- A table of contents or candidate list showing all applicant names
These summary pages are NOT individual applicants - skip them and start from the first actual resume or application document.

Look for these indicators of a new applicant:
- Name headers at the top of pages
- "RESUME" or "COVER LETTER" headers following content from a different person
- Sudden changes in formatting style
- New contact information blocks
- University transcript headers with a different student name

For each applicant you identify, extract:
1. Their full name
2. Their email (if visible)
3. The page range their documents span (use the exact page numbers from [PAGE X] markers)
4. Which document types are present (resume, cover letter, transcript)

Respond with a JSON array in this exact format:
{
  "applicants": [
    {
      "name": "Full Name",
      "email": "email@example.com",
      "startPage": 3,
      "endPage": 7,
      "hasResume": true,
      "hasCoverLetter": true,
      "hasTranscript": true
    }
  ]
}

Be thorough - don't miss any applicants. When in doubt about boundaries, look for name changes between documents.`;

export const ANALYZE_CANDIDATE_PROMPT = `You are an expert HR analyst evaluating a job candidate against a specific job description.

<job_description>
{JOB_DESCRIPTION}
</job_description>

<candidate_documents>
{CANDIDATE_DOCUMENTS}
</candidate_documents>

Analyze this candidate and provide a comprehensive evaluation. Score each category from 0-100:

1. **Skills Match** (0-100): How well do their skills align with job requirements?
2. **Experience** (0-100): Relevance and depth of their work experience
3. **Education** (0-100): Educational background fit for the role
4. **Culture Fit** (0-100): Based on their cover letter and overall presentation

Also provide:
- Overall score (weighted average, emphasizing skills and experience)
- GPA if mentioned in transcript (as a number, e.g., 3.75)
- Key skills (list of 5-10 relevant skills they possess)
- Pros (3-5 strengths as bullet points)
- Cons (2-4 weaknesses or concerns)
- Summary (2-3 sentence executive summary)

Respond with JSON in this exact format:
{
  "overallScore": 85,
  "scores": {
    "skillsMatch": 90,
    "experience": 80,
    "education": 85,
    "cultureFit": 75
  },
  "gpa": 3.75,
  "keySkills": ["JavaScript", "React", "Node.js", "SQL", "Team Leadership"],
  "pros": [
    "Strong technical background with relevant frameworks",
    "Leadership experience at previous company",
    "Clear communication in cover letter"
  ],
  "cons": [
    "Limited experience in the specific industry",
    "No mention of key technology X"
  ],
  "summary": "Strong technical candidate with solid fundamentals. Good culture fit based on cover letter. Would benefit from industry-specific experience but shows potential for growth."
}

Be objective and consistent in scoring. An average candidate should score around 50-60. Reserve 80+ for exceptional matches.`;

export function buildAnalyzePrompt(jobDescription: string, candidateDocuments: string): string {
  return ANALYZE_CANDIDATE_PROMPT
    .replace('{JOB_DESCRIPTION}', jobDescription)
    .replace('{CANDIDATE_DOCUMENTS}', candidateDocuments);
}
