'use client';

import { Cpu, Zap, Shield, Sparkles, Layers, Sliders, CheckCircle2, Video } from 'lucide-react';

export default function TechSpecsSection() {
  const specs = [
    {
      icon: Video,
      title: '4K & 2K NLE Mastering (No VP09 Errors)',
      subtitle: 'Premiere Pro, DaVinci & Final Cut Ready',
      description:
        'YouTube only delivers 4K (2160p) and 2K (1440p) in VP9 or AV1 codecs, causing "unsupported compression type (vp09)" errors in Premiere Pro. MediaFlow automatically detects VP9/AV1 and masters them into visually lossless H.264 (CRF 17, YUV 4:2:0) with 320kbps AAC, guaranteeing 100% edit-ready compatibility across all NLEs without quality loss.',
      badge: 'Zero VP09 Error',
    },
    {
      icon: Zap,
      title: 'Direct Stream Copy for Native H.264',
      subtitle: '0% Re-encoding Compression',
      description:
        'When a video is already in native H.264 (e.g. standard 1080p, 720p), MediaFlow preserves bit-for-bit direct stream copy (-c:v copy). No compression is applied, and the original master frames are preserved 1:1 without alteration.',
      badge: 'Zero Loss',
    },
    {
      icon: Sliders,
      title: 'Studio LAME 320k Audio Pipeline',
      subtitle: 'Audiophile Constant Bitrate (CBR)',
      description:
        'Audio streams are demuxed and mastered using FFmpeg libmp3lame with faststart MP3 headers. Enjoy pristine stereo separation, 48kHz sampling, and universal compatibility across DAWs, cars, and mobile players.',
      badge: '320 kbps',
    },
    {
      icon: Shield,
      title: 'Ephemeral Storage & Zero Logs',
      subtitle: 'Automatic 30-Minute Cryptographic Purge',
      description:
        'Your privacy and data sovereignty are paramount. MediaFlow maintains zero persistent logs or tracking tokens. Every downloaded asset and intermediate FFmpeg buffer is automatically shredded and purged after 30 minutes.',
      badge: 'Private',
    },
  ];

  return (
    <section className="mt-20 pt-12 border-t border-slate-200/80 dark:border-white/5">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Under The Hood</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Engineered for Creators, Editors & Professionals
          </h2>

          <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Compare MediaFlow against standard cloud converters. Built with zero-compromise FFmpeg architecture.
          </p>
        </div>

        {/* 4 Feature Spec Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {specs.map((spec) => {
            const Icon = spec.icon;
            return (
              <div
                key={spec.title}
                className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 uppercase">
                      {spec.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {spec.title}
                  </h3>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {spec.subtitle}
                  </div>

                  <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {spec.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Standard on all conversions</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
