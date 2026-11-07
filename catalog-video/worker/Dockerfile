# Catalog transcoder. Separate from the Motion Studio image: FFmpeg only, no Chrome.
# Build from the repo root:
#   docker build -f catalog-video/worker/Dockerfile -t swadebase-catalog-video-worker .
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 10001 catalog
WORKDIR /app
COPY --chown=catalog:catalog docker/volumes/functions/catalog-video /app/docker/volumes/functions/catalog-video
COPY --chown=catalog:catalog catalog-video /app/catalog-video
USER catalog
ENV NODE_ENV=production
CMD ["node", "/app/catalog-video/worker/worker.mjs"]
