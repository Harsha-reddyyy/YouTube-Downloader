'use client';

import { Link as LinkIcon, Sliders, DownloadCloud, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepNumber = 1 | 2 | 3;

interface StepIndicatorProps {
  currentStep: StepNumber;
  onStepClick?: (step: StepNumber) => void;
  canNavigateToStep2: boolean;
}

export default function StepIndicator({
  currentStep,
  onStepClick,
  canNavigateToStep2,
}: StepIndicatorProps) {
  const steps = [
    {
      num: 1 as StepNumber,
      title: 'Paste Link',
      subtitle: 'URL & validation',
      icon: LinkIcon,
      clickable: true,
    },
    {
      num: 2 as StepNumber,
      title: 'Choose Format',
      subtitle: 'MP4 / MP3 & quality',
      icon: Sliders,
      clickable: canNavigateToStep2,
    },
    {
      num: 3 as StepNumber,
      title: 'Download',
      subtitle: 'Transcode & retrieve',
      icon: DownloadCloud,
      clickable: false,
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
        {steps.map((s, idx) => {
          const isCompleted = currentStep > s.num;
          const isActive = currentStep === s.num;
          const isClickable = s.clickable && onStepClick;

          const IconComponent = s.icon;

          return (
            <button
              key={s.num}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(s.num)}
              className={cn(
                'group relative flex flex-col items-center text-center p-3 sm:p-4 rounded-xl transition-all duration-200 border text-left',
                isActive
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500/40 dark:border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                  : isCompleted
                  ? 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-60 cursor-not-allowed',
                isClickable && !isActive && 'cursor-pointer'
              )}
            >
              {/* Step indicator number / check badge */}
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold mb-2 transition-all',
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-4 ring-indigo-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <IconComponent className="w-4 h-4" />}
              </div>

              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-xs sm:text-sm font-semibold tracking-tight transition-colors',
                    isActive
                      ? 'text-indigo-900 dark:text-indigo-200'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  Step {s.num}: {s.title}
                </span>
                <span className="hidden sm:inline-block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  {s.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
