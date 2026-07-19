-- ============================================================================
-- JanVyuha — Supabase schema (free tier)
-- Run this once in your Supabase project:  SQL Editor → paste → Run.
-- Create the project in the India region (South Asia / Mumbai, ap-south-1)
-- for data-residency comfort.
--
-- The CORE guarantee — "only the routed department, in the right jurisdiction,
-- can see/act on an issue" — is enforced HERE by Row-Level Security (RLS),
-- helper functions, and guard triggers. Not by the frontend. That is what makes
-- the security claim real when a technical team inspects it.
--
-- This schema is idempotent-ish (drops policies before re-creating) and safe to
-- re-run during a pilot. For production, manage changes via migrations.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ============================================================================
-- profiles: one row per auth user — role + (for stakeholders) department +
-- jurisdiction scope. role/department/jurisdiction are PRIVILEGED and can only
-- be set by an admin (via department_invites at sign-up, or admin RPCs); a user
-- may edit only their own name/phone (enforced by profiles_guard below).
-- ============================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'public'
               check (role in ('public','stakeholder','admin')),
  name         text not null default 'Citizen',
  department   text
               check (department in
                 ('fire','ambulance','police','municipal','electricity','water','animal')),
  -- Geographic scope for a stakeholder/admin. NULL or 'ALL' = no restriction.
  -- Otherwise matches an issue's district or state (see jurisdiction_match).
  jurisdiction text,
  phone        text,
  suspended    boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ----------------------------------------------------------------------------
-- department_invites: the ONLY way to become a stakeholder/admin. An admin adds
-- an email here (with the role/department/jurisdiction to grant); when that
-- person signs up, handle_new_user() reads this allow-list. Self-registration
-- can NEVER grant privilege — it always yields role='public'.
-- ----------------------------------------------------------------------------
create table if not exists public.department_invites (
  email        text primary key,
  role         text not null default 'stakeholder'
               check (role in ('stakeholder','admin')),
  department   text
               check (department in
                 ('fire','ambulance','police','municipal','electricity','water','animal')),
  jurisdiction text,
  invited_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
alter table public.department_invites enable row level security;

-- Helpers (security definer so RLS policies can read the caller's profile) -----
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_department()
returns text language sql stable security definer set search_path = public as $$
  select department from public.profiles where id = auth.uid();
$$;

create or replace function public.my_jurisdiction()
returns text language sql stable security definer set search_path = public as $$
  select jurisdiction from public.profiles where id = auth.uid();
$$;

create or replace function public.is_suspended()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select suspended from public.profiles where id = auth.uid()), false);
$$;

