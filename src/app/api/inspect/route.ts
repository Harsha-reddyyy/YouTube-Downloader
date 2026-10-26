import { NextRequest, NextResponse } from 'next/server';
import { validateAndParseYouTubeUrl } from '@/lib/security';
import { mediaService } from '@/server/media-service';
import { rateLimiter } from '@/server/rate-limiter';
import { getServerConfig } from '@/server/config';
import { InspectResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<InspectResponse>> {
  // 1. Rate limiting by IP
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateCheck = rateLimiter.check(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. Please wait ${rateCheck.status.resetSeconds}s before trying again.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateCheck.status.resetSeconds.toString(),
          'X-RateLimit-Limit': rateCheck.status.limit.toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 2. Parse request payload
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload in request body.' },
      { status: 400 }
    );
  }

  const { url } = body;
  if (!url) {
    return NextResponse.json(
      { success: false, error: 'The "url" field is required.' },
      { status: 400 }
    );
  }

  // 3. Strict URL validation & SSRF defense
  const validation = validateAndParseYouTubeUrl(url);
  if (!validation.isValid || !validation.normalizedUrl) {
    return NextResponse.json(
      { success: false, error: validation.error || 'Invalid YouTube URL.' },
      { status: 422 }
    );
  }

  // 4. Inspect media metadata
  try {
    const config = getServerConfig();
    const metadata = await mediaService.inspectMedia(validation.normalizedUrl);
    return NextResponse.json(
      {
        success: true,
        metadata,
        isServerless: config.isServerless || !config.ytdlpCommand.isAvailable,
      },
      {
        headers: {
          'X-RateLimit-Remaining': rateCheck.status.remaining.toString(),
        },
      }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to inspect media source.';
    const isMediaIssue =
      message.includes('verification') ||
      message.includes('cookies.txt') ||
      message.includes('unavailable') ||
      message.includes('not found') ||
      message.includes('private') ||
      message.includes('exceeds maximum allowed limit') ||
      message.includes('Live streams') ||
      message.includes('Serverless') ||
      message.includes('ENOENT') ||
      message.includes('yt-dlp');

    return NextResponse.json(
      { success: false, error: message },
      { status: isMediaIssue ? 422 : 500 }
    );
  }
}
