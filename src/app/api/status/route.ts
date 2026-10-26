import { NextResponse } from 'next/server';
import { getServerConfig } from '@/server/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getServerConfig();

  return NextResponse.json({
    status: 'ok',
    isServerless: config.isServerless,
    hasYtDlp: config.ytdlpCommand.isAvailable,
    hasFfmpeg: config.hasFfmpeg,
    environment: config.nodeEnv,
  });
}
