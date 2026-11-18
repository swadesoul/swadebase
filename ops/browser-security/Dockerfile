FROM lscr.io/linuxserver/webtop@sha256:14fa1ceb750d4bf9e0880cb7e7b6a535f6f9210762a59ff992ef17e3375d48c0
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends nodejs socat && rm -rf /var/lib/apt/lists/*
COPY secure-bridge.mjs /app/bridge.mjs
COPY bridge-run /custom-services.d/swade-browser
RUN chmod 755 /custom-services.d/swade-browser
LABEL org.opencontainers.image.title="SWADE Secure Browser"
LABEL org.opencontainers.image.description="Founder-only Webtop browser; direct sandboxed Ubuntu Chromium; owner gateway external"
