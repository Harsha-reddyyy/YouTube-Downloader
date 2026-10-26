import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import {
  MediaMetadata,
  QualityOption,
  AudioQualityOption,
  MediaFormat,
  JobProgress,
  VideoResolution,
  AudioBitrate,
} from '@/lib/types';
import { getServerConfig } from './config';
import { formatDuration, formatBytes } from '@/lib/utils';
import { sanitizeFilename } from '@/lib/security';
import { storageService, StoredFileRecord } from './storage-service';

export interface YtDlpRawFormat {
  format_id: string;
  format_note?: string;
  ext?: string;
  resolution?: string;
  width?: number;
  height?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  vbr?: number;
  abr?: number;
}

export interface YtDlpDumpJson {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  uploader?: string;
  channel?: string;
  channel_url?: string;
  thumbnail?: string;
  thumbnails?: Array<{ url: string; width?: number; height?: number }>;
  view_count?: number;
  upload_date?: string;
  is_live?: boolean;
  formats?: YtDlpRawFormat[];
  ext?: string;
}

export class MediaService {
  /**
   * Inspects a video and returns normalized metadata and available quality options.
   */
  public async inspectMedia(url: string): Promise<MediaMetadata> {
    const config = getServerConfig();

    // In serverless environments (e.g. Vercel) where yt-dlp binary is unavailable,
    // gracefully fall back to YouTube's public oEmbed API rather than crashing with 500.
    if (!config.ytdlpCommand.isAvailable) {
      return this.inspectMediaFallback(url);
    }

    const args = [
      ...config.ytdlpCommand.argsPrefix,
      '--dump-json',
      '--simulate',
      '--no-playlist',
      '--no-warnings',
      '--remote-components',
      'ejs:github',
      '--js-runtimes',
      'node',
      '--extractor-args',
      'youtube:player_client=tv_samsung,web_embedded',
    ];

    if (config.cookiesPath) {
      args.push('--cookies', config.cookiesPath);
    }

    args.push(url);

    let rawJson: string;
    try {
      rawJson = await this.executeProcess(
        config.ytdlpCommand.command,
        args,
        30000 // 30s timeout for metadata inspection
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('ENOENT') || errMsg.includes('not found') || errMsg.includes('spawn')) {
        return this.inspectMediaFallback(url);
      }
      if (errMsg.toLowerCase().includes('sign in') || errMsg.toLowerCase().includes('bot')) {
        throw new Error(
          'YouTube is requesting bot verification for this video. You can place your exported YouTube cookies in a "cookies.txt" file in the project folder to authenticate, or try another video.'
        );
      }
      throw err;
    }

    let parsed: YtDlpDumpJson;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error('Failed to parse media metadata response from extractor.');
    }

    if (parsed.is_live) {
      throw new Error(
        'Live streams cannot be processed. Please provide an authorized video on-demand URL.'
      );
    }

    const durationSeconds = parsed.duration || 0;
    if (durationSeconds > config.maxVideoDurationSeconds) {
      throw new Error(
        `Media duration (${formatDuration(durationSeconds)}) exceeds maximum allowed limit of ${formatDuration(config.maxVideoDurationSeconds)}.`
      );
    }

    // Determine highest resolution thumbnail
    let thumbnailUrl = parsed.thumbnail || '';
    if (parsed.thumbnails && parsed.thumbnails.length > 0) {
      const sortedThumbs = [...parsed.thumbnails].sort(
        (a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0)
      );
      if (sortedThumbs[0]?.url) {
        thumbnailUrl = sortedThumbs[0].url;
      }
    }

    const availableResolutions = this.resolveVideoQualities(
      parsed.formats || [],
      durationSeconds
    );
    const availableAudioQualities = this.resolveAudioQualities(durationSeconds);

