# Owner sign-in

Credential issuance and approval are owner actions. They accept a SWADEBASE auth session that came from Google. This service does not hold a Google client id or client secret, and it does not call Google.

## Where Google is configured

Google OAuth already belongs to SWADEBASE auth (GoTrue):

| Setting                               | Where it lives                 | This service     |
| ------------------------------------- | ------------------------------ | ---------------- |
| `GOOGLE_ENABLED`                      | SWADEBASE auth environment     | Does not read it |
| `GOOGLE_CLIENT_ID`                    | SWADEBASE auth environment     | Does not read it |
| `GOOGLE_SECRET`                       | SWADEBASE auth environment     | Does not read it |
| `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI` | `${API_EXTERNAL_URL}/callback` | Does not read it |

The Hostinger example documents the authorized redirect as `https://swadebase.cloud/auth/v1/callback` when `API_EXTERNAL_URL` is `https://swadebase.cloud/auth/v1`. Put the client id and secret only in that auth service's secret store.

## What this service configures

| Variable                     | Value                                                      |
| ---------------------------- | ---------------------------------------------------------- |
| `SWADEBASE_AUTH_URL`         | GoTrue base, for example `https://swadebase.cloud/auth/v1` |
| `SWADE_ONTOLOGY_OWNER_EMAIL` | The owner's verified Google email                          |

Both can be empty while `SWADE_ONTOLOGY_ENABLED=false`. Admin routes then fail closed with `owner_not_configured`. `SWADEBASE_AUTH_URL` is rejected when it points at a Google host.

## Operator session

Google sign-in is exchanged once for a first-party session. The browser does not keep the SWADEBASE access token, and it does not put a session secret in `localStorage`.

1. The owner signs in through SWADEBASE auth with Google: `{SWADEBASE_AUTH_URL}/authorize?provider=google`.
2. SWADEBASE auth redirects to Google and back to its own callback.
3. The operator surface posts that access token to `POST /v1/admin/session` and then discards it.
4. SWADE asks SWADEBASE auth `GET {SWADEBASE_AUTH_URL}/user`.
5. The user must have a Google identity, a verified email, and that email must match `SWADE_ONTOLOGY_OWNER_EMAIL`.
6. The response sets `swade_ontology_session` as `HttpOnly; Secure; SameSite=Lax` on `Path=/v1/admin`, with no `Domain` attribute. The JSON body does not contain the cookie secret.

Later admin requests send only that cookie. App and SWADEBOTS credentials stay on `Authorization: Bearer` for `/v1` reads and cannot open or approve admin actions. A session cookie cannot read the knowledge routes.

| Lifetime                                    | Default    | Environment variable                      |
| ------------------------------------------- | ---------- | ----------------------------------------- |
| Idle, rolling                               | 30 days    | `SWADE_ONTOLOGY_SESSION_IDLE_SECONDS`     |
| Absolute                                    | 90 days    | `SWADE_ONTOLOGY_SESSION_ABSOLUTE_SECONDS` |
| Recent sign-in required to issue or approve | 15 minutes | `SWADE_ONTOLOGY_SESSION_REAUTH_SECONDS`   |

Each accepted admin request moves the idle deadline forward and refreshes the cookie. The absolute deadline does not move. Issuing a credential, approving it, or revoking it returns `reauth_required` when the latest Google sign-in is older than the reauth window. Posting a fresh SWADEBASE access token to `POST /v1/admin/session` with the existing cookie refreshes that device.

`POST /v1/admin/session/sign-out` revokes the current device and clears the cookie. `POST /v1/admin/session/sign-out-everywhere` revokes every session for that Google subject. When the isolated database is configured, sessions are stored in `swade_ontology.admin_sessions` as a hash of the cookie secret.

There is no service-role fallback. A body field cannot name a different owner.

## Admin routes

| Route                                     | Effect                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `POST /v1/admin/credentials`              | Issues a SWADEBOTS or app credential in `pending` state. The token is returned once. |
| `POST /v1/admin/credentials/{id}/approve` | Writes an owner approval and sets `approved`.                                        |
| `POST /v1/admin/credentials/{id}/revoke`  | Writes an owner revocation and sets `revoked`.                                       |
| `GET /v1/admin/approvals`                 | Lists approval and revocation records for the signed-in owner.                       |

A pending credential cannot read SWADE. An approved credential can, inside its app and tenant grant. A revoked credential cannot. Each issuance, approval, revocation, and denied read is audited.
