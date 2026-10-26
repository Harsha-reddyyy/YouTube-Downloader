import { NextRequest, NextResponse } from 'next/server';
import { validateAndParseYouTubeUrl } from '@/lib/security';
import { mediaService } from '@/server/media-service';
import { jobQueue } from '@/server/job-queue';
import { rateLimiter } from '@/server/rate-limiter';
import { getServerConfig } from '@/server/config';
import { JobCreateRequest, JobCreateResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<JobCreateResponse>> {
  // 1. Rate limiting
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateCheck = rateLimiter.check(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. Please wait ${rateCheck.status.resetSeconds}s before starting another job.`,
      },
      { status: 429 }
    );
  }

  // 2. Parse body
  let body: JobCreateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload.' },
      { status: 400 }
    );
  }

  const { url, format, quality } = body;

  if (!url || !format || !quality) {
    return NextResponse.json(
      { success: false, error: 'Parameters "url", "format", and "quality" are required.' },
      { status: 400 }
    );
  }

  if (format !== 'mp4' && format !== 'mp3') {
    return NextResponse.json(
      { success: false, error: 'Format must be either "mp4" or "mp3".' },
      { status: 400 }
    );
  }

  // 3. Validate URL
  const validation = validateAndParseYouTubeUrl(url);
  if (!validation.isValid || !validation.normalizedUrl) {
    return NextResponse.json(
      { success: false, error: validation.error || 'Invalid YouTube URL.' },
      { status: 422 }
    );
  }

  // 4. Verify system capabilities (Vercel Serverless check)
  const config = getServerConfig();
  if (!config.ytdlpCommand.isAvailable) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Serverless Hosting Limitation: Vercel does not support background media processing binaries (yt-dlp & FFmpeg). To download full quality media, run locally with "npm run dev" or deploy using Docker to Railway / Render.',
      },
      { status: 503 }
    );
  }

  // 5. Inspect or get title & thumbnail for job representation
  try {
    const meta = await mediaService.inspectMedia(validation.normalizedUrl);

    // 6. Enqueue in background job queue
    const job = jobQueue.enqueue({
      url: validation.normalizedUrl,
      mediaTitle: meta.title,
      thumbnailUrl: meta.thumbnailUrl,
      format,
      quality,
    });

    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
      },
      { status: 202 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to initialize processing job.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
