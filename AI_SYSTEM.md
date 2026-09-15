# LUMI / DeepSeek

LUMI has ASK, CREATE and EDIT SITE. Only admins may use CREATE/EDIT. Server time is added to every request: CURRENT_DATE, CURRENT_TIME, TIMEZONE=Asia/Bangkok, ISO_TIMESTAMP. Duration and milestones are calculated by application code.

Tools: getCurrentTime, getRelationshipDuration, getUpcomingEvents, searchKnowledge, getResource, proposeChange. Tools read through the user's JWT/RLS. No tools read drafts, history, auth records, API keys or locked capsule content. proposeChange refuses canonical facts, validates merged fields with Zod and stores a draft. No Apply tool is exposed to the model.

For redesign: getResource(pages) → identify target slug → proposeChange(page id, supported config patch) → Studio Preview → human Apply → history Undo. Multiple pages create multiple independently reviewed drafts, not an atomic multi-page publish. Nested page config merges with current values before validation.

Supported appearance: text, accent, glow, font_scale, alignment, layout density, motion; Home section order and visibility. Unsupported requests for new code/features are explained rather than represented as completed. AI never executes shell, SQL, HTML, JavaScript or arbitrary CSS.

Knowledge comes from Studio → ข้อมูลของตะวัน. It is retrieved at request time, not model fine-tuning. Keyword retrieval is capped and may miss records. Instructions require distinguishing recorded facts, computed facts and creative wording; factual correctness still requires human verification.

Controls: validated user request <=3,000 characters; up to 8 history entries; up to 5 provider rounds; 2,000 output tokens per round; bounded tool results; 80,000-character context ceiling; 75-second abort; 6 top-level requests/minute/user in PostgreSQL. These limit abuse but are not a daily/monthly currency budget. An authorized admin can still incur cost through repeated use. Check provider Usage/Billing.

No key/provider failure → explicitly labeled Offline Assist with current time, computed duration and upcoming event. It cannot generate creative text or apply AI edits. Other app functionality remains available. Partially created drafts are preserved and disclosed if a later provider call fails.

Public environment variables are only Supabase URL and publishable key. DeepSeek API key/model are read server-side. Default model is deepseek-flash, verified against official documentation during this build. Pricing/model availability may change; see https://api-docs.deepseek.com/quick_start/pricing/.
