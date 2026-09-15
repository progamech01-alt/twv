-- TAWANVERSE 2: additive installation; never touches site_state or push_subscriptions.
-- Run ONCE in Supabase SQL Editor. Use a new project / tested backup first.
begin;
create schema if not exists tv_private;
revoke all on schema tv_private from public,anon,authenticated;
create sequence public.tv_revision_seq;
grant usage on sequence public.tv_revision_seq to authenticated;
create table public.tv_members(user_id uuid primary key references auth.users(id) on delete cascade, role text not null check(role in ('admin','viewer')));
alter table public.tv_members enable row level security;
revoke all on public.tv_members from public,anon,authenticated;
grant select on public.tv_members to authenticated;
revoke all on public.tv_members from anon;
create policy own_membership on public.tv_members for select to authenticated using(user_id=(select auth.uid()));
create function public.tv_is_member() returns boolean language sql stable security invoker set search_path='' as $$ select exists(select 1 from public.tv_members where user_id=(select auth.uid())) $$;
create function public.tv_is_admin() returns boolean language sql stable security invoker set search_path='' as $$ select exists(select 1 from public.tv_members where user_id=(select auth.uid()) and role='admin') $$;
revoke all on function public.tv_is_member(),public.tv_is_admin() from public,anon,authenticated;
grant execute on function public.tv_is_member(),public.tv_is_admin() to authenticated;
create table public.tv_versions(id uuid primary key default gen_random_uuid(),resource text not null,entity_id uuid not null,before_data jsonb,after_data jsonb,actor uuid,created_at timestamptz not null default now());
alter table public.tv_versions enable row level security;
revoke all on public.tv_versions from public,anon,authenticated;
grant select on public.tv_versions to authenticated;
revoke all on public.tv_versions from anon;
create policy admin_history on public.tv_versions for select to authenticated using((select public.tv_is_admin()) and (resource<>'letters' or (coalesce((before_data->>'unlock_at')::timestamptz,'-infinity')<=now() and coalesce((after_data->>'unlock_at')::timestamptz,'-infinity')<=now())));
create function tv_private.track_version() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.tv_versions(resource,entity_id,before_data,after_data,actor) values(substring(TG_TABLE_NAME from 4),coalesce(NEW.id,OLD.id),case when TG_OP='INSERT' then null else to_jsonb(OLD) end,case when TG_OP='DELETE' then null else to_jsonb(NEW) end,auth.uid());
  return coalesce(NEW,OLD);
end $$;
revoke all on function tv_private.track_version() from public,anon,authenticated;
create function tv_private.stamp() returns trigger language plpgsql security invoker set search_path='' as $$ begin NEW.revision=nextval('public.tv_revision_seq'); NEW.updated_at=now(); if TG_OP='UPDATE' then NEW.id=OLD.id; NEW.created_at=OLD.created_at; end if; return NEW; end $$;
revoke all on function tv_private.stamp() from public,anon,authenticated;

create table public.tv_events(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),description text not null default '', start_at timestamptz not null, end_at timestamptz, timezone text not null default 'Asia/Bangkok' check(timezone='Asia/Bangkok'), type text not null default 'custom' check(type in ('relationship','birthday','trip','memory','plan','letter','capsule','special','custom')), status text not null default 'planned' check(status in ('idea','planned','confirmed','happening','completed','cancelled')), recurrence text not null default 'none' check(recurrence in ('none','yearly')), location text not null default '', cover_url text not null default '', check(end_at is null or end_at>=start_at));
alter table public.tv_events enable row level security;
revoke all on public.tv_events from public,anon,authenticated;
grant select,insert,update,delete on public.tv_events to authenticated;
create policy member_read on public.tv_events for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_events for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_events for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_events for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_events for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_events for each row execute function tv_private.track_version();

create table public.tv_albums(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),description text not null default '', cover_url text not null default '');
alter table public.tv_albums enable row level security;
revoke all on public.tv_albums from public,anon,authenticated;
grant select,insert,update,delete on public.tv_albums to authenticated;
create policy member_read on public.tv_albums for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_albums for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_albums for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_albums for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_albums for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_albums for each row execute function tv_private.track_version();

