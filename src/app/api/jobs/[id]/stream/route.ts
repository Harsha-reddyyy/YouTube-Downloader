import { NextRequest } from 'next/server';
import { jobQueue } from '@/server/job-queue';
import { JobState } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
): Promise<Response> {
  const jobId = params.id;
  if (!jobId) {
    return new Response('Job ID missing', { status: 400 });
  }

  const initialJob = jobQueue.getJob(jobId);
  if (!initialJob) {
    return new Response('Job not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial state immediately
      const initialPayload = `data: ${JSON.stringify(initialJob)}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // If already terminal with download URL (or terminal failure/cancelled), close stream
      if (
        (initialJob.status === 'ready' && initialJob.downloadUrl) ||
        initialJob.status === 'failed' ||
        initialJob.status === 'cancelled'
      ) {
        controller.close();
        return;
      }

      // 2. Subscribe to subsequent updates
      const unsubscribe = jobQueue.subscribeToJob(jobId, (updatedState: JobState) => {
        try {
          const payload = `data: ${JSON.stringify(updatedState)}\n\n`;
          controller.enqueue(encoder.encode(payload));

          // If job reached a complete terminal state with downloadUrl, close the stream
          if (
            (updatedState.status === 'ready' && updatedState.downloadUrl) ||
            updatedState.status === 'failed' ||
            updatedState.status === 'cancelled'
          ) {
            unsubscribe();
            controller.close();
          }
        } catch {
          unsubscribe();
        }
      });

      // 3. Heartbeat keepalive ping every 15 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
          unsubscribe();
        }
      }, 15000);

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
