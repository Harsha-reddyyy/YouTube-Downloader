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
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import Image from 'next/image';
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
  const [thumbnailError, setThumbnailError] = useState(false);

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

  // Determine stage progression for visual pipeline (1 to 4)
  const getPipelineStage = (phase: JobPhase): number => {
    switch (phase) {
      case 'queued':
      case 'fetching_info':
        return 1;
      case 'downloading':
        return 2;
      case 'transcoding':
      case 'finalizing':
        return 3;
      case 'ready':
        return 4;
      default:
        return 1;
    }
  };

  const currentStage = getPipelineStage(job.status);

  const pipelineStages = [
    { num: 1, label: 'Manifest Analysis' },
    { num: 2, label: 'Stream Ingestion' },
    { num: 3, label: job.format === 'mp3' ? 'FFmpeg Transcode' : 'Direct Stream Copy' },
    { num: 4, label: 'Asset Ready' },
  ];

  const getPhaseDescription = (phase: JobPhase): string => {
    switch (phase) {
      case 'queued':
        return 'Queued in processing pool. Initializing transcode worker...';
      case 'fetching_info':
        return 'Extracting stream manifests and decrypting container formats...';
      case 'downloading':
        return 'Downloading authorized media streams from source at maximum speed...';
      case 'transcoding':
        return job.format === 'mp3'
          ? 'Transcoding audio track to high-bitrate MP3 using FFmpeg libmp3lame...'
          : 'Losslessly remuxing native video & audio streams with FFmpeg (0 compression)...';
      case 'finalizing':
        return 'Finalizing faststart headers and generating cryptographic download token...';
      case 'ready':
        return 'Processing complete! File is verified and ready for instant download.';
      case 'failed':
        return 'Media processing encountered an unexpected issue.';
      case 'cancelled':
        return 'Job was cancelled by the user.';
      default:
        return 'Processing media asset...';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Central Progress & Telemetry Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Header Summary */}
        <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 shadow-md">
            {!thumbnailError && job.thumbnailUrl ? (
              <Image
                src={job.thumbnailUrl}
                alt={job.mediaTitle}
                fill
                unoptimized
                sizes="80px"
                onError={() => setThumbnailError(true)}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                {job.format === 'mp3' ? (
                  <Music className="w-8 h-8 text-indigo-400" />
                ) : (
                  <Film className="w-8 h-8 text-indigo-400" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {job.format.toUpperCase()} • {job.quality}
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                Job #{job.id.slice(0, 8)}
              </span>
            </div>

            <h3 className="mt-1.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {job.mediaTitle}
            </h3>

            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {job.progress.message || getPhaseDescription(job.status)}
            </p>
          </div>
        </div>

        {/* 4-Stage Visual Pipeline Stepper */}
        {!isTerminal && (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-center">
              {pipelineStages.map((stg) => {
                const isDone = currentStage > stg.num;
                const isCurrent = currentStage === stg.num;

                return (
                  <div key={stg.num} className="flex flex-col items-center">
                    <div
                      className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-indigo-600 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                    <span
                      className={`mt-2 text-[10px] sm:text-[11px] font-semibold truncate ${
                        isDone
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isCurrent
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {stg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Indicator & Live Shimmering Progress Bar */}
        <div className="py-2 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              {!isTerminal && (
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
              )}
              {job.status === 'ready' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
              {job.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
              {job.status === 'cancelled' && <XCircle className="w-4 h-4 text-amber-500" />}
              <span className="capitalize">{job.status.replace('_', ' ')}</span>
            </div>

            <div className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-lg sm:text-xl tabular-nums">
              {Math.round(job.progress.percent || 0)}%
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out relative ${
                job.status === 'ready'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20'
                  : job.status === 'failed'
                  ? 'bg-red-500'
                  : job.status === 'cancelled'
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 animate-shimmer'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, job.progress.percent || 0))}%` }}
            />
          </div>

          {/* Telemetry info row (Speed, ETA, Active worker) */}
          {!isTerminal && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-4">
                {job.progress.downloadSpeed && (
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Speed: {job.progress.downloadSpeed}</span>
                  </span>
                )}
                {job.progress.eta && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ETA: {job.progress.eta}</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] font-sans">Keep tab open while processing</span>
            </div>
          )}
        </div>

        {/* 1. SUCCESS / READY STATE */}
        {job.status === 'ready' && (
          <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">
                    <Check className="w-4 h-4" />
                  </span>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    Verified Asset Ready for Download!
                  </h4>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {job.fileSizeBytes && (
                    <span className="flex items-center gap-1 font-mono font-semibold">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                      Size: {formatBytes(job.fileSizeBytes)}
                    </span>
                  )}
                  {job.format === 'mp4' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                      Direct Stream Copy (0 Compression)
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
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/30 transition-all duration-200 text-sm sm:text-base active:scale-95"
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

            {/* Sub-actions: Copy link & Start new */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-900/40 text-xs">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Download Link Copied to Clipboard!</span>
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
                className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
              >
                <span>Convert Another Video</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. ACTIVE / PROCESSING STATE CANCEL BUTTON */}
        {!isTerminal && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Need to cancel or change format?
            </span>

            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl transition disabled:opacity-50 active:scale-95"
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
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Job</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition active:scale-95"
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
