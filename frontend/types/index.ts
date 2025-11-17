export interface Applicant {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  position_applied: string | null;
  created_at: string;
  updated_at: string;
  documents: Document[];
  screening_result: ScreeningResult | null;
}

export interface Document {
  id: number;
  document_type: 'resume' | 'cover_letter' | 'transcript' | 'combined';
  file_path: string;
  original_filename: string;
  extracted_text: string | null;
  file_size_bytes: number | null;
  uploaded_at: string;
}

export interface ScreeningResult {
  id: number;
  applicant_id: number;
  overall_score: number;
  resume_score: number | null;
  cover_letter_score: number | null;
  transcript_score: number | null;
  strengths: string; // JSON string
  weaknesses: string; // JSON string
  reasoning: string;
  recommended_for_interview: boolean;
  confidence_level: string;
  rank: number | null;
  percentile: number | null;
  screened_at: string;
  ai_model_used: string;
}

export interface UploadResponse {
  message: string;
  applicant_id: number;
  documents_uploaded: number;
  screening_started: boolean;
}

export interface TopCandidatesResponse {
  total_count: number;
  top_percentage: number;
  candidates: Applicant[];
}

export interface ScreeningSummary {
  total_applicants: number;
  screened_count: number;
  pending_count: number;
  top_15_percent_count: number;
  average_score: number;
  recommended_count: number;
}
