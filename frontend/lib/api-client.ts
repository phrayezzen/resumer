import axios from 'axios';
import type { Applicant, UploadResponse, TopCandidatesResponse, ScreeningSummary } from '@/types';

// Determine API base URL based on environment
const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === 'true';
const API_BASE_URL = USE_BACKEND
  ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  : '/api'; // Use Next.js API routes (Vercel serverless functions)

console.log('API Mode:', USE_BACKEND ? 'Backend' : 'Serverless');
console.log('API Base URL:', API_BASE_URL);

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  /**
   * Upload applicant documents
   */
  async uploadApplicant(formData: FormData): Promise<UploadResponse> {
    const response = await apiClient.post<UploadResponse>('/applicants/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all applicants
   */
  async getApplicants(params?: {
    skip?: number;
    limit?: number;
    min_score?: number;
    recommended_only?: boolean;
  }): Promise<Applicant[]> {
    const response = await apiClient.get<Applicant[]>('/applicants', { params });
    return response.data;
  },

  /**
   * Get single applicant details
   */
  async getApplicant(id: number): Promise<Applicant> {
    const response = await apiClient.get<Applicant>(`/applicants/${id}`);
    return response.data;
  },

  /**
   * Get top candidates
   */
  async getTopCandidates(percentage: number = 15.0): Promise<TopCandidatesResponse> {
    const response = await apiClient.get<TopCandidatesResponse>('/applicants/top-candidates', {
      params: { percentage },
    });
    return response.data;
  },

  /**
   * Get screening summary/analytics
   */
  async getScreeningSummary(): Promise<ScreeningSummary> {
    const response = await apiClient.get<ScreeningSummary>('/applicants/analytics/summary');
    return response.data;
  },

  /**
   * Delete applicant
   */
  async deleteApplicant(id: number): Promise<void> {
    await apiClient.delete(`/applicants/${id}`);
  },
};

export default api;
