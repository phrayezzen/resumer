import Dexie, { type Table } from 'dexie';
import { Session, Candidate } from '@/types';

// Database schema
class ResumerDatabase extends Dexie {
  sessions!: Table<Session>;

  constructor() {
    super('ResumerDB');
    this.version(1).stores({
      sessions: 'id, createdAt'
    });
  }
}

// Singleton database instance
let db: ResumerDatabase | null = null;

function getDb(): ResumerDatabase {
  if (!db) {
    db = new ResumerDatabase();
  }
  return db;
}

// Storage service interface (for future backend migration)
export interface IStorageService {
  saveSession(session: Session): Promise<void>;
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  updateSession(id: string, updates: Partial<Session>): Promise<void>;
  deleteSession(id: string): Promise<void>;
  updateCandidate(sessionId: string, candidateId: string, updates: Partial<Candidate>): Promise<void>;
}

// IndexedDB implementation
export const storageService: IStorageService = {
  async saveSession(session: Session): Promise<void> {
    await getDb().sessions.put(session);
  },

  async getSession(id: string): Promise<Session | undefined> {
    return await getDb().sessions.get(id);
  },

  async getAllSessions(): Promise<Session[]> {
    return await getDb().sessions.orderBy('createdAt').reverse().toArray();
  },

  async updateSession(id: string, updates: Partial<Session>): Promise<void> {
    await getDb().sessions.update(id, updates);
  },

  async deleteSession(id: string): Promise<void> {
    await getDb().sessions.delete(id);
  },

  async updateCandidate(sessionId: string, candidateId: string, updates: Partial<Candidate>): Promise<void> {
    const session = await getDb().sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const candidateIndex = session.candidates.findIndex(c => c.id === candidateId);
    if (candidateIndex === -1) {
      throw new Error(`Candidate ${candidateId} not found in session ${sessionId}`);
    }

    session.candidates[candidateIndex] = {
      ...session.candidates[candidateIndex],
      ...updates
    };

    await getDb().sessions.put(session);
  }
};

// Helper to get the most recent session
export async function getMostRecentSession(): Promise<Session | undefined> {
  const sessions = await storageService.getAllSessions();
  return sessions[0];
}

// Helper to clear all data (for testing/reset)
export async function clearAllData(): Promise<void> {
  await getDb().sessions.clear();
}
