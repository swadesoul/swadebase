# Paid Payment Link fulfillment (2026-11-24)

Server-side fulfillment for Payment Links on the shared Swadesoul Stripe account. Live functions are in
`/opt/swadebase/docker/volumes/functions/`, which git ignores, so this folder keeps a reviewable copy.

| Copy here | Live folder | Offer |
|---|---|---|
| `functions/_shared/paidFulfill.ts` | `_shared/paidFulfill.ts` | Shared ledger, buyer, email and refund helpers |
| `functions/stripe-webhook` | `stripe-webhook` | ReSing Lab Pro / Studio (source: swadesoul/resing) |
| `functions/vsw-stripe-webhook` | `vsw-stripe-webhook` | VideoSayWhat Starter / Creator (source: swadesoul/videosaywhat `stripe-webhook`) |
| `functions/abg-stripe-router` | `abg-stripe-router` | ABAGALE Stripe ingress (source: swadesoul/abagale `stripe-router`) |
| `functions/abg-founding-pass-fulfill` | `abg-founding-pass-fulfill` | Abagale TV 2027 Founding Pass |
| `functions/blacktales-stripe-webhook` | `blacktales-stripe-webhook` | Black Tales Film Listing |
| `functions/paid-thanks` | `paid-thanks` | After-payment page for every link above |

Database: `migrations-manual/20261124120000_paid_link_fulfillment.sql` (rollback: `.down.sql`).
It adds `paid_fulfillments` and `paid_buyer_prepare` to each app schema, `abagale.founding_passes`, `blacktales.listing_credits`
and the paid-buyer exception in `sssbrain.enforce_invite_only_signup`.

## Refunds and disputes

| Event | Founding Pass | VideoSayWhat | Black Tales listing |
|---|---|---|---|
| `charge.refunded` (full refund) | pass `refunded`, entitlement `revoked` | plan to free (1 min) | credit `refunded`, film hidden |
| `charge.dispute.created` | pass `suspended`, entitlement `paused` | plan to free; prior plan saved in ledger | credit `suspended`, film hidden |
| `charge.dispute.closed` (won or warning_closed) | `active` again (only from suspended) | prior plan restored (unless refunded) | `active`, film expiry restored |
| `charge.dispute.closed` (lost) | `revoked` | stays free | `revoked` |

Partial refunds change nothing. Disputes don't carry the customer, so VideoSayWhat and Black Tales read it from the charge through the Stripe API.
Founding Pass events reach the handler through `abg-stripe-router`, which already receives `charge.*` on `we_1UNwnR43OPTHaIwnyK0720BK`.

The VideoSayWhat (`we_1UfISo43OPTHaIwnbAJHRBJy`) and Black Tales (`we_1UfISw43OPTHaIwnjQRkUob7`) endpoints also need
`charge.refunded`, `charge.dispute.created` and `charge.dispute.closed` added once this code is live.

## Deploy

```sh
B=/opt/swadebase/backups/refunds-$(date +%Y%m%d%H%M); mkdir -p $B
cd /opt/swadebase/docker/volumes/functions
tar czf $B/functions.tgz _shared/paidFulfill.ts vsw-stripe-webhook abg-stripe-router abg-founding-pass-fulfill blacktales-stripe-webhook
# copy the files from ops/paid-fulfillment/functions over the live folders, then:
cd /opt/swadebase/docker && docker compose -f docker-compose.yml up -d --no-deps functions
```
