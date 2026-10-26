import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediaFlow — High-Performance Media Downloader & Transcoder',
  description:
    'Download authorized YouTube and YouTube Shorts videos in MP4 (up to 1080p/4K) and high-bitrate MP3 audio with real-time FFmpeg processing.',
  keywords: [
    'youtube downloader',
    'mp4 converter',
    'mp3 converter',
    'ffmpeg transcoding',
    'video downloader',
    'audio extractor',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M8 5v14l11-7z'/></svg>" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
