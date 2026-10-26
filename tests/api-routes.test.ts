import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as inspectHandler } from '@/app/api/inspect/route';
import { POST as createJobHandler } from '@/app/api/jobs/route';
import { GET as getJobHandler, DELETE as cancelJobHandler } from '@/app/api/jobs/[id]/route';
import { GET as downloadHandler } from '@/app/api/download/[token]/route';
import { GET as statusHandler } from '@/app/api/status/route';
import { rateLimiter } from '@/server/rate-limiter';
import { storageService } from '@/server/storage-service';
import { getServerConfig } from '@/server/config';
import fs from 'fs';
import path from 'path';

describe('API Route Handlers', () => {
  beforeEach(() => {
    rateLimiter.reset();
  });

  describe('POST /api/inspect', () => {
    it('returns 400 when url is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await inspectHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('returns 422 when url is invalid or unauthorized domain', async () => {
      const req = new NextRequest('http://localhost:3000/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://vimeo.com/123456' }),
      });

      const res = await inspectHandler(req);
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unsupported domain');
    });
  });

  describe('POST /api/jobs & GET /api/jobs/[id]', () => {
    it('returns 400 when missing required parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://youtu.be/dQw4w9WgXcQ' }),
      });

      const res = await createJobHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('returns 404 when querying nonexistent job', async () => {
      const req = new NextRequest('http://localhost:3000/api/jobs/nonexistent_id');
      const res = await getJobHandler(req, { params: { id: 'nonexistent_id' } });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/download/[token]', () => {
    it('returns 404 for nonexistent or invalid token', async () => {
      const req = new NextRequest('http://localhost:3000/api/download/nonexistent_token');
      const res = await downloadHandler(req, { params: { token: 'nonexistent_token' } });
      expect(res.status).toBe(404);
    });

    it('returns 200 with attachment headers for valid registered token', async () => {
      const config = getServerConfig();
      const testFile = path.join(config.storageDir, 'api_test.mp4');
      fs.writeFileSync(testFile, 'video sample bytes');

      const record = storageService.registerFile({
        jobId: 'job_api_test',
        filePath: testFile,
        fileName: 'api_test.mp4',
        mimeType: 'video/mp4',
      });

      const req = new NextRequest(`http://localhost:3000/api/download/${record.token}`);
      const res = await downloadHandler(req, { params: { token: record.token } });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('video/mp4');
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="api_test.mp4"');

      // Clean up
      try {
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      } catch {
        // ignore
      }
    });
  });

  describe('GET /api/status', () => {
    it('returns system capability and environment flags', async () => {
      const res = await statusHandler();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(typeof data.isServerless).toBe('boolean');
      expect(typeof data.hasYtDlp).toBe('boolean');
      expect(typeof data.hasFfmpeg).toBe('boolean');
    });
  });
});
