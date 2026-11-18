Vendored from `swadesoul/swade-ecosystem-hub` pull request 66, package `packages/swade-session` (`@swade/session`), commit `2d032d7e14e591a522ac3ffa8b8a20cb16d8a873`.

`index.mjs` is the runtime the SWADEBOTS service imports: Google start, callback, session, sign-out, device list, cookie policy, and `requireRecentAuth`. Cookie flags stay host-only, HttpOnly, Secure, and SameSite=Lax so iPad Safari keeps them on this site.
