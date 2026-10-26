'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Video,
  Music,
  CheckCircle2,
  Clock,
  User,
  Eye,
  ArrowLeft,
  ArrowRight,
  HardDrive,
  Sparkles,
  Info,
  ExternalLink,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import {
  MediaMetadata,
  MediaFormat,
} from '@/lib/types';
import { formatBytes, formatViews } from '@/lib/utils';

interface FormatQualityStepProps {
  metadata: MediaMetadata;
  onBack: () => void;
  onSubmit: (format: MediaFormat, quality: string) => Promise<void>;
  isLoading: boolean;
}

export default function FormatQualityStep({
  metadata,
  onBack,
  onSubmit,
  isLoading,
}: FormatQualityStepProps) {
  const [selectedFormat, setSelectedFormat] = useState<MediaFormat>('mp4');
  const [thumbnailError, setThumbnailError] = useState(false);

  // Default to highest available 1080p, then 720p, or best available
  const defaultVideoQuality =
    metadata.availableResolutions.find((q) => q.isAvailable && q.resolution === '1080p')?.id ||
    metadata.availableResolutions.find((q) => q.isAvailable && q.resolution === '720p')?.id ||
    metadata.availableResolutions.find((q) => q.isAvailable)?.id ||
    '720p';

  const [selectedVideoQuality, setSelectedVideoQuality] = useState<string>(defaultVideoQuality);
  const [selectedAudioQuality, setSelectedAudioQuality] = useState<string>('320k');

  const currentQuality = selectedFormat === 'mp4' ? selectedVideoQuality : selectedAudioQuality;

  const currentOption =
    selectedFormat === 'mp4'
      ? metadata.availableResolutions.find((r) => r.id === selectedVideoQuality)
      : metadata.availableAudioQualities.find((a) => a.id === selectedAudioQuality);

  const estimatedBytes = currentOption?.filesizeEstimateBytes;

  const handleStartProcess = async () => {
    await onSubmit(selectedFormat, currentQuality);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 1. Cinematic Media Overview Showcase */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-5 items-start">
          {/* Thumbnail Preview Container */}
          <div className="relative w-full md:w-72 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0 shadow-lg group">
            {!thumbnailError && metadata.thumbnailUrl ? (
              <Image
                src={metadata.thumbnailUrl}
                alt={metadata.title}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 300px"
                onError={() => setThumbnailError(true)}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <Video className="w-10 h-10 text-indigo-400" />
                <span className="text-xs">Preview Asset</span>
              </div>
            )}

            {/* Duration pill */}
            <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-lg bg-black/85 backdrop-blur-md text-[11px] font-mono font-bold text-white tracking-wider shadow-sm">
              {metadata.durationFormatted}
            </div>

            {/* Format overlay badge */}
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur-md text-[10px] font-mono font-bold text-white uppercase tracking-wider">
              {metadata.isLiveStream ? 'Live' : 'Verified'}
            </div>
          </div>

          {/* Media Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                {metadata.title}
              </h2>

              {metadata.url && (
                <a
                  href={metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                  title="Open source video on YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Author & Telemetry Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                {metadata.channel}
              </span>

              {metadata.viewCount !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  {formatViews(metadata.viewCount)}
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Duration: {metadata.durationFormatted}
              </span>
            </div>

            {/* Snippet / Description */}
            {metadata.description && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {metadata.description}
              </p>
            )}

            {/* Direct stream copy guarantee */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Native Stream Copy Muxing • 0% Quality Loss Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Format Segmented Controller (MP4 vs MP3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* MP4 Option Card */}
        <button
          type="button"
          onClick={() => setSelectedFormat('mp4')}
          className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
            selectedFormat === 'mp4'
              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-md shadow-indigo-600/10'
              : 'border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#0c101a] hover:border-slate-300 dark:hover:border-white/10'
          }`}
        >
          <div
            className={`p-3 rounded-xl transition-colors ${
              selectedFormat === 'mp4'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Video className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                MP4 Video
              </span>
              {selectedFormat === 'mp4' && (
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Direct Stream Copy (0 Compression) • Up to 4K / 1080p 60fps
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              AVC / H.264 • Premiere Pro Ready
            </span>
          </div>
        </button>

        {/* MP3 Option Card */}
        <button
          type="button"
          onClick={() => setSelectedFormat('mp3')}
          className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
            selectedFormat === 'mp3'
              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-md shadow-indigo-600/10'
              : 'border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#0c101a] hover:border-slate-300 dark:hover:border-white/10'
          }`}
        >
          <div
            className={`p-3 rounded-xl transition-colors ${
              selectedFormat === 'mp3'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Music className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                MP3 Audio
              </span>
              {selectedFormat === 'mp3' && (
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Universal High-Bitrate Audio Track • LAME MP3 Transcoding
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              Up to 320 kbps CBR Audiophile Tier
            </span>
          </div>
        </button>
      </div>

      {/* 3. Quality Selection Section */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedFormat === 'mp4'
                ? 'Select Target Video Resolution'
                : 'Select Audio Bitrate Quality'}
            </h3>
          </div>

          {estimatedBytes && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
              <span>Est. Output: ~{formatBytes(estimatedBytes)}</span>
            </div>
          )}
        </div>

        {selectedFormat === 'mp4' ? (
          /* Video Quality Options Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metadata.availableResolutions.map((opt) => {
              const isSelected = selectedVideoQuality === opt.id;
              const isHighDef = opt.resolution === '1080p' || opt.resolution === '1440p' || opt.resolution === '2160p';

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedVideoQuality(opt.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-sm shadow-indigo-600/20'
                      : 'border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {opt.label}
                      </span>
                      {isHighDef && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          HD
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-[11px]">
                      {opt.fps ? `${opt.fps}fps • ` : ''}
                      {opt.vcodec ? opt.vcodec.split('.')[0] : 'H.264'}
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {opt.filesizeEstimateBytes
                        ? `~${formatBytes(opt.filesizeEstimateBytes)}`
                        : 'Dynamic'}
                    </span>
                  </div>

                  {opt.resolution === '1080p' && (
                    <div className="mt-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Recommended for Editing (Premiere / FCP)</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Audio Quality Options Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metadata.availableAudioQualities.map((audio) => {
              const isSelected = selectedAudioQuality === audio.id;
              const isStudio = audio.bitrateKbps === 320;

              return (
                <button
                  key={audio.id}
                  type="button"
                  onClick={() => setSelectedAudioQuality(audio.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-sm'
                      : 'border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {audio.label}
                      </span>
                      {isStudio && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                          Studio Tier
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>

                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {audio.description}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-mono">
                    <span>LAME CBR Engine</span>
                    <span className="font-semibold">
                      {audio.filesizeEstimateBytes
                        ? `~${formatBytes(audio.filesizeEstimateBytes)}`
                        : 'Dynamic'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Technical Architecture Explainer Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
          <Layers className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">
              {selectedFormat === 'mp4'
                ? 'Zero-Compression Direct Stream Copy'
                : 'FFmpeg Libmp3lame Audio Pipeline'}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {selectedFormat === 'mp4'
                ? 'Original video and audio streams are extracted directly from source without re-encoding. Video frames and timestamps are muxed into an MP4 container at native bitrates, guaranteeing 100% preservation of color grading and sharp details.'
                : 'Audio is extracted directly from the highest-bitrate source manifest and mastered using FFmpeg libmp3lame constant bitrate (CBR) encoding with faststart MP3 header headers for seamless playback.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Action Bar (Back + Start Processing) */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-xs sm:text-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Link</span>
        </button>

        <button
          type="button"
          onClick={handleStartProcess}
          disabled={isLoading}
          className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/25 transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
        >
          <span>Start Download Preparation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
