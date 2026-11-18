# Devin-like coding agents - October 26, 2026
Research only; none installed by this task.
Primary candidate: https://github.com/OpenHands/OpenHands - Agent Canvas control center.
Integration engine: https://github.com/OpenHands/software-agent-sdk - Python/TypeScript/REST APIs, file/terminal tools, workspaces and Agent Server. Current repositories document local or container-backed execution.
Lightweight pilot: https://github.com/SWE-agent/mini-swe-agent - MIT-licensed, small shell-based coding agent with local/container environments. Minimal architecture does not guarantee lower total inference cost or equal success.
Assisted repository editing: https://github.com/Aider-AI/aider - Apache-2.0 terminal pair programming with voice, Git integration and testing.
Proposal for SWADEBASE: existing voice/SSS Brain intake -> approved REA brief -> repository-scoped execution sandbox -> tests/diff -> review -> existing deployment route. Use the current coordinator rather than add a second scheduler. Keep Danny's client files, production secrets, shared database and host Docker socket out of an agent workspace by default.
Start with one synthetic repository, one job at a time, a bounded iteration/token/time budget and repository-scoped write access. Validate the selected model on coding tasks; the small CPU model used for case summaries is not evidence of Devin-level coding performance.
Open-source license is not free inference, hosting or operations. Review pinned dependencies and edition/component licenses before deployment. No installation, provider purchase, recurring automation, production execution or additional data access was requested or performed for this research.
