# SWADE ontology primer

An ontology is the agreed vocabulary and structure for the company's data. It is a shared map of what each thing means and how things relate, like biology naming species and how they are related.

Examples: Track, Artist, Station, Spin, Course, Lesson, Student, Customer, and Order. An Artist makes a Track. A Station plays a Track as a Spin. A Student enrolls in a Course, and a Course is made of Lessons. A Customer places an Order.

Agents use the map before they act. Query it to learn what a term means, which system owns it, and how it connects. Do not guess.

Ours is **SWADE**, the SWADEBASE knowledge map. It is built on adopted NVIDIA Auto Ontology and renamed under [standing rule 23](STANDING_RULES.md#swade-naming-for-adopted-open-source-november-13-2026). Agents reach it only through the SWADE facade.

Rules:

- An agent sees only the scopes it is approved for: owner approval plus least privilege.
- Never guess a meaning the map already defines.
- If the map has no term, flag that gap. Do not invent one.

## Information-use logging

Every SWADEBOTS agent must log what information it accessed, used, or referenced for each task. Include the task id, the bot, the ontology terms and entities queried, the data sources (tables, sites, URLs, and files), vault entries touched (entry id or name only, never secret values), the tools used, and the purpose. Logs are append-only and visible to the owner. That gives an audit trail of each bot's information use. The platform also records this automatically, so the agent's own log is a supplement, not the only record. Numbered copy: [standing rule 24](STANDING_RULES.md#information-use-logging-november-14-2026).
