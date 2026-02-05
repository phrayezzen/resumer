'use client';

import { Candidate } from '@/types';
import { ScoreCell } from './ScoreCell';

interface TopPicksBannerProps {
  candidates: Candidate[];
  onSelectCandidate: (id: string) => void;
}

export function TopPicksBanner({ candidates, onSelectCandidate }: TopPicksBannerProps) {
  const topPicks = candidates.filter(c => c.isTopPick).slice(0, 5);

  if (topPicks.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
        Top Picks ({topPicks.length})
      </h3>

      <div className="flex flex-wrap gap-3">
        {topPicks.map((candidate, index) => (
          <button
            key={candidate.id}
            onClick={() => onSelectCandidate(candidate.id)}
            className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
          >
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
              {index + 1}
            </span>
            <div className="text-left">
              <p className="font-medium text-gray-900 text-sm">{candidate.name}</p>
              <p className="text-xs text-gray-500">
                {candidate.keySkills.slice(0, 2).join(', ')}
              </p>
            </div>
            <ScoreCell score={candidate.overallScore} size="sm" />
          </button>
        ))}
      </div>
    </div>
  );
}
