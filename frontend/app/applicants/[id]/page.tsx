'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import ScreeningDetails from '@/components/ScreeningDetails';
import type { Applicant } from '@/types';

export default function ApplicantDetailPage() {
  const params = useParams();
  const [id, setId] = useState<number | null>(null);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      setId(parseInt(params.id as string));
    }
  }, [params.id]);

  useEffect(() => {
    if (id !== null) {
      loadApplicant();
    }
  }, [id]);

  const loadApplicant = async () => {
    if (id === null) return;
    try {
      const data = await api.getApplicant(id);
      setApplicant(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load applicant');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error || !applicant) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Applicant not found'}</p>
        <Link href="/applicants" className="text-blue-600 hover:underline">
          Back to all applicants
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/applicants" className="text-blue-600 hover:underline">
          ← Back to all applicants
        </Link>
      </div>

      <ScreeningDetails applicant={applicant} />
    </div>
  );
}
