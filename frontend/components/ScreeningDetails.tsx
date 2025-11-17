'use client';

import type { Applicant } from '@/types';

export default function ScreeningDetails({ applicant }: { applicant: Applicant }) {
  const screening = applicant.screening_result;

  if (!screening) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-900">No screening results available yet.</p>
      </div>
    );
  }

  const strengths = JSON.parse(screening.strengths || '[]');
  const weaknesses = JSON.parse(screening.weaknesses || '[]');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{applicant.name || 'Unnamed Applicant'}</h1>
            <p className="text-gray-900 mt-1">{applicant.email}</p>
            {applicant.position_applied && (
              <p className="text-sm text-gray-900 mt-1">Applied for: {applicant.position_applied}</p>
            )}
          </div>
          <div className="text-right">
            {screening.recommended_for_interview ? (
              <span className="inline-block px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg">
                ✓ RECOMMENDED
              </span>
            ) : (
              <span className="inline-block px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg">
                ✗ NOT RECOMMENDED
              </span>
            )}
            <p className="text-sm text-gray-900 mt-2">
              Confidence: {screening.confidence_level.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Overall Score</h2>
        <div className="flex items-center gap-6">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreBgColor(
              screening.overall_score
            )}`}
          >
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(screening.overall_score)}`}>
                {screening.overall_score}
              </div>
              <div className="text-sm text-gray-900">/ 100</div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-4">
            <ScoreCard
              label="Resume"
              score={screening.resume_score}
              getScoreColor={getScoreColor}
            />
            <ScoreCard
              label="Cover Letter"
              score={screening.cover_letter_score}
              getScoreColor={getScoreColor}
            />
            <ScoreCard
              label="Transcript"
              score={screening.transcript_score}
              getScoreColor={getScoreColor}
            />
          </div>
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-green-700">💪 Strengths</h2>
        <ul className="space-y-2">
          {strengths.map((strength: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-gray-700">{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weaknesses */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-red-700">⚠️ Areas for Improvement</h2>
        <ul className="space-y-2">
          {weaknesses.map((weakness: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span className="text-gray-700">{weakness}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI Reasoning */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">📝 Detailed Analysis</h2>
        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
          {screening.reasoning}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-6 text-sm text-gray-900">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Screened At:</span>{' '}
            {new Date(screening.screened_at).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">AI Model:</span> {screening.ai_model_used}
          </div>
          <div>
            <span className="font-medium">Source:</span> {applicant.source}
          </div>
          <div>
            <span className="font-medium">Documents:</span> {applicant.documents.length} uploaded
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  score,
  getScoreColor,
}: {
  label: string;
  score: number | null;
  getScoreColor: (score: number) => string;
}) {
  if (score === null) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-900 font-medium">{label}</div>
        <div className="text-gray-900 mt-1">N/A</div>
      </div>
    );
  }

  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-900 font-medium">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${getScoreColor(score)}`}>{score}</div>
    </div>
  );
}
