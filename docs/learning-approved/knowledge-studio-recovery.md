# SSS Knowledge Studio: reusable NotebookLM-style project
Source: swadesoul/sssbrain pull request 26, feature/sss-knowledge-studio, commit d6d8d1bdb35bd5b86f404e4c003236defd17bf1c. Inspected October 26, 2026 America/Chicago.
State: open and unmerged; not verified deployed. Proposed route /knowledge-studio.
Existing source implements source selection, cited Q&A, briefing, report, quiz, text mind map, two-host podcast script, video brief, and saving output to knowledge. Scripts are not rendered audio/video.
Review gaps: uploaded files enter brain_sources/wiki but the studio lists knowledge_entries; result saves can attach the wrong current selection instead of the generation snapshot; fallback citation metadata can omit cited sources after context truncation.
Reuse this source before building a duplicate studio. Repair the three gaps, test ownership and provenance, adapt the current application, then deploy and verify. Do not merge the stale branch blindly.
