# TAWANVERSE 2.0 — migration plan

Status: preliminary plan based on verified infrastructure and the supplied master prompt. Final source mapping depends on repository access. No migration has run.

## 1. Complete the audit and preserve the baseline

1. Enable repository access, inspect AGENTS.md, fetch the complete repository and list tracked files.
2. Record current production branch, commit, dependency lockfile, routes, build commands, environment variable names, assets, persistence paths and AI integration.
3. Trace the reported event/calendar bug and establish existing build/test results without changing production.
4. Create `tawanverse-v2` from the inspected baseline. If it exists, use `feature/tawanverse-v2` after checking its state. Never overwrite an existing branch or force-push production.
5. Preserve production commit `156ede40f212b00a1556820a022e2db804222291` and deployment `dpl_21g99LVFqY7BDfhdgd9aGZaLm9nT` as audit anchors; recheck the active production revision before any eventual cutover.

## 2. Recover and back up real data

The inspected Supabase project has zero rows in both public tables and no storage buckets. Confirm it is the application's backend before selecting migration sources.

- Inspect source seeds, uploaded assets, remote image URLs, browser localStorage/IndexedDB usage and any alternate backend references.
- Export database schema, grants, policies and data before any live migration. Preserve storage files if subsequently found. Store sensitive backups outside Git and public outputs.
- Verify backup checksums and restore into an isolated test database. A backup is not complete until the restore is tested.
- Build a dry-run importer once actual legacy shapes are known. Validate inputs, preserve legacy identifiers through a mapping table, use transactions and make reruns idempotent.
- Report detected, migrated, skipped, duplicate and invalid rows per entity, with redacted error details. Do not silently drop malformed records or invent missing memories.
- Preserve original media URLs and source metadata. Check links and provide placeholders for failures; copy media only when authorized and technically supported.

## 3. Isolated foundation

Use an isolated local Supabase environment first. A hosted preview database or branch requires checking availability and any cost requirements before provisioning. Never point V2 preview writes at the old production tables.

Implement Next.js App Router, strict TypeScript, pinned dependencies, a lockfile, separate Supabase browser/server clients, authenticated Studio and a repository/service layer. Components must not own persistence queries.

Use normalized entities for couple facts, events, memories, albums/media, letters/capsules, page sections, themes, settings, proposals and versions. JSON is appropriate for validated section styles or patch payloads, not a replacement for all relational entities. Exact schema and import mapping remain pending the source audit.

Use one canonical EventRepository and EventService for Home, Journey, Time/calendar, countdown and LUMI. Commit mutations and their version records atomically. Publish cache invalidation/realtime updates only after successful persistence. Handle reconnects with refetching.

Store canonical facts from the master prompt once. Compute relationship duration and milestones in application code using Asia/Bangkok calendar semantics; test midnight boundaries, leap years, recurrence, cancellations and interval overlap.

Require explicit membership/role authorization for Studio. Enable RLS and narrowly scoped policies/grants. Keep secrets server-side. Enforce capsule unlock access at database/server boundaries, including AI and alternate read endpoints. Sanitize visitor metadata and default to noindex/nofollow.

## 4. Ordered implementation gates

1. **Foundation:** migrations, repositories, services, auth, Event Engine; pass integration and authorization tests before continuing.
2. **Design:** Thai typography, blue visual system, responsive tokens, accessible controls and reduced motion.
3. **Visitor experience:** Intro, Home, Journey, Memories, Time, Letters and LUMI shell; real data and loading/empty/error/offline states.
4. **Studio:** managers and configurable page sections, responsive properties, media, appearance and draft visual preview. Drafts remain unpublished.
5. **LUMI:** server-side DeepSeek, explicit Bangkok time context, bounded authorized tools, deterministic offline assistance and validated ChangeSets. Preview must be isolated; Apply and Undo must be transactional, authorized and conflict-aware. Never publish AI output directly.
6. **Advanced experience:** adaptive cinematic motion, persistent gesture-started audio, configurable surprises with preview, real-data stories/wrapped, wishlist lifecycle and Easter eggs.
7. **Production:** PWA shell without caching private data, optional opt-in push, security/performance review, backup/restore, migration rehearsal and browser/mobile tests.

For each phase: explain findings and plan, implement, run tests, fix failures, review and commit logically. Maintain README.md, ARCHITECTURE.md, DATABASE.md, AI_SYSTEM.md, STUDIO.md, DEPLOY.md and TEST_REPORT.md alongside this audit and plan.

## 5. Environment configuration

Actual old variable names are unverified. Proposed V2 names, to finalize against the implementation:

- Browser-safe: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or the legacy anon-key name if necessary for compatibility).
- Server-only: DEEPSEEK_API_KEY; a Supabase privileged key only where a reviewed operation requires it; APP_TIMEZONE=Asia/Bangkok.
- Optional push: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.

Document required versus optional variables in .env.example with placeholders only. Ignore local environment files. Configure preview and production independently. Never copy secret values into reports, source control, AI context or browser bundles.

## 6. Acceptance and cutover

Maintain evidence for every master-prompt acceptance criterion. Critical tests include:

- Create/edit/delete one event and verify all consumers, including a second session; refresh and reconnect without losing state.
- Verify persistence, timezone calculations, recurrence and canonical facts.
- Verify real AI tool use and provider-failure behavior; creative generation must not masquerade as local AI.
- Verify draft Preview leaves published state unchanged; Apply updates it; Undo and Restore preserve history and reject stale conflicting updates.
- Deny unauthorized admin writes and access to locked capsule content through every read path, including AI.
- Verify media, letters, PWA, responsive layouts, keyboard access, reduced motion, production build and browser console.
- Test on a real mobile device, production Supabase/DeepSeek connections and Studio before promotion. Do not substitute emulation for the requested real-device check.

Deploy V2 Preview, run acceptance tests and rehearse rollback first. Before cutover, take a fresh tested backup and reconcile new V1 writes with a documented brief write-freeze or verified delta import. Promote only after all required checks pass. Preserve the old deployment and tables. Rollback must restore both application routing and a compatible data path; switching an alias alone is insufficient after incompatible writes.

## Current unblock action

Grant the GitHub connection access to the private repository `progamech01-alt/tawanverse`. The connector reports no installations, and direct source reads return 404. This blocks the required existing-code audit and safe branch creation; Vercel and Supabase access already work.


## Local delivery follow-up

The owner subsequently authorized building a separate local project and manually uploading it to GitHub/Vercel. Files are delivered in C:\xampp\htdocs\tawanverse-v2 and as a clean source ZIP. No GitHub repository inspection, legacy migration or production deployment has occurred. A pre-existing C:\xampp\htdocs\Tawan folder was discovered (index.html, config.js, script.js, style.css, song.mp3); it was left unchanged and its data was not imported. Do not treat this delivery as a verified migration of that site. See DEPLOY_TH.md for setup and TEST_REPORT.md for verified capabilities and remaining acceptance checks.
