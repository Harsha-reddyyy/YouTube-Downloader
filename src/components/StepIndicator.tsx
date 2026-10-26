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
      title: 'Inspect Link',
      subtitle: 'Analyze streams',
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
      title: 'Retrieve Asset',
      subtitle: 'Transcode & download',
      icon: DownloadCloud,
      clickable: false,
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 sm:mb-10">
      <nav aria-label="Processing Progress">
        <ol className="grid grid-cols-3 gap-2 sm:gap-4 relative">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isActive = currentStep === s.num;
            const isClickable = s.clickable && onStepClick;
            const IconComponent = s.icon;

            return (
              <li key={s.num} className="relative">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(s.num)}
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'w-full group relative flex flex-col items-center sm:items-start text-center sm:text-left p-3 sm:p-4 rounded-2xl transition-all duration-200 border',
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/40 dark:border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                      : isCompleted
                      ? 'bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                      : 'bg-slate-100/40 dark:bg-slate-900/20 border-transparent opacity-60 cursor-not-allowed',
                    isClickable && !isActive && 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                  )}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
                    {/* Badge */}
                    <div
                      className={cn(
                        'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all duration-200',
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                          : isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-4 ring-indigo-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      ) : (
                        <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </div>

                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-mono uppercase tracking-wider',
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      Stage {s.num}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0 w-full">
                    <span
                      className={cn(
                        'text-xs sm:text-sm font-bold tracking-tight truncate',
                        isActive
                          ? 'text-indigo-950 dark:text-indigo-200'
                          : isCompleted
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {s.title}
                    </span>
                    <span className="hidden sm:inline-block text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                      {s.subtitle}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
