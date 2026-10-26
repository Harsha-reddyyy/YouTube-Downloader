'use client';

import { ShieldCheck, Server, Cpu, HardDrive, ArrowUp, Activity } from 'lucide-react';

interface FooterProps {
  onOpenLegal: () => void;
  onOpenStatus?: () => void;
}

export default function Footer({ onOpenLegal, onOpenStatus }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-24 border-t border-slate-200/80 dark:border-white/5 bg-white/40 dark:bg-[#07090e]/60 backdrop-blur-xl transition-colors text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Technical Architecture Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pb-10 border-b border-slate-200/80 dark:border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>FFmpeg Core</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Native FFmpeg remuxing engine with faststart atom headers and libmp3lame constant bitrate mastering.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Server className="w-4 h-4 text-indigo-500" />
              <span>Worker Concurrency</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Dedicated async job queue with real-time SSE progress streaming and non-blocking background workers.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span>Ephemeral Storage</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Zero persistent file storage. Temporary media assets and download tokens automatically destroyed after 30 minutes.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>SSRF & Security Guard</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Zero-shell execution, sanitized arguments, sliding-window rate limiting, and loopback/private IP blocking.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="font-medium text-slate-600 dark:text-slate-400">
              MediaFlow Studio • High-Performance Media Downloader
            </p>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Authorized Media, Public Domain &amp; Creative Commons
            </span>
          </div>

          <div className="flex items-center gap-4">
            {onOpenStatus && (
              <button
                type="button"
                onClick={onOpenStatus}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1 font-semibold"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>System Status</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenLegal}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4 transition font-medium"
            >
              Legal &amp; Rights
            </button>

            <button
              type="button"
              onClick={scrollToTop}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              title="Scroll to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
