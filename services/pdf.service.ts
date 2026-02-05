import { RawApplicantData, PageRange } from '@/types';

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface PDFParseResult {
  pages: ParsedPage[];
  totalPages: number;
  fullText: string;
}

interface PDFData {
  numpages: number;
  text: string;
}

// Server-side PDF parsing (for API route)
export async function parsePDFFromBuffer(buffer: Buffer): Promise<PDFParseResult> {
  // Import directly from lib to avoid pdf-parse's test file loading bug
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js');

  const pageTexts: string[] = [];

  // Custom page renderer to extract text per-page with accurate boundaries
  const options = {
    pagerender: function(pageData: { getTextContent: () => Promise<{ items: Array<{ str: string }> }> }) {
      return pageData.getTextContent().then((textContent) => {
        const text = textContent.items.map((item) => item.str).join(' ');
        pageTexts.push(text);
        return text;
      });
    }
  };

  const data: PDFData = await pdfParse(buffer, options);

  const pages: ParsedPage[] = pageTexts.map((text, i) => ({
    pageNumber: i + 1,
    text: text
  }));

  // Create full text WITH page markers for Claude to accurately identify boundaries
  const fullText = pages.map(p => `[PAGE ${p.pageNumber}]\n${p.text}`).join('\n\n');

  console.log('[PDF] Parsed PDF:', {
    numPages: data.numpages,
    pagesExtracted: pages.length,
    textLength: fullText.length,
    textPreview: fullText.slice(0, 500) + '...'
  });

  return {
    pages,
    totalPages: data.numpages,
    fullText
  };
}

// Extract text for a specific page range
export function extractTextForRange(pages: ParsedPage[], range: PageRange): string {
  return pages
    .filter(p => p.pageNumber >= range.start && p.pageNumber <= range.end)
    .map(p => p.text)
    .join('\n\n--- Page Break ---\n\n');
}

// Try to identify document sections within text
export function identifyDocumentSections(text: string): {
  resumeText: string;
  coverLetterText: string;
  transcriptText: string;
} {
  // Look for section markers
  const resumeMarkers = ['resume', 'curriculum vitae', 'cv', 'experience', 'work history'];
  const coverLetterMarkers = ['cover letter', 'dear hiring', 'dear sir', 'dear madam', 'to whom it may concern', 'i am writing'];
  const transcriptMarkers = ['transcript', 'academic record', 'grade report', 'semester', 'gpa', 'credits'];

  let resumeText = '';
  let coverLetterText = '';
  let transcriptText = '';

  // Simple heuristic: split by common patterns and categorize
  const sections = text.split(/(?=RESUME|COVER LETTER|TRANSCRIPT|ACADEMIC)/i);

  for (const section of sections) {
    const sectionLower = section.toLowerCase();

    if (resumeMarkers.some(m => sectionLower.includes(m)) && !resumeText) {
      resumeText = section;
    } else if (coverLetterMarkers.some(m => sectionLower.includes(m)) && !coverLetterText) {
      coverLetterText = section;
    } else if (transcriptMarkers.some(m => sectionLower.includes(m)) && !transcriptText) {
      transcriptText = section;
    }
  }

  // Fallback: if we couldn't identify sections, put everything in resume
  if (!resumeText && !coverLetterText && !transcriptText) {
    resumeText = text;
  }

  return { resumeText, coverLetterText, transcriptText };
}

// Create raw applicant data from AI-identified boundaries
export function createApplicantData(
  pages: ParsedPage[],
  applicantInfo: {
    name: string;
    email?: string;
    startPage: number;
    endPage: number;
  }
): RawApplicantData {
  const range: PageRange = {
    start: applicantInfo.startPage,
    end: applicantInfo.endPage
  };

  const text = extractTextForRange(pages, range);
  const sections = identifyDocumentSections(text);

  return {
    pageRange: range,
    text,
    ...sections
  };
}
