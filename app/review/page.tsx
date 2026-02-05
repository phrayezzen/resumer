'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Session, Candidate } from '@/types';
import { storageService } from '@/services/storage.service';
import { TopPicksBanner, CandidateTable, ExportButtons } from '@/components';
import Link from 'next/link';

function ReviewContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | undefined>();

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        const loadedSession = await storageService.getSession(sessionId);
        if (!loadedSession) {
          setError('Session not found');
        } else {
          setSession(loadedSession);
        }
      } catch (err) {
        setError('Failed to load session');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  const handleUpdateCandidate = async (candidateId: string, updates: Partial<Candidate>) => {
    if (!session) return;

    // Update local state
    const updatedCandidates = session.candidates.map(c =>
      c.id === candidateId ? { ...c, ...updates } : c
    );

    setSession({ ...session, candidates: updatedCandidates });

    // Persist to storage
    try {
      await storageService.updateCandidate(session.id, candidateId, updates);
    } catch (err) {
      console.error('Failed to save candidate update:', err);
    }
  };

  const handleSelectCandidate = (id: string) => {
    setSelectedCandidateId(id);
    // Scroll to table
    document.getElementById('candidate-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested session could not be loaded.'}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  const topCandidates = session.candidates.filter(c => c.isTopPick);
  const avgScore = Math.round(
    session.candidates.reduce((sum, c) => sum + c.overallScore, 0) / session.candidates.length
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{session.pdfFileName}</h1>
                <p className="text-sm text-gray-500">
                  {new Date(session.createdAt).toLocaleDateString()} &middot;{' '}
                  {session.candidates.length} candidates
                </p>
              </div>
            </div>

            <ExportButtons session={session} />
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500">Total Candidates:</span>{' '}
              <span className="font-semibold">{session.candidates.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Top Picks:</span>{' '}
              <span className="font-semibold text-green-600">{topCandidates.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Avg Score:</span>{' '}
              <span className="font-semibold">{avgScore}</span>
            </div>
            <div>
              <span className="text-gray-500">Score 80+:</span>{' '}
              <span className="font-semibold text-blue-600">
                {session.candidates.filter(c => c.overallScore >= 80).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Top Picks Banner */}
        <TopPicksBanner
          candidates={session.candidates}
          onSelectCandidate={handleSelectCandidate}
        />

        {/* Candidate Table */}
        <div id="candidate-table">
          <CandidateTable
            candidates={session.candidates}
            onUpdateCandidate={handleUpdateCandidate}
            selectedCandidateId={selectedCandidateId}
          />
        </div>
      </main>

      {/* Job Description Drawer (Collapsible) */}
      <JobDescriptionDrawer jobDescription={session.jobDescription} />
    </div>
  );
}

function JobDescriptionDrawer({ jobDescription }: { jobDescription: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 flex items-center gap-2 z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        Job Description
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Job Description</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {jobDescription}
            </pre>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
