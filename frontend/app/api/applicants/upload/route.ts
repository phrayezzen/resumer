import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { validatePDF } from '@/lib/pdf-utils';
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

    // Extract resume file
    const resume = formData.get('resume') as File | null;

    console.log('Extracted file:', {
      resume: resume ? `${resume.name} (${resume.size} bytes)` : 'null',
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume is required' },
        { status: 400 }
      );
    }

    // Create applicant
    const now = new Date().toISOString();
    const documents: AppDocument[] = [];
    let documentsUploaded = 0;

    // Process resume
    const buffer = Buffer.from(await resume.arrayBuffer());
    if (!validatePDF(buffer)) {
      return NextResponse.json({ error: 'Invalid resume PDF' }, { status: 400 });
    }

    documents.push({
      id: 1,
      document_type: 'resume',
      file_path: `/uploads/${resume.name}`,
      original_filename: resume.name,
      extracted_text: '', // PDF sent directly to AI
      file_size_bytes: buffer.length,
      uploaded_at: now,
    });

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
    const screeningResult = await screenApplicant(buffer, resume.name, position_applied);

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
      message: 'Successfully uploaded resume and completed screening',
      applicant_id: applicant.id,
      documents_uploaded: 1,
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
  resumeBuffer: Buffer,
  resumeFilename: string,
  positionApplied: string | null
): Promise<Omit<ScreeningResult, 'id' | 'applicant_id' | 'screened_at'>> {
  try {
    // Build content array with PDF file
    const base64 = resumeBuffer.toString('base64');

    let promptText = 'Please evaluate this job applicant based on the attached resume PDF.';
    if (positionApplied) {
      promptText += `\n\nThe candidate is applying for the position: **${positionApplied}**\n\nPlease assess how well their resume aligns with this specific role.`;
    }
    promptText += '\n\nProvide a comprehensive evaluation in the JSON format specified in the system prompt.';

    const content: any[] = [
      {
        type: 'file',
        file: {
          filename: resumeFilename,
          file_data: `data:application/pdf;base64,${base64}`,
        },
      },
      {
        type: 'text',
        text: promptText,
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(),
        },
        {
          role: 'user',
          content,
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

Your task is to evaluate job applicants based on their resume. You should assess:

1. **Resume Quality** (0-100):
   - Relevant work experience and internships
   - Skills alignment with the specific position they're applying for (if provided)
   - Leadership and extracurricular activities
   - Professionalism and presentation
   - Clear career progression or growth
   - Education and academic achievements
   - Technical skills and certifications
   - How well their background fits the target role

2. **Overall Assessment**:
   - Provide an overall score (0-100) based on the resume and role fit
   - Identify key strengths (3-5 bullet points) - especially those relevant to the target position
   - Identify areas for improvement/weaknesses (2-3 bullet points)
   - Provide clear, detailed reasoning for your decision, including role alignment
   - Recommend whether this candidate should be interviewed
   - Assess your confidence level (high/medium/low)

Be thorough, fair, and objective. Consider that this is for entry-level positions targeting recent undergraduates. If a specific position is mentioned, pay special attention to how well the candidate's experience and skills match that role.

You MUST respond in valid JSON format with this exact structure:
{
  "overall_score": <number 0-100>,
  "resume_score": <number 0-100>,
  "cover_letter_score": null,
  "transcript_score": null,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "reasoning": "detailed explanation of scoring decision",
  "recommended_for_interview": <true or false>,
  "confidence_level": "high" | "medium" | "low"
}`;
}