create table public.tv_memories(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),story text not null default '', date date not null, location text not null default '', tags text[] not null default '{}', event_id uuid references public.tv_events(id) on delete set null, album_id uuid references public.tv_albums(id) on delete set null, cover_url text not null default '');
alter table public.tv_memories enable row level security;
revoke all on public.tv_memories from public,anon,authenticated;
grant select,insert,update,delete on public.tv_memories to authenticated;
create policy member_read on public.tv_memories for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_memories for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_memories for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_memories for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_memories for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_memories for each row execute function tv_private.track_version();

create table public.tv_media(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),url text not null default '', storage_path text not null default '', kind text not null default 'image' check(kind in ('image','video','audio')), alt text not null default '');
alter table public.tv_media enable row level security;
revoke all on public.tv_media from public,anon,authenticated;
grant select,insert,update,delete on public.tv_media to authenticated;
create policy member_read on public.tv_media for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_media for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_media for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_media for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_media for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_media for each row execute function tv_private.track_version();

create table public.tv_letters(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),content text not null default '', kind text not null default 'letter' check(kind in ('letter','capsule')), unlock_at timestamptz, check(kind<>'capsule' or unlock_at is not null));
alter table public.tv_letters enable row level security;
revoke all on public.tv_letters from public,anon,authenticated;
grant select,insert,update,delete on public.tv_letters to authenticated;
create policy member_read on public.tv_letters for select to authenticated using((select public.tv_is_member()) and (kind<>'capsule' or unlock_at<=now()));
create policy admin_insert on public.tv_letters for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_letters for update to authenticated using((select public.tv_is_admin()) and (kind<>'capsule' or unlock_at<=now())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_letters for delete to authenticated using((select public.tv_is_admin()) and (kind<>'capsule' or unlock_at<=now()));
create trigger stamp before insert or update on public.tv_letters for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_letters for each row execute function tv_private.track_version();

create table public.tv_quick_notes(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),content text not null default '');
alter table public.tv_quick_notes enable row level security;
revoke all on public.tv_quick_notes from public,anon,authenticated;
grant select,insert,update,delete on public.tv_quick_notes to authenticated;
create policy member_read on public.tv_quick_notes for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_quick_notes for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_quick_notes for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_quick_notes for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_quick_notes for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_quick_notes for each row execute function tv_private.track_version();

create table public.tv_wishlist(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),category text not null default 'อยากทำด้วยกัน' check(category in ('อยากกิน','อยากเที่ยว','อยากซื้อ','อยากลอง','อยากทำด้วยกัน')), description text not null default '', status text not null default 'active' check(status in ('active','planned','completed','archived')), event_id uuid references public.tv_events(id) on delete set null);
alter table public.tv_wishlist enable row level security;
revoke all on public.tv_wishlist from public,anon,authenticated;
grant select,insert,update,delete on public.tv_wishlist to authenticated;
create policy member_read on public.tv_wishlist for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_wishlist for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_wishlist for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_wishlist for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_wishlist for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_wishlist for each row execute function tv_private.track_version();

create table public.tv_pages(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),slug text not null unique check(slug in ('home','journey','memories','time','letters','lumi')), config jsonb not null default '{}' check(jsonb_typeof(config)='object'));
alter table public.tv_pages enable row level security;
revoke all on public.tv_pages from public,anon,authenticated;
grant select,insert,update,delete on public.tv_pages to authenticated;
create policy member_read on public.tv_pages for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_pages for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_pages for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_pages for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_pages for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_pages for each row execute function tv_private.track_version();

create table public.tv_themes(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),accent text not null default '#70DAFF' check(accent ~ '^#[0-9a-fA-F]{6}$'), glow numeric not null default 0.6 check(glow between 0 and 1));
alter table public.tv_themes enable row level security;
revoke all on public.tv_themes from public,anon,authenticated;
grant select,insert,update,delete on public.tv_themes to authenticated;
create policy member_read on public.tv_themes for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_themes for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_themes for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_themes for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_themes for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_themes for each row execute function tv_private.track_version();

