# Multi-stage production Dockerfile for MediaFlow Downloader
# Stage 1: Build Frontend and Server bundles
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Ensure public directory exists
RUN mkdir -p /app/public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 2: Production Runtime Environment
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install runtime dependencies: FFmpeg, Python3, pip, and CA certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary directly
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Create non-root application user for defense-in-depth security
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser

# Create storage and public directories and set permissions
RUN mkdir -p /app/storage/downloads /app/storage/temp /app/public && \
    chown -R appuser:appuser /app

# Copy built artifacts and production dependencies
COPY --from=builder --chown=appuser:appuser /app/package*.json ./
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/.next ./.next
COPY --from=builder --chown=appuser:appuser /app/public ./public
COPY --from=builder --chown=appuser:appuser /app/src ./src
COPY --from=builder --chown=appuser:appuser /app/next.config.mjs ./

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/status || exit 1

CMD ["npm", "start"]