-- Does the caller's jurisdiction cover an issue in (p_state, p_district)?
-- NULL/'ALL' scope, or an admin, matches everything.
create or replace function public.jurisdiction_match(p_state text, p_district text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.my_role() = 'admin'
    or coalesce(public.my_jurisdiction(), 'ALL') = 'ALL'
    or public.my_jurisdiction() = p_state
    or public.my_jurisdiction() = p_district;
$$;

-- Create a profile automatically on sign-up. Role/department/jurisdiction come
-- ONLY from the admin-managed allow-list (department_invites) — NEVER from
-- client-supplied metadata. Name/phone may come from metadata (harmless).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inv public.department_invites%rowtype;
begin
  select * into inv from public.department_invites
    where lower(email) = lower(new.email);

  insert into public.profiles (id, role, name, department, jurisdiction, phone)
  values (
    new.id,
    coalesce(inv.role, 'public'),                                   -- privilege only via invite
    -- Name from metadata, else the email local-part, else the phone, else a
    -- safe default (phone/OAuth sign-ups may have no email — never insert NULL).
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      new.phone,
      'Citizen'
    ),
    inv.department,
    inv.jurisdiction,
    coalesce(new.raw_user_meta_data->>'phone', new.phone)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard: a non-admin may edit only their own name/phone — never their own
-- role/department/jurisdiction/suspended. Blocks the privilege-escalation hole.
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'admin' then
    if new.role is distinct from old.role
       or new.department is distinct from old.department
       or new.jurisdiction is distinct from old.jurisdiction
       or new.suspended is distinct from old.suspended then
      raise exception 'Not allowed to change privileged fields';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_trg on public.profiles;
create trigger profiles_guard_trg
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- profiles policies
drop policy if exists "profiles self read"  on public.profiles;
drop policy if exists "profiles self write" on public.profiles;
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles self read"  on public.profiles
  for select using (id = auth.uid());
create policy "profiles admin read" on public.profiles
  for select using (public.my_role() = 'admin');
-- Self-update is allowed by RLS; the guard trigger blocks privileged columns.
create policy "profiles self write" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin write" on public.profiles
  for update using (public.my_role() = 'admin');

-- department_invites: admin-only.
drop policy if exists "invites admin all" on public.department_invites;
create policy "invites admin all" on public.department_invites
  for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- ============================================================================
-- issues
-- ============================================================================
create table if not exists public.issues (
  id                  uuid primary key default gen_random_uuid(),
  ref_id              text not null,
  title               text not null,
  category            text not null check (category in
                        ('fire','road_accident','missing_person','tree_fall',
                         'road_damage','public_nuisance','electricity','water',
                         'medical','garbage')),
  description         text not null default '',
  severity            text not null default 'moderate'
                        check (severity in ('critical','high','moderate','low')),
  status              text not null default 'reported'
                        check (status in ('reported','acknowledged','in_progress','resolved')),
  lat                 double precision not null,
  lng                 double precision not null,
  address             text not null default '',
  city                text,
  state               text,
  district            text,
  reporter_id         uuid references auth.users(id) on delete set null,
  reporter_name       text not null default 'Anonymous',
  reporter_phone      text,
  anonymous           boolean not null default false,
  routed_departments  text[] not null default '{}',
  upvotes             integer not null default 0,
  ai_meta             jsonb,
  -- Moderation / de-duplication
  moderation_status   text not null default 'active'
                        check (moderation_status in ('active','flagged','held','merged','rejected')),
  flagged             boolean not null default false,
  duplicate_of        uuid references public.issues(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists issues_created_idx  on public.issues (created_at desc);
create index if not exists issues_routed_idx   on public.issues using gin (routed_departments);
create index if not exists issues_reporter_idx on public.issues (reporter_id);
create index if not exists issues_geo_idx      on public.issues (state, district);

alter table public.issues enable row level security;

-- Column-immutability guard: a non-admin routed stakeholder may change ONLY the
-- headline status/updated_at (per-department progress lives in its own table).
-- They can NEVER rewrite routing, reporter PII, location, or moderation fields.
create or replace function public.issues_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Legitimate security-definer RPCs (e.g. cast_vote bumping upvotes) set this
  -- transaction-local flag to bypass the column-immutability checks. A plain
  -- stakeholder UPDATE never sets it, so it can't game the guarded columns.
  if current_setting('app.bypass_issue_guard', true) = 'on' then
    return new;
  end if;
  if public.my_role() is distinct from 'admin' then
    if new.ref_id is distinct from old.ref_id
       or new.title is distinct from old.title
       or new.category is distinct from old.category
       or new.description is distinct from old.description
       or new.severity is distinct from old.severity
       or new.lat is distinct from old.lat
       or new.lng is distinct from old.lng
       or new.address is distinct from old.address
       or new.state is distinct from old.state
       or new.district is distinct from old.district
       or new.reporter_id is distinct from old.reporter_id
       or new.reporter_name is distinct from old.reporter_name
       or new.reporter_phone is distinct from old.reporter_phone
       or new.anonymous is distinct from old.anonymous
       or new.routed_departments is distinct from old.routed_departments
       or new.moderation_status is distinct from old.moderation_status
       or new.duplicate_of is distinct from old.duplicate_of
       -- These were mutable and let a routed stakeholder game the metrics:
       -- upvotes (citizen-priority signal), flagged, city (analytics grouping),
       -- created_at (backdating skews avg-resolution KPI), ai_meta.
       or new.upvotes is distinct from old.upvotes
       or new.flagged is distinct from old.flagged
       or new.city is distinct from old.city
       or new.created_at is distinct from old.created_at
       or new.ai_meta is distinct from old.ai_meta then
      raise exception 'Not allowed to change protected issue fields';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists issues_guard_trg on public.issues;
create trigger issues_guard_trg
  before update on public.issues
  for each row execute function public.issues_guard();

-- Who may SEE an issue row:
--   • the citizen who reported it, OR
--   • an admin, OR
--   • a (non-suspended) stakeholder whose department is routed AND whose
--     jurisdiction covers the issue's state/district.
drop policy if exists "issues visible to owner or routed dept" on public.issues;
create policy "issues visible to owner or routed dept" on public.issues
  for select using (
    reporter_id = auth.uid()
    or public.my_role() = 'admin'
    or (
      public.my_role() = 'stakeholder'
      and not public.is_suspended()
      and public.my_department() = any(routed_departments)
      and public.jurisdiction_match(state, district)
    )
  );

-- Who may CREATE an issue: any signed-in, non-suspended user, filing as self.
drop policy if exists "issues insert by reporter" on public.issues;
create policy "issues insert by reporter" on public.issues
  for insert with check (reporter_id = auth.uid() and not public.is_suspended());

-- Who may UPDATE: a routed stakeholder (status only, via the guard) or an admin.
drop policy if exists "issues update by routed dept" on public.issues;
create policy "issues update by routed dept" on public.issues
  for update using (
    public.my_role() = 'admin'
    or (
      public.my_role() = 'stakeholder'
      and not public.is_suspended()
      and public.my_department() = any(routed_departments)
      and public.jurisdiction_match(state, district)
    )
  );

-- Right to erasure (DPDP): a citizen may DELETE their own report; admins may
-- delete any. Child rows (media/updates/dept status/votes) cascade via FKs.
drop policy if exists "issues delete by owner or admin" on public.issues;
create policy "issues delete by owner or admin" on public.issues
  for delete using (
    reporter_id = auth.uid() or public.my_role() = 'admin'
  );

-- ============================================================================
-- issue_department_status — per-department, independent progress. THIS is the
-- table the app's `departmentStatus` model needs; its earlier absence broke the
-- entire Supabase path. Each routed department advances on its own timeline.
-- ============================================================================
create table if not exists public.issue_department_status (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references public.issues(id) on delete cascade,
  department  text not null check (department in
                ('fire','ambulance','police','municipal','electricity','water','animal')),
  status      text not null default 'notified'
                check (status in ('notified','acknowledged','responding','done')),
  updated_by  text,
  updated_at  timestamptz not null default now(),
  unique (issue_id, department)
);
create index if not exists ids_issue_idx on public.issue_department_status (issue_id);
alter table public.issue_department_status enable row level security;

-- Visible whenever the parent issue is visible (inherits issue RLS via EXISTS).
drop policy if exists "dept status read" on public.issue_department_status;
create policy "dept status read" on public.issue_department_status
  for select using (
    exists (select 1 from public.issues i where i.id = issue_id)
  );
-- Insert: the reporter seeding the initial rows for their new issue, OR the
-- owning department stakeholder, OR an admin.
drop policy if exists "dept status insert" on public.issue_department_status;
create policy "dept status insert" on public.issue_department_status
  for insert with check (
    public.my_role() = 'admin'
    -- A reporter may only seed the initial 'notified' row for their own issue —
    -- without this, a malicious reporter could insert status='done' and fake a
    -- resolution before any department touched it.
    or (
      status = 'notified'
      and exists (select 1 from public.issues i
                  where i.id = issue_id and i.reporter_id = auth.uid())
    )
    or (
      public.my_role() = 'stakeholder'
      and not public.is_suspended()
      and department = public.my_department()
      and exists (select 1 from public.issues i
                  where i.id = issue_id
                    and department = any(i.routed_departments)
                    and public.jurisdiction_match(i.state, i.district))
    )
  );
-- Update: only the owning department stakeholder (their own row) or an admin.
drop policy if exists "dept status update" on public.issue_department_status;
create policy "dept status update" on public.issue_department_status
  for update using (
    public.my_role() = 'admin'
    or (
      public.my_role() = 'stakeholder'
      and not public.is_suspended()
      and department = public.my_department()
      and exists (select 1 from public.issues i
                  where i.id = issue_id
                    and department = any(i.routed_departments)
                    and public.jurisdiction_match(i.state, i.district))
    )
  );

-- ============================================================================
-- issue_media
-- ============================================================================
create table if not exists public.issue_media (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references public.issues(id) on delete cascade,
  type        text not null default 'image' check (type in ('image','video')),
  url         text not null,          -- gradient:/http(s): seed, or a storage path
  label       text,
  created_at  timestamptz not null default now()
);
alter table public.issue_media enable row level security;

drop policy if exists "media follows issue read" on public.issue_media;
create policy "media follows issue read" on public.issue_media
  for select using (
    exists (select 1 from public.issues i where i.id = issue_id)
  );
drop policy if exists "media insert by reporter" on public.issue_media;
create policy "media insert by reporter" on public.issue_media
  for insert with check (
    exists (select 1 from public.issues i
            where i.id = issue_id and i.reporter_id = auth.uid())
  );

-- ============================================================================
-- issue_updates (citizen-facing status timeline)
-- ============================================================================
create table if not exists public.issue_updates (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references public.issues(id) on delete cascade,
  status      text not null check (status in ('reported','acknowledged','in_progress','resolved')),
  note        text not null default '',
  by_name     text not null default 'System',
  created_at  timestamptz not null default now()
);
alter table public.issue_updates enable row level security;

drop policy if exists "updates follow issue read" on public.issue_updates;
create policy "updates follow issue read" on public.issue_updates
  for select using (
    exists (select 1 from public.issues i where i.id = issue_id)
  );
drop policy if exists "updates insert" on public.issue_updates;
create policy "updates insert" on public.issue_updates
  for insert with check (
    exists (
      select 1 from public.issues i
      where i.id = issue_id
        and (
          i.reporter_id = auth.uid()
          or public.my_role() = 'admin'
          or (public.my_role() = 'stakeholder'
              and not public.is_suspended()
              and public.my_department() = any(i.routed_departments)
              and public.jurisdiction_match(i.state, i.district))
        )
    )
  );

-- Atomically create an issue + its per-department status rows + the first
-- timeline entry. The client used to do these as 3 separate fire-and-forget
-- inserts with no error checking — a failure partway through (e.g. a dropped
-- connection after the issue row landed) could leave an orphaned issue with
-- no routing/timeline rows, a permanently "stuck" report. A single function
-- call is one Postgres transaction: if any insert raises, everything rolls
-- back and the client gets a clean error instead of silent partial success.
--
-- SECURITY INVOKER (the default — not definer): this runs as the calling
-- citizen, so the existing RLS policies on issues/issue_department_status/
-- issue_updates still fully govern every write here; it only adds atomicity,
-- not new privilege. Media upload is NOT part of this: it's a Storage call,
-- not a DB row, so it was never transactional with these inserts and stays a
-- separate best-effort client step (a failed photo shouldn't void the report).
create or replace function public.create_issue(
  p_ref_id             text,
  p_title              text,
  p_category           text,
  p_description        text,
  p_severity           text,
  p_lat                double precision,
  p_lng                double precision,
  p_address            text,
  p_city               text,
  p_state              text,
  p_district           text,
  p_reporter_name      text,
  p_reporter_phone     text,
  p_anonymous          boolean,
  p_routed_departments text[],
  p_ai_meta            jsonb
)
returns table (id uuid, ref_id text, created_at timestamptz)
language plpgsql set search_path = public as $$
declare
  v_issue_id uuid;
  v_dept text;
  -- Auto-route to moderation if the AI itself flagged this as spam/abuse/
  -- not-a-genuine-civic-issue and the citizen submitted anyway.
  v_ai_flagged boolean := coalesce((p_ai_meta->>'flagged')::boolean, false);
begin
  insert into public.issues (
    ref_id, title, category, description, severity, status,
    lat, lng, address, city, state, district,
    reporter_id, reporter_name, reporter_phone, anonymous,
    routed_departments, ai_meta, flagged, moderation_status
  ) values (
    p_ref_id, p_title, p_category, p_description, p_severity, 'reported',
    p_lat, p_lng, p_address, p_city, p_state, p_district,
    auth.uid(), p_reporter_name, p_reporter_phone, p_anonymous,
    p_routed_departments, p_ai_meta, v_ai_flagged,
    case when v_ai_flagged then 'flagged' else 'active' end
  )
  returning public.issues.id into v_issue_id;

  foreach v_dept in array p_routed_departments loop
    insert into public.issue_department_status (issue_id, department, status)
    values (v_issue_id, v_dept, 'notified');
  end loop;

  insert into public.issue_updates (issue_id, status, note, by_name)
  values (
    v_issue_id, 'reported',
    'Issue reported and routed to the concerned department(s).',
    'JanVyuha System'
  );

  return query select i.id, i.ref_id, i.created_at from public.issues i where i.id = v_issue_id;
end;
$$;

-- ============================================================================
-- issue_votes — one "also affected" vote per user per issue (dedup).
-- ============================================================================
create table if not exists public.issue_votes (
  issue_id   uuid not null references public.issues(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);
alter table public.issue_votes enable row level security;
drop policy if exists "votes self" on public.issue_votes;
create policy "votes self" on public.issue_votes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Atomic, deduped vote. Returns the new upvote count.
create or replace function public.cast_vote(p_issue uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  insert into public.issue_votes (issue_id, user_id)
  values (p_issue, auth.uid())
  on conflict do nothing;
  if found then
    -- Allow this one legitimate upvote write past issues_guard (transaction-local).
    perform set_config('app.bypass_issue_guard', 'on', true);
    update public.issues set upvotes = upvotes + 1 where id = p_issue;
  end if;
  select upvotes into n from public.issues where id = p_issue;
  return coalesce(n, 0);
end;
$$;

-- Citizen reopens a resolved report they're not satisfied with (the counter to
-- "administrative closure"). SECURITY DEFINER because the reporter has no UPDATE
-- policy on issues — the function itself enforces: caller is the reporter (or an
-- admin) AND the issue is currently resolved. Every routed department drops back
-- to 'acknowledged' (it's back in their queue), the overall status is re-derived
-- by the normal model, and the timeline + audit record who reopened it.
create or replace function public.reopen_issue(p_issue uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_reporter uuid;
  v_status text;
  v_name text;
begin
  select reporter_id, status into v_reporter, v_status
  from public.issues where id = p_issue;
  if v_reporter is null and public.my_role() is distinct from 'admin' then
    raise exception 'Issue not found';
  end if;
  if v_reporter is distinct from auth.uid() and public.my_role() is distinct from 'admin' then
    raise exception 'Only the reporter may reopen this issue';
  end if;
  if v_status is distinct from 'resolved' then
    raise exception 'Only a resolved issue can be reopened';
  end if;

  update public.issue_department_status
  set status = 'acknowledged', updated_at = now()
  where issue_id = p_issue;

  perform set_config('app.bypass_issue_guard', 'on', true);
  update public.issues
  set status = 'acknowledged', updated_at = now()
  where id = p_issue;

  select coalesce(raw_user_meta_data->>'name', email, 'Citizen')
  into v_name from auth.users where id = auth.uid();
  insert into public.issue_updates (issue_id, status, note, by_name)
  values (
    p_issue, 'acknowledged',
    'Reopened by the citizen — the issue was not resolved.',
    coalesce(v_name, 'Citizen')
  );

  -- Audit directly (write_audit is officials-only by design; a citizen reopen
  -- is still a legitimate audit event — actor pinned to auth.uid() as always).
  insert into public.audit_log (actor_id, actor_name, action, issue_id)
  values (auth.uid(), coalesce(v_name, 'Citizen'), 'reopen', p_issue);
end;
$$;

-- ============================================================================
-- issue_ratings — post-resolution citizen satisfaction (1..5 + comment).
-- ============================================================================
create table if not exists public.issue_ratings (
  issue_id   uuid not null references public.issues(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  stars      integer not null check (stars between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);
alter table public.issue_ratings enable row level security;
-- Owner: full read/write on their OWN rating only. Previously this policy's
-- `using` also matched any admin/stakeholder, which (because `using` governs
-- SELECT/UPDATE/DELETE of existing rows) let any department DELETE ratings —
-- e.g. erase its own negative feedback — and read every comment cross-dept.
drop policy if exists "ratings owner write" on public.issue_ratings;
create policy "ratings owner write" on public.issue_ratings
  for all using (
    user_id = auth.uid()
  ) with check (
    user_id = auth.uid()
    and exists (select 1 from public.issues i
                where i.id = issue_id and i.reporter_id = auth.uid())
  );

-- Officials get READ-ONLY access, scoped to issues they can already see:
-- admins → all; stakeholders → only ratings for issues routed to their
-- department. No UPDATE/DELETE for staff, so feedback cannot be tampered with.
drop policy if exists "ratings staff read" on public.issue_ratings;
create policy "ratings staff read" on public.issue_ratings
  for select using (
    public.my_role() = 'admin'
    or (
      public.my_role() = 'stakeholder'
      and exists (
        select 1 from public.issues i
        where i.id = issue_id
          and public.my_department() = any(i.routed_departments)
      )
    )
  );

-- ============================================================================
-- issue_reports — citizen "report abuse / not genuine" for moderation.
-- ============================================================================
create table if not exists public.issue_reports (
  id         uuid primary key default gen_random_uuid(),
  issue_id   uuid not null references public.issues(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  reason     text not null default '',
  created_at timestamptz not null default now()
);
alter table public.issue_reports enable row level security;
drop policy if exists "reports insert any auth" on public.issue_reports;
create policy "reports insert any auth" on public.issue_reports
  for insert with check (auth.uid() is not null);
drop policy if exists "reports admin read" on public.issue_reports;
create policy "reports admin read" on public.issue_reports
  for select using (public.my_role() = 'admin');

-- ============================================================================
-- audit_log — append-only accountability trail (who did what). Distinct from
-- the citizen-facing timeline. Only admins can read; nobody can update/delete.
-- ============================================================================
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid,
  actor_name text,
  action     text not null,
  issue_id   uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
drop policy if exists "audit admin read" on public.audit_log;
create policy "audit admin read" on public.audit_log
  for select using (public.my_role() = 'admin');

create or replace function public.write_audit(p_action text, p_issue uuid, p_detail jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Only officials may write to the tamper-evident trail. Without this, EXECUTE
  -- is granted to PUBLIC by default, so any authenticated citizen could inject or
  -- flood audit entries and undermine its evidentiary value. Actor is still pinned
  -- to auth.uid(), so an official cannot impersonate someone else.
  if public.my_role() not in ('admin','stakeholder') then
    raise exception 'Not authorised to write audit log';
  end if;
  insert into public.audit_log (actor_id, actor_name, action, issue_id, detail)
  values (
    auth.uid(),
    coalesce((select name from public.profiles where id = auth.uid()), 'System'),
    p_action, p_issue, p_detail
  );
end;
$$;

-- Trigger-only functions are executed by their triggers (as table owner), never
-- called directly by clients, so drop the default PUBLIC EXECUTE grant on them.
-- (Do NOT revoke the my_role/my_department/... helpers — RLS policies call them
-- as the querying user and need EXECUTE.)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.profiles_guard() from public, anon, authenticated;
revoke execute on function public.issues_guard() from public, anon, authenticated;

-- ============================================================================
-- push_subscriptions — Web Push endpoints (free). Server function reads these.
-- ============================================================================
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push self" on public.push_subscriptions;
create policy "push self" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- Admin provisioning RPCs (admin-only, security definer)
-- ============================================================================
create or replace function public.admin_invite(
  p_email text, p_role text, p_department text, p_jurisdiction text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'admin' then
    raise exception 'admin only';
  end if;
  insert into public.department_invites (email, role, department, jurisdiction, invited_by)
  values (lower(p_email), p_role, p_department, p_jurisdiction, auth.uid())
  on conflict (email) do update
    set role = excluded.role,
        department = excluded.department,
        jurisdiction = excluded.jurisdiction,
        invited_by = excluded.invited_by;
  -- If the user already exists, upgrade their profile immediately.
  update public.profiles p
    set role = p_role, department = p_department, jurisdiction = p_jurisdiction
    from auth.users u
    where u.id = p.id and lower(u.email) = lower(p_email);
  perform public.write_audit('admin_invite', null,
    jsonb_build_object('email', lower(p_email), 'role', p_role, 'department', p_department));
end;
$$;

create or replace function public.admin_set_suspended(p_user uuid, p_bool boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'admin' then
    raise exception 'admin only';
  end if;
  update public.profiles set suspended = p_bool where id = p_user;
  perform public.write_audit('admin_set_suspended', null,
    jsonb_build_object('user', p_user, 'suspended', p_bool));
end;
$$;

-- ============================================================================
-- Public transparency feed — a CURATED view that exposes ONLY non-PII columns
-- with location COARSENED to ~1km (2 decimals), for ACTIVE issues. This is the
-- ONLY thing anon can read. The `issues` table itself has NO anon-permissive
-- RLS policy, so anon gets zero rows from it directly — reporter name, phone,
-- and precise coordinates are never world-readable. (This replaces the old
-- definer view that leaked reporter_name + exact location.)
-- ============================================================================
drop view if exists public.public_issue_feed;
create view public.public_issue_feed as
  select id, ref_id, title, category, severity, status,
         round(lat::numeric, 2) as lat,
         round(lng::numeric, 2) as lng,
         city, state, district,
         routed_departments, upvotes, created_at, updated_at
  from public.issues
  where moderation_status = 'active';

grant select on public.public_issue_feed to anon, authenticated;

-- ============================================================================
-- Storage bucket for evidence — PRIVATE. Photos/videos of accidents, injured
-- people, or minors must NOT be world-readable by URL. The app serves them via
-- short-lived SIGNED URLs (see supabaseApi.ts). Writes are owner-scoped: the
-- object path must begin with the uploader's issue folder.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('evidence','evidence', false)
on conflict (id) do update set public = false;

drop policy if exists "evidence public read"          on storage.objects;
drop policy if exists "evidence authenticated write"  on storage.objects;
drop policy if exists "evidence read visible issue"   on storage.objects;
drop policy if exists "evidence owner write"          on storage.objects;

-- Read: signed URLs are generated server-side with the service key OR by a user
-- who can see the parent issue. Restrict direct object read to authenticated
-- users who own or are routed to the issue whose id prefixes the object path.
create policy "evidence read visible issue" on storage.objects
  for select to authenticated using (
    bucket_id = 'evidence'
    and exists (
      select 1 from public.issues i
      where i.id::text = split_part(name, '/', 1)
    )
  );
-- Write: an authenticated user may upload only under an issue folder they own.
create policy "evidence owner write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'evidence'
    and exists (
      select 1 from public.issues i
      where i.id::text = split_part(name, '/', 1)
        and i.reporter_id = auth.uid()
    )
  );

-- ============================================================================
-- Realtime — stream inserts/updates to dashboards
-- ============================================================================
do $$
begin
  begin alter publication supabase_realtime add table public.issues;
  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.issue_updates;
  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.issue_department_status;
  exception when duplicate_object then null; end;
end $$;

-- Done. Next: run supabase/seed.sql (optional demo data). Create your FIRST
-- admin by inserting a department_invites row (role='admin') for your email,
-- then sign up with that email — you'll be provisioned as admin automatically.
