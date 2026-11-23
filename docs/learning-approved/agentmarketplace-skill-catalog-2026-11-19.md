# Agent Marketplace capability research checkpoint

Status: candidate metadata; not deployed, imported or approved for sale. Source: https://github.com/swadesoul/agentmarketplacediy/tree/review/shared-skills-marketplace-20261119/docs/research/skill-sources-2026-11-19.md

# Skill and capability source catalog

Verified against primary upstream sources: **2026-11-19**. **40 candidates; none enabled, installed, published, or approved for sale.**

This catalog supports a proposed skill attachment bridge around existing SWAGENTS agents and the documented SSS Brain Agent OS workers/workflows/runs/run_steps. The observed SWAGENTS catalog.json / api/catalog lists agents and plans; it is not an executable skill registry. The skill entitlement-to-worker bridge is not yet implemented. SSS Brain remains the supervision point and SWADEBASE remains the adapter/service layer. A second agent runtime, duplicate media stack, or parallel CRM is not the default recommendation.

## What the catalog includes

Instruction libraries contain guidance a model follows. Tools perform a bounded operation. Runtimes coordinate or expose capabilities. Applications are larger services with deployment and maintenance costs. Each JSON record identifies its kind, proposed agent roles and work types, runtime, permissions, provider needs, costs, license evidence, and uncompleted release gates.

## First useful pilots

1. **Promotion skills:** select a few Marketing Skills procedures for product positioning, comparison pages, landing-page review, and opt-in campaigns. Reuse each site’s brand brief and existing publishing controls.
2. **SWAGENTS capability bridge:** map approved skills and tools to existing agents through a proposed capability registry/attachment adapter; use MCP SDK/FastMCP only where an adapter is missing. Start Frenemy as an internal developer experiment with existing model subscriptions, one builder, and one reviewer.
3. **Reliable outputs:** use the existing Playwright runner and small Promptfoo evaluation sets to verify that skills actually work before listing them.
4. **Music utilities:** expose librosa analysis and Basic Pitch MIDI drafts through the existing ReSingLab/media adapter. Neither requires paying for a generative music model to perform its core operation.
5. **Episode production:** reuse FFmpeg and existing video orchestration; consider MoviePy or Manim only for specific assembly or educational animation gaps.
6. **Document intake:** select MarkItDown or Docling for extraction, OCRmyPDF for scans, and reviewed Presidio steps for redaction. These operations do not authenticate financial assets or establish legal conclusions.

## Licensing and naming findings that affect packaging

- **OpenAI:** the old `openai/skills` repository is deprecated and points to `openai/plugins`. A blanket license for every current plugin was not established; selected plugin files require explicit review.
- **Anthropic:** its current Skills README describes the document skills as Apache-2.0, unlike older descriptions. Verify the chosen folder at a pinned commit before bundling.
- **ECC:** `affaan-m/everything-claude-code` now redirects to `affaan-m/ECC`.
- **Scientific Agent Skills:** the old Claude Scientific Skills name redirects to the new repository, and upstream explicitly warns that individual skill licenses can differ from its MIT repository license.
- **Trail of Bits:** its skills use CC-BY-SA-4.0, which needs attribution/share-alike consideration.
- **MCP TypeScript SDK:** current licensing is transitioning from MIT to Apache-2.0, with a separate documentation license.
- **Presidio:** the old Microsoft repository URL redirects to `data-privacy-stack/presidio`.
- **LiteLLM, Chatwoot, Activepieces, and Novu:** permissive community/core code does not grant rights to commercial enterprise directories.
- **Remotion and n8n:** these have custom/source-available licensing restrictions. Keep them in a license-review watchlist rather than promoting them as unrestricted open-source resale components.
- **FFmpeg:** obligations depend on the actual build, optional GPL components, codecs, and external libraries.

## Catalog

All fits and packaging ideas below are recommendations. Source descriptions and license evidence are linked to the upstream repositories. No compatibility or production-readiness claim is made.

### Skills and growth

#### 1. Marketing Skills

- **Source:** [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)
- **Type / status:** instruction; candidate only; priority: first-pilot.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/LICENSE).
- **What it does:** Marketing instructions for copywriting, conversion optimization, SEO, analytics, and growth workflows.
- **Fit:** AgentMarketplace, Maestro Radio, ReSingLab, SWOSTing.
- **Suggested SWAGENTS roles:** Growth planner, SEO editor, Conversion reviewer.
- **Work types:** campaign planning, landing-page review, comparison-page drafts.
- **Runtime:** SKILL.md instructions for compatible coding/agent hosts; selected scripts may require Node or provider tools.
- **Providers:** Existing authorized agent model; optional analytics and marketing accounts for connected workflows.
- **Cost boundary:** Instruction reuse does not include model usage, search data, ad budgets, email delivery, or third-party subscriptions.
- **Requested permissions:** read approved brand brief, read public sources, write draft artifacts.
- **Packaging proposal:** Curate a small branded promotion kit, with examples and acceptance checks; retain upstream notices.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

### Agent integration

#### 2. Frenemy

