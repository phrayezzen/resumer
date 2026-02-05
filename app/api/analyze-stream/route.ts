import { NextRequest } from 'next/server';
import { parsePDFFromBuffer, createApplicantData } from '@/services/pdf.service';
import { identifyApplicants, analyzeCandidate } from '@/services/ai.service';
import { Candidate } from '@/types';
import { generateId } from '@/lib/utils';

export const maxDuration = 300;

function createSSEMessage(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(createSSEMessage(data)));
      };

      try {
        const { pdfBase64, jobDescription } = await request.json();

        if (!pdfBase64 || !jobDescription) {
          send({ status: 'error', error: 'Missing required fields' });
          controller.close();
          return;
        }

        // Step 1: Parse PDF
        send({ status: 'parsing', progress: 0.1, message: 'Parsing PDF...' });
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const { pages, totalPages, fullText } = await parsePDFFromBuffer(pdfBuffer);
        console.log('[API] PDF parsed:', { totalPages, textLength: fullText.length });

        send({ status: 'parsing', progress: 0.2, message: `Parsed ${totalPages} pages` });

        // Step 2: Identify applicants
        send({ status: 'splitting', progress: 0.3, message: 'Identifying applicants...' });
        const splitResult = await identifyApplicants(fullText, totalPages);
        const applicants = splitResult.applicants;
        console.log('[API] Applicants found:', applicants.length, applicants);

        if (applicants.length === 0) {
          send({ status: 'error', error: 'No applicants identified in the PDF' });
          controller.close();
          return;
        }

        send({
          status: 'splitting',
          progress: 0.4,
          message: `Found ${applicants.length} applicants`
        });

        // Step 3: Analyze each candidate
        const candidates: Candidate[] = [];
        const total = applicants.length;

        for (let i = 0; i < applicants.length; i++) {
          const applicant = applicants[i];

          send({
            status: 'analyzing',
            progress: 0.4 + (0.55 * (i / total)),
            current: i + 1,
            total,
            message: `Analyzing ${applicant.name}...`
          });

          const applicantData = createApplicantData(pages, applicant);

          try {
            const candidate = await analyzeCandidate(applicantData, applicant, jobDescription);
            candidates.push(candidate);

            // Send partial results
            send({
              status: 'analyzing',
              progress: 0.4 + (0.55 * ((i + 1) / total)),
              current: i + 1,
              total,
              candidatePreview: {
                name: candidate.name,
                score: candidate.overallScore
              }
            });
          } catch (error) {
            console.error(`Failed to analyze ${applicant.name}:`, error);
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

        // Final result
        send({
          status: 'complete',
          progress: 1,
          sessionId,
          candidates,
          totalPages
        });

      } catch (error) {
        send({
          status: 'error',
          error: error instanceof Error ? error.message : 'Analysis failed'
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
