'use client';

import { useState } from 'react';
import {
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  HardDrive,
  Clock,
  Zap,
  Loader2,
  Film,
  Music,
} from 'lucide-react';
import { JobState, JobPhase } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface ProcessingStepProps {
  job: JobState;
  onCancel: () => Promise<void>;
  onRetry: () => Promise<void>;
  onReset: () => void;
  isCancelling: boolean;
}

export default function ProcessingStep({
  job,
  onCancel,
  onRetry,
  onReset,
  isCancelling,
}: ProcessingStepProps) {
  const [copied, setCopied] = useState(false);

  const isTerminal =
    job.status === 'ready' || job.status === 'failed' || job.status === 'cancelled';

  const handleCopyLink = () => {
    if (job.downloadUrl) {
      const fullUrl = `${window.location.origin}${job.downloadUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPhaseDescription = (phase: JobPhase): string => {
    switch (phase) {
      case 'queued':
        return 'Waiting in queue for an available processing worker...';
      case 'fetching_info':
        return 'Extracting stream metadata and audio/video manifests...';
      case 'downloading':
        return 'Downloading authorized media streams from source...';
      case 'transcoding':
        return job.format === 'mp3'
          ? 'Transcoding audio to high-bitrate MP3 using FFmpeg...'
          : 'Losslessly muxing native video & audio streams with FFmpeg (0 compression)...';
      case 'finalizing':
        return 'Verifying stream integrity and preparing download asset...';
      case 'ready':
        return 'Processing complete! Your media file is ready for download.';
      case 'failed':
        return 'Media processing encountered an error.';
      case 'cancelled':
        return 'Job was cancelled.';
      default:
        return 'Processing media...';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Central Progress Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 transition-all">
        {/* Header / Media Summary */}
        <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 shadow-md">
            {job.thumbnailUrl ? (
              <img
                src={job.thumbnailUrl}
                alt={job.mediaTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                {job.format === 'mp3' ? (
                  <Music className="w-8 h-8" />
                ) : (
                  <Film className="w-8 h-8" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {job.format.toUpperCase()} • {job.quality}
              </span>
              <span className="text-xs text-slate-400">• Job #{job.id.slice(0, 8)}</span>
            </div>

            <h3 className="mt-1.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
              {job.mediaTitle}
            </h3>

            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {job.progress.message || getPhaseDescription(job.status)}
            </p>
          </div>
        </div>

        {/* Status Indicator & Progress Bar */}
        <div className="py-6 space-y-4">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              {!isTerminal && (
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
              )}
              {job.status === 'ready' && (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              )}
              {job.status === 'failed' && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              {job.status === 'cancelled' && (
                <XCircle className="w-4 h-4 text-amber-500" />
              )}
              <span className="capitalize">{job.status.replace('_', ' ')}</span>
            </span>

            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">
              {Math.round(job.progress.percent || 0)}%
            </span>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                job.status === 'ready'
                  ? 'bg-emerald-500'
                  : job.status === 'failed'
                  ? 'bg-red-500'
                  : job.status === 'cancelled'
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 animate-shimmer'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, job.progress.percent || 0))}%` }}
            />
          </div>

          {/* Telemetry info row (Speed, ETA, etc.) */}
          {!isTerminal && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4">
                {job.progress.downloadSpeed && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Speed: {job.progress.downloadSpeed}
                  </span>
                )}
                {job.progress.eta && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    ETA: {job.progress.eta}
                  </span>
                )}
              </div>
              <span>Keep this tab open while processing</span>
            </div>
          )}
        </div>

        {/* Phase Action States */}

        {/* 1. SUCCESS / READY STATE */}
        {job.status === 'ready' && (
          <div className="mt-4 p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">
                    <Check className="w-4 h-4" />
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    File Ready for Download!
                  </h4>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {job.fileSizeBytes && (
                    <span className="flex items-center gap-1 font-medium">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                      Size: {formatBytes(job.fileSizeBytes)}
                    </span>
                  )}
                  {job.format === 'mp4' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                      Exact Native Stream (0 Compression)
                    </span>
                  )}
                  <span>• Link expires in 30 minutes</span>
                </div>
              </div>

              {/* Direct Download Button */}
              {job.downloadUrl ? (
                <a
                  href={job.downloadUrl}
                  download={job.fileName || 'media_download'}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 transition-all duration-200 text-sm sm:text-base cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Download {job.format.toUpperCase()}</span>
                </a>
              ) : (
                <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-xs sm:text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span>Securing Download Asset...</span>
                </div>
              )}
            </div>

            {/* Sub-actions (Copy link & Start new) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-900/40 text-xs">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Download Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Direct Download Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                <span>Convert Another Video</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. ACTIVE / PROCESSING STATE */}
        {!isTerminal && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Need to cancel or change format?
            </span>

            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>{isCancelling ? 'Cancelling Job...' : 'Cancel Job'}</span>
            </button>
          </div>
        )}

        {/* 3. FAILED OR CANCELLED STATE */}
        {(job.status === 'failed' || job.status === 'cancelled') && (
          <div className="mt-4 p-5 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {job.status === 'cancelled'
                    ? 'Processing Cancelled'
                    : 'Processing Failed'}
                </h4>
                <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                  {job.error || job.progress.message || 'The job could not be completed.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Job</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition"
              >
                Try Another Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
