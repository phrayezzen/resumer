import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minScore = searchParams.get('min_score');
    const recommendedOnly = searchParams.get('recommended_only') === 'true';

    let applicants = store.getAllApplicants();

    // Apply filters
    if (minScore || recommendedOnly) {
      applicants = applicants.filter((applicant) => {
        const screening = applicant.screening_result;
        if (!screening) return false;

        if (minScore && screening.overall_score < parseFloat(minScore)) {
          return false;
        }

        if (recommendedOnly && !screening.recommended_for_interview) {
          return false;
        }

        return true;
      });
    }

    // Sort by score (highest first)
    applicants.sort((a, b) => {
      const scoreA = a.screening_result?.overall_score || 0;
      const scoreB = b.screening_result?.overall_score || 0;
      return scoreB - scoreA;
    });

    return NextResponse.json(applicants);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applicants' },
      { status: 500 }
    );
  }
}
