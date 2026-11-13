# SWADE Adapter Contract v1

Status: **APPROVED v1 by Swade, 2026-10-24 ~1:50 AM CT**, with the side-by-side migration rule below. Originally proposed 2026-10-24. Derived from the Maestro Book Studio contract (swade-radio `src/docs/BookStudioAdapter.md`, deployed `maestro-book-studio`), the ReSing mix worker (`/opt/resing-mix-worker`), and SWADE Connect (`swade-ecosystem-hub@706e853`, `supabase/functions/swade-connect`). No running adapter was changed to write this.

An **adapter** is any SWADEBASE edge function or host service that exposes one capability (book studio, music generation, voice, mixdown, render, and so on) to ecosystem sites. Each adapter maps to one or more `swadesoul.swade_modules` slugs. Each site enables an adapter through `swadesoul.swade_site_modules` (`enabled`, `config_json.provider`).


> **Formal approval record.** On Saturday, October 24, 2026 (about 1:51 AM CT), Swade Soul, super admin of SWADEBASE and SWADE Connect, reviewed this SWADE Adapter Contract v1 in full and formally approved it as the shared adapter format for all SWADEBASE adapters, subject to the side-by-side migration rule in section 0. Recorded by Big Mamma at his instruction.

## 0. Migration rule (approved with the contract)

- **Side by side.** During the switch every adapter keeps its old fields, routes and signatures working next to the new ones (for example `output_url` next to `output.url`, `X-Mix-Signature` next to `X-Swade-Signature`, old status words available next to the standard ones). Old forms are only removed after every known caller has moved, and only with Swade's OK.
- **One tool at a time.** Convert and deploy a single adapter, verify it, then move to the next.
- **Ready only after a full test.** `ready:true` is set only after the test gate at the end of section 7 passes for that adapter.
- **Order.** The mix worker (`media.mix`) goes first, before ReSing PR 26 goes live.

## 1. Transport

Adapters use one of two transports.

| Transport | Used by | Request form |
| --- | --- | --- |
| **A. Action envelope** | Browser-facing edge functions | `POST /functions/v1/<adapter>` with body `{ "action": "<name>", ...params }`. Called through `supabase.functions.invoke`. |
| **B. REST** | Server-to-server host services | `GET /v1/status`, `POST /v1/<resource>`, `GET /v1/<resource>/:id`. Bound to `172.16.0.1` or loopback only, never public. |

Both transports must return the same JSON bodies, defined below.

## 2. Auth

| Caller | Credential | Validation |
| --- | --- | --- |
| End user (browser) | `Authorization: Bearer <SWADEBASE user JWT>` | Validate with SWADEBASE Auth (`auth.getUser(token)`). Never only decode the token. |
| Site server | `X-SWADE-API-KEY: sk_live_…` (SWADE Connect key) | Look up the sha256 of the key in `swadesoul.swade_api_keys` where `revoked_at` is null. Then check `scopes` and `site_id`. |
| Internal service | `Authorization: Bearer <SERVICE_TOKEN>` (one token per adapter, stored in `/opt/swade-secrets/<adapter>.env` and `functions.env`) | Use a constant-time compare. |

Rules that apply to every adapter:

- **Every action needs auth, including `status`.** A missing or invalid credential returns 401. A valid credential with the wrong scope returns 403.
- **Site and owner come from the server.** Derive them from the credential (token user, key `site_id`) or hard-code them. Reject caller-supplied `siteId`, `site_id`, `ownerId` or `owner_id`, including inside nested metadata.
- **Keep secrets server-side.** Service-role and provider keys stay on the server and never appear in responses, logs or errors.

## 3. `status` (required)

Call it as `action:"status"` (transport A) or `GET /v1/status` (transport B). It returns HTTP 200 even when the adapter is not ready.

```json
{
  "adapter": "media.mix",
  "service": "resing-mix-worker",
  "contractVersion": 1,
  "ready": false,
  "blockers": ["callback signing uses legacy X-Mix-Signature"],
  "capabilities": {
    "actions": ["status", "submit", "get"],
    "async": true,
    "callbacks": true,
    "formats": ["mp3", "wav"],
    "limits": { "max_tracks": 16, "max_duration_s": 900 },
    "providers": ["ffmpeg"]
  },
  "version": "1.0.0",
  "time": "2026-10-24T06:00:00Z"
}
```

