'use client';

import { X, Cpu, Server, HardDrive, ShieldCheck, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { useEffect } from 'react';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverStatus: {
    isServerless?: boolean;
    hasYtDlp?: boolean;
    hasFfmpeg?: boolean;
  };
}

export default function SystemStatusModal({
  isOpen,
  onClose,
  serverStatus,
}: SystemStatusModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-status-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 id="system-status-title" className="text-base font-bold text-slate-900 dark:text-white">
              System Architecture & Health
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live processing engine diagnostics
            </p>
          </div>
        </div>

        {/* Diagnostic Items */}
        <div className="space-y-3 pt-2">
          {/* FFmpeg Engine */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  FFmpeg Transcoder Core
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Direct stream copy muxing & LAME MP3 encoding
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{serverStatus.hasFfmpeg !== false ? 'Operational' : 'Unavailable'}</span>
            </div>
          </div>

          {/* yt-dlp Extractor */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-indigo-500" />
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Stream Manifest Extractor
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Native yt-dlp binary with fallback engine
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{serverStatus.hasYtDlp !== false ? 'Connected' : 'Fallback Engine'}</span>
            </div>
          </div>

          {/* Ephemeral Storage Engine */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Ephemeral Auto-Purge Storage
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  30-minute strict cryptographic TTL lifecycle
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Purge Active</span>
            </div>
          </div>

          {/* Security Guard */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  SSRF & Private IP Sandbox
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Zero-shell execution with argument sanitization
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Protected</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
