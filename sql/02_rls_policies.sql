-- Authenticated application requests carry an opaque session token in
-- x-app-session. The database validates its hash and current account role.

grant usage on schema public to anon, authenticated;
revoke all on table public.students, public.caretakers, public.cases,
  public.case_students, public.case_caretakers, public.case_updates,
  public.case_signatures, public.login_attempts, public.login_sessions
  from public, anon, authenticated;

grant select, insert, update, delete on table public.students, public.cases,
  public.case_students, public.case_caretakers, public.case_updates,
  public.case_signatures to anon, authenticated;
grant select (id, name, role, disabled_at, created_at)
  on table public.caretakers to anon, authenticated;

create or replace function public.app_session_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select s.caretaker_id
  from public.login_sessions s
  join public.caretakers c on c.id = s.caretaker_id
  where s.token_hash = extensions.digest(
      nullif(current_setting('request.headers', true), '')::json ->> 'x-app-session',
      'sha256'
    )
    and s.expires_at > now()
    and c.disabled_at is null;
$$;

create or replace function public.app_has_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1
    from public.caretakers c
    where c.id = public.app_session_user_id()
      and c.disabled_at is null
      and c.role = any(p_roles)
  );
$$;

revoke all on function public.app_session_user_id() from public, anon, authenticated;
revoke all on function public.app_has_role(text[]) from public, anon, authenticated;
grant execute on function public.app_session_user_id() to anon, authenticated;
grant execute on function public.app_has_role(text[]) to anon, authenticated;

alter table public.students enable row level security;
alter table public.caretakers enable row level security;
alter table public.cases enable row level security;
alter table public.case_students enable row level security;
alter table public.case_caretakers enable row level security;
alter table public.case_updates enable row level security;
alter table public.case_signatures enable row level security;
alter table public.login_attempts enable row level security;
alter table public.login_sessions enable row level security;

do $$
declare
  v_policy record;
begin
  for v_policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'students', 'caretakers', 'cases', 'case_students',
        'case_caretakers', 'case_updates', 'case_signatures',
        'login_attempts', 'login_sessions'
      ])
  loop
    execute format('drop policy %I on public.%I', v_policy.policyname, v_policy.tablename);
  end loop;
end;
$$;

create policy "students_authorized_select" on public.students
  for select to anon, authenticated using (
    public.app_has_role(array['admin', 'caretaker']) and disabled_at is null
  );
create policy "students_admin_insert" on public.students
  for insert to anon, authenticated
  with check (public.app_has_role(array['admin']));
create policy "students_admin_update" on public.students
  for update to anon, authenticated
  using (public.app_has_role(array['admin']))
  with check (public.app_has_role(array['admin']));

create policy "caretakers_authorized_select" on public.caretakers
  for select to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));

create policy "cases_authorized_select" on public.cases
  for select to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));
create policy "cases_authorized_insert" on public.cases
  for insert to anon, authenticated
  with check (
    public.app_has_role(array['admin', 'caretaker'])
    and created_by = public.app_session_user_id()
  );
create policy "cases_authorized_update" on public.cases
  for update to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']))
  with check (public.app_has_role(array['admin', 'caretaker']));
create policy "cases_authorized_delete" on public.cases
  for delete to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));

create policy "case_students_authorized_select" on public.case_students
  for select to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));
create policy "case_students_authorized_insert" on public.case_students
  for insert to anon, authenticated
  with check (public.app_has_role(array['admin', 'caretaker']));
create policy "case_students_authorized_delete" on public.case_students
  for delete to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));

create policy "case_caretakers_authorized_select" on public.case_caretakers
  for select to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));
create policy "case_caretakers_authorized_insert" on public.case_caretakers
  for insert to anon, authenticated
  with check (public.app_has_role(array['admin', 'caretaker']));
create policy "case_caretakers_authorized_delete" on public.case_caretakers
  for delete to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));

create policy "case_updates_authorized_select" on public.case_updates
  for select to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));
create policy "case_updates_authorized_insert" on public.case_updates
  for insert to anon, authenticated
  with check (
    public.app_has_role(array['admin', 'caretaker'])
    and caretaker_id = public.app_session_user_id()
  );
create policy "case_updates_authorized_update" on public.case_updates
  for update to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']))
  with check (public.app_has_role(array['admin', 'caretaker']));
create policy "case_updates_authorized_delete" on public.case_updates
  for delete to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));

create policy "case_signatures_authorized_select" on public.case_signatures
  for select to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));
create policy "case_signatures_authorized_insert" on public.case_signatures
  for insert to anon, authenticated
  with check (public.app_has_role(array['admin', 'caretaker']));
create policy "case_signatures_authorized_delete" on public.case_signatures
  for delete to anon, authenticated
  using (public.app_has_role(array['admin', 'caretaker']));
