import { NextRequest, NextResponse } from 'next/server';
import { parsePDFFromBuffer, createApplicantData } from '@/services/pdf.service';
import { identifyApplicants, analyzeCandidate } from '@/services/ai.service';
import { Candidate } from '@/types';
import { generateId } from '@/lib/utils';

export const maxDuration = 300; // 5 minutes for large PDFs

export async function POST(request: NextRequest) {
  try {
    const { pdfBase64, jobDescription } = await request.json();

    if (!pdfBase64 || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: pdfBase64 and jobDescription' },
        { status: 400 }
      );
    }

    // Decode base64 PDF
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Step 1: Parse PDF
    const { pages, totalPages, fullText } = await parsePDFFromBuffer(pdfBuffer);

    // Step 2: Identify applicants using AI
    const splitResult = await identifyApplicants(fullText, totalPages);
    const applicants = splitResult.applicants;

    if (applicants.length === 0) {
      return NextResponse.json(
        { error: 'No applicants identified in the PDF' },
        { status: 400 }
      );
    }

    // Step 3: Analyze each candidate
    const candidates: Candidate[] = [];

    for (const applicant of applicants) {
      const applicantData = createApplicantData(pages, applicant);

      try {
        const candidate = await analyzeCandidate(applicantData, applicant, jobDescription);
        candidates.push(candidate);
      } catch (error) {
        console.error(`Failed to analyze ${applicant.name}:`, error);
        // Create placeholder for failed analysis
        candidates.push({
          id: generateId(),
          name: applicant.name,
          email: applicant.email,
          pageRange: { start: applicant.startPage, end: applicant.endPage },
          resumeText: applicantData.resumeText || '',
          coverLetterText: applicantData.coverLetterText || '',
          transcriptText: applicantData.transcriptText || '',
          overallScore: 0,
          scores: { skillsMatch: 0, experience: 0, education: 0, cultureFit: 0 },
          keySkills: [],
          pros: [],
          cons: ['Analysis failed - please review manually'],
          aiSummary: 'Analysis could not be completed',
          isTopPick: false
        });
      }
    }

    // Sort by score
    candidates.sort((a, b) => b.overallScore - a.overallScore);

    const sessionId = generateId();

    return NextResponse.json({
      sessionId,
      candidates,
      totalPages,
      processingTime: Date.now()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