create table public.tv_music(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),url text not null default '', scene text not null default 'all' check(scene in ('all','home','journey','memories','time','letters','lumi')), volume numeric not null default 0.3 check(volume between 0 and 1));
alter table public.tv_music enable row level security;
revoke all on public.tv_music from public,anon,authenticated;
grant select,insert,update,delete on public.tv_music to authenticated;
create policy member_read on public.tv_music for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_music for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_music for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_music for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_music for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_music for each row execute function tv_private.track_version();

create table public.tv_surprises(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),message text not null default '', start_at timestamptz not null, end_at timestamptz not null, enabled boolean not null default false, accent text not null default '#70DAFF' check(accent ~ '^#[0-9a-fA-F]{6}$'), check(end_at>start_at));
alter table public.tv_surprises enable row level security;
revoke all on public.tv_surprises from public,anon,authenticated;
grant select,insert,update,delete on public.tv_surprises to authenticated;
create policy member_read on public.tv_surprises for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_surprises for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_surprises for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_surprises for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_surprises for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_surprises for each row execute function tv_private.track_version();

create table public.tv_facts(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),key text not null unique check(key in ('relationship_start','first_confession','phat_birthday','tawan_birthday','phat_name','tawan_name')), value text not null);
alter table public.tv_facts enable row level security;
revoke all on public.tv_facts from public,anon,authenticated;
grant select,insert,update,delete on public.tv_facts to authenticated;
create policy member_read on public.tv_facts for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_facts for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_facts for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_facts for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_facts for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_facts for each row execute function tv_private.track_version();

create table public.tv_knowledge(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 240),revision bigint not null default nextval('public.tv_revision_seq'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),content text not null default '',category text not null default 'อื่น ๆ',source text not null default '',tags text[] not null default '{}');
alter table public.tv_knowledge enable row level security;
revoke all on public.tv_knowledge from public,anon,authenticated;
grant select,insert,update,delete on public.tv_knowledge to authenticated;
create policy member_read on public.tv_knowledge for select to authenticated using((select public.tv_is_member()));
create policy admin_insert on public.tv_knowledge for insert to authenticated with check((select public.tv_is_admin()));
create policy admin_update on public.tv_knowledge for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create policy admin_delete on public.tv_knowledge for delete to authenticated using((select public.tv_is_admin()));
create trigger stamp before insert or update on public.tv_knowledge for each row execute function tv_private.stamp();
create trigger version after insert or update or delete on public.tv_knowledge for each row execute function tv_private.track_version();

create index on public.tv_events(start_at);
create index on public.tv_memories(date);
create index on public.tv_memories(event_id);
create index on public.tv_memories(album_id);
create index on public.tv_wishlist(event_id);
create index on public.tv_letters(unlock_at);
create index on public.tv_versions(resource,entity_id,created_at desc);

