-- ============================================================
-- SarkariType Pro V5 - SAFE ADDITIVE MIGRATION
-- Run ONCE in Supabase SQL Editor.
-- It preserves existing auth users, premium flags and payment rows.
-- ============================================================

begin;

-- Preflight: stop safely before changing anything if the proven V2 foundation is missing.
do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'SarkariType V5 preflight failed: public.profiles does not exist.';
  end if;
  if to_regclass('public.payment_orders') is null then
    raise exception 'SarkariType V5 preflight failed: public.payment_orders does not exist.';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 1) Profiles: progress, referral, sharing, admin
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id) on delete set null,
  add column if not exists referral_discount_used boolean not null default false,
  add column if not exists referral_rewarded boolean not null default false,
  add column if not exists public_slug text,
  add column if not exists share_enabled boolean not null default false,
  add column if not exists total_tests integer not null default 0,
  add column if not exists total_practice_seconds integer not null default 0,
  add column if not exists best_net_wpm integer not null default 0,
  add column if not exists best_gross_wpm integer not null default 0,
  add column if not exists best_accuracy integer not null default 0,
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_practice_date date,
  add column if not exists free_tests_used integer not null default 0,
  add column if not exists is_admin boolean not null default false;

-- Backfill any auth user that somehow lacks a profile.
-- If a legacy paid order exists, preserve entitlement by setting Premium true.
insert into public.profiles (
  id, email, full_name, is_premium, total_xp
)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(coalesce(u.email, ''), '@', 1)
  ),
  exists (
    select 1
    from public.payment_orders po
    where po.user_id = u.id
      and po.status = 'paid'
  ),
  0
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

update public.profiles
set referral_code = 'AG' || upper(substr(md5(id::text), 1, 10))
where referral_code is null or btrim(referral_code) = '';

update public.profiles
set public_slug =
  trim(both '-' from regexp_replace(
    lower(coalesce(nullif(split_part(email, '@', 1), ''), 'user')),
    '[^a-z0-9]+',
    '-',
    'g'
  )) || '-' || substr(md5(id::text), 1, 8)
where public_slug is null or btrim(public_slug) = '';

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code);
create unique index if not exists profiles_public_slug_uidx
  on public.profiles (public_slug);
create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by);

-- ------------------------------------------------------------
-- 2) Existing payment table: timestamps only, no destructive change
-- ------------------------------------------------------------
alter table public.payment_orders
  add column if not exists created_at timestamptz default now(),
  add column if not exists paid_at timestamptz;

create index if not exists payment_orders_user_idx
  on public.payment_orders (user_id);

-- ------------------------------------------------------------
-- 3) Durable typing result history
-- ------------------------------------------------------------
create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  net_wpm integer not null default 0,
  accuracy integer not null default 0,
  xp_earned integer not null default 0
);

alter table public.test_results
  add column if not exists gross_wpm integer not null default 0,
  add column if not exists typed_chars integer not null default 0,
  add column if not exists correct_chars integer not null default 0,
  add column if not exists incorrect_chars integer not null default 0,
  add column if not exists duration_seconds integer not null default 0,
  add column if not exists passage_id text,
  add column if not exists passage_title text,
  add column if not exists difficulty text,
  add column if not exists exam_mode text,
  add column if not exists mistake_map jsonb not null default '{}'::jsonb,
  add column if not exists completed_at timestamptz not null default now(),
  add column if not exists xp_earned integer not null default 0;

create index if not exists test_results_user_completed_idx
  on public.test_results (user_id, completed_at desc);

alter table public.test_results enable row level security;
drop policy if exists "Users can view own results" on public.test_results;
create policy "Users can view own results"
on public.test_results
for select
to authenticated
using ((select auth.uid()) = user_id);

-- V5 writes happen through authenticated server routes. During the safe
-- transition, legacy V2 clients may still save their own result with ZERO XP.
-- This keeps the live site functional while preventing client-awarded XP.
drop policy if exists "Legacy clients can insert own zero-XP results" on public.test_results;
create policy "Legacy clients can insert own zero-XP results"
on public.test_results
for insert
to authenticated
with check ((select auth.uid()) = user_id and coalesce(xp_earned, 0) = 0);

grant insert on table public.test_results to authenticated;
revoke update, delete on table public.test_results from anon, authenticated;

-- ------------------------------------------------------------
-- 4) Achievements
-- ------------------------------------------------------------
create table if not exists public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  emoji text not null default '🏆'
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

insert into public.achievements (id, name, description, emoji) values
  ('FIRST_TEST', 'First Step', 'Completed the first saved typing test.', '🌱'),
  ('WPM_30', '30 WPM Club', 'Reached at least 30 Net WPM.', '⚡'),
  ('WPM_40', 'Fast Fingers', 'Reached at least 40 Net WPM.', '🚀'),
  ('WPM_50', 'Speed Star', 'Reached at least 50 Net WPM.', '🌟'),
  ('ACC_95', 'Precision Typist', 'Reached at least 95% accuracy.', '🎯'),
  ('PERFECT', 'Perfect Run', 'Completed a test with 100% accuracy.', '💎'),
  ('STREAK_7', 'Seven Day Spark', 'Maintained a 7-day practice streak.', '🔥'),
  ('TESTS_50', 'Practice Pro', 'Completed 50 saved tests.', '🏅'),
  ('TESTS_100', 'Centurion', 'Completed 100 saved tests.', '👑'),
  ('HARD_MASTER', 'Hard Mode Master', 'Scored 95%+ accuracy on a Hard passage.', '🧠')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  emoji = excluded.emoji;

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
revoke all on table public.achievements from anon, authenticated;
revoke all on table public.user_achievements from anon, authenticated;

