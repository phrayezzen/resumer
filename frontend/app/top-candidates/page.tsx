'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { TopCandidatesResponse } from '@/types';

export default function TopCandidatesPage() {
  const [data, setData] = useState<TopCandidatesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopCandidates();
  }, []);

  const loadTopCandidates = async () => {
    try {
      const result = await api.getTopCandidates(15);
      setData(result);
    } catch (error) {
      console.error('Failed to load top candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!data || data.candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No screened applicants yet</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Upload applicants to see top candidates
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Top {data.top_percentage}% Candidates</h1>
        <p className="text-gray-600 mt-2">
          Showing {data.candidates.length} of {data.total_count} screened applicants
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.candidates.map((applicant, index) => {
          const screening = applicant.screening_result!;
          return (
            <Link
              key={applicant.id}
              href={`/applicants/${applicant.id}`}
              className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{applicant.name || 'Unnamed'}</h3>
                  <p className="text-sm text-gray-600">{applicant.email}</p>
                  {applicant.position_applied && (
                    <p className="text-sm text-gray-500 mt-1">{applicant.position_applied}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{screening.overall_score}</div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Resume:</span>
                  <span className="font-medium">{screening.resume_score || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cover Letter:</span>
                  <span className="font-medium">{screening.cover_letter_score || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transcript:</span>
                  <span className="font-medium">{screening.transcript_score || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                {screening.recommended_for_interview ? (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded">
                    ✓ Recommended
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded">
                    Review
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
