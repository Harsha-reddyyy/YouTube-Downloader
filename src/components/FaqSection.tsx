'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'Does MediaFlow re-encode MP4 video or cause visual degradation?',
      answer:
        'No. Unlike conventional online converters that re-render video using lossy CRF encoding, MediaFlow uses FFmpeg Direct Stream Copy (-c:v copy -c:a copy). The raw video frames and audio packets are copied directly bit-for-bit from source manifests into a standard MP4 container. There is zero compression artifacting, zero generation loss, and processing takes seconds rather than minutes.',
    },
    {
      question: 'Why do MediaFlow MP4 files import seamlessly into Premiere Pro & DaVinci Resolve?',
      answer:
        'YouTube often delivers modern 1080p and 4K streams in VP9 or AV1 codecs, which frequently trigger black screens, missing audio, or crash professional NLEs like Adobe Premiere Pro, Final Cut Pro, and DaVinci Resolve. MediaFlow prioritizes native H.264 / AVC streams and audio AAC/MP3 containers, ensuring effortless drag-and-drop timeline editing without transcoding headaches.',
    },
    {
      question: 'Can I download vertical YouTube Shorts?',
      answer:
        'Yes! MediaFlow fully parses and supports vertical 9:16 YouTube Shorts URLs (e.g. youtube.com/shorts/...). Video streams are preserved in their native vertical 1080x1920 format with matched stereo audio.',
    },
    {
      question: 'How does the 30-minute ephemeral auto-purge work?',
      answer:
        'MediaFlow is engineered with strict privacy principles. Once an asset is downloaded or transcoded, a cryptographic time-to-live (TTL) counter is initiated. After 30 minutes, our automated background reaper shreds and permanently deletes temporary intermediate files and download tokens. No persistent user libraries, IP logs, or watch histories are stored.',
    },
    {
      question: 'What is the quality of MP3 audio downloads?',
      answer:
        'MediaFlow extracts the highest-bitrate source audio stream available (typically 128k to 256k Opus/AAC) and transcodes it with FFmpeg libmp3lame into constant bitrate (CBR) MP3 up to 320 kbps. We inject faststart metadata tags so your files display correct durations and play instantaneously on all devices.',
    },
    {
      question: 'What are the copyright and usage guidelines?',
      answer:
        'MediaFlow is strictly designed for creators, educators, journalists, and archivists downloading authorized media—such as Creative Commons licensed videos, public domain archives, or self-owned content. It does not circumvent digital rights management (DRM) or download paywalled streams.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="mt-16 pt-12 border-t border-slate-200/80 dark:border-white/5">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Common Questions & Answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={faq.question}
                className="glass-card rounded-2xl overflow-hidden transition-all duration-200 border border-slate-200/80 dark:border-white/5"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <span className="pr-4">{faq.question}</span>
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
