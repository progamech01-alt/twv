import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
async function main() {
  const db = new PGlite();
  let checks = 0;
  const check = (value: unknown, msg: string) => {
    assert.ok(value, msg);
    checks++;
    console.log(`PASS ${msg}`);
  };
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create schema storage; create table auth.users(id uuid primary key,email text); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth,storage to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key,bucket_id text,name text); alter table storage.objects enable row level security;`,
  );
  await db.exec(
    "alter default privileges in schema public grant all on tables to anon,authenticated; alter default privileges in schema public grant all on functions to anon,authenticated;",
  );
  await db.exec(readFileSync("sql/01_install.sql", "utf8"));
  await db.exec(readFileSync("sql/02_seed.sql", "utf8"));
  await db.exec(readFileSync("sql/02_seed.sql", "utf8"));
  const admin = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    viewer = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    outsider = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  await db.query(
    `insert into auth.users(id,email) values($1,'admin@example.test'),($2,'viewer@example.test'),($3,'outsider@example.test')`,
    [admin, viewer, outsider],
  );
  await db.query(
    `insert into public.tv_members values($1,'admin'),($2,'viewer')`,
    [admin, viewer],
  );
  const asUser = async (id: string, role = "authenticated") => {
    await db.exec("reset role");
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [id]);
    await db.exec(`set role ${role}`);
  };
  const mutate = async (
    resource: string,
    id: string | null,
    rev: number | null,
    patch: object,
    action = "save",
  ) =>
    (
      await db.query<{
        result: { id: string; revision: number; title: string };
      }>("select public.tv_mutate($1,$2,$3,$4::jsonb,$5) as result", [
        resource,
        id,
        rev,
        JSON.stringify(patch),
        action,
      ])
    ).rows[0].result;
  await asUser(admin);
  await assert.rejects(
    () => db.query("truncate tv_events"),
    /permission denied/,
  );
  checks++;
  await assert.rejects(
    () =>
      db.query(
        "insert into tv_versions(resource,entity_id) values('events',gen_random_uuid())",
      ),
    /permission denied/,
  );
  checks++;
  check(
    (await db.query("select * from tv_facts")).rows.length === 6,
    "seed idempotence preserves six canonical facts",
  );
  check(
    (await db.query("select * from tv_pages")).rows.length === 6,
    "all six pages configured",
  );
  const event = await mutate("events", null, null, {
    title: "Integration event",
    start_at: "2026-09-15T18:00:00+07:00",
  });
  check(
    !!event.id && event.revision > 0,
    "admin creates persistent canonical event",
  );
  const edited = await mutate("events", event.id, event.revision, {
    title: "Edited",
  });
  check(edited.title === "Edited", "event edit persists");
  await assert.rejects(
    () => mutate("events", event.id, event.revision, { title: "Stale" }),
    /CONFLICT/,
  );
  checks++;
  const v = (
    await db.query<{ id: string }>(
      "select id from tv_versions where entity_id=$1 order by (after_data->>'revision')::bigint desc nulls last limit 1",
      [event.id],
    )
  ).rows[0];
  await db.query("select tv_restore_version($1)", [v.id]);
  check(
    (
      await db.query<{ title: string }>(
        "select title from tv_events where id=$1",
        [event.id],
      )
    ).rows[0].title === "Integration event",
    "undo restores previous state",
  );
  await assert.rejects(
    () => db.query("select tv_restore_version($1)", [v.id]),
    /CONFLICT/,
  );
  checks++;
  await assert.rejects(
    () => mutate("members", null, null, { title: "escalate" }),
    /INVALID_RESOURCE/,
  );
  checks++;
  await assert.rejects(
    () =>
      mutate("events", null, null, {
        title: "bad",
        start_at: "2026-01-01",
        revision: 9,
      }),
    /INVALID_FIELD/,
  );
  checks++;
  const capsule = await mutate("letters", null, null, {
    title: "Sealed",
    kind: "capsule",
    unlock_at: "2099-01-01T00:00:00Z",
    content: "LOCKED_SECRET",
  });
  check(!!capsule.id, "admin can create capsule without returning its content");
  check(
    (await db.query("select * from tv_letters where id=$1", [capsule.id])).rows
      .length === 0,
    "admin cannot read locked capsule",
  );
  check(
    (
      await db.query("select * from tv_versions where entity_id=$1", [
        capsule.id,
      ])
    ).rows.length === 0,
    "locked capsule history cannot leak content",
  );
  const c = (
    await db.query<{ id: string }>(
      `insert into tv_changes(title,resource,patch,action) values('Draft','quick_notes','{"title":"Proposed","content":"Draft text"}','save') returning id`,
    )
  ).rows[0];
  check(
    (await db.query("select * from tv_quick_notes where title='Proposed'")).rows
      .length === 0,
    "draft does not publish",
  );
  await db.query("select tv_apply_change($1)", [c.id]);
  check(
    (await db.query("select * from tv_quick_notes where title='Proposed'")).rows
      .length === 1,
    "apply publishes proposal",
  );
  await assert.rejects(
    () => db.query("select tv_apply_change($1)", [c.id]),
    /INVALID_CHANGE/,
  );
  checks++;
  await asUser(viewer);
  await assert.rejects(
    () => db.query("select tv_apply_change($1)", [c.id]),
    /FORBIDDEN/,
  );
  checks++;
  check(
    (await db.query("select * from tv_events where id=$1", [event.id])).rows
      .length === 1,
    "viewer reads canonical events",
  );
  await assert.rejects(
    () => mutate("events", null, null, { title: "No", start_at: "2026-01-01" }),
    /FORBIDDEN/,
  );
  checks++;
  check(
    (await db.query("select * from tv_letters where id=$1", [capsule.id])).rows
      .length === 0,
    "viewer cannot read locked capsule",
  );
  check(
    (await db.query("select * from tv_changes")).rows.length === 0,
    "viewer cannot read drafts",
  );
  await assert.rejects(
    () =>
      db.query(`update tv_members set role='admin' where user_id=$1`, [viewer]),
    /permission denied/,
  );
  checks++;
  await asUser(outsider);
  check(
    (await db.query("select * from tv_events")).rows.length === 0,
    "authenticated non-member sees no private data",
  );
  await asUser("", "anon");
  await assert.rejects(
    () => db.query("select * from tv_events"),
    /permission denied/,
  );
  checks++;
  await asUser(admin);
  const wish = await mutate("wishlist", null, null, { title: "Test plan" });
  await db.query("select tv_plan_wish($1,$2)", [
    wish.id,
    "2027-01-01T10:00:00+07:00",
  ]);
  check(
    (
      await db.query<{ status: string; event_id: string }>(
        "select status,event_id from tv_wishlist where id=$1",
        [wish.id],
      )
    ).rows[0].status === "planned",
    "wishlist links to event transactionally",
  );
  await assert.rejects(
    () =>
      db.query("select tv_plan_wish($1,$2)", [
        wish.id,
        "2027-01-01T10:00:00+07:00",
      ]),
    /CONFLICT/,
  );
  checks++;
  for (let i = 0; i < 6; i++)
    check(
      (await db.query<{ ok: boolean }>("select tv_ai_budget() ok")).rows[0].ok,
      "AI request budget accepts request " + (i + 1),
    );
  check(
    !(await db.query<{ ok: boolean }>("select tv_ai_budget() ok")).rows[0].ok,
    "AI request budget rejects seventh request",
  );
  await db.exec("reset role");
  await db.query("update tv_letters set unlock_at='2000-01-01' where id=$1", [
    capsule.id,
  ]);
  await asUser(viewer);
  check(
    (await db.query("select * from tv_letters where id=$1", [capsule.id])).rows
      .length === 1,
    "capsule becomes readable after unlock",
  );
  await db.close();
  console.log(
    `\n${checks} database assertions passed (isolated PGlite PostgreSQL; no live Supabase changes).`,
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
