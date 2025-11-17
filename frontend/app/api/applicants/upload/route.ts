import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { extractTextFromPDF, validatePDF } from '@/lib/pdf-utils';
import OpenAI from 'openai';
import type { Applicant, Document as AppDocument, ScreeningResult } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Log what we received
    console.log('FormData keys:', Array.from(formData.keys()));
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    // Extract form fields
    const name = (formData.get('name') as string) || null;
    const email = (formData.get('email') as string) || null;
    const phone = (formData.get('phone') as string) || null;
    const position_applied = (formData.get('position_applied') as string) || null;
    const source = (formData.get('source') as string) || 'handshake';

    // Extract files
    const resume = formData.get('resume') as File | null;
    const coverLetter = formData.get('cover_letter') as File | null;
    const transcript = formData.get('transcript') as File | null;

    console.log('Extracted files:', {
      resume: resume ? `${resume.name} (${resume.size} bytes)` : 'null',
      coverLetter: coverLetter ? `${coverLetter.name} (${coverLetter.size} bytes)` : 'null',
      transcript: transcript ? `${transcript.name} (${transcript.size} bytes)` : 'null'
    });

    if (!resume && !coverLetter && !transcript) {
      return NextResponse.json(
        { error: 'At least one document must be provided' },
        { status: 400 }
      );
    }

    // Create applicant
    const now = new Date().toISOString();
    const documents: AppDocument[] = [];
    let documentsUploaded = 0;

    // Process resume
    let resumeText = '';
    if (resume) {
      const buffer = Buffer.from(await resume.arrayBuffer());
      if (!validatePDF(buffer)) {
        return NextResponse.json({ error: 'Invalid resume PDF' }, { status: 400 });
      }
      resumeText = await extractTextFromPDF(buffer);
      documents.push({
        id: documentsUploaded + 1,
        document_type: 'resume',
        file_path: `/uploads/${resume.name}`,
        original_filename: resume.name,
        extracted_text: resumeText,
        file_size_bytes: buffer.length,
        uploaded_at: now,
      });
      documentsUploaded++;
    }

    // Process cover letter
    let coverLetterText = '';
    if (coverLetter) {
      const buffer = Buffer.from(await coverLetter.arrayBuffer());
      if (!validatePDF(buffer)) {
        return NextResponse.json({ error: 'Invalid cover letter PDF' }, { status: 400 });
      }
      coverLetterText = await extractTextFromPDF(buffer);
      documents.push({
        id: documentsUploaded + 1,
        document_type: 'cover_letter',
        file_path: `/uploads/${coverLetter.name}`,
        original_filename: coverLetter.name,
        extracted_text: coverLetterText,
        file_size_bytes: buffer.length,
        uploaded_at: now,
      });
      documentsUploaded++;
    }

    // Process transcript
    let transcriptText = '';
    if (transcript) {
      const buffer = Buffer.from(await transcript.arrayBuffer());
      if (!validatePDF(buffer)) {
        return NextResponse.json({ error: 'Invalid transcript PDF' }, { status: 400 });
      }
      transcriptText = await extractTextFromPDF(buffer);
      documents.push({
        id: documentsUploaded + 1,
        document_type: 'transcript',
        file_path: `/uploads/${transcript.name}`,
        original_filename: transcript.name,
        extracted_text: transcriptText,
        file_size_bytes: buffer.length,
        uploaded_at: now,
      });
      documentsUploaded++;
    }

    // Create applicant record (without screening first)
    const applicant = store.addApplicant({
      name,
      email,
      phone,
      source,
      position_applied,
      created_at: now,
      updated_at: now,
      documents,
      screening_result: null,
    });

    // Perform AI screening
    const screeningResult = await screenApplicant(
      resumeText,
      coverLetterText,
      transcriptText
    );

    // Update applicant with screening result
    const updatedApplicant = store.updateApplicant(applicant.id, {
      screening_result: {
        ...screeningResult,
        id: applicant.id,
        applicant_id: applicant.id,
        screened_at: now,
      },
    });

    return NextResponse.json({
      message: 'Successfully uploaded documents for applicant',
      applicant_id: applicant.id,
      documents_uploaded: documentsUploaded,
      screening_started: true,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload and process documents' },
      { status: 500 }
    );
  }
}

