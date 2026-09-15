# Database

Install instructions and email placeholders: [DEPLOY_TH.md](DEPLOY_TH.md). `sql/01_install.sql` and the generated foundation migration are equivalent alternatives. Do not run both.

| Entity | Role |
|---|---|
| tv_members | Auth user → admin/viewer membership; no user-side writes |
| tv_facts | Canonical names/dates, unique key |
| tv_events | Single event source, dates, status, yearly recurrence |
| tv_memories / tv_albums | Stories, dates, tags, event and album relationships |
| tv_media | Private storage path or HTTPS URL, type, alt |
| tv_letters | Letters and locked text capsules; RLS excludes locked rows |
| tv_quick_notes | Small notes |
| tv_wishlist | Ideas, categories, event links, lifecycle status |
| tv_pages | Six unique slugs and validated appearance config |
| tv_themes / tv_music | Reusable palettes and scene tracks |
| tv_surprises | Date-range Home takeovers; enabled flag |
| tv_knowledge | Tawan knowledge, category, source and search tags |
| tv_changes | Draft proposal payloads and status |
| tv_versions | Append-only mutation snapshots; locked letter versions excluded |
| tv_ai_usage | Per-user minute request counter, inaccessible to clients |

All content tables have UUID id, title, global revision, created_at and updated_at. No legacy tables are removed or changed. Foreign keys preserve relationships; deleting an event/album clears corresponding optional links, with resulting mutations versioned as well.

RLS grants member reads and admin writes. Unauthenticated and non-member clients have no data access. Locked capsules are excluded even for an admin; create can return a sealed ID without returning content. Versions containing future locked content are hidden. Applied capsule drafts are hidden until unlock. Database owner access remains privileged by design.

RPCs: `tv_mutate`, `tv_apply_change`, `tv_restore_version`, `tv_plan_wish`, `tv_ai_budget`. Resources and fields are allowlisted; callers cannot target membership or history tables through mutation. `tv_restore_version` refuses if newer data no longer matches the snapshot.

Bucket `tawanverse` is private, 20 MB/file, JPG/PNG/WebP/MP3/MP4. Ordinary members may read media; only admins upload/update/delete. Do not use this shared bucket for locked capsule attachments. Deleting a media metadata record does not delete the underlying object; this preserves reversibility. Remove orphan objects only after reviewing references and backups.

Read-only production verification after installation:

```sql
select tablename, rowsecurity from pg_tables where schemaname='public' and tablename like 'tv_%';
select tablename, policyname, roles, cmd from pg_policies where schemaname='public' and tablename like 'tv_%';
select count(*) from public.tv_facts; -- 6 after canonical seed
select slug from public.tv_pages order by slug; -- 6 pages
select id, public from storage.buckets where id='tawanverse'; -- false
```

Run the Supabase security advisors after live installation. Local PostgreSQL tests do not validate your hosted project's API exposure configuration, Storage server or Realtime server.
