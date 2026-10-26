import path from 'path';

/**
 * YouTube URL patterns supported by the platform
 */
const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
]);

/**
 * Validates a user-supplied YouTube URL or returns null if invalid/disallowed.
 * Protects against SSRF by checking protocol, hostnames, and IP patterns.
 */
export function validateAndParseYouTubeUrl(rawUrl: string): {
  isValid: boolean;
  videoId?: string;
  normalizedUrl?: string;
  error?: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string.' };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    return { isValid: false, error: 'URL exceeds maximum allowable length.' };
  }

  let parsed: URL;
  try {
    // If protocol omitted, prepend https://
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return { isValid: false, error: 'Malformed URL structure.' };
  }

  // Enforce HTTPS / HTTP
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { isValid: false, error: 'Only HTTP and HTTPS protocols are permitted.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // SSRF prevention: reject localhost, 0.0.0.0, IP addresses directly
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    isPrivateIp(hostname)
  ) {
    return { isValid: false, error: 'Access to private, loopback, or internal addresses is blocked.' };
  }

  // Validate host against YouTube allowed host whitelist
  if (!ALLOWED_HOSTS.has(hostname)) {
    return {
      isValid: false,
      error: 'Unsupported domain. Please provide a valid YouTube video or YouTube Shorts link.',
    };
  }

  // Match video ID from URL
  const match = trimmed.match(YOUTUBE_REGEX);
  if (!match || !match[1] || !YOUTUBE_ID_REGEX.test(match[1])) {
    return {
      isValid: false,
      error: 'Could not detect a valid 11-character YouTube video ID in the provided URL.',
    };
  }

  const videoId = match[1];
  const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return {
    isValid: true,
    videoId,
    normalizedUrl,
  };
}

/**
 * Helper to detect private IPv4 address ranges
 */
function isPrivateIp(ip: string): boolean {
  // Simple regex check if hostname is an IPv4 address
  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) return false;

  const octets = ipv4Match.slice(1, 5).map(Number);
  if (octets.some((o) => o < 0 || o > 255)) return false;

  const [a, b] = octets;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (Link Local / Cloud Metadata)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8
  if (a === 0) return true;

  return false;
}

/**
 * Sanitizes a title string into a safe filename.
 * Removes directory traversal characters, null bytes, OS reserved characters, and limits length.
 */
export function sanitizeFilename(title: string, suffix = '', ext = 'mp4'): string {
  if (!title || typeof title !== 'string') {
    title = 'media_download';
  }

  // First extract basename to strip any directory path prefixes
  let clean = path.basename(title);

  // Normalize Unicode and remove combining diacritical marks (e.g. accented characters)
  clean = clean
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')     // remove combining diacritical marks
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // remove control chars
    .replace(/[<>:"/\\|?*]/g, '_')        // replace OS reserved chars with underscore
    .replace(/\.{2,}/g, '_')             // remove double dots (path traversal)
    .replace(/\s+/g, '_')                // replace whitespace with underscores
    .replace(/_+/g, '_')                 // collapse multiple underscores
    .replace(/^_+|_+$/g, '')             // trim leading/trailing underscores
    .replace(/[.]+$/g, '')               // remove trailing periods
    .trim();

  if (!clean || clean === '.' || clean === '..') {
    clean = 'media_download';
  }

  // Truncate to maximum 80 chars
  if (clean.length > 80) {
    clean = clean.slice(0, 80).replace(/_$/, '');
  }

  const cleanSuffix = suffix ? `_${suffix.replace(/[^a-zA-Z0-9_-]/g, '')}` : '';
  const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  return `${clean}${cleanSuffix}.${cleanExt}`;
}

/**
 * Verifies that a target file path resides strictly inside the designated base directory.
 * Prevents directory traversal attacks.
 */
export function isPathInsideDirectory(baseDir: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);

  return (
    resolvedTarget.startsWith(resolvedBase + path.sep) ||
    resolvedTarget === resolvedBase
  );
}
