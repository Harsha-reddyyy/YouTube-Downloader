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
  Calendar,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  HardDrive,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  MediaMetadata,
  MediaFormat,
  QualityOption,
  AudioQualityOption,
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

  // Default to highest available 1080p or best available resolution for MP4
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
      {/* 1. Media Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row gap-5 items-start">
          {/* Thumbnail preview */}
          <div className="relative w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 shadow-md">
            {metadata.thumbnailUrl ? (
              <img
                src={metadata.thumbnailUrl}
                alt={metadata.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <Video className="w-10 h-10" />
              </div>
            )}
            {/* Duration pill */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-semibold text-white tracking-wide">
              {metadata.durationFormatted}
            </div>
          </div>

          {/* Metadata details */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
              {metadata.title}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                {metadata.channel}
              </span>
              {metadata.viewCount !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {formatViews(metadata.viewCount)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Duration: {metadata.durationFormatted}
              </span>
            </div>

            {metadata.description && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {metadata.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Format Selection Tabs (MP4 vs MP3) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* MP4 Card */}
        <button
          type="button"
          onClick={() => setSelectedFormat('mp4')}
          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
            selectedFormat === 'mp4'
              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm shadow-indigo-500/10'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              selectedFormat === 'mp4'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Video className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                MP4 Video
              </span>
              {selectedFormat === 'mp4' && (
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exact Native Stream • Lossless Copy (0 Compression)
            </p>
          </div>
        </button>

        {/* MP3 Card */}
        <button
          type="button"
          onClick={() => setSelectedFormat('mp3')}
          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
            selectedFormat === 'mp3'
              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm shadow-indigo-500/10'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              selectedFormat === 'mp3'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Music className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                MP3 Audio
              </span>
              {selectedFormat === 'mp3' && (
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Audio-only track, high-bitrate conversion
            </p>
          </div>
        </button>
      </div>

      {/* 3. Quality Options Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            {selectedFormat === 'mp4'
              ? 'Select Available Video Resolution'
              : 'Select Audio Bitrate Quality'}
          </h3>
          {estimatedBytes && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
              Est. Size: ~{formatBytes(estimatedBytes)}
            </span>
          )}
        </div>

        {selectedFormat === 'mp4' ? (
          /* Video Quality Options */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metadata.availableResolutions.map((opt) => {
              const isSelected = selectedVideoQuality === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedVideoQuality(opt.id)}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {opt.fps ? `${opt.fps}fps • ` : ''}
                      {opt.vcodec || 'MP4'}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {opt.filesizeEstimateBytes
                        ? `~${formatBytes(opt.filesizeEstimateBytes)}`
                        : 'Dynamic'}
                    </span>
                  </div>

                  {opt.requiresTranscode && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Transcoding from higher stream</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Audio Quality Options */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metadata.availableAudioQualities.map((audio) => {
              const isSelected = selectedAudioQuality === audio.id;
              return (
                <button
                  key={audio.id}
                  type="button"
                  onClick={() => setSelectedAudioQuality(audio.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {audio.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {audio.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <span>MP3 CBR / LAME</span>
                    <span>
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

        {/* Processing pipeline disclaimer note */}
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span>
            {selectedFormat === 'mp4'
              ? 'Exact original video and audio streams are downloaded 1:1 directly from source and merged losslessly using direct stream copy (0 compression). Native H.264 (AVC) is prioritized for seamless editing in Premiere Pro without AV1 errors.'
              : 'Audio is extracted and converted using FFmpeg libmp3lame to ensure universal playback compatibility.'}
          </span>
        </div>
      </div>

      {/* 4. Action Buttons (Back + Process) */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Link</span>
        </button>

        <button
          type="button"
          onClick={handleStartProcess}
          disabled={isLoading}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 transition-all duration-200 disabled:opacity-50"
        >
          <span>Start Download Preparation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
