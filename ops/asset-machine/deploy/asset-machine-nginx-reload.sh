#!/bin/sh
case "$RENEWED_LINEAGE" in
 /etc/letsencrypt/live/assetmachine.live) /usr/sbin/nginx -t && /usr/bin/systemctl reload nginx ;;
esac
