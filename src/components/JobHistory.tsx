'use client';

import { Download, Trash2, Clock, Film, Music, CheckCircle2, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { JobState } from '@/lib/types';
import { formatBytes, formatRelativeTime } from '@/lib/utils';
import { useState } from 'react';

interface JobHistoryProps {
  history: JobState[];
  onClearHistory: () => void;
  onSelectJob: (job: JobState) => void;
}

export default function JobHistory({
  history,
  onClearHistory,
  onSelectJob,
}: JobHistoryProps) {
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});

  if (history.length === 0) return null;

  const handleImageError = (id: string) => {
    setThumbnailErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 glass-card rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
            Recent Session Conversions
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {history.length}
          </span>
        </div>

        <button
          onClick={onClearHistory}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Item List */}
      <div className="mt-3 divide-y divide-slate-100 dark:divide-white/5">
        {history.map((job) => {
          const isReady = job.status === 'ready';
          const hasError = thumbnailErrors[job.id];

          return (
            <div
              key={job.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm hover:bg-slate-50/50 dark:hover:bg-white/[0.02] px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 shadow-sm relative">
                  {!hasError && job.thumbnailUrl ? (
                    <Image
                      src={job.thumbnailUrl}
                      alt={job.mediaTitle}
                      fill
                      unoptimized
                      sizes="48px"
                      onError={() => handleImageError(job.id)}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      {job.format === 'mp3' ? (
                        <Music className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <Film className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {job.mediaTitle}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                    <span className="uppercase font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60 text-[10px]">
                      {job.format} • {job.quality}
                    </span>
                    {job.fileSizeBytes && (
                      <span className="font-mono">{formatBytes(job.fileSizeBytes)}</span>
                    )}
                    <span>•</span>
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(job.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {isReady && job.downloadUrl ? (
                  <a
                    href={job.downloadUrl}
                    download={job.fileName || 'media_download'}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 transition text-xs active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                ) : (
                  <button
                    onClick={() => onSelectJob(job)}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition text-xs"
                  >
                    <span>View Status</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
