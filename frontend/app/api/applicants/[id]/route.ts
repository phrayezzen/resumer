import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const applicant = store.getApplicant(id);

    if (!applicant) {
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(applicant);
  } catch (error) {
    console.error('Error fetching applicant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applicant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const deleted = store.deleteApplicant(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Applicant deleted successfully' });
  } catch (error) {
    console.error('Error deleting applicant:', error);
    return NextResponse.json(
      { error: 'Failed to delete applicant' },
      { status: 500 }
    );
  }
}
