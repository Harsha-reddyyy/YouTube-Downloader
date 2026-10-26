'use client';

import { Download, Trash2, Clock, Film, Music, ExternalLink } from 'lucide-react';
import { JobState } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

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
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Recent Session Conversions ({history.length})
          </h3>
        </div>

        <button
          onClick={onClearHistory}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {history.map((job) => {
          const isReady = job.status === 'ready';

          return (
            <div
              key={job.id}
              className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0">
                  {job.thumbnailUrl ? (
                    <img
                      src={job.thumbnailUrl}
                      alt={job.mediaTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      {job.format === 'mp3' ? (
                        <Music className="w-4 h-4" />
                      ) : (
                        <Film className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {job.mediaTitle}
                  </p>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                    <span className="uppercase font-medium text-indigo-600 dark:text-indigo-400">
                      {job.format} • {job.quality}
                    </span>
                    {job.fileSizeBytes && (
                      <span>• {formatBytes(job.fileSizeBytes)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isReady && job.downloadUrl ? (
                  <a
                    href={job.downloadUrl}
                    download={job.fileName || 'media_download'}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900 transition text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                ) : (
                  <button
                    onClick={() => onSelectJob(job)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition text-xs"
                  >
                    View Status
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
