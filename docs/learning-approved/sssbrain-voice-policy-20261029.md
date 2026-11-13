# SSSBrain GPT Live and free voice policy

GPT Live is the default main-orb voice. Explicit voice choices persist. Only verified OpenAI exhausted-credit/quota codes trigger automatic free fallback; auth, throttling, outages and network errors retain GPT Live selection. Both modes share conversation history and the existing knowledge/tool bridge.

Free mode uses the existing owner-scoped SWADEBASE knowledge route with bounded local llama3.2:3b replies, recent history and relevant evidence excerpts. No paid language, transcription or speech fallback is used. Automatic credit fallback uses device speech. Other local speech attempts have a 3.5-second header deadline before device speech. Free voices can still be slower and less capable than GPT Live.

Full typecheck/build passed. Native21, backend23 existing plus8 new, and6 built HTTP canary checks passed. Real short-answer backend times were roughly5.3–5.9seconds, greeting0.03seconds. Actual signed-in microphone/audio journeys remain unverified. SSSBrain PR98 merge644d6ef696eb862c8357ad41f1ca720f5245c238 is the release source; verify the actual Coolify running image before stating the native release is live.

This read-only voice connection grants no broader execution authority. Automatic approval review rejected expanding native repair actions and unverified target mappings. Existing approvals, action policy and verified target allowlists remain in place. See SSSBRAIN_REPAIR_CONNECTION_PROPOSAL.md for the concrete proposed owner-only repair connection.

## Production voice release confirmed — October 29, 2026, 8:12 PM Chicago
The existing Coolify deployment 6dgdixxzlqee92kqsq7mcckj finished successfully for SSSBrain PR98 merge 644d6ef696eb862c8357ad41f1ca720f5245c238. The exact image g1406wexcvceencavj1fuo0u:644d6ef696eb862c8357ad41f1ca720f5245c238 is running healthy; the prior revision was removed from live traffic. The public /api/live endpoint returned 200. This supersedes earlier staging/build-blocked and deployment-pending status entries.

GPT Live is the default main-orb voice. Explicit choices persist; automatic free fallback occurs only on verified OpenAI credit/quota exhaustion. Free replies, transcription and speech cannot spill into paid providers. Automatic credit fallback uses device speech. Conversation history, owner knowledge and the existing brain tool bridge are shared.

Actual signed-in microphone/audio journeys remain unverified. Broader all-site repair execution is still blocked by automatic approval review and missing protected server action connections; existing exact owner approvals and allowlists were preserved. Four externally served Lovable badge domains and 20 unreachable audit entries still need migration/favicon verification.
