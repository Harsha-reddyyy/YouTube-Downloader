import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getServerConfig } from './config';
import { isPathInsideDirectory } from '@/lib/security';

export interface StoredFileRecord {
  token: string;
  jobId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: number;
  expiresAt: number;
}

class StorageService {
  private files: Map<string, StoredFileRecord> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupSchedule();
  }

  /**
   * Registers a completed output file, generates an unguessable token, and returns the record.
   */
  public registerFile(params: {
    jobId: string;
    filePath: string;
    fileName: string;
    mimeType: string;
  }): StoredFileRecord {
    const config = getServerConfig();

    // Verify file exists on disk
    if (!fs.existsSync(params.filePath)) {
      throw new Error(`File does not exist at path: ${params.filePath}`);
    }

    // Verify path is within storage dir or temp dir
    if (
      !isPathInsideDirectory(config.storageDir, params.filePath) &&
      !isPathInsideDirectory(config.storageTempDir, params.filePath)
    ) {
      throw new Error('File path is outside of authorized storage directories.');
    }

    const stat = fs.statSync(params.filePath);
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + config.fileTtlMs;

    const record: StoredFileRecord = {
      token,
      jobId: params.jobId,
      filePath: params.filePath,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSizeBytes: stat.size,
      createdAt: now,
      expiresAt,
    };

    this.files.set(token, record);
    return record;
  }

  /**
   * Retrieves a file record by token. Validates expiration and disk presence.
   */
  public getFileByToken(token: string): StoredFileRecord | null {
    if (!token || typeof token !== 'string') return null;

    const record = this.files.get(token);
    if (!record) return null;

    // Check expiration
    if (Date.now() > record.expiresAt) {
      this.deleteFileByToken(token);
      return null;
    }

    // Check file on disk
    if (!fs.existsSync(record.filePath)) {
      this.files.delete(token);
      return null;
    }

    return record;
  }

  /**
   * Deletes a registered file and its disk asset
   */
  public deleteFileByToken(token: string): boolean {
    const record = this.files.get(token);
    if (!record) return false;

    this.files.delete(token);

    try {
      if (fs.existsSync(record.filePath)) {
        fs.unlinkSync(record.filePath);
      }
      return true;
    } catch (err) {
      console.error(`Failed to delete file at ${record.filePath}:`, err);
      return false;
    }
  }

  /**
   * Purges expired files and cleans orphaned files on disk
   */
  public runCleanup(): { purgedRecords: number; purgedOrphanFiles: number } {
    const config = getServerConfig();
    const now = Date.now();
    let purgedRecords = 0;
    let purgedOrphanFiles = 0;

    // 1. Purge expired tracked records
    for (const [token, record] of this.files.entries()) {
      if (now > record.expiresAt) {
        this.deleteFileByToken(token);
        purgedRecords++;
      }
    }

    // 2. Scan disk storage folders for files older than TTL
    const dirsToScan = [config.storageDir, config.storageTempDir];
    for (const dir of dirsToScan) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.startsWith('.')) continue; // skip hidden files

          const fullPath = path.join(dir, file);
          try {
            const stat = fs.statSync(fullPath);
            // If file is older than TTL
            if (now - stat.mtimeMs > config.fileTtlMs) {
              if (stat.isDirectory()) {
                fs.rmSync(fullPath, { recursive: true, force: true });
              } else {
                fs.unlinkSync(fullPath);
              }
              purgedOrphanFiles++;
            }
          } catch {
            // ignore individual file stat/unlink errors
          }
        }
      } catch (err) {
        console.error(`Failed to scan directory for cleanup: ${dir}`, err);
      }
    }

    return { purgedRecords, purgedOrphanFiles };
  }

  /**
   * Starts periodic timer for automated cleanup
   */
  private startCleanupSchedule() {
    if (this.cleanupTimer) return;

    const config = getServerConfig();
    this.cleanupTimer = setInterval(() => {
      this.runCleanup();
    }, config.cleanupIntervalMs);

    // Unref timer so it does not block Node process exit during tests
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Clean up all state (for tests)
   */
  public stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.files.clear();
  }
}

// Global singleton to persist across Next.js API route invocations in development
const globalForStorage = globalThis as unknown as { storageService?: StorageService };

export const storageService =
  globalForStorage.storageService || new StorageService();

if (process.env.NODE_ENV !== 'production') {
  globalForStorage.storageService = storageService;
}
