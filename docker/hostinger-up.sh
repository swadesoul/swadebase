#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

ENV_FILE="${SWADEBASE_ENV_FILE:-.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.hostinger.example to .env and fill production values."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(
  POSTGRES_PASSWORD JWT_SECRET ANON_KEY SERVICE_ROLE_KEY
  SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY
  SECRET_KEY_BASE VAULT_ENC_KEY PG_META_CRYPTO_KEY
  LOGFLARE_PUBLIC_ACCESS_TOKEN LOGFLARE_PRIVATE_ACCESS_TOKEN
  DASHBOARD_USERNAME DASHBOARD_PASSWORD
  SUPABASE_PUBLIC_URL API_EXTERNAL_URL SITE_URL
)

missing=()
for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then missing+=("$name"); fi
done
if (("${#missing[@]}" > 0)); then
  printf 'Missing required production variable: %s\n' "${missing[@]}"
  exit 1
fi

if [[ "${SUPABASE_PUBLIC_URL}" != "https://swadebase.cloud" ]]; then
  echo "SUPABASE_PUBLIC_URL must be https://swadebase.cloud"
  exit 1
fi
if [[ "${API_EXTERNAL_URL}" != "https://swadebase.cloud/auth/v1" ]]; then
  echo "API_EXTERNAL_URL must be https://swadebase.cloud/auth/v1"
  exit 1
fi

echo "Validating compose configuration..."
docker compose --env-file "$ENV_FILE" config >/dev/null

echo "Pulling production images..."
docker compose --env-file "$ENV_FILE" pull

echo "Starting SwadeBase..."
docker compose --env-file "$ENV_FILE" up -d --remove-orphans

echo "Waiting for Kong/Auth..."
for attempt in $(seq 1 60); do
  if curl --fail --silent --show-error     -H "apikey: ${ANON_KEY}"     "http://127.0.0.1:${KONG_HTTP_PORT:-8000}/auth/v1/health" >/dev/null 2>&1; then
    echo "SwadeBase auth gateway is healthy."
    docker compose --env-file "$ENV_FILE" ps
    exit 0
  fi
  sleep 5
done

echo "SwadeBase auth gateway did not become healthy."
docker compose --env-file "$ENV_FILE" ps
docker compose --env-file "$ENV_FILE" logs --tail=120 kong auth db
exit 1
