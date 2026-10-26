'use client';

import { ShieldCheck, Server, Cpu, HardDrive, Info } from 'lucide-react';

interface FooterProps {
  onOpenLegal: () => void;
}

export default function Footer({ onOpenLegal }: FooterProps) {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm transition-colors text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Specs and Technical Architecture row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>Transcoding Core</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Powered by native FFmpeg with dynamic bitrates, faststart headers, and libmp3lame.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <Server className="w-4 h-4 text-indigo-500" />
              <span>Worker Concurrency</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Dedicated async job queue with real-time SSE telemetry and non-blocking workers.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span>Ephemeral Storage</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Temporary files and cryptographic tokens automatically destroyed after 30 minutes.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Security & SSRF Guard</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Zero-shell execution, sanitized paths, rate limiting, and private IP blocking.
            </p>
          </div>
        </div>

        {/* Bottom copyright and legal disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-center sm:text-left">
            MediaFlow Downloader • Built for authorized media, public domain, and Creative Commons content.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenLegal}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4 transition"
            >
              Legal & Permissions Policy
            </button>
            <span>•</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
