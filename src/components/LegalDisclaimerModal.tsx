'use client';

import { ShieldCheck, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegalDisclaimerModal({
  isOpen,
  onClose,
}: LegalDisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Terms of Use & Authorized Access
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Responsible media processing guidelines
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-b border-slate-100 dark:border-slate-800 py-3">
          <p>
            This application is designed for creators, educators, and users to convert and download media for which they have explicit authorization, ownership, or fair use rights.
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Authorized Content:</strong> Public domain media, Creative Commons licensed video/audio, and user-owned content.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Privacy & Automatic Cleanup:</strong> Intermediate processing files and completed downloads are automatically destroyed after 30 minutes. No persistent media logs or user credentials are saved.</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><strong>No DRM Circumvention:</strong> The service does not bypass Widevine, FairPlay, PlayReady, or paywalled streaming protections.</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            By utilizing this tool, you certify that your processing request respects copyright law, source platform terms of service, and applicable local regulations.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-sm"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
