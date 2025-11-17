import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const applicants = store.getAllApplicants();
    const totalApplicants = applicants.length;
    const screenedCount = applicants.filter((a) => a.screening_result !== null).length;
    const pendingCount = totalApplicants - screenedCount;

    // Calculate top 15% count
    const top15Count = screenedCount > 0 ? Math.max(1, Math.floor(screenedCount * 0.15)) : 0;

    // Calculate average score
    const scores = applicants
      .filter((a) => a.screening_result !== null)
      .map((a) => a.screening_result!.overall_score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Count recommended
    const recommendedCount = applicants.filter(
      (a) => a.screening_result?.recommended_for_interview === true
    ).length;

    return NextResponse.json({
      total_applicants: totalApplicants,
      screened_count: screenedCount,
      pending_count: pendingCount,
      top_15_percent_count: top15Count,
      average_score: Math.round(avgScore * 10) / 10,
      recommended_count: recommendedCount,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
