import { Candidate } from './candidate';

export interface Session {
  id: string;
  jobDescription: string;
  pdfFileName: string;
  pdfData?: string; // Base64 encoded PDF for persistence
  createdAt: Date;
  candidates: Candidate[];
}

export interface ProcessingStatus {
  status: 'idle' | 'parsing' | 'splitting' | 'analyzing' | 'complete' | 'error';
  progress: number; // 0-1
  current?: number;
  total?: number;
  message?: string;
  error?: string;
}
