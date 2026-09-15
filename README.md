# TAWANVERSE 2

Private Thai couple website with Next.js, Supabase Auth/PostgreSQL/Storage, and server-side DeepSeek tools. Built as a separate local project at the owner's request; this is not an audited rewrite of the inaccessible GitHub source.

**เริ่มที่ [DEPLOY_TH.md](DEPLOY_TH.md)** — วิธีเปิดจาก htdocs, variables และที่มาของค่า, SQL พร้อมข้อมูลตั้งต้น, บัญชีแอดมิน, GitHub และ Vercel

```sh
npm ci
# Copy .env.example to .env.local; fill project URL + publishable key.
# Run sql/01_install.sql, 02_seed.sql, optionally 03_optional_examples.sql.
# Create two Supabase Auth users and customize/run 04_add_members.sql.
npm run dev
```

Visit http://localhost:3000. Apache alone does not run this app; `.htaccess` denies direct access to source under htdocs. `START-DEV.cmd` is included for Windows.

Features implemented:

- Private member login; admin-only Studio with persistent CRUD.
- Canonical events powering Home, Journey, calendar, countdown and LUMI; realtime invalidation plus reconnect/focus/interval refetch.
- Six configurable visitor pages; drafts, appearance preview and transactional Apply/Undo with conflict detection.
- DeepSeek ASK/CREATE/EDIT SITE tools; admin knowledge about Tawan, canonical facts and bounded queries.
- Memories, albums, private uploads, letters, server/database-enforced text capsules, quick notes, wishlist-to-event conversion.
- Scheduled date-range Home takeovers; manual story slideshow and annual counts from real records.
- Blue responsive interface, shared audio player, reduced motion, quality selection, installable manifest and privacy-preserving offline page.

Documents: [architecture](ARCHITECTURE.md), [database](DATABASE.md), [AI](AI_SYSTEM.md), [Studio](STUDIO.md), [testing and limitations](TEST_REPORT.md), [migration](MIGRATION_PLAN.md).

```sh
npm run check
```

No API keys, passwords, real media, production backup or deployment are included. The 69-section master brief includes advanced features not all implemented in this delivery; see the explicit remaining-work list in TEST_REPORT.md. Do not label production-ready until live service and real-device acceptance checks pass.
