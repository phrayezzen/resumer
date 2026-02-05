'use client';

import { useState } from 'react';
import { Candidate } from '@/types';
import { ScoreCell, ScoreBar } from './ScoreCell';
import { formatPageRange } from '@/lib/utils';

interface CandidateRowProps {
  candidate: Candidate;
  rank: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Candidate>) => void;
}

export function CandidateRow({
  candidate,
  rank,
  isExpanded,
  onToggleExpand,
  onUpdate
}: CandidateRowProps) {
  const [userScore, setUserScore] = useState(candidate.userScore?.toString() || '');
  const [userNotes, setUserNotes] = useState(candidate.userNotes || '');

  const handleScoreBlur = () => {
    const score = parseInt(userScore);
    if (!isNaN(score) && score >= 0 && score <= 100) {
      onUpdate({ userScore: score });
    }
  };

  const handleNotesBlur = () => {
    onUpdate({ userNotes });
  };

  const handleTopPickToggle = () => {
    onUpdate({ isTopPick: !candidate.isTopPick });
  };

  return (
    <>
      <tr
        className={`border-b hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
        onClick={onToggleExpand}
      >
        <td className="px-4 py-3 text-center">
          <span className="font-bold text-gray-700">{rank}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTopPickToggle();
              }}
              className={`w-5 h-5 rounded ${candidate.isTopPick ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <p className="font-medium text-gray-900">{candidate.name}</p>
              {candidate.email && (
                <p className="text-xs text-gray-500">{candidate.email}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <ScoreCell score={candidate.overallScore} size="md" />
        </td>
        <td className="px-4 py-3 text-center">
          <ScoreCell score={candidate.scores.skillsMatch} size="sm" />
        </td>
        <td className="px-4 py-3 text-center">
          <ScoreCell score={candidate.scores.experience} size="sm" />
        </td>
        <td className="px-4 py-3 text-center">
          <ScoreCell score={candidate.scores.education} size="sm" />
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-600">
          {candidate.gpa ? candidate.gpa.toFixed(2) : '-'}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1 max-w-xs">
            {candidate.keySkills.slice(0, 3).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                {skill}
              </span>
            ))}
            {candidate.keySkills.length > 3 && (
              <span className="px-2 py-0.5 text-gray-500 text-xs">
                +{candidate.keySkills.length - 3}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-center text-sm text-blue-600 font-mono">
          {formatPageRange(candidate.pageRange.start, candidate.pageRange.end)}
        </td>
        <td className="px-4 py-3 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`w-5 h-5 mx-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={10} className="px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column - AI Analysis */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">AI Summary</h4>
                  <p className="text-sm text-gray-600">{candidate.aiSummary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Detailed Scores</h4>
                    <div className="space-y-2">
                      <ScoreBar score={candidate.scores.skillsMatch} label="Skills Match" />
                      <ScoreBar score={candidate.scores.experience} label="Experience" />
                      <ScoreBar score={candidate.scores.education} label="Education" />
                      <ScoreBar score={candidate.scores.cultureFit} label="Culture Fit" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">All Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {candidate.keySkills.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {candidate.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500">+</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">Concerns</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {candidate.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-500">-</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right column - User Input */}
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-gray-800 mb-2">
                    Your Score Override
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={userScore}
                    onChange={(e) => setUserScore(e.target.value)}
                    onBlur={handleScoreBlur}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="0-100"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-800 mb-2">
                    Your Notes
                  </label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Add your notes about this candidate..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Document Location:</span>{' '}
                    Pages {candidate.pageRange.start} to {candidate.pageRange.end} in the original PDF
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
