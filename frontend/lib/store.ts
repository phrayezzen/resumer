/**
 * In-memory data store for demo mode
 * In production, this would be replaced by a real database
 */

import type { Applicant, ScreeningResult } from '@/types';

class InMemoryStore {
  private applicants: Map<number, Applicant> = new Map();
  private nextId: number = 1;

  addApplicant(applicant: Omit<Applicant, 'id'>): Applicant {
    const id = this.nextId++;
    const newApplicant: Applicant = {
      ...applicant,
      id,
    };
    this.applicants.set(id, newApplicant);
    return newApplicant;
  }

  getApplicant(id: number): Applicant | undefined {
    return this.applicants.get(id);
  }

  getAllApplicants(): Applicant[] {
    return Array.from(this.applicants.values());
  }

  updateApplicant(id: number, updates: Partial<Applicant>): Applicant | undefined {
    const applicant = this.applicants.get(id);
    if (!applicant) return undefined;

    const updated = { ...applicant, ...updates };
    this.applicants.set(id, updated);
    return updated;
  }

  deleteApplicant(id: number): boolean {
    return this.applicants.delete(id);
  }

  clear(): void {
    this.applicants.clear();
    this.nextId = 1;
  }
}

// Export singleton instance
export const store = new InMemoryStore();
