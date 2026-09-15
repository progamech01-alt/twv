# TAWANVERSE 2.0 — Phase 0 audit

Audit date: 2026-09-14, Asia/Bangkok. Status: partial; repository access blocks completion. No production, database, deployment, or remote repository changes were made.

## Verified connections

### GitHub

- Linked identity: `progamech01-alt`.
- Vercel identifies the private source repository as `progamech01-alt/tawanverse` (repository ID `1367286733`).
- Repository search and repository listing returned no repositories. Installation listing returned no installations.
- Direct repository metadata and `package.json` requests both returned HTTP 404. This does not prove the repository is missing; the connector currently lacks usable access to it.
- The current workspace has no application checkout. A filename search under Documents/Codex found no package.json, vercel.json, or AGENTS.md files.
- No branch was created, because the source repository and branch state cannot yet be inspected.

### Vercel

- Team: `progamech01-2188`, ID `team_JxclSyLAZGfElbNjdjbJ70Uh`.
- Project: `tawanverse`, ID `prj_I390ITjqUkXyLumf2SDI8gkS7Nlx`.
- Production URL: https://tawanverse.vercel.app
- Latest deployment: `dpl_21g99LVFqY7BDfhdgd9aGZaLm9nT`, status `READY`, production target.
- Immutable deployment URL: https://tawanverse-jjmbfz19p-progamech01-2188.vercel.app
- Source branch: `main`; commit: `156ede40f212b00a1556820a022e2db804222291`; message: `Add files via upload`.
- Vercel framework field: null. This is not evidence of the application's actual framework.
- Configured Node version: `24.x`; deployment region: `iad1`; metadata reports six Node.js lambdas.
- Build/install commands, routing configuration, function source, environment variable names, and rollback behavior have not been verified. Available project/deployment responses did not expose environment variable names. No secret values were requested.
- READY is a deployment status, not proof that application flows work. No browser or mobile acceptance tests were run.

### Supabase

Accessible project: `progamech01-alt's Project`, ref `rvpnxzpibvqznpmumudc`, organization `ttvgjagarskqvagiziga`, region `ap-southeast-1`, status `ACTIVE_HEALTHY`, PostgreSQL `17.6.1.166`.

This is the only project returned by the connector. Its connection to the deployed application still needs source/configuration verification.

| Table | Columns | Exact row count | RLS | Policies |
|---|---|---:|---|---|
| public.site_state | id text PK; data jsonb default {}; updated_at timestamptz default now() | 0 | Enabled | None |
| public.push_subscriptions | endpoint text PK; subscription jsonb; updated_at timestamptz default now() | 0 | Enabled | None |

- Exact counts were queried; these are not table-size estimates.
- No recorded Supabase migrations, storage buckets, or top-level site_state data keys were found.
- Both tables have broad table grants to `anon` and `authenticated`, including SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, and TRUNCATE. Grants alone do not establish REST exploitability. Review and minimize them in the isolated V2 design.
- RLS with no policies denies ordinary role row access. Privileged server access may still work. Without source code, this cannot be identified as the cause of any old application bug.
- Security advisors reported `rls_enabled_no_policy` for both tables: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Required source audit still pending

| Requested check | Current finding / next evidence |
|---|---|
| List current files | Requires repository checkout/tree |
| Framework and dependencies | Requires package manifest and lockfile |
| Routes and handlers | Requires application source and deployment routing config |
| Database integration | Inspect client/server queries, credential boundaries and state persistence |
| AI integration | Inspect provider calls, fallback behavior, prompts, current-time injection and authorization |
| Environment variable names | Extract identifiers only from source/config and deployment settings |
| Reusable assets/data | Inspect repository assets, seed data, external URLs and browser persistence |
| Event/calendar bug | Trace mutation through persistence, read models, cache invalidation and calendar consumers |
| Tests/build | Inspect scripts, install locked dependencies and establish baseline |
| Auth/capsules | Inspect access enforcement in APIs, AI tools and database policies |

Empty tables do not establish that no useful old data exists. Data may be hardcoded, stored locally in a browser, external, or in a different backend. Do not reset anything based on these counts.

## Phase 0 conclusion

The infrastructure inventory is usable, but the mandatory source audit is incomplete. No implementation, migration, backup, branch commit, or production readiness is claimed. Enable GitHub connector access to `progamech01-alt/tawanverse` to continue the required source inspection and complete this audit before architecture replacement.


## Local delivery follow-up

The owner subsequently authorized building a separate local project and manually uploading it to GitHub/Vercel. Files are delivered in C:\xampp\htdocs\tawanverse-v2 and as a clean source ZIP. No GitHub repository inspection, legacy migration or production deployment has occurred. A pre-existing C:\xampp\htdocs\Tawan folder was discovered (index.html, config.js, script.js, style.css, song.mp3); it was left unchanged and its data was not imported. Do not treat this delivery as a verified migration of that site. See DEPLOY_TH.md for setup and TEST_REPORT.md for verified capabilities and remaining acceptance checks.