-- Single atomic mutation path with row locking and optimistic concurrency.
create function public.tv_mutate(p_resource text,p_id uuid,p_expected bigint,p_patch jsonb,p_action text default 'save') returns jsonb language plpgsql security invoker set search_path='' as $$
declare tab text; prev jsonb; output jsonb; cols text; vals text; assignments text; entity uuid; sealing boolean;
begin
 if not public.tv_is_admin() then raise exception 'FORBIDDEN'; end if;
 if not (p_resource=any(array['events','memories','albums','media','letters','quick_notes','wishlist','pages','themes','music','surprises','facts','knowledge'])) then raise exception 'INVALID_RESOURCE'; end if;
 if p_action not in ('save','delete') then raise exception 'INVALID_ACTION'; end if;
 tab='tv_'||p_resource; entity=coalesce(p_id,gen_random_uuid());
 execute format('select to_jsonb(t) from public.%I t where id=$1 for update',tab) into prev using entity;
 if p_expected is null and prev is not null then raise exception 'CONFLICT'; end if;
 if p_expected is not null and (prev is null or (prev->>'revision')::bigint<>p_expected) then raise exception 'CONFLICT'; end if;
 if p_action='delete' then
   if prev is null then raise exception 'NOT_FOUND'; end if;
   execute format('delete from public.%I where id=$1',tab) using entity; return jsonb_build_object('id',entity,'deleted',true);
 end if;
 if jsonb_typeof(p_patch)<>'object' or p_patch='{}'::jsonb then raise exception 'INVALID_PATCH'; end if;
 if exists(select 1 from jsonb_object_keys(p_patch) k where k in ('id','created_at','updated_at','revision') or not exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=tab and c.column_name=k)) then raise exception 'INVALID_FIELD'; end if;
 select string_agg(format('%I',k),','),string_agg(format('r.%I',k),','),string_agg(format('%I=r.%I',k,k),',') into cols,vals,assignments from jsonb_object_keys(p_patch) k;
 sealing=p_resource='letters' and coalesce(p_patch->>'kind',prev->>'kind')='capsule' and coalesce((p_patch->>'unlock_at')::timestamptz,(prev->>'unlock_at')::timestamptz)>now();
 if sealing then
  if prev is null then execute format('insert into public.%I(id,%s) select $1,%s from jsonb_populate_record(null::public.%I,$2) r',tab,cols,vals,tab) using entity,p_patch;
  else execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$2) r where t.id=$1',tab,assignments,tab) using entity,p_patch; end if;
  return jsonb_build_object('id',entity,'sealed',true);
 end if;
 if prev is null then
  execute format('insert into public.%I(id,%s) select $1,%s from jsonb_populate_record(null::public.%I,$2) r returning to_jsonb(%I.*)',tab,cols,vals,tab,tab) into output using entity,p_patch;
 else
  execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$2) r where t.id=$1 returning to_jsonb(t.*)',tab,assignments,tab) into output using entity,p_patch;
 end if;
 return output;
end $$;
revoke all on function public.tv_mutate(text,uuid,bigint,jsonb,text) from public,anon,authenticated;
grant execute on function public.tv_mutate(text,uuid,bigint,jsonb,text) to authenticated;

