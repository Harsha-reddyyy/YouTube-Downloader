'use client';

import ThemeToggle from './ThemeToggle';
import { Film, Sparkles, ShieldCheck, Activity } from 'lucide-react';

interface HeaderProps {
  onOpenLegal?: () => void;
  onOpenStatus?: () => void;
  isEngineActive?: boolean;
}

export default function Header({
  onOpenLegal,
  onOpenStatus,
  isEngineActive = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/75 dark:bg-[#07090e]/80 border-b border-slate-200/80 dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                MediaFlow
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                FFmpeg 4K / HD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
              Lossless Media Extraction & Transcoding Pipeline
            </p>
          </div>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Engine Diagnostic Trigger */}
          {onOpenStatus && (
            <button
              onClick={onOpenStatus}
              type="button"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
              title="View live processing worker health and specifications"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
              <span className="hidden sm:inline font-mono text-[11px]">Worker Engine</span>
              <span className="text-[11px] font-semibold">Active</span>
            </button>
          )}

          {/* Legal and Terms trigger */}
          {onOpenLegal && (
            <button
              onClick={onOpenLegal}
              type="button"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition"
              title="Usage policies, Creative Commons, and copyright guidelines"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Permissions</span>
            </button>
          )}

          {/* Dark / Light Mode Switch */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
