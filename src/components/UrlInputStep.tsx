'use client';

import { useState } from 'react';
import {
  Link2,
  Clipboard,
  XCircle,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Youtube,
} from 'lucide-react';
import { validateAndParseYouTubeUrl } from '@/lib/security';

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

  // Preset sample URLs for one-click testing
  const sampleLinks = [
    {
      label: 'Open Movie (Blender CC)',
      url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    },
    {
      label: 'YouTube Shorts Link',
      url: 'https://www.youtube.com/shorts/51nZ2Z3Jm6k',
    },
    {
      label: 'Standard Music Video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
  ];

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
      setValidationError('Please enter or paste a YouTube URL to proceed.');
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
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          {/* Subtle glowing ring behind input */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur-lg transition duration-500 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-stretch gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl shadow-slate-900/5 transition-all">
            {/* Left URL Input container */}
            <div className="relative flex-1 flex items-center min-w-0">
              <div className="pl-3.5 pr-2 text-slate-400 dark:text-slate-500">
                <Youtube className="w-5 h-5 text-red-500" />
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste YouTube video or Shorts link here (e.g. https://youtu.be/...)"
                disabled={isLoading}
                aria-label="YouTube media URL"
                className="w-full py-3.5 pr-10 text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />

              {/* Paste & Clear action buttons inside the input */}
              <div className="flex items-center gap-1 pr-2">
                {url ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear URL input"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    title="Paste from clipboard"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inspect / Fetch button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inspecting Media...</span>
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
        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Unable to process link</p>
            <p className="mt-0.5 text-xs sm:text-sm text-red-600 dark:text-red-300">
              {activeError}
            </p>
          </div>
        </div>
      )}

      {/* Sample presets chips */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Quick Samples:
        </span>
        {sampleLinks.map((sample) => (
          <button
            key={sample.label}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setUrl(sample.url);
              setValidationError(null);
              if (onClearError) onClearError();
            }}
            className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