create function public.tv_restore_version(p_version uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.tv_versions; current_row jsonb;
begin
 if not public.tv_is_admin() then raise exception 'FORBIDDEN'; end if;
 select * into v from public.tv_versions where id=p_version;
 if not found then raise exception 'NOT_FOUND'; end if;
 execute format('select to_jsonb(t) from public.%I t where id=$1 for update','tv_'||v.resource) into current_row using v.entity_id;
 if current_row is distinct from v.after_data then raise exception 'CONFLICT'; end if;
 return public.tv_mutate(v.resource,v.entity_id,(v.after_data->>'revision')::bigint,coalesce(v.before_data-'id'-'revision'-'created_at'-'updated_at','{}'),case when v.before_data is null then 'delete' else 'save' end);
end $$;
revoke all on function public.tv_restore_version(uuid) from public,anon,authenticated;
grant execute on function public.tv_restore_version(uuid) to authenticated;

create table public.tv_changes(id uuid primary key default gen_random_uuid(),title text not null,resource text not null,entity_id uuid,expected_revision bigint,patch jsonb not null,action text not null check(action in ('save','delete')),status text not null default 'draft' check(status in ('draft','applied','cancelled')),actor uuid not null default auth.uid(),created_at timestamptz not null default now());
alter table public.tv_changes enable row level security;
revoke all on public.tv_changes from public,anon,authenticated;
grant select,insert,update on public.tv_changes to authenticated;
create policy admin_changes_read on public.tv_changes for select to authenticated using((select public.tv_is_admin()) and (status<>'applied' or resource<>'letters' or coalesce((patch->>'unlock_at')::timestamptz,'-infinity')<=now()));
create policy admin_changes_insert on public.tv_changes for insert to authenticated with check((select public.tv_is_admin()) and actor=auth.uid() and status='draft');
create policy admin_changes_update on public.tv_changes for update to authenticated using((select public.tv_is_admin())) with check((select public.tv_is_admin()));
create function public.tv_apply_change(p_id uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.tv_changes; result jsonb;
begin
 if not public.tv_is_admin() then raise exception 'FORBIDDEN'; end if;
 select * into c from public.tv_changes where id=p_id for update;
 if not found or c.status<>'draft' then raise exception 'INVALID_CHANGE'; end if;
 result=public.tv_mutate(c.resource,c.entity_id,c.expected_revision,c.patch,c.action);
 update public.tv_changes set status='applied' where id=p_id;
 return result;
end $$;
revoke all on function public.tv_apply_change(uuid) from public,anon,authenticated;
grant execute on function public.tv_apply_change(uuid) to authenticated;

-- Atomic wishlist conversion prevents double clicks producing duplicate events.
create function public.tv_plan_wish(p_id uuid,p_start timestamptz) returns jsonb language plpgsql security invoker set search_path='' as $$
declare w public.tv_wishlist; e jsonb;
begin
 if not public.tv_is_admin() then raise exception 'FORBIDDEN'; end if;
 select * into w from public.tv_wishlist where id=p_id for update;
 if not found or w.status<>'active' then raise exception 'CONFLICT'; end if;
 e=public.tv_mutate('events',null,null,jsonb_build_object('title',w.title,'description',w.description,'start_at',p_start,'type','plan'),'save');
 perform public.tv_mutate('wishlist',w.id,w.revision,jsonb_build_object('status','planned','event_id',e->>'id'),'save');
 return e;
end $$;
revoke all on function public.tv_plan_wish(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.tv_plan_wish(uuid,timestamptz) to authenticated;

-- Shared per-user AI request budget; trusted server calls this using the user's JWT.
create table public.tv_ai_usage(user_id uuid references auth.users(id) on delete cascade,minute timestamptz not null,requests integer not null,primary key(user_id,minute));
alter table public.tv_ai_usage enable row level security;
revoke all on public.tv_ai_usage from anon,authenticated;
create function tv_private.consume_ai(p_user uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if auth.uid() is null or p_user<>auth.uid() or not exists(select 1 from public.tv_members where user_id=auth.uid()) then raise exception 'FORBIDDEN'; end if;
 delete from public.tv_ai_usage where minute<now()-interval '1 day';
 insert into public.tv_ai_usage values(p_user,date_trunc('minute',now()),1) on conflict(user_id,minute) do update set requests=public.tv_ai_usage.requests+1 returning requests into n;
 return n<=6;
end $$;
revoke all on function tv_private.consume_ai(uuid) from public,anon,authenticated;
grant usage on schema tv_private to authenticated;
grant execute on function tv_private.consume_ai(uuid) to authenticated;
create function public.tv_ai_budget() returns boolean language sql security invoker set search_path='' as $$ select tv_private.consume_ai(auth.uid()) $$;
revoke all on function public.tv_ai_budget() from public,anon,authenticated;
grant execute on function public.tv_ai_budget() to authenticated;

-- A private asset bucket. Do not put locked-capsule attachments here: ordinary members can read this bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('tawanverse','tawanverse',false,20971520,array['image/jpeg','image/png','image/webp','audio/mpeg','video/mp4']) on conflict(id) do nothing;
create policy tv_media_read on storage.objects for select to authenticated using(bucket_id='tawanverse' and (select public.tv_is_member()));
create policy tv_media_insert on storage.objects for insert to authenticated with check(bucket_id='tawanverse' and (select public.tv_is_admin()));
create policy tv_media_update on storage.objects for update to authenticated using(bucket_id='tawanverse' and (select public.tv_is_admin())) with check(bucket_id='tawanverse' and (select public.tv_is_admin()));
create policy tv_media_delete on storage.objects for delete to authenticated using(bucket_id='tawanverse' and (select public.tv_is_admin()));

-- Realtime: subscribers still need table SELECT policies. Locked letters are excluded.
do $$ declare t text; begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
 foreach t in array array['tv_events','tv_memories','tv_pages','tv_quick_notes','tv_wishlist','tv_surprises','tv_music','tv_facts'] loop
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then execute format('alter publication supabase_realtime add table public.%I',t); end if;
 end loop; end if;
end $$;
commit;
