import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

export interface ServerConfig {
  nodeEnv: string;
  port: number;
  appUrl: string;
  storageDir: string;
  storageTempDir: string;
  fileTtlMs: number;
  cleanupIntervalMs: number;
  maxConcurrentJobs: number;
  maxVideoDurationSeconds: number;
  maxFileSizeBytes: number;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
  tokenSecret: string;
  ffmpegPath: string;
  ffprobePath: string;
  cookiesPath: string | null;
  ytdlpCommand: {
    command: string;
    argsPrefix: string[];
  };
}

let cachedConfig: ServerConfig | null = null;

function resolveFfmpegPath(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  // Common macOS and Linux locations
  const candidates = [
    '/opt/homebrew/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Try which ffmpeg
  try {
    const whichOut = execSync('which ffmpeg', { encoding: 'utf-8' }).trim();
    if (whichOut && fs.existsSync(whichOut)) {
      return whichOut;
    }
  } catch {
    // ignore
  }

  return 'ffmpeg';
}

function resolveFfprobePath(ffmpegPath?: string): string {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }

  if (ffmpegPath && ffmpegPath !== 'ffmpeg') {
    const siblingFfprobe = path.join(path.dirname(ffmpegPath), 'ffprobe');
    if (fs.existsSync(siblingFfprobe)) {
      return siblingFfprobe;
    }
  }

  // Common macOS and Linux locations
  const candidates = [
    '/opt/homebrew/bin/ffprobe',
    '/usr/local/bin/ffprobe',
    '/usr/bin/ffprobe',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Try which ffprobe
  try {
    const whichOut = execSync('which ffprobe', { encoding: 'utf-8' }).trim();
    if (whichOut && fs.existsSync(whichOut)) {
      return whichOut;
    }
  } catch {
    // ignore
  }

  return 'ffprobe';
}

function resolveYtDlpCommand(): { command: string; argsPrefix: string[] } {
  if (process.env.YTDLP_PATH && fs.existsSync(process.env.YTDLP_PATH)) {
    return { command: process.env.YTDLP_PATH, argsPrefix: [] };
  }

  // Check if yt-dlp binary is directly in PATH
  try {
    const whichOut = execSync('which yt-dlp', { encoding: 'utf-8' }).trim();
    if (whichOut && fs.existsSync(whichOut)) {
      return { command: whichOut, argsPrefix: [] };
    }
  } catch {
    // not in path
  }

  // Check python3 -m yt_dlp
  try {
    const pythonOut = execSync('which python3', { encoding: 'utf-8' }).trim();
    if (pythonOut) {
      return { command: pythonOut, argsPrefix: ['-m', 'yt_dlp'] };
    }
  } catch {
    // ignore
  }

  return { command: 'yt-dlp', argsPrefix: [] };
}

function resolveCookiesPath(): string | null {
  const cwd = process.cwd();
  const candidates = [
    process.env.YOUTUBE_COOKIES_PATH,
    path.resolve(cwd, 'cookies.txt'),
    path.resolve(cwd, 'storage/cookies.txt'),
    path.resolve(cwd, 'storage/downloads/cookies.txt'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function getServerConfig(): ServerConfig {
  if (cachedConfig) return cachedConfig;

  const cwd = process.cwd();
  const storageDir = path.resolve(
    cwd,
    process.env.STORAGE_DIR || './storage/downloads'
  );
  const storageTempDir = path.resolve(
    cwd,
    process.env.STORAGE_TEMP_DIR || './storage/temp'
  );

  // Ensure directories exist
  try {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    if (!fs.existsSync(storageTempDir)) {
      fs.mkdirSync(storageTempDir, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to initialize storage directories:', err);
  }

  const fileTtlSeconds = parseInt(process.env.FILE_TTL_SECONDS || '1800', 10);
  const cleanupIntervalSeconds = parseInt(
    process.env.CLEANUP_INTERVAL_SECONDS || '300',
    10
  );

  cachedConfig = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    storageDir,
    storageTempDir,
    fileTtlMs: fileTtlSeconds * 1000,
    cleanupIntervalMs: cleanupIntervalSeconds * 1000,
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '3', 10),
    maxVideoDurationSeconds: parseInt(
      process.env.MAX_VIDEO_DURATION_SECONDS || '7200',
      10
    ),
    maxFileSizeBytes: parseInt(
      process.env.MAX_FILE_SIZE_BYTES || '1073741824',
      10
    ),
    rateLimitMaxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || '60',
      10
    ),
    rateLimitWindowMs:
      parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10) * 1000,
    tokenSecret:
      process.env.TOKEN_SECRET || 'dev_secret_key_antigravity_media_32_chars',
    ffmpegPath: resolveFfmpegPath(),
    ffprobePath: resolveFfprobePath(resolveFfmpegPath()),
    cookiesPath: resolveCookiesPath(),
    ytdlpCommand: resolveYtDlpCommand(),
  };

  return cachedConfig;
}
