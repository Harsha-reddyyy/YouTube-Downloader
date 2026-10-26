import { NextRequest, NextResponse } from 'next/server';
import { jobQueue } from '@/server/job-queue';
import { JobStatusResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<JobStatusResponse>> {
  const jobId = params.id;
  if (!jobId) {
    return NextResponse.json(
      { success: false, error: 'Job ID missing.' },
      { status: 400 }
    );
  }

  const job = jobQueue.getJob(jobId);
  if (!job) {
    return NextResponse.json(
      { success: false, error: 'Job not found or has expired.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    job,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<{ success: boolean; message: string }>> {
  const jobId = params.id;
  if (!jobId) {
    return NextResponse.json(
      { success: false, message: 'Job ID missing.' },
      { status: 400 }
    );
  }

  const cancelled = jobQueue.cancelJob(jobId);
  if (!cancelled) {
    return NextResponse.json(
      {
        success: false,
        message: 'Job could not be cancelled. It may have already finished or does not exist.',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Job was successfully cancelled.',
  });
}
