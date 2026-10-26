import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { storageService } from '@/server/storage-service';
import { getServerConfig } from '@/server/config';

describe('StorageService', () => {
  const config = getServerConfig();
  const testFile = path.join(config.storageDir, 'test_media.mp4');

  beforeEach(() => {
    if (!fs.existsSync(config.storageDir)) {
      fs.mkdirSync(config.storageDir, { recursive: true });
    }
    fs.writeFileSync(testFile, 'dummy media content');
  });

  afterEach(() => {
    try {
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    } catch {
      // ignore
    }
  });

  it('registers a file and generates a 64-char hex token', () => {
    const record = storageService.registerFile({
      jobId: 'job_123',
      filePath: testFile,
      fileName: 'my_video.mp4',
      mimeType: 'video/mp4',
    });

    expect(record.token).toBeDefined();
    expect(record.token.length).toBe(64);
    expect(record.fileName).toBe('my_video.mp4');
    expect(record.fileSizeBytes).toBeGreaterThan(0);
  });

  it('retrieves an existing unexpired file by token', () => {
    const record = storageService.registerFile({
      jobId: 'job_456',
      filePath: testFile,
      fileName: 'test_file.mp4',
      mimeType: 'video/mp4',
    });

    const retrieved = storageService.getFileByToken(record.token);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.jobId).toBe('job_456');
    expect(retrieved?.filePath).toBe(testFile);
  });

  it('returns null for nonexistent token', () => {
    const result = storageService.getFileByToken('invalid_token_123456');
    expect(result).toBeNull();
  });

  it('rejects registering files located outside of authorized storage directories', () => {
    const outsideFile = path.resolve(process.cwd(), 'package.json');
    expect(() => {
      storageService.registerFile({
        jobId: 'job_outside',
        filePath: outsideFile,
        fileName: 'package.json',
        mimeType: 'application/json',
      });
    }).toThrow('File path is outside of authorized storage directories');
  });

  it('deletes registered file and disk asset upon token deletion', () => {
    const fileToDelete = path.join(config.storageDir, 'temp_delete.mp4');
    fs.writeFileSync(fileToDelete, 'to be deleted');

    const record = storageService.registerFile({
      jobId: 'job_del',
      filePath: fileToDelete,
      fileName: 'temp_delete.mp4',
      mimeType: 'video/mp4',
    });

    const success = storageService.deleteFileByToken(record.token);
    expect(success).toBe(true);
    expect(fs.existsSync(fileToDelete)).toBe(false);
    expect(storageService.getFileByToken(record.token)).toBeNull();
  });
});
