'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadZone, ProgressIndicator } from '@/components';
import { storageService } from '@/services/storage.service';
import { ProcessingStatus, Session, Candidate } from '@/types';
import { arrayBufferToBase64 } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<ProcessingStatus>({ status: 'idle', progress: 0 });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file || !jobDescription.trim()) {
      alert('Please upload a PDF and provide a job description');
      return;
    }

    setStatus({ status: 'parsing', progress: 0.1, message: 'Reading PDF...' });

    try {
      // Read file as base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);

      // Use streaming endpoint
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64, jobDescription })
      });

      console.log('[Frontend] Response status:', response.status, response.ok);

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';  // Buffer for incomplete SSE messages
      let candidates: Candidate[] = [];
      let sessionId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append chunk to buffer (stream: true handles multi-byte chars across chunks)
        buffer += decoder.decode(value, { stream: true });

        // Process complete messages (SSE messages are delimited by \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';  // Keep incomplete message in buffer

        for (const message of messages) {
          const line = message.trim();
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('[Frontend] SSE data:', data);

              if (data.status === 'error') {
                throw new Error(data.error);
              }

              setStatus({
                status: data.status,
                progress: data.progress || 0,
                current: data.current,
                total: data.total,
                message: data.message
              });

              if (data.status === 'complete') {
                candidates = data.candidates;
                sessionId = data.sessionId;
              }
            } catch (parseErr) {
              console.warn('[Frontend] SSE parse error:', parseErr, 'Line:', line);
            }
          }
        }
      }

      console.log('[Frontend] Stream complete. Candidates:', candidates.length, 'SessionId:', sessionId);

      if (candidates.length === 0) {
        throw new Error('No candidates were analyzed');
      }

      // Save session to storage
      const session: Session = {
        id: sessionId,
        jobDescription,
        pdfFileName: file.name,
        pdfData: base64,
        createdAt: new Date(),
        candidates
      };

      await storageService.saveSession(session);

      setStatus({ status: 'complete', progress: 1, message: 'Analysis complete!' });

      // Navigate to review page
      setTimeout(() => {
        router.push(`/review?session=${sessionId}`);
      }, 500);

    } catch (error) {
      console.error('Analysis failed:', error);
      setStatus({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Analysis failed'
      });
    }
  };

  const isProcessing = status.status !== 'idle' && status.status !== 'complete' && status.status !== 'error';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Resumer
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered candidate analysis for Handshake applications
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Concatenated PDF
            </label>
            <UploadZone onFileSelect={handleFileSelect} disabled={isProcessing} />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isProcessing}
              placeholder="Paste the job description here. Include required skills, experience level, responsibilities, and any specific qualifications..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Be specific about required skills and qualifications for better scoring accuracy
            </p>
          </div>

          {/* Progress Indicator */}
          {status.status !== 'idle' && (
            <div className="pt-4 border-t border-gray-200">
              <ProgressIndicator status={status} />
            </div>
          )}

          {/* Analyze Button */}
          <div className="pt-4">
            <button
              onClick={handleAnalyze}
              disabled={!file || !jobDescription.trim() || isProcessing}
              className="w-full py-4 px-6 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Analyzing...' : 'Analyze Applications'}
            </button>
          </div>

          {/* Error Display */}
          {status.status === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{status.error}</p>
              <button
                onClick={() => setStatus({ status: 'idle', progress: 0 })}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Previous Sessions */}
        <div className="mt-8">
          <PreviousSessions />
        </div>
      </div>
    </div>
  );
}

function PreviousSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load sessions on mount
  if (!loaded) {
    setLoaded(true);
    storageService.getAllSessions().then(setSessions);
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Previous Sessions</h2>
      <div className="space-y-2">
        {sessions.slice(0, 5).map((session) => (
          <button
            key={session.id}
            onClick={() => router.push(`/review?session=${session.id}`)}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
          >
            <div>
              <p className="font-medium text-gray-900">{session.pdfFileName}</p>
              <p className="text-sm text-gray-500">
                {session.candidates.length} candidates &middot;{' '}
                {new Date(session.createdAt).toLocaleDateString()}
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
