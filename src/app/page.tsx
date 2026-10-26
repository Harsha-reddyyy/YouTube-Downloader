'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StepIndicator, { StepNumber } from '@/components/StepIndicator';
import UrlInputStep from '@/components/UrlInputStep';
import FormatQualityStep from '@/components/FormatQualityStep';
import ProcessingStep from '@/components/ProcessingStep';
import JobHistory from '@/components/JobHistory';
import TechSpecsSection from '@/components/TechSpecsSection';
import FaqSection from '@/components/FaqSection';
import LegalDisclaimerModal from '@/components/LegalDisclaimerModal';
import SystemStatusModal from '@/components/SystemStatusModal';
import {
  MediaMetadata,
  MediaFormat,
  JobState,
  InspectResponse,
  JobCreateResponse,
  JobStatusResponse,
} from '@/lib/types';
import { Sparkles, Shield, Zap, CheckCircle2, AlertTriangle, Layers, Film } from 'lucide-react';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [activeJob, setActiveJob] = useState<JobState | null>(null);

  const [isInspecting, setIsInspecting] = useState(false);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const [history, setHistory] = useState<JobState[]>([]);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [serverStatus, setServerStatus] = useState<{
    isServerless?: boolean;
    hasYtDlp?: boolean;
    hasFfmpeg?: boolean;
  }>({});

  // SSE event source ref
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check server environment on mount
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasYtDlp === 'boolean') {
          setServerStatus({
            isServerless: data.isServerless,
            hasYtDlp: data.hasYtDlp,
            hasFfmpeg: data.hasFfmpeg,
          });
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Load history from session storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('media_job_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save history to session storage on change
  const saveToHistory = (job: JobState) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== job.id);
      const updated = [job, ...filtered].slice(0, 8); // keep last 8
      try {
        sessionStorage.setItem('media_job_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Clean up event source and polling on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  // STEP 1: Inspect URL
  const handleInspectUrl = async (url: string) => {
    setIsInspecting(true);
    setErrorMessage(undefined);

    try {
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data: InspectResponse = await res.json();

      if (!res.ok || !data.success || !data.metadata) {
        throw new Error(data.error || 'Failed to inspect media URL.');
      }

      setMetadata(data.metadata);
      if (data.isServerless) {
        setServerStatus((prev) => ({ ...prev, isServerless: true, hasYtDlp: false }));
      }
      setCurrentStep(2);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not retrieve media details. Please check the URL and try again.'
      );
    } finally {
      setIsInspecting(false);
    }
  };

  // STEP 2: Enqueue Job & Navigate to Step 3
  const handleStartJob = async (format: MediaFormat, quality: string) => {
    if (!metadata) return;

    setIsStartingJob(true);
    setErrorMessage(undefined);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: metadata.url,
          format,
          quality,
        }),
      });

      const data: JobCreateResponse = await res.json();

      if (!res.ok || !data.success || !data.jobId) {
        throw new Error(data.error || 'Failed to queue media download.');
      }

      // Initial placeholder state while waiting for SSE stream
      const initialJob: JobState = {
        id: data.jobId,
        url: metadata.url,
        mediaTitle: metadata.title,
        thumbnailUrl: metadata.thumbnailUrl,
        format,
        quality,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'queued',
        progress: {
          phase: 'queued',
          percent: 5,
          message: 'Connecting to processing worker...',
        },
      };

      setActiveJob(initialJob);
      setCurrentStep(3);

      // Connect to real-time updates
      connectToJobUpdates(data.jobId);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to start processing job.'
      );
    } finally {
      setIsStartingJob(false);
    }
  };

  // Real-time updates via Server-Sent Events with fallback polling
  const connectToJobUpdates = (jobId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    try {
      const es = new EventSource(`/api/jobs/${jobId}/stream`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const updatedJob: JobState = JSON.parse(event.data);
          setActiveJob(updatedJob);

          if (
            (updatedJob.status === 'ready' && updatedJob.downloadUrl) ||
            updatedJob.status === 'failed' ||
            updatedJob.status === 'cancelled'
          ) {
            es.close();
            saveToHistory(updatedJob);
          } else if (updatedJob.status === 'ready' && !updatedJob.downloadUrl) {
            // Self-heal: fetch directly from API to ensure complete credentials
            fetch(`/api/jobs/${jobId}`)
              .then((r) => r.json())
              .then((data: JobStatusResponse) => {
                if (data.success && data.job?.downloadUrl) {
                  setActiveJob(data.job);
                  saveToHistory(data.job);
                  es.close();
                }
              })
              .catch(() => {});
          }
        } catch {
          // parse error or ping
        }
      };

      es.onerror = () => {
        es.close();
        // Fallback to polling every 1.5s
        startPolling(jobId);
      };
    } catch {
      startPolling(jobId);
    }
  };

  const startPolling = (jobId: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data: JobStatusResponse = await res.json();

        if (data.success && data.job) {
          setActiveJob(data.job);
          if (
            (data.job.status === 'ready' && data.job.downloadUrl) ||
            data.job.status === 'failed' ||
            data.job.status === 'cancelled'
          ) {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            saveToHistory(data.job);
          }
        }
      } catch {
        // ignore polling error
      }
    }, 1500);
  };

  // Cancel Job
  const handleCancelJob = async () => {
    if (!activeJob) return;
    setIsCancelling(true);

    try {
      await fetch(`/api/jobs/${activeJob.id}`, { method: 'DELETE' });
      setActiveJob((prev) =>
        prev
          ? {
              ...prev,
              status: 'cancelled',
              progress: {
                phase: 'cancelled',
                percent: 0,
                message: 'Job was cancelled by the user.',
              },
            }
          : null
      );
    } catch {
      // ignore
    } finally {
      setIsCancelling(false);
    }
  };

  // Retry Job
  const handleRetryJob = async () => {
    if (!activeJob) return;
    await handleStartJob(activeJob.format, activeJob.quality);
  };

  // Reset to Step 1
  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }
    setCurrentStep(1);
    setMetadata(null);
    setActiveJob(null);
    setErrorMessage(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-500/20 selection:text-indigo-600">
      {/* Navigation Header */}
      <Header
        onOpenLegal={() => setIsLegalModalOpen(true)}
        onOpenStatus={() => setIsStatusModalOpen(true)}
        isEngineActive={serverStatus.hasFfmpeg !== false}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-10 sm:mb-12">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-wide">Direct Stream Copy Pipeline</span>
            <span className="w-1 h-1 rounded-full bg-indigo-400 dark:bg-indigo-600" />
            <span>Zero Re-encoding Loss</span>
          </div>

          {/* Confident Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-slate-900 dark:text-white leading-[1.1]">
            Studio-Grade Media Extraction.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500">
              Instant. Lossless.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Download authorized YouTube &amp; Shorts videos with bit-for-bit video preservation and high-bitrate MP3 audio. Native H.264 streams optimized for Premiere Pro &amp; DaVinci Resolve.
          </p>

          {/* Capability Badges Bar */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5">
              <Film className="w-3.5 h-3.5 text-indigo-500" />
              1080p / 4K MP4
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              320kbps MP3 LAME
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              Shorts 9:16 Vertical
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              30m Ephemeral Purge
            </span>
          </div>
        </div>

        {/* Serverless Environment Alert Banner (if deployed to Vercel without binaries) */}
        {serverStatus.hasYtDlp === false && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-800 dark:text-amber-300">
                Serverless Environment Detected
              </div>
              <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                Serverless functions operate with read-only filesystems without native <code className="px-1 py-0.5 rounded bg-amber-500/20 font-mono text-amber-700 dark:text-amber-300">yt-dlp</code> and <code className="px-1 py-0.5 rounded bg-amber-500/20 font-mono text-amber-700 dark:text-amber-300">FFmpeg</code> binaries. Video inspection works via our fallback engine. For lossless stream copy downloads, run locally or deploy using the included Dockerfile.
              </p>
            </div>
          </div>
        )}

        {/* 3-Step Breadcrumb Navigation */}
        <StepIndicator
          currentStep={currentStep}
          canNavigateToStep2={!!metadata && !isInspecting}
          onStepClick={(step) => {
            if (step === 1) setCurrentStep(1);
            if (step === 2 && metadata) setCurrentStep(2);
          }}
        />

        {/* Step Views */}
        <div className="relative">
          {currentStep === 1 && (
            <UrlInputStep
              onInspect={handleInspectUrl}
              isLoading={isInspecting}
              errorMessage={errorMessage}
              onClearError={() => setErrorMessage(undefined)}
            />
          )}

          {currentStep === 2 && metadata && (
            <FormatQualityStep
              metadata={metadata}
              onBack={() => setCurrentStep(1)}
              onSubmit={handleStartJob}
              isLoading={isStartingJob}
            />
          )}

          {currentStep === 3 && activeJob && (
            <ProcessingStep
              job={activeJob}
              onCancel={handleCancelJob}
              onRetry={handleRetryJob}
              onReset={handleReset}
              isCancelling={isCancelling}
            />
          )}
        </div>

        {/* Recent Session History */}
        <JobHistory
          history={history}
          onClearHistory={() => {
            setHistory([]);
            sessionStorage.removeItem('media_job_history');
          }}
          onSelectJob={(job) => {
            setActiveJob(job);
            setCurrentStep(3);
            if (job.status !== 'ready' && job.status !== 'failed' && job.status !== 'cancelled') {
              connectToJobUpdates(job.id);
            }
          }}
        />

        {/* Tech Specs & Architecture Section */}
        <TechSpecsSection />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenLegal={() => setIsLegalModalOpen(true)}
        onOpenStatus={() => setIsStatusModalOpen(true)}
      />

      {/* Terms and Legal Disclaimer Modal */}
      <LegalDisclaimerModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* System Status Diagnostic Modal */}
      <SystemStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        serverStatus={serverStatus}
      />
    </div>
  );
}