- **Source:** [noblehacks/frenemy](https://github.com/noblehacks/frenemy)
- **Type / status:** runtime; candidate only; priority: first-pilot.
- **License:** MIT. [Primary evidence](https://github.com/noblehacks/frenemy/blob/main/LICENSE).
- **What it does:** Local relays let supported signed-in AI coding clients consult one another or perform scoped file work; Snitch displays local job status.
- **Fit:** Swagents, SWOSTing, AgentMarketplace.
- **Suggested SWAGENTS roles:** Developer dispatcher, Independent code reviewer.
- **Work types:** second-opinion review, parallel bounded development, job reporting.
- **Runtime:** Node.js; installed Claude Code, Codex, Antigravity agy, or Kimi Code clients; VS Code optional for Snitch.
- **Providers:** At least two supported signed-in native clients; provider access and terms remain applicable.
- **Cost boundary:** Bridge code is free, but provider subscriptions and quotas remain. Begin with existing clients and one builder plus one reviewer; do not use consumer sessions to serve unrelated customers.
- **Requested permissions:** read approved repository, write isolated work copy, invoke selected native clients, emit job receipts.
- **Packaging proposal:** Internal developer adapter feeding existing SWAGENTS tasks and status; no separate orchestration product.
- **Review note:** Author reports live routes mainly on Mac; Kimi route and Gemini/Kimi driver roles were not confirmed in release testing. Work copies are not a security sandbox.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

### Skills and growth

#### 3. Anthropic Skills

- **Source:** [anthropics/skills](https://github.com/anthropics/skills)
- **Type / status:** instruction; candidate only; priority: first-pilot.
- **License:** Apache-2.0 for skills described in current README; selected-folder review required. [Primary evidence](https://raw.githubusercontent.com/anthropics/skills/main/README.md).
- **What it does:** Examples of reusable skills for document work, design, development, testing, and business workflows.
- **Fit:** AgentMarketplace, Swagents, SWOSTing, Cochrane.
- **Suggested SWAGENTS roles:** Skill packager, Document producer, QA assistant.
- **Work types:** skill authoring, document drafting, workflow templates.
- **Runtime:** SKILL.md folders with optional scripts and dependencies; adapt to the existing supported host.
- **Providers:** Existing agent model; dependencies vary per selected skill.
- **Cost boundary:** No model usage or document tool runtime is included in an instruction license. Load only selected skills.
- **Requested permissions:** read approved inputs, write draft documents, run reviewed scripts in isolated workspace.
- **Packaging proposal:** Use selected examples to improve SWAGENTS skill structure and original branded task packs.
- **Review note:** Current upstream README explicitly describes both example and document skills as Apache-2.0. This supersedes older descriptions that called document skills source-available; verify each selected folder and pinned revision before redistribution.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 4. OpenAI Plugins

- **Source:** [openai/plugins](https://github.com/openai/plugins)
- **Type / status:** instruction; candidate only; priority: license-review.
- **License:** Per-plugin / asset license not established by repository README. [Primary evidence](https://raw.githubusercontent.com/openai/plugins/main/README.md).
- **What it does:** Current curated Codex plugin examples combine manifests, skills, MCP configuration, hooks, commands, and supporting files.
- **Fit:** Swagents, AgentMarketplace, SWOSTing.
- **Suggested SWAGENTS roles:** Skill packager, Connector designer.
- **Work types:** plugin packaging, capability manifest design.
- **Runtime:** Codex plugin layout; compatibility must be checked against the target SWAGENTS adapter rather than assumed.
- **Providers:** Existing compatible agent; each connector has its own authentication and service requirements.
- **Cost boundary:** Connected services and model usage may be paid. Public repository access alone is not a redistribution grant.
- **Requested permissions:** read public examples, write original package metadata.
- **Packaging proposal:** Use as a packaging reference. Do not copy a plugin into a paid bundle until its actual license and assets are reviewed.
- **Review note:** openai/skills is deprecated and directs users here. No blanket repository license was verified; each selected plugin needs explicit rights review.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 5. Superpowers

- **Source:** [obra/superpowers](https://github.com/obra/superpowers)
- **Type / status:** instruction; candidate only; priority: first-pilot.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/obra/superpowers/main/LICENSE).
- **What it does:** Skills and a development method for structured planning, implementation, review, and verification.
- **Fit:** Swagents, AgentMarketplace, SWOSTing.
- **Suggested SWAGENTS roles:** Development lead, Code reviewer, QA coordinator.
- **Work types:** planning, bounded implementation, review and verification.
- **Runtime:** Agent skill/plugin instructions; host-specific installation and hooks need selective adaptation.
- **Providers:** Existing authorized coding model.
- **Cost boundary:** Longer workflows can increase model usage; retain only steps that reduce defects or rework for the task.
- **Requested permissions:** read approved repository, write task plans, run authorized checks.
- **Packaging proposal:** Adapt selected review and planning procedures to existing SWAGENTS roles; avoid replacing the runtime.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 6. ECC / Everything Claude Code

- **Source:** [affaan-m/ECC](https://github.com/affaan-m/ECC)
- **Type / status:** instruction; candidate only; priority: evaluate.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/affaan-m/ECC/main/LICENSE).
- **What it does:** An agent harness optimization collection containing skills, memory patterns, security guidance, and development workflows.
- **Fit:** Swagents, SWOSTing, AgentMarketplace.
- **Suggested SWAGENTS roles:** Agent operations reviewer, Developer assistant.
- **Work types:** context reduction, agent workflow review, development assistance.
- **Runtime:** Multi-host agent configuration and skills; optional hooks and scripts require separate review.
- **Providers:** Selected supported coding host and its model access.
- **Cost boundary:** Model usage remains billed or quota-limited; installing a large collection can increase context and maintenance costs.
- **Requested permissions:** read approved project context, write reviewed configuration drafts.
- **Packaging proposal:** Extract a small set of context and review patterns; do not import all hooks or grant broad tools.
- **Review note:** Repository formerly named everything-claude-code redirects to ECC; retain canonical URL and pin a reviewed revision.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 7. Claude Skills by Alireza Rezvani

- **Source:** [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
- **Type / status:** instruction; candidate only; priority: evaluate.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/alirezarezvani/claude-skills/main/LICENSE).
- **What it does:** Agent skills and references spanning engineering, marketing, product, operations, and research.
- **Fit:** Swagents, AgentMarketplace, SWOSTing.
- **Suggested SWAGENTS roles:** Product strategist, Marketing editor, Operations analyst.
- **Work types:** product planning, workflow documentation, specialist task guidance.
- **Runtime:** SKILL.md and optional scripts/references; host compatibility and selected dependencies need testing.
- **Providers:** Existing agent model; optional service connectors vary by skill.
- **Cost boundary:** Free instructions do not cover hosted service access or the model that follows them.
- **Requested permissions:** read scoped briefs, write drafts, use specifically reviewed connector.
- **Packaging proposal:** Curate by role and work type, with brand examples and a short acceptance checklist.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 8. Full-Stack Developer Skills

- **Source:** [Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills)
- **Type / status:** instruction; candidate only; priority: evaluate.
- **License:** MIT. [Primary evidence](https://github.com/Jeffallan/claude-skills/blob/main/LICENSE).
- **What it does:** Specialized development skills cover frameworks, infrastructure, APIs, testing, security, and data workflows.
- **Fit:** Swagents, SWOSTing, AgentMarketplace.
- **Suggested SWAGENTS roles:** Full-stack developer, Infrastructure reviewer, Test reviewer.
- **Work types:** application work, debugging, deployment preparation.
- **Runtime:** Coding-agent skills; some documented workflow commands require Atlassian MCP.
- **Providers:** Existing agent model; Atlassian access only for the workflows that use it.
- **Cost boundary:** Avoid adding Jira/Confluence subscriptions merely to use optional examples.
- **Requested permissions:** read assigned source files, write isolated changes, run authorized local checks.
- **Packaging proposal:** Package selected development role instructions for SWADEBASE projects; use existing task boards.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 9. Scientific Agent Skills

- **Source:** [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills)
- **Type / status:** instruction; candidate only; priority: license-review.
- **License:** MIT repository; individual skills may specify different licenses. [Primary evidence](https://raw.githubusercontent.com/K-Dense-AI/scientific-agent-skills/main/LICENSE.md).
- **What it does:** Scientific and data-analysis skills with references to research tools and scientific databases.
- **Fit:** Swagents, AssetMachine, Cochrane, AgentMarketplace.
- **Suggested SWAGENTS roles:** Research analyst, Data quality reviewer.
- **Work types:** literature organization, data analysis, evidence tables.
- **Runtime:** Agent Skills format; Python packages, databases, or compute requirements depend on the selected skill.
- **Providers:** Existing model; selected databases or cloud services may require credentials.
- **Cost boundary:** Local analysis can use existing CPU capacity; scientific databases, cloud compute, and hosted inference have separate costs.
- **Requested permissions:** read approved research inputs, read permitted public databases, write cited drafts.
- **Packaging proposal:** Consider selected research and data methods; do not imply scientific skills authenticate assets or establish legal conclusions.
- **Review note:** Upstream explicitly warns that each SKILL.md license can differ from the MIT repository license. Former name claude-scientific-skills redirects here.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 10. Trail of Bits Skills

- **Source:** [trailofbits/skills](https://github.com/trailofbits/skills)
- **Type / status:** instruction; candidate only; priority: license-review.
- **License:** CC-BY-SA-4.0. [Primary evidence](https://github.com/trailofbits/skills/blob/main/LICENSE).
- **What it does:** Skills and plugins for security analysis, testing, vulnerability research, and audit workflows.
- **Fit:** Swagents, SWOSTing, AssetMachine, AgentMarketplace.
- **Suggested SWAGENTS roles:** Security reviewer, Code audit assistant.
- **Work types:** authorized security review, vulnerability triage, audit preparation.
- **Runtime:** Agent skills/plugins with tool requirements varying by selected workflow.
- **Providers:** Existing model; optional security tools.
- **Cost boundary:** Security tools and model usage can add cost. Restrict to owned or explicitly authorized systems.
- **Requested permissions:** read authorized source, run bounded authorized scanners, write findings.
- **Packaging proposal:** Use selected internal review procedures; review attribution and share-alike obligations before selling modified skill content.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 11. Awesome Copilot

- **Source:** [github/awesome-copilot](https://github.com/github/awesome-copilot)
- **Type / status:** instruction; candidate only; priority: evaluate.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/github/awesome-copilot/main/LICENSE).
- **What it does:** Community instructions, agents, skills, and configuration examples for development workflows.
- **Fit:** Swagents, SWOSTing, AgentMarketplace.
- **Suggested SWAGENTS roles:** Developer assistant, Skill curator.
- **Work types:** role instructions, review checklists, workflow examples.
- **Runtime:** Primarily GitHub Copilot conventions; adapt instructions to SWAGENTS and test host-specific features.
- **Providers:** No exclusive provider for copied instruction text; original integrations may require Copilot or GitHub services.
- **Cost boundary:** An instruction collection does not grant paid Copilot features or third-party service access.
- **Requested permissions:** read approved source and briefs, write reviewed skill drafts.
- **Packaging proposal:** Use as a reference pool, not a wholesale skill import.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

### Agent integration

#### 12. MCP TypeScript SDK

- **Source:** [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- **Type / status:** runtime; candidate only; priority: first-pilot.
- **License:** Apache-2.0 new code + remaining MIT code; documentation CC-BY-4.0. [Primary evidence](https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/LICENSE).
- **What it does:** Official SDK for building MCP servers and clients.
- **Fit:** Swagents, AgentMarketplace, SWOSTing.
- **Suggested SWAGENTS roles:** Connector engineer.
- **Work types:** tool adapters, capability discovery, typed tool calls.
- **Runtime:** TypeScript / Node.js; use the existing SWADEBASE MCP service rather than adding parallel infrastructure.
- **Providers:** No inference provider required by the transport itself.
- **Cost boundary:** Hosting and connected APIs still cost money; every exposed tool needs its own authorization.
- **Requested permissions:** define scoped tool schemas, call existing authenticated adapters.
- **Packaging proposal:** Use for a thin capability bridge from reviewed catalog entries to existing SWAGENTS tools.
- **Review note:** Upstream is transitioning from MIT to Apache-2.0. Preserve the relevant notices and documentation attribution; do not label the whole current tree MIT.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 13. OpenAI Agents SDK for Python

- **Source:** [openai/openai-agents-python](https://github.com/openai/openai-agents-python)
- **Type / status:** runtime; candidate only; priority: evaluate.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/openai/openai-agents-python/main/LICENSE).
- **What it does:** Python framework for agent workflows and tool-driven coordination.
- **Fit:** Swagents.
- **Suggested SWAGENTS roles:** Agent integration engineer.
- **Work types:** bounded agent execution, handoffs, tool orchestration.
- **Runtime:** Python SDK; only adopt a capability missing from the existing Agent OS.
- **Providers:** Configured model provider; supported model routes must be verified.
- **Cost boundary:** SDK license does not include inference, tracing service, or external tool costs.
- **Requested permissions:** invoke approved models, call scoped existing tools.
- **Packaging proposal:** Reference or narrowly scoped adapter; avoid replacing the current agent system.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 14. LangGraph

- **Source:** [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)
- **Type / status:** runtime; candidate only; priority: evaluate.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/langchain-ai/langgraph/main/LICENSE).
- **What it does:** Framework for stateful agent workflows and resilient orchestration.
- **Fit:** Swagents, AssetMachine, Cochrane.
- **Suggested SWAGENTS roles:** Workflow engineer.
- **Work types:** stateful review flows, checkpointed workflows.
- **Runtime:** Python or corresponding supported ecosystem packages; integrate only if current orchestration lacks a needed capability.
- **Providers:** Models and external tools selected by the application.
- **Cost boundary:** Open-source framework use is separate from hosted platform and model costs.
- **Requested permissions:** read scoped task state, write workflow checkpoints, call approved tools.
- **Packaging proposal:** Borrow state and recovery patterns for existing SWAGENTS jobs instead of introducing a second scheduler.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 15. LiteLLM

- **Source:** [BerriAI/litellm](https://github.com/BerriAI/litellm)
- **Type / status:** runtime; candidate only; priority: evaluate.
- **License:** MIT core; enterprise directory separately licensed. [Primary evidence](https://raw.githubusercontent.com/BerriAI/litellm/main/LICENSE).
- **What it does:** An LLM gateway and SDK with provider routing, usage logging, and cost-related controls.
- **Fit:** Swagents, SWOSTing, AgentMarketplace.
- **Suggested SWAGENTS roles:** Provider operations engineer, Usage analyst.
- **Work types:** model routing, usage tracking, provider failover.
- **Runtime:** Gateway/SDK service; compare against the already existing SWADEBASE model adapter before adding it.
- **Providers:** Existing approved provider credentials or supported local model endpoints.
- **Cost boundary:** Provider inference remains chargeable. Do not enable paid fallback or enterprise features without specific authorization.
- **Requested permissions:** access scoped provider secrets via existing vault, emit usage logs.
- **Packaging proposal:** Only fill verified routing or usage gaps; keep one authoritative provider adapter.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 16. FastMCP

- **Source:** [PrefectHQ/fastmcp](https://github.com/PrefectHQ/fastmcp)
- **Type / status:** runtime; candidate only; priority: first-pilot.
- **License:** Apache-2.0. [Primary evidence](https://github.com/PrefectHQ/fastmcp#license).
- **What it does:** Python tooling for building MCP servers and clients.
- **Fit:** Swagents, ReSingLab, AssetMachine.
- **Suggested SWAGENTS roles:** Python adapter engineer.
- **Work types:** wrap local tools, typed MCP capabilities.
- **Runtime:** Python; suitable for exposing existing audio and document tools through the current MCP boundary.
- **Providers:** No model provider required by MCP plumbing.
- **Cost boundary:** Connected services and hosted execution are separate; local tools still consume server resources.
- **Requested permissions:** read approved tool inputs, write scoped artifacts, expose authenticated MCP endpoints.
- **Packaging proposal:** A small proposed adapter layer around existing Python tools, with one tool policy per operation.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

### Development and quality

#### 17. Playwright

- **Source:** [microsoft/playwright](https://github.com/microsoft/playwright)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** Apache-2.0. [Primary evidence](https://raw.githubusercontent.com/microsoft/playwright/main/LICENSE).
- **What it does:** Browser testing and automation across Chromium, Firefox, and WebKit.
- **Fit:** Swagents, SWOSTing, AgentMarketplace, Maestro Radio, ReSingLab.
- **Suggested SWAGENTS roles:** Site QA agent, Release verifier.
- **Work types:** browser smoke tests, checkout navigation checks, responsive UI checks.
- **Runtime:** Node.js or supported bindings with browser binaries; use the approved existing browser runner.
- **Providers:** No LLM required for deterministic tests.
- **Cost boundary:** Browser compute and storage remain; avoid launching a new paid VM or browser service when an approved runner exists.
- **Requested permissions:** visit authorized sites, read rendered UI, use non-chargeable test flows.
- **Packaging proposal:** Create branded acceptance-test packs and attach evidence to SWAGENTS jobs.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 18. Promptfoo

- **Source:** [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/promptfoo/promptfoo/main/LICENSE).
- **What it does:** Tools to evaluate prompts, agents, and retrieval systems with repeatable test configurations.
- **Fit:** Swagents, AgentMarketplace, Cochrane, AssetMachine.
- **Suggested SWAGENTS roles:** Agent evaluator, Regression reviewer.
- **Work types:** prompt regression checks, provider comparisons, retrieval evaluation.
- **Runtime:** Node.js CLI and configuration; evaluate existing adapters rather than building a separate evaluation service.
- **Providers:** Chosen model endpoints; deterministic assertions need no additional judge model.
- **Cost boundary:** Evaluations can multiply model calls. Use a small representative dataset and bounded budgets; avoid unnecessary model judges.
- **Requested permissions:** read approved synthetic or redacted fixtures, call approved model endpoints, write evaluation reports.
- **Packaging proposal:** Validation packs for marketplace skills: expected outputs, failure cases, and cost measurements.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 19. Browser Use

- **Source:** [browser-use/browser-use](https://github.com/browser-use/browser-use)
- **Type / status:** tool; candidate only; priority: evaluate.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/browser-use/browser-use/main/LICENSE).
- **What it does:** Python library for AI-directed browser tasks, with a separate hosted cloud offering.
- **Fit:** Swagents, SWOSTing.
- **Suggested SWAGENTS roles:** Browser task agent.
- **Work types:** UI-assisted operations, browser task drafts.
- **Runtime:** Python with a browser and compatible agent model; reuse current browser controls where adequate.
- **Providers:** A model provider for AI-directed work; cloud browser service is optional and separate.
- **Cost boundary:** AI browser loops can be expensive and brittle. Prefer deterministic APIs/tests where possible; bound steps and runtime.
- **Requested permissions:** navigate authorized sites, read visible content, perform specifically authorized actions.
- **Packaging proposal:** Candidate for gaps in the existing browser adapter, not an additional default browsing system.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

### Research and content

#### 20. Crawl4AI

- **Source:** [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** Apache-2.0. [Primary evidence](https://raw.githubusercontent.com/unclecode/crawl4ai/main/LICENSE).
- **What it does:** Self-hostable crawler and extraction toolkit for collecting structured web content.
- **Fit:** Swagents, AgentMarketplace, AssetMachine, Cochrane.
- **Suggested SWAGENTS roles:** Source researcher, Directory researcher.
- **Work types:** public-source extraction, research snapshots, directory drafts.
- **Runtime:** Python and browser dependencies; run through the current research adapter.
- **Providers:** Basic extraction can be local; optional LLM extraction or hosted service requires the relevant provider.
- **Cost boundary:** Crawling still uses bandwidth and CPU; respect source access rules and rate limits. Hosted credits and proxy services are separate.
- **Requested permissions:** read permitted public web sources, write attributed research artifacts.
- **Packaging proposal:** A source collection skill using existing infrastructure, with URL/date provenance.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 21. Firecrawl

- **Source:** [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl)
- **Type / status:** app; candidate only; priority: license-review.
- **License:** AGPL-3.0 core; selected SDKs and services may differ. [Primary evidence](https://raw.githubusercontent.com/firecrawl/firecrawl/main/LICENSE).
- **What it does:** Web-data infrastructure for search, scraping, and extraction.
- **Fit:** Swagents, AssetMachine, AgentMarketplace.
- **Suggested SWAGENTS roles:** Research integration engineer.
- **Work types:** web data collection, structured extraction.
- **Runtime:** Self-hosted service or hosted API; assess overlap with the existing crawler before adoption.
- **Providers:** Hosted API credentials if using its cloud; local infrastructure and any optional extraction providers if self-hosting.
- **Cost boundary:** Open-source code does not include hosted API credits, premium data sources, proxies, or full cloud feature parity.
- **Requested permissions:** read permitted sources, write attributed records.
- **Packaging proposal:** Keep as an alternative candidate; prefer the lighter existing extraction route unless a measured gap justifies a service.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 22. MarkItDown

- **Source:** [microsoft/markitdown](https://github.com/microsoft/markitdown)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** MIT. [Primary evidence](https://raw.githubusercontent.com/microsoft/markitdown/main/LICENSE).
- **What it does:** Python conversion tools that turn supported files and office documents into Markdown.
- **Fit:** Swagents, AssetMachine, Cochrane, AgentMarketplace.
- **Suggested SWAGENTS roles:** Document intake agent, Knowledge organizer.
- **Work types:** document text extraction, knowledge preparation.
- **Runtime:** Python with optional format-specific packages; reuse the current document intake adapter.
- **Providers:** No paid model required for ordinary supported-format conversion; optional advanced integrations vary.
- **Cost boundary:** Conversion consumes CPU and may need additional format libraries. OCR or AI descriptions can have extra dependencies/costs.
- **Requested permissions:** read user-approved files, write derived text in scoped workspace.
- **Packaging proposal:** Document intake skill with preserved source-file references and explicit extraction limits.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 23. Docling

- **Source:** [docling-project/docling](https://github.com/docling-project/docling)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** MIT code; model and dependency licenses reviewed separately. [Primary evidence](https://raw.githubusercontent.com/docling-project/docling/main/LICENSE).
- **What it does:** Document parsing and conversion tooling for structured AI-ready document content.
- **Fit:** Swagents, AssetMachine, Cochrane.
- **Suggested SWAGENTS roles:** Document analyst.
- **Work types:** structured extraction, tables and layouts, research preparation.
- **Runtime:** Python and selected parsing/OCR models; choose suitable CPU or GPU execution through existing adapters.
- **Providers:** Selected local models; optional remote providers if explicitly configured.
- **Cost boundary:** Model downloads and compute are separate from code licensing; do not assume every optional model is commercially reusable.
- **Requested permissions:** read approved documents, write structured extracts, use scoped local models.
- **Packaging proposal:** Enhance existing intake for difficult layouts; conversion does not establish document authenticity.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 24. Presidio

- **Source:** [data-privacy-stack/presidio](https://github.com/data-privacy-stack/presidio)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** MIT. [Primary evidence](https://github.com/data-privacy-stack/presidio#license).
- **What it does:** Framework for detecting and transforming sensitive information in text, images, and structured data.
- **Fit:** Swagents, AssetMachine, Cochrane, AgentMarketplace.
- **Suggested SWAGENTS roles:** Privacy reviewer, Intake redaction assistant.
- **Work types:** PII detection, redaction preparation.
- **Runtime:** Python with selected NLP models and recognizers; pipeline accuracy requires domain-specific review.
- **Providers:** Can use local NLP models; optional integrations have separate requirements.
- **Cost boundary:** Local execution uses compute. Model licensing and false negatives require review; it is not a guarantee that all sensitive data is removed.
- **Requested permissions:** read specifically authorized sensitive input, write reviewed redacted copies.
- **Packaging proposal:** Add a reviewed redaction step before sending appropriate content to external models.
- **Review note:** The microsoft/presidio URL redirects to data-privacy-stack/presidio. Preserve the new canonical source.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 25. OCRmyPDF

- **Source:** [ocrmypdf/OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF)
- **Type / status:** tool; candidate only; priority: evaluate.
- **License:** MPL-2.0; external OCR/PDF dependencies separately licensed. [Primary evidence](https://github.com/ocrmypdf/OCRmyPDF#license).
- **What it does:** Adds a searchable OCR text layer to scanned PDFs.
- **Fit:** Swagents, AssetMachine, Cochrane.
- **Suggested SWAGENTS roles:** Scanned-document intake agent.
- **Work types:** OCR, searchable PDF preparation.
- **Runtime:** Python command-line tool with external OCR/PDF utilities.
- **Providers:** No paid inference provider is required for its local workflow.
- **Cost boundary:** CPU time, language data, and dependency licensing remain. OCR accuracy must be checked for important document fields.
- **Requested permissions:** read approved PDF, write searchable derivative PDF.
- **Packaging proposal:** Use through existing intake; retain original evidence and mark OCR as extracted text.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

### Media and music

#### 26. Faster Whisper

- **Source:** [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** MIT code; chosen model artifacts reviewed separately. [Primary evidence](https://raw.githubusercontent.com/SYSTRAN/faster-whisper/master/LICENSE).
- **What it does:** Whisper transcription implementation using CTranslate2.
- **Fit:** Swagents, ReSingLab, Maestro Radio, Swarvis/BlackTales.
- **Suggested SWAGENTS roles:** Transcription worker, Caption editor.
- **Work types:** speech transcription, caption drafts.
- **Runtime:** Python / CTranslate2 with a supported CPU or GPU runtime and a selected model.
- **Providers:** Local model artifacts; no hosted speech API is required for local execution.
- **Cost boundary:** Compute and storage remain; benchmark existing transcription infrastructure before replacing it. Captions need review.
- **Requested permissions:** read approved audio or video, write transcript and caption artifacts.
- **Packaging proposal:** Expose through the existing SWADEBASE transcription/video adapter, with language and quality checks.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 27. librosa

- **Source:** [librosa/librosa](https://github.com/librosa/librosa)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** ISC. [Primary evidence](https://raw.githubusercontent.com/librosa/librosa/main/LICENSE.md).
- **What it does:** Python audio and music analysis library.
- **Fit:** Swagents, ReSingLab, Maestro Radio.
- **Suggested SWAGENTS roles:** Audio analysis worker, Music librarian.
- **Work types:** tempo analysis, audio features, technical audio inspection.
- **Runtime:** Python / NumPy/SciPy stack; local CPU jobs suit many analyses.
- **Providers:** No paid LLM or music-generation provider required for analysis.
- **Cost boundary:** CPU and storage still apply; tempo and feature estimates require validation and are not ownership or ISRC verification.
- **Requested permissions:** read approved audio, write analysis metadata.
- **Packaging proposal:** Create an audio-inspection skill behind the current media adapter; avoid a new music application.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 28. Basic Pitch

- **Source:** [spotify/basic-pitch](https://github.com/spotify/basic-pitch)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** Apache-2.0 repository; verify selected model/asset notices. [Primary evidence](https://github.com/spotify/basic-pitch#license).
- **What it does:** Audio-to-MIDI conversion with pitch-bend detection.
- **Fit:** Swagents, ReSingLab.
- **Suggested SWAGENTS roles:** MIDI transcription assistant.
- **Work types:** note transcription, MIDI draft generation.
- **Runtime:** Python with supported model runtime; optional corresponding client implementations need separate testing.
- **Providers:** Local model/runtime; no paid text model is required for core conversion.
- **Cost boundary:** Inference uses local compute; dense mixes and instrument ambiguity can require manual musical correction.
- **Requested permissions:** read user-approved music, write MIDI drafts.
- **Packaging proposal:** A music utility skill that generates editable MIDI drafts; it does not transcribe lyrics or grant music rights.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 29. MoviePy

- **Source:** [Zulko/moviepy](https://github.com/Zulko/moviepy)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** MIT code; FFmpeg and media asset licenses separate. [Primary evidence](https://github.com/Zulko/moviepy#license).
- **What it does:** Python video editing and composition library.
- **Fit:** Swagents, Swarvis/BlackTales, ReSingLab, AgentMarketplace.
- **Suggested SWAGENTS roles:** Video assembly worker.
- **Work types:** clip assembly, titles and overlays, export variants.
- **Runtime:** Python with multimedia dependencies such as FFmpeg; attach to the existing video adapter.
- **Providers:** No generative AI provider required for deterministic editing.
- **Cost boundary:** Video processing uses CPU/GPU and storage. Music, footage, fonts, and codec licenses are separate.
- **Requested permissions:** read approved media, write rendered outputs.
- **Packaging proposal:** Reusable assembly recipes for existing episode workflows, with synchronized captions and audio.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 30. Manim Community

- **Source:** [ManimCommunity/manim](https://github.com/ManimCommunity/manim)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** MIT code; third-party assets and dependencies separate. [Primary evidence](https://github.com/ManimCommunity/manim#license).
- **What it does:** Python framework for programmatic mathematical and explanatory animations.
- **Fit:** Swagents, Swarvis/BlackTales, AgentMarketplace.
- **Suggested SWAGENTS roles:** Educational animation worker.
- **Work types:** diagram animation, lesson motion graphics.
- **Runtime:** Python rendering stack; LaTeX and media dependencies vary by scene.
- **Providers:** No paid video model required for programmatic scenes.
- **Cost boundary:** Render compute, fonts, images, and any commissioned narration/music remain separate.
- **Requested permissions:** read approved lesson script, write scene code and rendered media.
- **Packaging proposal:** Use for precise lesson segments while keeping the established character/video production workflow.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 31. FFmpeg

- **Source:** [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg)
- **Type / status:** tool; candidate only; priority: first-pilot.
- **License:** Primarily LGPL-2.1-or-later; GPL and other options depend on build. [Primary evidence](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/LICENSE.md).
- **What it does:** Multimedia processing toolkit used for conversion, filtering, mixing, and media assembly.
- **Fit:** Swagents, Maestro Radio, ReSingLab, Swarvis/BlackTales.
- **Suggested SWAGENTS roles:** Media processing worker.
- **Work types:** transcoding, audio mixing, episode assembly, caption burn-in.
- **Runtime:** Native command-line binaries and libraries; reuse the installed approved build.
- **Providers:** No paid AI provider required for deterministic processing.
- **Cost boundary:** Render compute/storage remain; the build flags, codecs, external libraries, and distribution method change obligations.
- **Requested permissions:** read approved media, write scoped transformed outputs.
- **Packaging proposal:** Build reviewed command recipes within the existing media adapter, not another rendering service.
- **Review note:** Upstream documents optional GPL components and incompatible nonfree combinations. Record the actual binary build configuration before redistribution.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 32. Remotion

- **Source:** [remotion-dev/remotion](https://github.com/remotion-dev/remotion)
- **Type / status:** tool; candidate only; priority: license-review.
- **License:** Custom Remotion license; not a blanket open-source resale grant. [Primary evidence](https://raw.githubusercontent.com/remotion-dev/remotion/main/LICENSE.md).
- **What it does:** React-based programmatic video creation.
- **Fit:** Swagents, Swarvis/BlackTales, AgentMarketplace.
- **Suggested SWAGENTS roles:** Video template engineer.
- **Work types:** React video compositions, motion templates.
- **Runtime:** Node.js / React rendering; consider only after checking current entity and product-use eligibility.
- **Providers:** No paid generative model required for deterministic compositions; rendering infrastructure is separate.
- **Cost boundary:** Company licensing can be required. The reviewed license restricts selling/renting/licensing a derivative of Remotion; do not assume marketplace bundling is allowed.
- **Requested permissions:** read approved media, write original compositions.
- **Packaging proposal:** Watchlist for original video outputs or templates after license review; prefer existing permitted media tools for immediate work.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

### Business and support

#### 33. Chatwoot

- **Source:** [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot)
- **Type / status:** app; candidate only; priority: evaluate.
- **License:** MIT core; enterprise and third-party components separately licensed. [Primary evidence](https://raw.githubusercontent.com/chatwoot/chatwoot/develop/LICENSE).
- **What it does:** Customer conversation and support inbox with multiple communication channels.
- **Fit:** Swagents, AgentMarketplace, Maestro Radio, ReSingLab, SWOSTing.
- **Suggested SWAGENTS roles:** Support triage agent, Customer success assistant.
- **Work types:** inbox triage, reply drafts, support handoff.
- **Runtime:** Self-hosted Rails application and its data services; connect via approved existing infrastructure.
- **Providers:** Channel accounts/services; SWAGENTS model can be connected through a reviewed bot adapter.
- **Cost boundary:** Email/SMS/WhatsApp delivery, hosting, and any paid enterprise features remain separate.
- **Requested permissions:** read assigned support conversations, draft replies, send only within explicit approved policy.
- **Packaging proposal:** Host-level support integration or a managed setup service, reusing existing customer records.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 34. Mautic

- **Source:** [mautic/mautic](https://github.com/mautic/mautic)
- **Type / status:** app; candidate only; priority: evaluate.
- **License:** GPL-3.0-or-later. [Primary evidence](https://raw.githubusercontent.com/mautic/mautic/7.x/LICENSE.txt).
- **What it does:** Open-source marketing automation software.
- **Fit:** Swagents, AgentMarketplace, Maestro Radio, ReSingLab, SWOSTing.
- **Suggested SWAGENTS roles:** Lifecycle campaign manager.
- **Work types:** opt-in follow-up, campaign planning, customer lifecycle workflows.
- **Runtime:** PHP application with database and background jobs; check the existing growth stack before deploying a copy.
- **Providers:** Approved email transport and channel integrations.
- **Cost boundary:** Sending, hosting, deliverability work, and maintenance are not free. Do not duplicate existing campaign systems.
- **Requested permissions:** read consented contact records, draft campaigns, activate sends only when authorized.
- **Packaging proposal:** Reusable campaign recipes and connectors for the existing marketing installation; GPL obligations apply to distribution.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 35. listmonk

- **Source:** [knadh/listmonk](https://github.com/knadh/listmonk)
- **Type / status:** app; candidate only; priority: license-review.
- **License:** AGPL-3.0. [Primary evidence](https://raw.githubusercontent.com/knadh/listmonk/master/LICENSE).
- **What it does:** Self-hosted newsletter and mailing-list management application.
- **Fit:** Swagents, Maestro Radio, AgentMarketplace.
- **Suggested SWAGENTS roles:** Newsletter coordinator.
- **Work types:** newsletter drafts, list segmentation, consent-based campaigns.
- **Runtime:** Go application with PostgreSQL and a configured delivery service.
- **Providers:** Approved SMTP/email service; optional message gateways.
- **Cost boundary:** Delivery fees, hosting, reputation, and maintenance remain. Prefer one existing mailing platform when it already meets the need.
- **Requested permissions:** read opted-in subscribers, draft newsletter, send only when explicitly authorized.
- **Packaging proposal:** A lightweight newsletter option if existing growth infrastructure lacks the needed function.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 36. Activepieces

- **Source:** [activepieces/activepieces](https://github.com/activepieces/activepieces)
- **Type / status:** app; candidate only; priority: evaluate.
- **License:** MIT community core; enterprise directories commercial. [Primary evidence](https://raw.githubusercontent.com/activepieces/activepieces/main/LICENSE).
- **What it does:** Workflow automation application with connectors, AI workflows, and MCP-related capabilities.
- **Fit:** Swagents, SWOSTing, AgentMarketplace.
- **Suggested SWAGENTS roles:** Integration workflow designer.
- **Work types:** cross-app automation, connector recipes.
- **Runtime:** TypeScript / Node service stack; reuse SWAGENTS orchestration and inspect individual connector licenses.
- **Providers:** Connected application accounts and optional model providers.
- **Cost boundary:** Connector services, inference, hosting, and enterprise features may cost money.
- **Requested permissions:** read explicitly scoped app data, draft automation flows, execute approved actions only.
- **Packaging proposal:** Use selected connector patterns or a bounded service integration after demonstrating a gap.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 37. Novu

- **Source:** [novuhq/novu](https://github.com/novuhq/novu)
- **Type / status:** app; candidate only; priority: evaluate.
- **License:** MIT core; enterprise modules commercial. [Primary evidence](https://github.com/novuhq/novu#-license).
- **What it does:** Communication infrastructure for product and agent notifications.
- **Fit:** Swagents, AgentMarketplace, Maestro Radio, ReSingLab.
- **Suggested SWAGENTS roles:** Notification coordinator.
- **Work types:** job status updates, transactional notification workflows.
- **Runtime:** Node/TypeScript service and channel providers; compare with the existing notification adapter.
- **Providers:** Configured email, push, SMS, or other channel providers.
- **Cost boundary:** Channel delivery and hosting remain chargeable. Notification infrastructure is not turnkey failed-payment recovery.
- **Requested permissions:** read scoped job or product events, send only approved transactional messages.
- **Packaging proposal:** Adapter for consistent notifications if the existing system has a demonstrated gap.
- **Review note:** Upstream distinguishes MIT core from enterprise modules. Review the selected version and packages before redistribution.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 38. ERPNext

- **Source:** [frappe/erpnext](https://github.com/frappe/erpnext)
- **Type / status:** app; candidate only; priority: defer.
- **License:** GPL-3.0. [Primary evidence](https://raw.githubusercontent.com/frappe/erpnext/develop/license.txt).
- **What it does:** Enterprise resource planning application with business operations modules.
- **Fit:** Swagents, SWOSTing, AgentMarketplace.
- **Suggested SWAGENTS roles:** Business operations analyst.
- **Work types:** operations reporting, order and service processes.
- **Runtime:** Frappe/Python application stack with database and workers; a substantial app rather than a small skill.
- **Providers:** Business data sources and optional payment or communication integrations.
- **Cost boundary:** Hosting, migration, administration, and accounting configuration can outweigh license savings.
- **Requested permissions:** read specifically approved operational records, draft reports.
- **Packaging proposal:** Defer unless a clear missing ERP requirement exists; package narrow integration skills, not a replacement business system.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

#### 39. n8n

- **Source:** [n8n-io/n8n](https://github.com/n8n-io/n8n)
- **Type / status:** app; candidate only; priority: license-review.
- **License:** Sustainable Use License plus separate enterprise license. [Primary evidence](https://raw.githubusercontent.com/n8n-io/n8n/master/LICENSE.md).
- **What it does:** Workflow automation application with integrations and AI capabilities.
- **Fit:** Swagents, SWOSTing.
- **Suggested SWAGENTS roles:** Automation integration reviewer.
- **Work types:** existing automation integration, workflow examples.
- **Runtime:** Node.js application; do not introduce alongside existing orchestration without a demonstrated requirement.
- **Providers:** Connected services and selected model providers.
- **Cost boundary:** Paid services and inference remain. Reviewed terms restrict internal/noncommercial uses and distribution; hosted resale or embedding can require separate rights.
- **Requested permissions:** read approved workflow definitions, draft integration plans.
- **Packaging proposal:** License-review watchlist, particularly for paid white-label hosting; not a default open-source marketplace component.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

### Research and content

#### 40. CourtListener

- **Source:** [freelawproject/courtlistener](https://github.com/freelawproject/courtlistener)
- **Type / status:** app; candidate only; priority: evaluate.
- **License:** Affero GPL as declared upstream; verify full selected license/version. [Primary evidence](https://github.com/freelawproject/courtlistener/blob/main/LICENSE.txt).
- **What it does:** Court-data archive and search application for opinions, oral arguments, filings, and related records.
- **Fit:** Swagents, Cochrane, AssetMachine.
- **Suggested SWAGENTS roles:** Legal source researcher.
- **Work types:** case-source discovery, citation collection, legal research intake.
- **Runtime:** Python/Django application and search/data infrastructure; prefer an approved source/API adapter to recreating its full corpus.
- **Providers:** Permitted court-data/API access; service and dataset terms are separate from code.
- **Cost boundary:** API access, rate limits, records acquisition, hosting, and data rights require their own review. Code availability does not license every document or validate legal conclusions.
- **Requested permissions:** read permitted legal sources, write cited research drafts.
- **Packaging proposal:** Cited legal-source connector feeding the existing Cochrane review workflow.
- **Pin / review:** immutable commit not yet selected; source-code audit, dependency/model/asset license review, execution tests, integration tests, and listing approval remain pending.

## Admission into the proposed SWAGENTS capability bridge

For an approved candidate, preserve its upstream repository, immutable commit, selected paths, license notices, and capabilities. Map its proposed role and work types to existing SWAGENTS agents. A proposed capability attachment record should hold the exact tool adapter, runtime requirements, credential references, allowed actions, limits, and entitlement decision. Dispatch approved jobs through documented SSS Agent OS workers and existing run logs. This attachment/entitlement bridge remains to be built; this document does not claim it is operating. Keep every candidate disabled until focused tests pass and its intended use is approved.

For marketplace packaging, publish an original useful workflow with examples, setup instructions, provider requirements, cost expectations, and support boundaries. A catalog entry is not an installed product and is not evidence that it can be sold unchanged. Keep unreviewed candidates out of public product feeds.

## Discovery indexes and format references

These are discovery/reference links, **not additional licensed product packages**. The index license never licenses all projects it links to.

- [VoltAgent / Awesome Agent Skills](https://github.com/VoltAgent/awesome-agent-skills): a curated discovery list; its repository declares MIT, while every linked project requires its own review.
- [travisvn / Awesome Claude Skills](https://github.com/travisvn/awesome-claude-skills): another discovery list. Its own license was not established in this review; use its links for research, not bulk copying.
- [Agent Skills specification](https://github.com/agentskills/agentskills): the SKILL.md format and selective loading pattern. Upstream distinguishes Apache-2.0 code from CC-BY-4.0 documentation.

## Proposed SWAGENTS attachment contract

The JSON includes a proposed adapter contract carrying skill ID, immutable revision and paths, agent/site IDs, work type, execution kind, worker capability, scoped inputs, entitlement result, permissions, cost limit, approval policy, run ID, and evidence/artifact references. This is a proposed interface for the existing SSS Agent OS runner, not a second runtime or an implemented authorization boundary.

Keep a product entitlement separate from permission to execute actions. Buying or downloading a skill does not authorize sending messages, spending funds, deploying changes, or accessing unrelated tenant data. Load only the selected skill instructions and required references for each job to reduce context cost.

## Verification limits

This is a repository/documentation/license metadata review, not a source audit or a production deployment test. All licenses apply to particular files and versions; repository badges alone do not resolve every dependency or asset right. The explicit source-available and unknown/per-plugin entries are retained to prevent accidental misuse, not to certify them as unrestricted open source. The JSON file records this boundary for every entry.
