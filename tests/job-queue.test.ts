import { describe, it, expect, vi } from 'vitest';
import { jobQueue } from '@/server/job-queue';

describe('JobQueueService', () => {
  it('enqueues a job with initial state', () => {
    const job = jobQueue.enqueue({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      mediaTitle: 'Test Rickroll Video',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      format: 'mp4',
      quality: '1080p',
    });

    expect(job.id).toBeDefined();
    expect(job.format).toBe('mp4');
    expect(job.quality).toBe('1080p');
    expect(['queued', 'fetching_info', 'downloading']).toContain(job.status);
    expect(job.progress.percent).toBeGreaterThanOrEqual(0);
  });

  it('prevents duplicate active submissions with identical parameters', () => {
    const params = {
      url: 'https://www.youtube.com/watch?v=51nZ2Z3Jm6k',
      mediaTitle: 'Shorts Video',
      thumbnailUrl: '',
      format: 'mp3' as const,
      quality: '320k',
    };

    const firstJob = jobQueue.enqueue(params);
    const secondJob = jobQueue.enqueue(params);

    expect(secondJob.id).toBe(firstJob.id);
  });

  it('retrieves an active job by ID', () => {
    const created = jobQueue.enqueue({
      url: 'https://www.youtube.com/watch?v=test1234567',
      mediaTitle: 'Video For Retrieval',
      thumbnailUrl: '',
      format: 'mp4',
      quality: '720p',
    });

    const retrieved = jobQueue.getJob(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
  });

  it('cancels an active job and transitions status to cancelled', () => {
    const job = jobQueue.enqueue({
      url: 'https://www.youtube.com/watch?v=canceltarget',
      mediaTitle: 'Video to cancel',
      thumbnailUrl: '',
      format: 'mp4',
      quality: '480p',
    });

    const success = jobQueue.cancelJob(job.id);
    expect(success).toBe(true);

    const cancelledState = jobQueue.getJob(job.id);
    expect(cancelledState?.status).toBe('cancelled');
    expect(cancelledState?.progress.message).toContain('cancelled');
  });

  it('reports queue statistics correctly', () => {
    const stats = jobQueue.getStats();
    expect(stats.totalTracked).toBeGreaterThan(0);
    expect(typeof stats.activeJobs).toBe('number');
    expect(typeof stats.pendingJobs).toBe('number');
  });
});
