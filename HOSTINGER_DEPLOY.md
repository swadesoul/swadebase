# SwadeBase on Hostinger

SwadeBase production is deployed by importing the GitHub repository
`swadesoul/swadebase` into Hostinger and binding the public domain
`https://swadebase.cloud`.

## Production contract

- API gateway: `https://swadebase.cloud`
- Auth API: `https://swadebase.cloud/auth/v1`
- REST API: `https://swadebase.cloud/rest/v1`
- Realtime: `wss://swadebase.cloud/realtime/v1`
- Functions: `https://swadebase.cloud/functions/v1`
- Oathloom client origin: `https://oathloom.com`

## Deployment process

1. Make code/config changes in `swadesoul/swadebase`.
2. Push/merge the GitHub changes.
3. Hostinger rebuilds/redeploys the imported repository.
4. Keep secrets in Hostinger environment variables only.
5. Verify `https://swadebase.cloud/auth/v1/health` after each backend deploy.
6. Verify Oathloom login/signup against SwadeBase after auth or gateway changes.

Use `docker/.env.hostinger.example` as the production variable checklist.

## Browser-safe value for Oathloom

Oathloom should use:

```text
VITE_SWADEBASE_URL=https://swadebase.cloud
VITE_SWADEBASE_FUNCTIONS_URL=https://swadebase.cloud/functions/v1
VITE_SWADEBASE_PUBLIC_KEY=<SWADEBASE PUBLIC/ANON KEY>
```

Only the public/anon key may be exposed to the browser. Never expose the
service-role key, database password, JWT secret, SMTP password, Backblaze
application key, or other privileged credentials.
