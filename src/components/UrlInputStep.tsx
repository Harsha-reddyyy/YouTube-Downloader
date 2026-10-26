'use client';

import { useState, useMemo } from 'react';
import {
  Clipboard,
  XCircle,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Youtube,
  Film,
  Zap,
  Music,
} from 'lucide-react';
import { validateAndParseYouTubeUrl } from '@/lib/security';
import { detectUrlType } from '@/lib/utils';

interface UrlInputStepProps {
  onInspect: (url: string) => Promise<void>;
  isLoading: boolean;
  errorMessage?: string;
  onClearError?: () => void;
}

export default function UrlInputStep({
  onInspect,
  isLoading,
  errorMessage,
  onClearError,
}: UrlInputStepProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Curated sample URLs for instantaneous one-click testing
  const sampleLinks = [
    {
      label: '4K Creative Commons Film',
      sublabel: 'Blender Foundation • 4K/1080p',
      url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      icon: Film,
      badge: '4K MP4',
    },
    {
      label: 'Vertical YouTube Shorts',
      sublabel: 'Mobile 1080x1920 Format',
      url: 'https://www.youtube.com/shorts/51nZ2Z3Jm6k',
      icon: Zap,
      badge: 'Shorts',
    },
    {
      label: 'Studio Music Track',
      sublabel: 'Ideal for 320kbps MP3 LAME',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      icon: Music,
      badge: '320k MP3',
    },
  ];

  // Live URL recognition badge
  const detectedType = useMemo(() => {
    if (!url.trim()) return null;
    return detectUrlType(url);
  }, [url]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setValidationError(null);
    if (onClearError) onClearError();
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setValidationError(null);
          if (onClearError) onClearError();
        }
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
  };

  const handleClear = () => {
    setUrl('');
    setValidationError(null);
    if (onClearError) onClearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      setValidationError('Please enter or paste a YouTube video or Shorts URL to proceed.');
      return;
    }

    const check = validateAndParseYouTubeUrl(trimmed);
    if (!check.isValid || !check.normalizedUrl) {
      setValidationError(
        check.error ||
          'Please enter a valid YouTube video or YouTube Shorts link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)'
      );
      return;
    }

    setValidationError(null);
    await onInspect(check.normalizedUrl);
  };

  const activeError = validationError || errorMessage;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Search & URL Input Box */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          {/* Subtle glowing halo behind input */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-40 group-hover:opacity-80 group-focus-within:opacity-100 blur-xl transition duration-500 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-stretch gap-2 bg-white dark:bg-[#0c101a] border border-slate-200/90 dark:border-white/10 rounded-2xl p-2 sm:p-2.5 shadow-xl shadow-slate-900/5 dark:shadow-black/40 transition-all duration-200">
            {/* Input field container */}
            <div className="relative flex-1 flex items-center min-w-0 px-2 sm:px-3">
              <div className="text-red-500 shrink-0 mr-2.5">
                <Youtube className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste YouTube video or Shorts link here..."
                disabled={isLoading}
                aria-label="YouTube media URL"
                className="w-full py-3 sm:py-3.5 pr-2 text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-normal"
              />

              {/* Dynamic URL format pill */}
              {detectedType && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shrink-0 mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="capitalize">{detectedType}</span>
                </div>
              )}

              {/* Paste or Clear action buttons inside the input */}
              <div className="flex items-center gap-1 shrink-0">
                {url ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear URL input"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    title="Paste from clipboard (⌘V)"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-150 active:scale-95"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Paste</span>
                    <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-slate-400">
                      ⌘V
                    </kbd>
                  </button>
                )}
              </div>
            </div>

            {/* Inspect / Fetch Streams button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Inspecting Streams...</span>
                </>
              ) : (
                <>
                  <span>Inspect Streams</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error alert banner */}
      {activeError && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm animate-in fade-in duration-200 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-bold text-red-900 dark:text-red-200">Unable to resolve media link</p>
            <p className="mt-1 leading-relaxed text-red-700 dark:text-red-300">{activeError}</p>
          </div>
        </div>
      )}

      {/* Quick Sample Presets */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Try One-Click Verified Presets
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            Directly test stream copy pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {sampleLinks.map((sample) => {
            const IconComp = sample.icon;
            return (
              <button
                key={sample.label}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setUrl(sample.url);
                  setValidationError(null);
                  if (onClearError) onClearError();
                }}
                className="group relative flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-[#0c101a]/70 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 border border-slate-200/80 dark:border-white/5 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 text-left transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sample.label}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {sample.sublabel}
                    </div>
                  </div>
                </div>

                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors shrink-0">
                  {sample.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
