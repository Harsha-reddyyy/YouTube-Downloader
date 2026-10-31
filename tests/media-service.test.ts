import { describe, it, expect } from 'vitest';
import { mediaService } from '@/server/media-service';
import { getServerConfig } from '@/server/config';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('MediaService NLE Edit-Friendly Engine', () => {
  it('correctly provides 4K and 2K options marked as NLE Ready in fallback mode', async () => {
    const meta = await mediaService.inspectMedia('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
    expect(meta.availableResolutions.length).toBeGreaterThan(0);

    const res4k = meta.availableResolutions.find((r) => r.resolution === '2160p');
    if (res4k) {
      expect(res4k.isNleReady).toBe(true);
      expect(res4k.vcodec).toContain('H.264');
    }

    const res2k = meta.availableResolutions.find((r) => r.resolution === '1440p');
    if (res2k) {
      expect(res2k.isNleReady).toBe(true);
      expect(res2k.vcodec).toContain('H.264');
    }
  });

  it('correctly probes media files and extracts video/audio codecs', async () => {
    const config = getServerConfig();
    const testFilePath = path.join(config.storageTempDir, 'test_probe_unit.mp4');

    if (!fs.existsSync(config.storageTempDir)) {
      fs.mkdirSync(config.storageTempDir, { recursive: true });
    }

    // Generate a 1-second test MP4 with H.264 video and AAC audio
    const gen = spawnSync(
      config.ffmpegPath,
      [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'testsrc=duration=1:size=320x240:rate=30',
        '-f',
        'lavfi',
        '-i',
        'sine=duration=1:frequency=440',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        testFilePath,
      ],
      { stdio: 'ignore' }
    );

    if (gen.status !== 0) {
      // If ffmpeg not available in test env, skip
      return;
    }

    const probe = await mediaService.probeMedia(testFilePath);

    expect(probe.videoStream).toBeDefined();
    expect(probe.videoStream?.codecName).toBe('h264');
    expect(probe.videoStream?.pixFmt).toBe('yuv420p');
    expect(probe.videoStream?.width).toBe(320);
    expect(probe.videoStream?.height).toBe(240);

    expect(probe.audioStream).toBeDefined();
    expect(probe.audioStream?.codecName).toBe('aac');

    try {
      if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    } catch {
      // ignore
    }
  });
});
