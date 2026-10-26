/**
 * Type definitions for Media Downloader application
 */

export type MediaFormat = 'mp4' | 'mp3';

export type VideoResolution = '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | 'best';

export type AudioBitrate = '128k' | '192k' | '256k' | '320k';

export interface QualityOption {
  id: string;
  label: string;
  resolution?: VideoResolution;
  height?: number;
  width?: number;
  fps?: number;
  formatNote?: string;
  vcodec?: string;
  acodec?: string;
  filesizeEstimateBytes?: number;
  isAvailable: boolean;
  requiresTranscode?: boolean;
}

export interface AudioQualityOption {
  id: AudioBitrate;
  label: string;
  bitrateKbps: number;
  filesizeEstimateBytes?: number;
  description: string;
}

export interface MediaMetadata {
  id: string;
  url: string;
  title: string;
  description?: string;
  durationSeconds: number;
  durationFormatted: string;
  channel: string;
  channelUrl?: string;
  thumbnailUrl: string;
  viewCount?: number;
  uploadDate?: string;
  availableResolutions: QualityOption[];
  availableAudioQualities: AudioQualityOption[];
  isLiveStream: boolean;
  isAgeRestricted?: boolean;
  originalExt?: string;
}

export type JobPhase =
  | 'queued'
  | 'fetching_info'
  | 'downloading'
  | 'transcoding'
  | 'finalizing'
  | 'ready'
  | 'failed'
  | 'cancelled';

export interface JobProgress {
  phase: JobPhase;
  percent: number; // 0 - 100
  downloadSpeed?: string;
  eta?: string;
  transcodeFps?: number;
  bytesProcessed?: number;
  totalBytesEstimate?: number;
  message?: string;
}

export interface JobState {
  id: string;
  url: string;
  mediaTitle: string;
  thumbnailUrl: string;
  format: MediaFormat;
  quality: string;
  createdAt: number;
  updatedAt: number;
  status: JobPhase;
  progress: JobProgress;
  downloadToken?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  expiresAt?: number;
  error?: string;
}

export interface JobCreateRequest {
  url: string;
  format: MediaFormat;
  quality: string; // e.g. "1080p", "720p", "320k", "192k"
  audioBitrate?: AudioBitrate;
}

export interface InspectResponse {
  success: boolean;
  metadata?: MediaMetadata;
  error?: string;
}

export interface JobCreateResponse {
  success: boolean;
  jobId?: string;
  error?: string;
}

export interface JobStatusResponse {
  success: boolean;
  job?: JobState;
  error?: string;
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetSeconds: number;
}
