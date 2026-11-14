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

## Operator flow

1. The owner signs in through SWADEBASE auth with Google: `{SWADEBASE_AUTH_URL}/authorize?provider=google`.
2. SWADEBASE auth redirects to Google and back to its own callback.
3. The owner calls the admin routes with that access token: `Authorization: Bearer <swadebase access token>`.
4. SWADE asks SWADEBASE auth `GET {SWADEBASE_AUTH_URL}/user`.
5. The user must have a Google identity, a verified email, and that email must match `SWADE_ONTOLOGY_OWNER_EMAIL`.

There is no service-role fallback. A body field cannot name a different owner.

## Admin routes

| Route                                     | Effect                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `POST /v1/admin/credentials`              | Issues a SWADEBOTS or app credential in `pending` state. The token is returned once. |
| `POST /v1/admin/credentials/{id}/approve` | Writes an owner approval and sets `approved`.                                        |
| `POST /v1/admin/credentials/{id}/revoke`  | Writes an owner revocation and sets `revoked`.                                       |
| `GET /v1/admin/approvals`                 | Lists approval and revocation records for the signed-in owner.                       |

A pending credential cannot read SWADE. An approved credential can, inside its app and tenant grant. A revoked credential cannot. Each issuance, approval, revocation, and denied read is audited.
