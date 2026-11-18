# VideoSayWhat transcription recovery baseline
Evidence: Incident Guardian videosaywhat-transcription-recovery-2026-10-16-2dbd665, status resolved. Repository swadesoul/videosaywhat; immutable baseline commit 2dbd66574f3bcb6ab8ad6374c1cc3717e881aa09.
Historical failure: a Replicate-only rollback removed the self-hosted adapter connection.
Resolution: restore the intended self-hosted-first intake connection and protect the working AssemblyAI transcription paths and timestamp conversions. Eligible direct media goes to transcription without unnecessary extraction-provider calls.
Verification limits: the historical working transcription and persisted library output were recorded; this knowledge-indexing release ran no new paid transcription.
Prevention: inspect immutable working source, deploy only owned function aliases, preserve working audio paths, and distinguish extraction failure from transcription failure. Respect source access refusals; no network-identity evasion instructions are included.