async function screenApplicant(
  resumeText: string,
  coverLetterText: string,
  transcriptText: string
): Promise<Omit<ScreeningResult, 'id' | 'applicant_id' | 'screened_at'>> {
  try {
    const prompt = buildPrompt(resumeText, coverLetterText, transcriptText);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      overall_score: result.overall_score || 50,
      resume_score: result.resume_score || null,
      cover_letter_score: result.cover_letter_score || null,
      transcript_score: result.transcript_score || null,
      strengths: JSON.stringify(result.strengths || []),
      weaknesses: JSON.stringify(result.weaknesses || []),
      reasoning: result.reasoning || '',
      recommended_for_interview: result.recommended_for_interview || false,
      confidence_level: result.confidence_level || 'medium',
      rank: null,
      percentile: null,
      ai_model_used: 'gpt-4o',
    };
  } catch (error) {
    console.error('Screening error:', error);
    // Return default low score on error
    return {
      overall_score: 30,
      resume_score: null,
      cover_letter_score: null,
      transcript_score: null,
      strengths: JSON.stringify(['Unable to analyze']),
      weaknesses: JSON.stringify(['Screening failed']),
      reasoning: `Automated screening encountered an error: ${error}`,
      recommended_for_interview: false,
      confidence_level: 'low',
      rank: null,
      percentile: null,
      ai_model_used: 'gpt-4o',
    };
  }
}

function getSystemPrompt(): string {
  return `You are an expert HR professional and recruiter with 15+ years of experience screening job applicants.

Your task is to evaluate job applicants based on their resume, cover letter, and academic transcript. You should assess:

1. **Resume Quality** (0-100):
   - Relevant work experience and internships
   - Skills alignment with typical entry-level professional roles
   - Leadership and extracurricular activities
   - Professionalism and presentation
   - Clear career progression or growth

2. **Cover Letter Quality** (0-100):
   - Writing quality and professionalism
   - Genuine interest and enthusiasm
   - Company research and fit
   - Clear communication skills
   - Specific examples and achievements

3. **Academic Transcript** (0-100):
   - GPA (consider 3.5+ as strong, 3.0-3.5 as good, below 3.0 as concern)
   - Relevant coursework for business/professional roles
   - Consistency of performance
   - Academic rigor and challenging courses
   - Upward or stable trend in grades

4. **Overall Assessment**:
   - Synthesize all factors into an overall score (0-100)
   - Identify key strengths and weaknesses
   - Provide clear reasoning for your decision
   - Recommend whether this candidate should be interviewed
   - Assess your confidence level (high/medium/low)

Be thorough, fair, and objective. Consider that this is for entry-level positions targeting recent undergraduates.

You MUST respond in valid JSON format with this exact structure:
{
  "overall_score": <number 0-100>,
  "resume_score": <number 0-100 or null>,
  "cover_letter_score": <number 0-100 or null>,
  "transcript_score": <number 0-100 or null>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "reasoning": "detailed explanation of scoring decision",
  "recommended_for_interview": <true or false>,
  "confidence_level": "high" | "medium" | "low"
}`;
}

function buildPrompt(
  resumeText: string,
  coverLetterText: string,
  transcriptText: string
): string {
  let prompt = 'Please evaluate this job applicant:\n\n';

  if (resumeText) {
    prompt += `**RESUME:**\n${resumeText.slice(0, 4000)}\n\n`;
  } else {
    prompt += '**RESUME:** Not provided\n\n';
  }

  if (coverLetterText) {
    prompt += `**COVER LETTER:**\n${coverLetterText.slice(0, 2000)}\n\n`;
  } else {
    prompt += '**COVER LETTER:** Not provided\n\n';
  }

  if (transcriptText) {
    prompt += `**TRANSCRIPT:**\n${transcriptText.slice(0, 2000)}\n\n`;
  } else {
    prompt += '**TRANSCRIPT:** Not provided\n\n';
  }

  prompt += 'Provide a comprehensive evaluation in the JSON format specified in the system prompt.';

  return prompt;
}
