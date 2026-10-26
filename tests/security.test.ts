import { describe, it, expect } from 'vitest';
import {
  validateAndParseYouTubeUrl,
  sanitizeFilename,
  isPathInsideDirectory,
} from '@/lib/security';
import path from 'path';

describe('Security & URL Validation', () => {
  describe('validateAndParseYouTubeUrl', () => {
    it('accepts standard YouTube watch URLs', () => {
      const res = validateAndParseYouTubeUrl(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
      expect(res.isValid).toBe(true);
      expect(res.videoId).toBe('dQw4w9WgXcQ');
      expect(res.normalizedUrl).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });

    it('accepts YouTube short links (youtu.be)', () => {
      const res = validateAndParseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
      expect(res.isValid).toBe(true);
      expect(res.videoId).toBe('dQw4w9WgXcQ');
      expect(res.normalizedUrl).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });

    it('accepts YouTube Shorts URLs', () => {
      const res = validateAndParseYouTubeUrl(
        'https://www.youtube.com/shorts/51nZ2Z3Jm6k'
      );
      expect(res.isValid).toBe(true);
      expect(res.videoId).toBe('51nZ2Z3Jm6k');
      expect(res.normalizedUrl).toBe(
        'https://www.youtube.com/watch?v=51nZ2Z3Jm6k'
      );
    });

    it('accepts YouTube embed URLs and URLs without protocol', () => {
      const res = validateAndParseYouTubeUrl(
        'youtube.com/embed/dQw4w9WgXcQ'
      );
      expect(res.isValid).toBe(true);
      expect(res.videoId).toBe('dQw4w9WgXcQ');
    });

    it('rejects non-YouTube domains (SSRF prevention)', () => {
      const res = validateAndParseYouTubeUrl('https://malicious-site.com/video');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Unsupported domain');
    });

    it('rejects localhost, 127.0.0.1, and private IPs (SSRF prevention)', () => {
      const resLocal = validateAndParseYouTubeUrl('http://localhost:8080/exploit');
      expect(resLocal.isValid).toBe(false);
      expect(resLocal.error).toContain('blocked');

      const resIp = validateAndParseYouTubeUrl('http://169.254.169.254/latest/meta-data');
      expect(resIp.isValid).toBe(false);
      expect(resIp.error).toContain('blocked');

      const resPrivate = validateAndParseYouTubeUrl('http://192.168.1.1/admin');
      expect(resPrivate.isValid).toBe(false);
    });

    it('rejects invalid YouTube IDs', () => {
      const res = validateAndParseYouTubeUrl(
        'https://www.youtube.com/watch?v=too_short'
      );
      expect(res.isValid).toBe(false);
    });

    it('rejects javascript: and file: schemes', () => {
      const res = validateAndParseYouTubeUrl('javascript:alert(1)');
      expect(res.isValid).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('removes dangerous path traversal sequences', () => {
      const clean = sanitizeFilename('../../../etc/passwd', '1080p', 'mp4');
      expect(clean).not.toContain('..');
      expect(clean).not.toContain('/');
      expect(clean).toBe('passwd_1080p.mp4');
    });

    it('replaces OS reserved characters with underscores', () => {
      const clean = sanitizeFilename('Video: "Great" <Awesome> | Test? *', '720p', 'mp4');
      expect(clean).not.toMatch(/[<>:"/\\|?*]/);
      expect(clean).toBe('Video_Great_Awesome_Test_720p.mp4');
    });

    it('handles titles with non-ASCII or Unicode characters safely', () => {
      const clean = sanitizeFilename('Música Española & 測試', '320k', 'mp3');
      expect(clean).toBe('Musica_Espanola_&_測試_320k.mp3');
    });

    it('truncates excessively long titles to safe length', () => {
      const longTitle = 'a'.repeat(200);
      const clean = sanitizeFilename(longTitle, '1080p', 'mp4');
      expect(clean.length).toBeLessThan(120);
    });
  });

  describe('isPathInsideDirectory', () => {
    it('returns true for paths inside the target directory', () => {
      const base = '/var/app/storage';
      const file = '/var/app/storage/downloads/video.mp4';
      expect(isPathInsideDirectory(base, file)).toBe(true);
    });

    it('returns false for path traversal escapes', () => {
      const base = '/var/app/storage';
      const escape = '/var/app/storage/../../etc/shadow';
      expect(isPathInsideDirectory(base, escape)).toBe(false);
    });
  });
});
