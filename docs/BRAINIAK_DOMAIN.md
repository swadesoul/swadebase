# Brainiak domain connection — October 25, 2026

Confirmed domain: brainiak.live (k), not brainiac.live.
Namecheap apex A: 2.25.74.73; www CNAME: brainiak.live. TTL 300.
Replaced only default parking/forward records; backed up prior DNS under /opt/backups/dns-brainiak.live-before-connect-*.json.
SWADEBASE nginx: /etc/nginx/sites-available/brainiak.live.
HTTPS covers apex and www; HTTP redirects to HTTPS. Certbot renewal and nginx reload hook configured.
Root and www redirect to the private ChatGPT review https://brainiak.swadeswade-s-8788.chatgpt.site. This is a redirect front door: the browser displays the ChatGPT destination after opening it, rather than keeping brainiak.live in the address bar. No reverse proxy of ChatGPT authentication and no audience change.
/app redirects to https://swadebase.cloud/brainiak.
/login redirects to https://swadebase.cloud/brainiak/auth/google.
Shared Google callback stays https://swadebase.cloud/auth/v1/callback; application callback stays https://swadebase.cloud/brainiak/auth/callback. No provider or callback changes needed.
Verified authoritative/public DNS, valid HTTPS, exact routing destinations, and existing app health. User Google consent/session not exercised.
Rollback: restore DNS backup and remove only the isolated brainiak.live nginx site after nginx -t. Existing SWADEBASE app and ChatGPT review remain untouched.

## Main-domain correction — October 25, 2026
Observed root and www redirecting to private ChatGPT preview (401 Sign in required for signed-out visitors). Changed HTTPS root fallback to https://swadebase.cloud/brainiak; HTTP still upgrades to HTTPS; /app and /login routes preserved. Both apex and www, HTTP and HTTPS, follow to Brainiak SWADEBASE page with HTTP 200. Browser address changes to swadebase.cloud/brainiak. Private ChatGPT preview audience unchanged. nginx validated and reloaded. Backup: /opt/brainiak/domain-before-frontdoor-fix-20261025.conf. Visual browser and Google consent flow not exercised.
