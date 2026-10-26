#!/usr/bin/env bash
#
# fix-for-premiere.sh
# Fixes YouTube downloaded MP4 videos that trigger "unsupported compression type ('av01')" 
# or show black/offline video in Adobe Premiere Pro, DaVinci Resolve, Final Cut Pro, or QuickTime.
# Converts AV1 / VP9 / non-compliant MP4 videos into 100% Premiere Pro ready H.264 (yuv420p) + AAC (faststart).
#
# Usage:
#   ./scripts/fix-for-premiere.sh "/path/to/your-video.mp4" [output.mp4]
#

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <input_video.mp4> [output_video.mp4]"
  echo "Example: $0 ~/Downloads/my_video.mp4"
  exit 1
fi

INPUT_FILE="$1"

if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: Input file does not exist: $INPUT_FILE"
  exit 1
fi

OUTPUT_FILE="$2"
if [ -z "$OUTPUT_FILE" ]; then
  DIRNAME=$(dirname "$INPUT_FILE")
  BASENAME=$(basename "$INPUT_FILE")
  FILENAME="${BASENAME%.*}"
  OUTPUT_FILE="${DIRNAME}/${FILENAME}_premiere_ready.mp4"
fi

FFMPEG_BIN="ffmpeg"
if [ -x "/opt/homebrew/bin/ffmpeg" ]; then
  FFMPEG_BIN="/opt/homebrew/bin/ffmpeg"
elif [ -x "/usr/local/bin/ffmpeg" ]; then
  FFMPEG_BIN="/usr/local/bin/ffmpeg"
fi

echo "=========================================================="
echo " Premiere Pro Video Fixer (Universal H.264 Normalizer)   "
echo "=========================================================="
echo "Input:   $INPUT_FILE"
echo "Output:  $OUTPUT_FILE"
echo "Encoder: FFmpeg ($FFMPEG_BIN)"
echo ""
echo "Transcoding to H.264 (yuv420p) + AAC stereo + faststart..."

"$FFMPEG_BIN" -y -i "$INPUT_FILE" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ac 2 \
  -movflags +faststart \
  "$OUTPUT_FILE"

echo ""
echo " Successfully fixed video for Premiere Pro!"
echo "Saved to: $OUTPUT_FILE"
echo "You can now drag and drop this file directly into Premiere Pro or any video editor."
