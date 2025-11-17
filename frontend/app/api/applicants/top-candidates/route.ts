import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const percentage = parseFloat(searchParams.get('percentage') || '15.0');

    // Get all applicants with screening results
    let applicants = store.getAllApplicants().filter((a) => a.screening_result !== null);

    if (applicants.length === 0) {
      return NextResponse.json({
        total_count: 0,
        top_percentage: percentage,
        candidates: [],
      });
    }

    // Sort by score (highest first)
    applicants.sort((a, b) => {
      const scoreA = a.screening_result?.overall_score || 0;
      const scoreB = b.screening_result?.overall_score || 0;
      return scoreB - scoreA;
    });

    // Calculate how many to return (at least 1)
    const topCount = Math.max(1, Math.floor(applicants.length * (percentage / 100)));
    const topCandidates = applicants.slice(0, topCount);

    return NextResponse.json({
      total_count: applicants.length,
      top_percentage: percentage,
      candidates: topCandidates,
    });
  } catch (error) {
    console.error('Error fetching top candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top candidates' },
      { status: 500 }
    );
  }
}