    return {
      id: parsed.id,
      url,
      title: parsed.title || 'Untitled Media',
      description: parsed.description ? parsed.description.slice(0, 300) : '',
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      channel: parsed.uploader || parsed.channel || 'Unknown Creator',
      channelUrl: parsed.channel_url,
      thumbnailUrl,
      viewCount: parsed.view_count,
      uploadDate: parsed.upload_date,
      availableResolutions,
      availableAudioQualities,
      isLiveStream: false,
      originalExt: parsed.ext || 'mp4',
    };
  }

  /**
   * Evaluates available video resolutions against source streams
   */
  private resolveVideoQualities(
    formats: YtDlpRawFormat[],
    durationSeconds: number
  ): QualityOption[] {
    const standardResolutions: Array<{
      res: VideoResolution;
      targetHeight: number;
      label: string;
      desc: string;
    }> = [
      { res: '2160p', targetHeight: 2160, label: '4K Ultra HD', desc: '3840x2160' },
      { res: '1440p', targetHeight: 1440, label: '2K Quad HD', desc: '2560x1440' },
      { res: '1080p', targetHeight: 1080, label: '1080p Full HD', desc: '1920x1080' },
      { res: '720p', targetHeight: 720, label: '720p HD', desc: '1280x720' },
      { res: '480p', targetHeight: 480, label: '480p Standard', desc: '854x480' },
      { res: '360p', targetHeight: 360, label: '360p Compact', desc: '640x360' },
    ];

    // Find all valid video formats with height
    const videoFormats = formats.filter(
      (f) => (f.height && f.height > 0) || (f.vcodec && f.vcodec !== 'none')
    );

    const maxHeightAvailable = videoFormats.reduce(
      (max, f) => Math.max(max, f.height || 0),
      0
    );

    return standardResolutions
      .filter((spec) => {
        // Only include 4K/2K if source actually has it
        if (spec.targetHeight > 1080 && maxHeightAvailable < spec.targetHeight) {
          return false;
        }
        return true;
      })
      .map((spec) => {
        const isAvailable = maxHeightAvailable >= spec.targetHeight || maxHeightAvailable >= spec.targetHeight - 20;

        // Find best matching format matching the exact download preference order:
        // Prioritize target resolution, H.264 (avc1), highest fps and bitrate
        const candidateFormats = videoFormats.filter(
          (f) => f.height && Math.abs(f.height - spec.targetHeight) <= 40
        );
        const match = candidateFormats.sort((a, b) => {
          const aH264 = a.vcodec?.toLowerCase().startsWith('avc') ? 1 : 0;
          const bH264 = b.vcodec?.toLowerCase().startsWith('avc') ? 1 : 0;
          if (aH264 !== bH264) return bH264 - aH264;
          const aFps = a.fps || 30;
          const bFps = b.fps || 30;
          if (aFps !== bFps) return bFps - aFps;
          return (b.tbr || b.filesize || 0) - (a.tbr || a.filesize || 0);
        })[0] || candidateFormats[0];

        let filesizeEstimateBytes: number | undefined;
        if (match?.filesize) {
          filesizeEstimateBytes = match.filesize;
        } else if (match?.filesize_approx) {
          filesizeEstimateBytes = match.filesize_approx;
        } else if (match?.tbr && durationSeconds > 0) {
          filesizeEstimateBytes = Math.round((match.tbr * 1000 * durationSeconds) / 8);
        } else if (durationSeconds > 0) {
          // Fallback heuristic estimation based on standard bitrate per resolution
          const avgBitrateKbps: Record<string, number> = {
            '2160p': 18000,
            '1440p': 9000,
            '1080p': 4500,
            '720p': 2500,
            '480p': 1200,
            '360p': 750,
          };
          const br = avgBitrateKbps[spec.res] || 2000;
          filesizeEstimateBytes = Math.round((br * 1000 * durationSeconds) / 8);
        }

        // Add audio stream estimate (~128kbps) if video format is video-only (DASH)
        if (filesizeEstimateBytes && durationSeconds > 0 && (!match?.acodec || match.acodec === 'none')) {
          filesizeEstimateBytes += Math.round((128 * 1000 * durationSeconds) / 8);
        }

        return {
          id: spec.res,
          label: spec.label,
          resolution: spec.res,
          height: spec.targetHeight,
          fps: match?.fps || 30,
          vcodec: 'H.264',
          acodec: 'AAC',
          filesizeEstimateBytes,
          isAvailable,
          requiresTranscode: !isAvailable,
        };
      });
  }

  /**
   * Generates standard MP3 audio quality options
   */
  private resolveAudioQualities(durationSeconds: number): AudioQualityOption[] {
    const qualities: Array<{
      id: AudioBitrate;
      label: string;
      bitrateKbps: number;
      description: string;
    }> = [
      {
        id: '320k',
        label: '320 kbps — Studio High Quality',
        bitrateKbps: 320,
        description: 'Maximum fidelity, crystal clear audio representation',
      },
      {
        id: '256k',
        label: '256 kbps — Premium Audio',
        bitrateKbps: 256,
        description: 'Excellent balance between studio sound and storage',
      },
      {
        id: '192k',
        label: '192 kbps — Standard Quality',
        bitrateKbps: 192,
        description: 'Industry standard for everyday music & podcasts',
      },
      {
        id: '128k',
        label: '128 kbps — Compact / Speech',
        bitrateKbps: 128,
        description: 'Lightweight format, optimized for speech and low bandwidth',
      },
    ];

    return qualities.map((q) => {
      const filesizeEstimateBytes =
        durationSeconds > 0
          ? Math.round((q.bitrateKbps * 1000 * durationSeconds) / 8)
          : undefined;

      return {
        ...q,
        filesizeEstimateBytes,
      };
    });
  }

  /**
   * Pure HTTP fallback using YouTube's oEmbed endpoint when yt-dlp binary is unavailable (e.g. Vercel serverless).
   */
  private async inspectMediaFallback(url: string): Promise<MediaMetadata> {
    const videoIdMatch = url.match(/(?:watch\?(?:.*&)?v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : 'video';

    let title = 'YouTube Video';
    let author = 'YouTube Creator';
    let authorUrl = 'https://www.youtube.com';
    let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.author_url) authorUrl = data.author_url;
        if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
      }
    } catch {
      // ignore network issue on oembed, proceed with defaults
    }

    const availableResolutions: QualityOption[] = [
      {
        id: '1080p',
        label: '1080p Full HD (60fps)',
        resolution: '1080p',
        height: 1080,
        fps: 60,
        vcodec: 'H.264',
        acodec: 'AAC',
        isAvailable: true,
        requiresTranscode: false,
      },
      {
        id: '720p',
        label: '720p HD (60fps)',
        resolution: '720p',
        height: 720,
        fps: 60,
        vcodec: 'H.264',
        acodec: 'AAC',
        isAvailable: true,
        requiresTranscode: false,
      },
      {
        id: '480p',
        label: '480p Standard Definition',
        resolution: '480p',
        height: 480,
        fps: 30,
        vcodec: 'H.264',
        acodec: 'AAC',
        isAvailable: true,
        requiresTranscode: false,
      },
      {
        id: '360p',
        label: '360p Medium Quality',
        resolution: '360p',
        height: 360,
        fps: 30,
        vcodec: 'H.264',
        acodec: 'AAC',
        isAvailable: true,
        requiresTranscode: false,
      },
    ];

    const availableAudioQualities: AudioQualityOption[] = [
      {
        id: '320k',
        label: '320 kbps — Studio High Quality',
        bitrateKbps: 320,
        description: 'Maximum fidelity, crystal clear audio representation',
      },
      {
        id: '256k',
        label: '256 kbps — Premium Audio',
        bitrateKbps: 256,
        description: 'High definition audio streaming equivalent',
      },
      {
        id: '192k',
        label: '192 kbps — High Quality (Recommended)',
        bitrateKbps: 192,
        description: 'Industry standard for music listening and archiving',
      },
      {
        id: '128k',
        label: '128 kbps — Standard Quality',
        bitrateKbps: 128,
        description: 'Compact file size, suitable for spoken word and podcasts',
      },
    ];

    return {
      id: videoId,
      url,
      title,
      description: `Uploaded by ${author}`,
      durationSeconds: 0,
      durationFormatted: 'Online Stream',
      channel: author,
      channelUrl: authorUrl,
      thumbnailUrl,
      availableResolutions,
      availableAudioQualities,
      isLiveStream: false,
      originalExt: 'mp4',
    };
  }

  /**
   * Executes a full media download and conversion pipeline with real-time progress.
   */
  public async processMedia(params: {
    jobId: string;
    url: string;
    mediaTitle: string;
    format: MediaFormat;
    quality: string;
    onProgress: (progress: JobProgress) => void;
    abortSignal?: AbortSignal;
  }): Promise<StoredFileRecord> {
    const { jobId, url, mediaTitle, format, quality, onProgress, abortSignal } =
      params;
    const config = getServerConfig();

    if (!config.ytdlpCommand.isAvailable) {
      throw new Error(
        'Serverless Environment Detected: Vercel serverless functions do not include the yt-dlp or FFmpeg binaries required for video processing. Please deploy this app to a persistent container host like Railway or Render, or run locally using "npm run dev".'
      );
    }

    onProgress({
      phase: 'fetching_info',
      percent: 5,
      message: 'Initializing stream extraction and resolving audio/video endpoints...',
    });

    const tempOutputDir = path.join(config.storageTempDir, jobId);
    if (!fs.existsSync(tempOutputDir)) {
      fs.mkdirSync(tempOutputDir, { recursive: true });
    }

    const outputPattern = path.join(tempOutputDir, 'output.%(ext)s');

    // Build secure command arguments array (shell: false prevents any command injection)
    const args: string[] = [
      ...config.ytdlpCommand.argsPrefix,
      '--no-playlist',
      '--no-warnings',
      '--newline',
      '--ffmpeg-location',
      config.ffmpegPath,
      '--remote-components',
      'ejs:github',
      '--js-runtimes',
      'node',
      '--extractor-args',
      'youtube:player_client=tv_samsung,web_embedded',
      '--progress-template',
      'PROGRESS:%(progress.status)s|%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._total_bytes_estimate_str)s',
      '-o',
      outputPattern,
    ];

    if (config.cookiesPath) {
      args.push('--cookies', config.cookiesPath);
    }

    if (format === 'mp3') {
      // Audio extraction mode
      const bitrateNum = parseInt(quality.replace('k', ''), 10) || 192;
      args.push(
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        `${bitrateNum}k`
      );
    } else {
      // Video MP4 mode: Download native target resolution stream (exact 1:1 file size, 0 compression)
      // Sorting by res:targetHeight guarantees full target resolution (e.g. 1080p, not 360p),
      // and prefers native H.264 (avc1) for instant Premiere Pro compatibility.
      const targetHeight = parseInt(quality.replace('p', ''), 10) || 1080;
      args.push(
        '-f',
        `bestvideo[height<=${targetHeight}]+bestaudio/best[height<=${targetHeight}]/best`,
        '-S',
        `res:${targetHeight},fps,vcodec:h264,acodec:m4a`,
        '--merge-output-format',
        'mp4',
        '--postprocessor-args',
        'Merger+ffmpeg:-movflags +faststart'
      );
    }

    args.push(url);

    let child: ChildProcess | null = null;

    try {
      await new Promise<void>((resolve, reject) => {
        if (abortSignal?.aborted) {
          return reject(new Error('Job was cancelled by the user.'));
        }

        child = spawn(config.ytdlpCommand.command, args, {
          shell: false,
          env: {
            ...process.env,
            PATH: `${path.dirname(config.ffmpegPath)}:${process.env.PATH || ''}`,
          },
        });

        const onAbort = () => {
          if (child && !child.killed) {
            try {
              child.kill('SIGTERM');
              setTimeout(() => {
                if (child && !child.killed) child.kill('SIGKILL');
              }, 2000);
            } catch {
              // ignore
            }
          }
          reject(new Error('Job was cancelled by the user.'));
        };

        if (abortSignal) {
          abortSignal.addEventListener('abort', onAbort, { once: true });
        }

        let stderrBuffer = '';

        child.stdout?.on('data', (data: Buffer) => {
          const lines = data.toString('utf-8').split(/\r?\n/);
          for (const line of lines) {
            if (!line.trim()) continue;

            if (line.startsWith('PROGRESS:')) {
              // Format: PROGRESS:downloading| 45.2%| 3.45MiB/s|00:12| 52.30MiB
              const payload = line.substring(9);
              const parts = payload.split('|');
              const statusStr = parts[0]?.trim();
              const percentStr = parts[1]?.trim().replace('%', '');
              const speedStr = parts[2]?.trim();
              const etaStr = parts[3]?.trim();

              const percent = parseFloat(percentStr) || 10;

              onProgress({
                phase: 'downloading',
                percent: Math.min(92, Math.max(10, Math.round(percent * 0.85))),
                downloadSpeed: speedStr !== 'NA' ? speedStr : undefined,
                eta: etaStr !== 'NA' ? etaStr : undefined,
                message: `Downloading media stream (${Math.round(percent)}%)...`,
              });
            } else if (
              line.includes('[ExtractAudio]') ||
              line.includes('[Merger]') ||
              line.includes('Destination:') ||
              line.includes('[Fixup')
            ) {
              onProgress({
                phase: 'transcoding',
                percent: 94,
                message:
                  format === 'mp3'
                    ? 'Transcoding audio to high-bitrate MP3 with FFmpeg...'
                    : 'Muxing video & audio streams with FFmpeg...',
              });
            }
          }
        });

        child.stderr?.on('data', (data: Buffer) => {
          stderrBuffer += data.toString('utf-8');
          // Keep stderr buffer bounded
          if (stderrBuffer.length > 8000) {
            stderrBuffer = stderrBuffer.slice(-8000);
          }
        });

        child.on('error', (err) => {
          reject(new Error(`Failed to spawn media processing process: ${err.message}`));
        });

        child.on('close', (code) => {
          if (abortSignal) {
            abortSignal.removeEventListener('abort', onAbort);
          }

          if (code === 0) {
            resolve();
          } else {
            const errSnippet = stderrBuffer
              .split('\n')
              .filter((l) => l.trim().length > 0 && !l.includes('WARNING'))
              .slice(-3)
              .join(' ');
            if (errSnippet.toLowerCase().includes('sign in') || errSnippet.toLowerCase().includes('bot')) {
              reject(
                new Error(
                  'YouTube is requesting bot verification for this video. You can place your exported YouTube cookies in a "cookies.txt" file in the project folder to authenticate, or try another video.'
                )
              );
            } else {
              reject(
                new Error(
                  errSnippet || `Media processor exited with code ${code}. Check source stream availability.`
                )
              );
            }
          }
        });
      });

      onProgress({
        phase: 'finalizing',
        percent: 98,
        message: 'Finalizing file packaging and securing download asset...',
      });

      // Find the generated file in tempOutputDir
      const files = fs.readdirSync(tempOutputDir);
      const targetExt = format === 'mp3' ? '.mp3' : '.mp4';
      const outputFilename = files.find(
        (f) =>
          f.endsWith(targetExt) ||
          f.endsWith('.m4a') ||
          f.endsWith('.webm') ||
          f.endsWith('.mkv')
      );

      if (!outputFilename) {
        throw new Error(
          'Output media file was not generated by the processing pipeline.'
        );
      }

      const generatedFilePath = path.join(tempOutputDir, outputFilename);
      const ext = path.extname(outputFilename).replace('.', '') || format;
      const cleanFileName = sanitizeFilename(mediaTitle, quality, ext);
      const finalDestPath = path.join(config.storageDir, `${jobId}_${cleanFileName}`);

      // Move completed file directly to storageDir (1:1 exact native stream copy, zero compression)
      fs.renameSync(generatedFilePath, finalDestPath);

      // Clean up temp job directory
      try {
        fs.rmSync(tempOutputDir, { recursive: true, force: true });
      } catch {
        // ignore temp dir cleanup error
      }

      const mimeType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';

      // Register file with storage service
      const record = storageService.registerFile({
        jobId,
        filePath: finalDestPath,
        fileName: cleanFileName,
        mimeType,
      });

      onProgress({
        phase: 'finalizing',
        percent: 99,
        message: 'Packaging complete. Generating secure download token...',
      });

      return record;
    } catch (err: unknown) {
      // Clean up temp directory on error
      try {
        if (fs.existsSync(tempOutputDir)) {
          fs.rmSync(tempOutputDir, { recursive: true, force: true });
        }
      } catch {
        // ignore
      }
      throw err;
    }
  }

  /**
   * Helper to execute a standalone process and return stdout as string
   */
  private executeProcess(
    command: string,
    args: string[],
    timeoutMs = 30000
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(command, args, { shell: false });

      const timer = setTimeout(() => {
        try {
          child.kill('SIGTERM');
        } catch {
          // ignore
        }
        reject(new Error(`Command timed out after ${timeoutMs / 1000}s.`));
      }, timeoutMs);

      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf-8');
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf-8');
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve(stdout);
        } else {
          const errSnippet = stderr
            .split('\n')
            .filter((l) => l.trim().length > 0 && !l.includes('WARNING'))
            .slice(-3)
            .join(' ');
          reject(
            new Error(
              errSnippet || `Process exited with code ${code}.`
            )
          );
        }
      });
    });
  }
}

export const mediaService = new MediaService();
