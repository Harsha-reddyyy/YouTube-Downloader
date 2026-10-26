import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { storageService } from '@/server/storage-service';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    token: string;
  };
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<Response> {
  const token = params.token;
  if (!token) {
    return new NextResponse('Download token is required.', { status: 400 });
  }

  const fileRecord = storageService.getFileByToken(token);
  if (!fileRecord) {
    return new NextResponse(
      'Download link has expired or is invalid. Please process the media again.',
      { status: 404 }
    );
  }

  if (!fs.existsSync(fileRecord.filePath)) {
    return new NextResponse('Target file could not be found on disk.', {
      status: 410,
    });
  }

  // Stream file incrementally to avoid loading large media files into memory
  const nodeStream = fs.createReadStream(fileRecord.filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  // Encode filename for Content-Disposition (RFC 5987 standard)
  const encodedFilename = encodeURIComponent(fileRecord.fileName).replace(
    /['()]/g,
    escape
  );

  return new Response(webStream, {
    status: 200,
    headers: {
      'Content-Type': fileRecord.mimeType || 'application/octet-stream',
      'Content-Length': fileRecord.fileSizeBytes.toString(),
      'Content-Disposition': `attachment; filename="${fileRecord.fileName.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
