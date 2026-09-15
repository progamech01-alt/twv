# Architecture

`src/app` owns Next.js routes and HTTP authorization. `src/features` owns visitor, Studio and LUMI views. `src/repositories/universe.ts` encapsulates persistence. `src/services` owns canonical event derivation, authenticated client HTTP, AI tools and uploads. `src/lib` owns domain types, validation, time and separated browser/server auth helpers.

Browser → bearer JWT → Next.js route → `auth.getUser` + membership → repository using the SAME user JWT → PostgreSQL RLS. No service-role key is required. Browser session persistence is supplied by Supabase Auth; session data is not trusted for server authorization.

Events have a single table (`tv_events`). EventService supplies date-range/recurrence results used by Time and upcoming cards; Journey reads the same event rows. Mutations refresh the shared provider; Supabase Realtime triggers debounced refetches. Focus/reconnection and a 60-second poll recover missed changes and time-based capsule unlocks. The poll is also a fallback when Realtime isn't configured.

Data is not cached in the service worker. API responses are `no-store, private`; private page data is loaded only after login. Public HTML and metadata contain no couple facts. Private Storage uses temporary signed URLs. The browser gallery does not make external image processing requests through the server.

PostgreSQL `tv_mutate` validates a resource/field allowlist, locks the row and checks its expected revision. A monotonically increasing revision prevents stale updates; immutable before/after versions are captured by a private trigger in the same transaction. Restore compares current content against the exact recorded after-state. A newer edit blocks restore instead of being overwritten.

SQL functions use SECURITY INVOKER except narrowly scoped private audit/rate-limit functions. The rate-limit function verifies auth.uid against its caller; the trigger function cannot be called by browser roles. Explicit REVOKE then GRANT statements avoid inheriting unsafe default privileges. `tv_members` can only be changed through trusted database administration.

Drafts are database records. AI can create drafts but has no publish tool. A human uses authenticated Apply, which locks the draft and calls the same mutation function transactionally. Canonical facts cannot be changed by AI. Studio changes to facts are deliberate manual operations.

Styling uses local open-source fonts, CSS surfaces and orbit illustration; no raster-generation service or mandatory external CDN. Heavy effects can be reduced. Audio remains mounted between route changes. Layout/appearance changes are validated configuration, never arbitrary executable code.

UI lists currently cap at 500 rows per resource; history lists show the latest 100. AI tools return smaller bounded selections. Pagination/semantic search should be added before this becomes a large archive. This package is one private universe, not a multi-tenant SaaS.
