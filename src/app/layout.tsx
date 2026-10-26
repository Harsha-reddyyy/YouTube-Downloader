import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediaFlow — High-Performance Studio Media Downloader & Transcoder',
  description:
    'Lossless video and audio extraction powered by native FFmpeg. Direct stream copy for 100% video fidelity, Premiere Pro AVC readiness, and 320kbps MP3 audio.',
  keywords: [
    'youtube downloader',
    'direct stream copy',
    'premiere pro mp4',
    'ffmpeg transcoding',
    'lossless video converter',
    'youtube shorts downloader',
    'mp3 320kbps converter',
    'mediaflow',
  ],
  authors: [{ name: 'MediaFlow Engineering' }],
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#07090e' },
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
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M8 5v14l11-7z'/></svg>"
        />
        {/* Anti-FOUC Theme Script: Sets the dark class immediately before render */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