- `adapter` is the module slug from `swade_modules`. `service` is the deployed function or unit name.
- `ready` is true only when every dependency probe passes **and** the acceptance tests for this adapter have passed. A feature flag may hold it false.
- `blockers` is a list of human-readable strings. It must be empty when `ready` is true. It must not contain URLs, keys or user data.
- `capabilities.actions` must list every action the adapter accepts. The other keys depend on the adapter but must be documented.
- `GET /health` (no auth, `{"status":"ok"}`) may stay as a liveness probe for systemd and monitors. It does not replace `status`.

## 4. Action and job envelope

### Synchronous success

```json
{ "ok": true, "data": { ... }, "request_id": "uuid" }
```

### Asynchronous job

Submitting a job returns HTTP 202:

```json
{ "ok": true, "job_id": "uuid", "status": "queued", "status_path": "/v1/jobs/<id>", "request_id": "uuid" }
```

Polling the job (`action:"get"` with `job_id`, or `GET /v1/jobs/:id`) returns:

```json
{ "ok": true, "job_id": "uuid", "status": "queued|running|done|error|cancelled",
  "progress": 0.0, "output": { "url": "...", "expires_at": "...", "duration_s": 22.0, ... },
  "error": null, "created_at": "...", "updated_at": "..." }
```

Rules for jobs:

- **Status values.** Use exactly `queued`, `running`, `done`, `error` or `cancelled`. Map adapter-specific words ("processing", "complete", "completed", "failed", "rendering") onto these.
- **Progress** is a number from 0 to 1.
- **Output URLs** are presigned and short-lived. Re-sign them on every GET.
- **Idempotency.** `Idempotency-Key` is optional. If the adapter supports it, a repeated key within 24 hours returns the original job.

### Errors

Every non-2xx response uses this shape:

```json
{ "ok": false, "error": { "code": "invalid_request", "message": "human readable", "retryable": false }, "request_id": "uuid" }
```

| HTTP | `code` |
| --- | --- |
| 400 | `invalid_request` / `invalid_json` |
| 401 | `unauthorized` |
| 403 | `forbidden` |
| 404 | `not_found` / `job_not_found` |
| 409 | `conflict` |
| 413 | `payload_too_large` |
| 429 | `rate_limited` |
| 502 | `upstream_failed` |
| 503 | `not_ready` / `queue_full` / `disabled` |

Rules for errors:

- **Compatibility.** During migration a top-level string `error` is still accepted, as in Book Studio's `{error}` and Connect's `{ok:false,error:"…"}`. Clients must handle both forms. New code must emit the object form.
- **Missing adapter.** HTTP 404, or HTTP 500 with "could not find an appropriate entrypoint", means the adapter is not deployed. Clients show "backend adapter not deployed" and must not treat it as a data error.

## 5. Signed webhooks and callbacks

Callbacks are sent as `POST <callback_url>` with `Content-Type: application/json`. The body is the same job object as the poll response in section 4.

Headers:

```
X-Swade-Signature: t=<unix_seconds>,v1=<hex>
X-Swade-Event: job.done | job.error | <adapter>.<event>
X-Swade-Delivery: <uuid>
User-Agent: <service>/<version>
```

**Signing.** `v1` is the lowercase hex HMAC-SHA256 of `"<t>." + raw_body_bytes`. The key is the per-endpoint secret: `swade_webhook_endpoints` (`whsec_…`) or the adapter service token for internal callbacks.

**Verifying.** The receiver must:

1. Compute the HMAC over the **raw** body bytes.
2. Compare with a constant-time function.
3. Reject when `|now - t| > 300 s`.
4. De-duplicate on `X-Swade-Delivery`.

**Retries.** The sender retries 3 times with backoff (about 1 s, 5 s and 30 s) on a network error or a 5xx. A 4xx is final. Each delivery is recorded in `swade_webhook_deliveries` (Connect) or the job record (`callback_status`).

**URL safety.** Before sending, the sender checks the callback URL:

- https only;
- no IP literals, localhost, `.local` or `.internal` hosts;
- the DNS result must not be private, and that IP is pinned for the connection;
- redirects are not followed.

**Legacy format.** The `X-Mix-Signature: <hex HMAC-SHA256(raw_body)>` header from mix worker v1 (no timestamp) is accepted as legacy v0. Senders should send both headers during transition.

## 6. Registration

