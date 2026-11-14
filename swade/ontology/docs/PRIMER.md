An ontology is the agreed vocabulary and structure for a company's data. It is a shared map of meanings and relations: what something is called, what it means, and how it connects to the rest. Biology does this when it names a species once, so two people do not invent two names for the same animal.

SWADE is that map here. A Track is a recording. An Artist performs it. A Station airs it. A Spin is one airing. Attribution connects an airing to an Order. A Course contains Lessons. A Lesson can unlock an Exam. A Source is teacher-approved material, and its quotations stay in full-text search. Consent, Royalty, and Tenant mean the same thing in every app.

SWADEBOTS agents query SWADE before they act. They reach it through this facade, and only inside the least-privilege scopes an owner approved for that credential. A radio credential can read Track, Station, and Spin. It cannot read Course or Exam.

Agents use the defined meanings. They never invent a new meaning for a term that already exists. If the map cannot support the question, they say so and flag the gap.

Log what you use. Every query records the calling credential and bot, an optional X-Task-Id, the terms touched, and the source tables. The log is append-only. The owner can read it. Agents cannot change or erase it.
