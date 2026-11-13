
# Repo Scout brief — 2026-11-02 — The Next New Thing

Video: "Transcriptions on device are blazing fast!" (https://www.youtube.com/watch?v=OHZiDdyoFLk), uploaded 2026-11-02, transcribed 2026-11-07. Status: PROPOSALS awaiting Harold. Redundancy check: Site Bible names, grep of /opt/swadebase/docs and /opt/sssbrain/docs, /opt directory listing on swadesoul and the existing queue (not a deep code audit).

| # | Item | Verdict | Where it fits / what we already have | Cost | First test |
|---|---|---|---|---|---|
| 1 | Fluid Voice / Fluid Meet app — https://github.com/altic-dev/FluidVoice (GPL-3.0) | EXISTS | Already queued as WATCH (2026-11-05 #12): Mac desktop app, Harold is iPad-first, GPL-3 limits reuse. | — | — |
| 2 | Fluid Speech Mini / Pico ASR models (150-250 MB, open weights on Hugging Face) (link not found) | WATCH | Could become a cheap CPU speech-to-text tier behind swade-stt-forward / voice gateway for SSS Brain and DNA Front. Open-weight license terms not verified. | $0 if license allows | Benchmark vs current STT once license is confirmed |
| 3 | Fluid Speech Pro (unreleased, ~622 MB) | WATCH | Not released. | — | None |
| 4 | Context-aware transcript cleanup (fixes names using what's on screen) | EXTEND | Our version: pass a known-names glossary (people, brands, the dictation fixes Harold already set, e.g. Swade, Ameyea, KarriAnne, Leyco, Shamone, Nevaborya) into the STT cleanup step of the voice gateway. No screen capture needed. | $0 | Run the glossary post-processor over 20 stored transcripts; count corrected names |
| 5 | Meeting recordings + transcripts readable by every agent through one skill | EXTEND | SSS Brain manual lists meeting notes; knowledge sync indexes docs. Gap: recorded call/meeting -> local transcript -> indexed so Chief of Staff and bots can answer "what did we decide?" (DNA Front call transcripts too). Consent/recording notice required. | $0 | Index one recorded call and ask SSS Brain a question about it |

Top 3 recommended: #4 (name glossary in STT cleanup), #5 (meetings searchable by agents), #2 (small local STT models, once license is checked).
