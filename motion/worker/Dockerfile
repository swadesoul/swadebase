# SWADEBASE Motion render worker — CPU only, runs beside SWADEBASE on the Hostinger VPS.
# Build from the repo root:  docker build -f motion/worker/Dockerfile -t swadebase-motion-worker .
FROM node:22-bookworm-slim

# FFmpeg for encode/poster/audio conversion, zip for source bundles, and the shared
# libraries headless Chrome needs (HyperFrames drives Chrome to capture frames).
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg zip ca-certificates fonts-liberation fonts-noto-color-emoji \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 \
      libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxfixes3 \
      libxkbcommon0 libxrandr2 libxshmfence1 xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Everything below runs as the unprivileged node user so the browser HyperFrames
# downloads lands in that user's cache and is available at render time.
RUN mkdir -p /app/motion/worker && chown -R node:node /app
USER node
ENV HOME=/home/node NODE_ENV=production MOTION_JOB_DIR=/tmp/motion-jobs HYPERFRAMES_TELEMETRY=0
WORKDIR /app/motion/worker
COPY --chown=node:node motion/worker/package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npx --no-install hyperframes telemetry disable || true
RUN npx --no-install hyperframes browser ensure

COPY --chown=node:node motion/adapter /app/motion/adapter
COPY --chown=node:node motion/styles/library.json /app/motion/styles/library.json
COPY --chown=node:node motion/worker/*.mjs ./

CMD ["node", "worker.mjs"]
