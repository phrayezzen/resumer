'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Applicant } from '@/types';

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants = async () => {
    try {
      const data = await api.getApplicants();
      setApplicants(data);
    } catch (error) {
      console.error('Failed to load applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (applicants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No applicants yet</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Upload your first applicant
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">All Applicants ({applicants.length})</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applicants.map((applicant) => (
              <tr key={applicant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{applicant.name || 'Unnamed'}</div>
                  <div className="text-sm text-gray-500">{applicant.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {applicant.position_applied || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {applicant.screening_result ? (
                    <ScoreBadge score={applicant.screening_result.overall_score} />
                  ) : (
                    <span className="text-gray-400">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {applicant.screening_result?.recommended_for_interview ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                      Interview
                    </span>
                  ) : applicant.screening_result ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                      Reject
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(applicant.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/applicants/${applicant.id}`}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  let colorClass = '';
  if (score >= 80) colorClass = 'bg-green-100 text-green-800';
  else if (score >= 60) colorClass = 'bg-yellow-100 text-yellow-800';
  else colorClass = 'bg-red-100 text-red-800';

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold ${colorClass}`}>
      {score}
    </span>
  );
}
