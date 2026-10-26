'use client';

import ThemeToggle from './ThemeToggle';
import { Film, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenLegal?: () => void;
}

export default function Header({ onOpenLegal }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25">
            <Film className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                MediaFlow
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                <Sparkles className="w-3 h-3" />
                FFmpeg 4K/HD
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              High-performance media transcoding pipeline
            </p>
          </div>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Worker Queue Active</span>
          </div>

          {onOpenLegal && (
            <button
              onClick={onOpenLegal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Usage policies and copyright guidelines"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Permissions & Terms</span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