-- ------------------------------------------------------------
-- 5) Daily challenge completions
-- ------------------------------------------------------------
create table if not exists public.daily_challenge_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null,
  passage_id text not null,
  net_wpm integer not null default 0,
  accuracy integer not null default 0,
  completed_at timestamptz not null default now(),
  unique (user_id, challenge_date)
);

create index if not exists daily_challenge_date_idx
  on public.daily_challenge_results (challenge_date, net_wpm desc, accuracy desc);

alter table public.daily_challenge_results enable row level security;
revoke all on table public.daily_challenge_results from anon, authenticated;

-- ------------------------------------------------------------
-- 6) Passage CMS (site works with static fallback before seeding)
-- ------------------------------------------------------------
create table if not exists public.passages (
  id text primary key,
  title text not null,
  body text not null,
  difficulty text not null check (difficulty in ('Easy','Moderate','Hard')),
  category text not null default 'General',
  exam_tags text[] not null default '{}',
  skill_tags text[] not null default '{}',
  is_premium boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists passages_active_sort_idx
  on public.passages (is_active, sort_order);

alter table public.passages enable row level security;
revoke all on table public.passages from anon, authenticated;

-- ------------------------------------------------------------
-- 7) Lightweight analytics + error monitoring
-- ------------------------------------------------------------
create table if not exists public.analytics_events (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_errors (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  context text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);
create index if not exists app_errors_created_idx on public.app_errors (created_at desc);

alter table public.analytics_events enable row level security;
alter table public.app_errors enable row level security;
revoke all on table public.analytics_events from anon, authenticated;
revoke all on table public.app_errors from anon, authenticated;

-- ------------------------------------------------------------
-- 8) New-user trigger upgraded for V5
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    is_premium,
    total_xp,
    referral_code,
    public_slug,
    share_enabled,
    total_tests,
    total_practice_seconds,
    best_net_wpm,
    best_gross_wpm,
    best_accuracy,
    current_streak,
    longest_streak,
    free_tests_used
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    false,
    0,
    'AG' || upper(substr(md5(new.id::text), 1, 10)),
    trim(both '-' from regexp_replace(
      lower(coalesce(nullif(split_part(new.email, '@', 1), ''), 'user')),
      '[^a-z0-9]+',
      '-',
      'g'
    )) || '-' || substr(md5(new.id::text), 1, 8),
    false,
    0, 0, 0, 0, 0, 0, 0,
    0
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger function is not a public API. The trigger itself can still execute it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.handle_new_user();
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 9) Atomic typing-result + profile progress update
-- ------------------------------------------------------------
create or replace function public.record_typing_result(
  p_user_id uuid,
  p_net_wpm integer,
  p_gross_wpm integer,
  p_accuracy integer,
  p_typed_chars integer,
  p_correct_chars integer,
  p_incorrect_chars integer,
  p_duration_seconds integer,
  p_passage_id text,
  p_passage_title text,
  p_difficulty text,
  p_exam_mode text,
  p_mistake_map jsonb,
  p_xp_earned integer
)
returns table (
  id uuid,
  email text,
  full_name text,
  is_premium boolean,
  total_xp integer,
  referral_code text,
  referred_by uuid,
  referral_discount_used boolean,
  public_slug text,
  share_enabled boolean,
  total_tests integer,
  total_practice_seconds integer,
  best_net_wpm integer,
  best_gross_wpm integer,
  best_accuracy integer,
  current_streak integer,
  longest_streak integer,
  last_practice_date date,
  free_tests_used integer,
  is_admin boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_today date := timezone('Asia/Kolkata', now())::date;
  v_current_streak integer := 0;
  v_longest_streak integer := 0;
  v_last_practice date;
  v_new_streak integer := 1;
  v_is_premium boolean := false;
  v_free_tests_used integer := 0;
begin
  select
    coalesce(p.current_streak, 0),
    coalesce(p.longest_streak, 0),
    p.last_practice_date,
    coalesce(p.is_premium, false),
    coalesce(p.free_tests_used, 0)
  into
    v_current_streak,
    v_longest_streak,
    v_last_practice,
    v_is_premium,
    v_free_tests_used
  from public.profiles p
  where p.id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;

  if not v_is_premium and v_free_tests_used >= 2 then
    raise exception 'FREE_TEST_LIMIT_REACHED';
  end if;

  if v_last_practice = v_today then
    v_new_streak := greatest(v_current_streak, 1);
  elsif v_last_practice = (v_today - 1) then
    v_new_streak := greatest(v_current_streak, 0) + 1;
  else
    v_new_streak := 1;
  end if;

  insert into public.test_results (
    user_id, net_wpm, gross_wpm, accuracy,
    typed_chars, correct_chars, incorrect_chars,
    duration_seconds, passage_id, passage_title,
    difficulty, exam_mode, mistake_map, xp_earned, completed_at
  ) values (
    p_user_id,
    greatest(p_net_wpm, 0),
    greatest(p_gross_wpm, 0),
    greatest(least(p_accuracy, 100), 0),
    greatest(p_typed_chars, 0),
    greatest(p_correct_chars, 0),
    greatest(p_incorrect_chars, 0),
    greatest(p_duration_seconds, 1),
    p_passage_id,
    p_passage_title,
    p_difficulty,
    p_exam_mode,
    coalesce(p_mistake_map, '{}'::jsonb),
    greatest(p_xp_earned, 0),
    now()
  );

  update public.profiles p
  set
    total_xp = coalesce(p.total_xp, 0) + greatest(p_xp_earned, 0),
    total_tests = coalesce(p.total_tests, 0) + 1,
    total_practice_seconds = coalesce(p.total_practice_seconds, 0) + greatest(p_duration_seconds, 1),
    best_net_wpm = greatest(coalesce(p.best_net_wpm, 0), greatest(p_net_wpm, 0)),
    best_gross_wpm = greatest(coalesce(p.best_gross_wpm, 0), greatest(p_gross_wpm, 0)),
    best_accuracy = greatest(coalesce(p.best_accuracy, 0), greatest(least(p_accuracy, 100), 0)),
    current_streak = v_new_streak,
    longest_streak = greatest(v_longest_streak, v_new_streak),
    last_practice_date = v_today,
    free_tests_used = case when v_is_premium then coalesce(p.free_tests_used, 0) else least(2, coalesce(p.free_tests_used, 0) + 1) end
  where p.id = p_user_id;

  return query
  select
    p.id, p.email, p.full_name, p.is_premium, p.total_xp,
    p.referral_code, p.referred_by, p.referral_discount_used,
    p.public_slug, p.share_enabled,
    p.total_tests, p.total_practice_seconds,
    p.best_net_wpm, p.best_gross_wpm, p.best_accuracy,
    p.current_streak, p.longest_streak, p.last_practice_date,
    p.free_tests_used, p.is_admin
  from public.profiles p
  where p.id = p_user_id;
end;
$$;

revoke execute on function public.record_typing_result(
  uuid, integer, integer, integer, integer, integer, integer, integer,
  text, text, text, text, jsonb, integer
) from public, anon, authenticated;
grant execute on function public.record_typing_result(
  uuid, integer, integer, integer, integer, integer, integer, integer,
  text, text, text, text, jsonb, integer
) to service_role;

-- ------------------------------------------------------------
-- 10) Server-only XP bonus helper
-- ------------------------------------------------------------
create or replace function public.award_profile_xp(
  p_user_id uuid,
  p_amount integer
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total integer;
begin
  update public.profiles
  set total_xp = coalesce(total_xp, 0) + greatest(p_amount, 0)
  where id = p_user_id
  returning total_xp into v_total;
  return coalesce(v_total, 0);
end;
$$;

revoke execute on function public.award_profile_xp(uuid, integer) from public, anon, authenticated;
grant execute on function public.award_profile_xp(uuid, integer) to service_role;

-- ------------------------------------------------------------
-- 11) Referral reward, idempotent
-- ------------------------------------------------------------
create or replace function public.reward_referrer_for_purchase(
  p_buyer_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_referrer_id uuid;
  v_already_rewarded boolean;
begin
  select p.referred_by, coalesce(p.referral_rewarded, false)
  into v_referrer_id, v_already_rewarded
  from public.profiles p
  where p.id = p_buyer_id
  for update;

  if not found or v_referrer_id is null or v_already_rewarded then
    return null;
  end if;

  update public.profiles
  set referral_rewarded = true,
      referral_discount_used = true
  where id = p_buyer_id;

  update public.profiles
  set total_xp = coalesce(total_xp, 0) + 250
  where id = v_referrer_id;

  return v_referrer_id;
end;
$$;

revoke execute on function public.reward_referrer_for_purchase(uuid) from public, anon, authenticated;
grant execute on function public.reward_referrer_for_purchase(uuid) to service_role;

commit;

-- ============================================================
-- AUTOMATIC VERIFY OUTPUT (read-only)
-- ============================================================
select
  'SarkariType V5 migration complete' as status,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'free_tests_used'
  ) as free_test_guard_ready,
  to_regclass('public.test_results') is not null as results_ready,
  to_regclass('public.passages') is not null as passage_cms_ready,
  to_regprocedure('public.record_typing_result(uuid,integer,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb,integer)') is not null as result_rpc_ready,
  to_regprocedure('public.reward_referrer_for_purchase(uuid)') is not null as referral_rpc_ready;

-- Optional account inspection after success:
-- select id,email,is_premium,total_xp,free_tests_used,referral_code,public_slug,
--        total_tests,total_practice_seconds,best_net_wpm,current_streak,longest_streak,is_admin
-- from public.profiles order by email;
