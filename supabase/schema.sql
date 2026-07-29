create table if not exists public.classroom_state (
  class_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.classroom_state enable row level security;

-- 현재 앱은 로그인 없이 사용하는 단일 학급 버전입니다.
-- 여러 학급/외부 공개 운영 전에는 Supabase Auth와 교사별 RLS로 교체하세요.
drop policy if exists "classroom state public read" on public.classroom_state;
drop policy if exists "classroom state public write" on public.classroom_state;

create policy "classroom state public read"
  on public.classroom_state for select
  to anon, authenticated
  using (class_id = 'main');

create policy "classroom state public write"
  on public.classroom_state for all
  to anon, authenticated
  using (class_id = 'main')
  with check (class_id = 'main');

grant select, insert, update, delete on public.classroom_state to anon, authenticated;
