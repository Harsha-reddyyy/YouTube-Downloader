'use client';

import { ShieldCheck, X, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { useEffect } from 'react';

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegalDisclaimerModal({
  isOpen,
  onClose,
}: LegalDisclaimerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 id="legal-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              Terms of Use & Authorized Access
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Responsible media processing and ethics policy
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-b border-slate-100 dark:border-white/5 py-4">
          <p>
            MediaFlow is designed for content creators, video editors, educators, archivists, and researchers to process and extract media assets for which they have explicit authorization, ownership, or fair use rights.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Authorized Content:</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Public domain media, Creative Commons licensed video/audio, and user-owned recordings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40">
              <Lock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Privacy & 30-Minute Auto-Purge:</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Downloaded assets and intermediate files are automatically deleted after 30 minutes. No persistent logs, IP addresses, or user libraries are retained.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">No DRM Circumvention:</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This service does not bypass Widevine, FairPlay, PlayReady, or paywalled streaming protections.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            By utilizing this tool, you certify that your processing request respects copyright law, source platform terms of service, and applicable local regulations.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-sm active:scale-95"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
