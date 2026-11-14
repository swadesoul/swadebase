# How apps read SWADE

No other repository is changed by the ontology pull request. Each app gets its own follow-up that adds the client and a credential. The app does not receive a database URL, an engine URL, or a service-role key.

Clients:

- TypeScript: `swade/ontology/sdk/typescript/src/client.ts`
- Python: `swade/ontology/sdk/python/swade_ontology_sdk`

Both clients send `x-swadebots-client: swadebots` and refuse a tenant override. The credential is the scope.

```typescript
import { SwadeClient } from './client.ts'

const swade = new SwadeClient({
  baseUrl: process.env.SWADE_ONTOLOGY_URL ?? '',
  token: process.env.SWADE_ONTOLOGY_TOKEN ?? '',
})

const answer = await swade.ask('how many spins aired')
```

The base URL is the facade, port 8090 in the Coolify file. The token is the app credential, not a platform service-role key.

## Grants

| App id            | Products        | Terms                                        |
| ----------------- | --------------- | -------------------------------------------- |
| `maestro-radio`   | Maestro Radio   | Artist, Track, Station, Spin, Attribution    |
| `swade-radio`     | SWADE Radio     | Artist, Track, Station, Spin, Attribution    |
| `resinglab`       | ReSingLab       | Artist, Track, Station, Spin, Attribution    |
| `black-tales`     | Black Tales     | Radio terms, Consent, Book                   |
| `teachvirt`       | TeachVirt       | Course, Lesson, Exam, Source                 |
| `virtteach`       | VirtTeach       | Course, Lesson, Exam, Source                 |
| `my-distribution` | My Distribution | Order, Royalty, Consent, Tenant              |
| `sss-brain`       | SSS Brain       | Order, Royalty, Consent, Tenant              |
| `swade-personal`  | Personal scope  | Platform terms, tenant `swade-personal` only |

TeachVirt and VirtTeach keep quoted course material on Postgres full-text search. The Source term points at that decision and does not store document bodies.

SSS Brain remains the per-tenant knowledge store. The facade calls it only when `SSS_BRAIN_SEARCH_URL` is configured, and it discards hits for any other tenant.

## Follow-up pull requests

Confirm which repository is actually deployed before opening each one. A GitHub repository is not proof of the running service.

| Follow-up         | Repository to confirm                                                                          | Change                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Maestro Radio     | `swadesoul/maestroradiofactory`, `swadesoul/maestroradio-v7`, or `swadesoul/maestro-assistant` | Add the TypeScript or Python client. Read radio terms only.                                                                             |
| SWADE Radio       | `swadesoul/swade-radio`                                                                        | Same radio terms.                                                                                                                       |
| ReSingLab         | `swadesoul/resing`                                                                             | Same radio terms.                                                                                                                       |
| Black Tales       | `swadesoul/blacktales`                                                                         | Radio terms plus Consent and Book.                                                                                                      |
| TeachVirt         | `swadesoul/teachvirt`                                                                          | Course, Lesson, Exam, and Source. Leave `course_sources` search on full-text search.                                                    |
| VirtTeach         | `swadesoul/virtteach`                                                                          | Same teaching terms.                                                                                                                    |
| My Distribution   | `swadesoul/my-distribution` or `swadesoul/mydistribution`                                      | Order, Royalty, Consent, and Tenant.                                                                                                    |
| SSS Brain         | `swadesoul/sssbrain`                                                                           | Resolve shared terms from SWADE, then read documents through the existing tenant store. Do not ingest customer corpora into the engine. |
| SWADEBOTS console | `swade/bots` in this repository, owned by the console work                                     | Call this facade. Do not copy `catalog/platform.json` into the console.                                                                 |

## MCP

SWADEBOTS connect to `POST /mcp` on the facade. The server name is `swade-ontology` and the title is SWADE. Tools are read-only: `swade_search_terms`, `swade_get_term`, `swade_check_answerable`, `swade_ask`, and `swade_search_documents`. A tool argument cannot set `tenant_id`.

The pinned Auto Ontology MCP stays internal to the engine profile. Apps do not get that URL.