- **Module.** One `swadesoul.swade_modules` row per adapter capability. Fill `slug`, `name`, `category`, `description`, `requires[]` (module slugs) and `min_api_version` = 1.
- **Site.** A site enables a module with a `swade_site_modules` row: `enabled`, and `config_json` = `{ "provider": "...", "secondary": ..., "note": ... }` with no secrets in it.
- **Service.** Adapters exposed through functions are routed with `main/app-routes.json`, so `SUPABASE_URL` is pinned to `https://swadebase.cloud/app/<schema>`. Secrets live in `functions.env` or `/opt/swade-secrets/*.env`, and `/opt/swade-secrets` files are chmod 600.

## 7. Adapters today and what each needs

| Adapter (module) | Where | Matches today | Needs to change |
| --- | --- | --- | --- |
| **maestro-book-studio** (`books.studio`) | Edge function, transport A | `status` returns `{adapter, contractVersion:1, ready:false, blockers}`. Bearer user JWT on every action. Site is fixed server-side and caller scope is rejected. | Add `capabilities`. Errors are `{error:string}`: move to the object form. Uses `adapter:'maestro-book-studio'`: add `service`, or switch `adapter` to the `books.studio` slug. CRUD is behind a flag (expected). |
| **resing-mix-worker** (`media.mix`) | Host service on 172.16.0.1:8799, transport B | Bearer service token; constant-time check. Async job with queued/running/done/error and progress 0–1. Presigned output re-signed on GET. HMAC callback. SSRF guard. | Add `GET /v1/status`. Wrap responses in `ok`/`request_id`. Errors are `{error:"code"}`: use the object form. Add `t=` timestamped `X-Swade-Signature` (keep `X-Mix-Signature`), plus delivery id and retries. Use `output.url` instead of `output_url`. |
| **swade-music-gpu-adapter** (`music.generate`) | Host FastAPI | Bearer token on `/health`. Async jobs with `job_id`. | Add `/v1/status` with ready, blockers and capabilities (engines and models are already in `/health`). Map `processing`→running, `completed`→done, `failed`→error. Use the error object. No callbacks yet. |
| **swade-voice-service** (`voice`) | Host aiohttp | Bearer token with constant-time compare. 202 `{job_id,status:"queued"}`. | Add `/v1/status`. `/health` has no contract fields. Use the error object. Add a callback or a documented poll route. Standardise job fields. |
| **swade-voice-gateway** (`voice`) | Host proxy to the GPU voice backend | Bearer token with constant-time compare. Returns 503 `{status:"offline",reason}` when the backend is down. | Turn the offline reason into `status` `ready:false` with `blockers`. Use the error object. |
| **sssbrain-render-worker** (media render) | Host service | Bearer token with constant-time compare. 202 queued; `/status/:id`. | Add `/v1/status`. Map `complete`/`failed`. Move `/status/:id` to `/v1/jobs/:id` (keep an alias). Jobs are in memory only, so they are lost on restart: persist them. Use the error object. No callbacks. Needs a module slug (for example `media.render`). |
| **swade-media-core** (`media`) | Host service | Bearer token. `/v1/media/capabilities` already reports per-provider availability. | Expose it as `/v1/status` (`capabilities` already fits). Add `ready` and `blockers`. Use the error object. |
| **swadebase-hyperframes** | Host, loopback | Bearer token with timingSafeEqual. 202 `{id,status,statusPath}`. Site allowlist. | Rename `id`→`job_id` and `rendering`→running. Add `/v1/status`. Use the error object. Needs a module slug. |
| **swade-ai-gateway** (`ai`) | Host | Bearer token with constant-time compare. `/healthz`. | Add `/v1/status`. Use the error object. |
| **book-voice** (narration) | Host worker (queue consumer, no HTTP API) | — | Out of scope for the HTTP contract. If it is exposed, it should report status through media-core or voice. |
| **swade-connect** (registry, not an adapter) | Edge function | Uses `{ok,data,request_id}` and `{ok:false,error,request_id}`. | Make `error` an object. As of 2026-10-24 `/v1/health`, `/v1/modules` and `/v1/sites` are **key-protected** (approved by Swade): anonymous calls get 401, super admin sees every site, and a site or third-party key sees only its own site. External parties request access and get a key only after super-admin approval. The README describes webhook signing as `t=…,v1=…`, but `index.ts` does not implement signing; implement it to section 5. |

Test gate before any adapter reports `ready:true`:

- `status` returns 401 without auth and 403 with the wrong scope;
- a disposable job runs end to end;
- polling works;
- the signed callback verifies, and a tampered body or signature is rejected;
- caller-supplied site and owner values are rejected;
- the test data is cleaned up.
