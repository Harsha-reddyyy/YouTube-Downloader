import { EventEmitter } from 'events';
import crypto from 'crypto';
import {
  JobState,
  JobPhase,
  JobProgress,
  MediaFormat,
  JobCreateRequest,
} from '@/lib/types';
import { getServerConfig } from './config';
import { mediaService } from './media-service';
import { storageService } from './storage-service';

interface InternalJobItem {
  state: JobState;
  abortController: AbortController;
}

class JobQueueService extends EventEmitter {
  private jobs: Map<string, InternalJobItem> = new Map();
  private pendingQueue: string[] = [];
  private activeJobsCount = 0;

  constructor() {
    super();
    // Allow ample listeners for SSE connections
    this.setMaxListeners(200);
  }

  /**
   * Enqueues a new media download job or returns existing active job for the same URL + format + quality
   */
  public enqueue(params: {
    url: string;
    mediaTitle: string;
    thumbnailUrl: string;
    format: MediaFormat;
    quality: string;
  }): JobState {
    const { url, mediaTitle, thumbnailUrl, format, quality } = params;

    // Check for existing active or pending job with same parameters (prevent duplicate submissions)
    for (const item of this.jobs.values()) {
      const s = item.state;
      if (
        s.url === url &&
        s.format === format &&
        s.quality === quality &&
        (s.status === 'queued' ||
          s.status === 'fetching_info' ||
          s.status === 'downloading' ||
          s.status === 'transcoding' ||
          s.status === 'finalizing')
      ) {
        return s;
      }
    }

    const jobId = crypto.randomBytes(12).toString('hex');
    const now = Date.now();

    const initialState: JobState = {
      id: jobId,
      url,
      mediaTitle,
      thumbnailUrl,
      format,
      quality,
      createdAt: now,
      updatedAt: now,
      status: 'queued',
      progress: {
        phase: 'queued',
        percent: 0,
        message: 'Job queued, waiting for available processing worker slot...',
      },
    };

    const abortController = new AbortController();

    this.jobs.set(jobId, {
      state: initialState,
      abortController,
    });

    this.pendingQueue.push(jobId);
    this.emit(`job:${jobId}`, initialState);

    // Trigger queue processing
    this.processNext();

    return initialState;
  }

  /**
   * Retrieves state of a job by ID
   */
  public getJob(jobId: string): JobState | null {
    const item = this.jobs.get(jobId);
    return item ? { ...item.state } : null;
  }

  /**
   * Cancels an active or queued job
   */
  public cancelJob(jobId: string): boolean {
    const item = this.jobs.get(jobId);
    if (!item) return false;

    const { state, abortController } = item;

    // If already terminal, cannot cancel
    if (
      state.status === 'ready' ||
      state.status === 'failed' ||
      state.status === 'cancelled'
    ) {
      return false;
    }

    // Remove from pending queue if not yet started
    const queueIdx = this.pendingQueue.indexOf(jobId);
    if (queueIdx !== -1) {
      this.pendingQueue.splice(queueIdx, 1);
    }

    // Trigger abort signal
    abortController.abort();

    state.status = 'cancelled';
    state.updatedAt = Date.now();
    state.progress = {
      phase: 'cancelled',
      percent: 0,
      message: 'Job was cancelled by the user.',
    };

    this.emit(`job:${jobId}`, { ...state });
    return true;
  }

  /**
   * Subscribes to job state changes (used by SSE routes)
   */
  public subscribeToJob(
    jobId: string,
    callback: (state: JobState) => void
  ): () => void {
    const eventName = `job:${jobId}`;
    this.on(eventName, callback);

    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Dispatches pending jobs to workers subject to concurrency limits
   */
  private processNext() {
    const config = getServerConfig();

    while (
      this.activeJobsCount < config.maxConcurrentJobs &&
      this.pendingQueue.length > 0
    ) {
      const nextJobId = this.pendingQueue.shift();
      if (!nextJobId) break;

      const item = this.jobs.get(nextJobId);
      if (!item || item.state.status === 'cancelled') continue;

      this.activeJobsCount++;
      this.executeJob(item).finally(() => {
        this.activeJobsCount--;
        this.processNext();
      });
    }
  }

  /**
   * Worker task execution
   */
  private async executeJob(item: InternalJobItem) {
    const { state, abortController } = item;
    const config = getServerConfig();

    try {
      state.status = 'downloading';
      state.updatedAt = Date.now();
      this.emit(`job:${state.id}`, { ...state });

      const storedRecord = await mediaService.processMedia({
        jobId: state.id,
        url: state.url,
        mediaTitle: state.mediaTitle,
        format: state.format,
        quality: state.quality,
        abortSignal: abortController.signal,
        onProgress: (progress: JobProgress) => {
          if (progress.phase !== 'ready') {
            state.status = progress.phase;
          }
          state.progress = progress;
          state.updatedAt = Date.now();
          this.emit(`job:${state.id}`, { ...state });
        },
      });

      // Successful completion - attach download credentials before marking ready
      state.downloadToken = storedRecord.token;
      state.downloadUrl = `/api/download/${storedRecord.token}`;
      state.fileName = storedRecord.fileName;
      state.fileSizeBytes = storedRecord.fileSizeBytes;
      state.expiresAt = storedRecord.expiresAt;
      state.status = 'ready';
      state.updatedAt = Date.now();
      state.progress = {
        phase: 'ready',
        percent: 100,
        message: 'File processing complete! Ready to download.',
      };

      this.emit(`job:${state.id}`, { ...state });
    } catch (err: unknown) {
      const isAbort =
        abortController.signal.aborted ||
        (err instanceof Error && err.message.includes('cancelled'));

      state.status = isAbort ? 'cancelled' : 'failed';
      state.updatedAt = Date.now();
      state.error =
        err instanceof Error ? err.message : 'An unexpected error occurred during processing.';
      state.progress = {
        phase: state.status,
        percent: 0,
        message: state.error,
      };

      this.emit(`job:${state.id}`, { ...state });
    }
  }

  /**
   * Return overall queue stats
   */
  public getStats() {
    return {
      activeJobs: this.activeJobsCount,
      pendingJobs: this.pendingQueue.length,
      totalTracked: this.jobs.size,
    };
  }
}

// Global singleton to persist in development
const globalForQueue = globalThis as unknown as { jobQueue?: JobQueueService };

export const jobQueue = globalForQueue.jobQueue || new JobQueueService();

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.jobQueue = jobQueue;
}
