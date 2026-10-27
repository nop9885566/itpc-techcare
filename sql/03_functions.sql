-- PIN login issues an opaque database-backed session token to the Next.js
-- server. All other operations require that active session and its DB role.

create or replace function public.login_caretaker(p_name text, p_pin text)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_caretaker public.caretakers;
  v_login_name text;
  v_name_matches integer;
  v_locked_until timestamptz;
  v_session_token text;
begin
  v_login_name := lower(trim(coalesce(p_name, '')));
  if v_login_name = '' or length(v_login_name) > 100 then
    return json_build_object('success', false, 'error', 'ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง');
  end if;

  select * into v_caretaker
  from public.caretakers
  where name = trim(p_name);
  if v_caretaker.id is null then
    select count(*) into v_name_matches
    from public.caretakers
    where lower(name) = v_login_name;
    if v_name_matches != 1 then
      return json_build_object('success', false, 'error', 'ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง');
    end if;

    select * into v_caretaker
    from public.caretakers
    where lower(name) = v_login_name;
  end if;

  if v_caretaker.disabled_at is not null then
    return json_build_object('success', false, 'error', 'ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง');
  end if;

  if v_caretaker.id is null then
    return json_build_object('success', false, 'error', 'ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง');
  end if;

  insert into public.login_attempts (login_name)
  values (v_login_name)
  on conflict (login_name) do nothing;
  select locked_until
    into v_locked_until
  from public.login_attempts
  where login_name = v_login_name
  for update;

  if v_locked_until is not null and v_locked_until > now() then
    return json_build_object('success', false, 'error', 'พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่');
  end if;

  if p_pin is null
    or p_pin !~ '^[0-9]{4,6}$'
    or v_caretaker.pin_hash != crypt(p_pin, v_caretaker.pin_hash) then
    update public.login_attempts
    set failed_attempts = case
          when locked_until is not null and locked_until <= now() then 1
          else failed_attempts + 1
        end,
        locked_until = case
          when (case
            when locked_until is not null and locked_until <= now() then 1
            else failed_attempts + 1
          end) >= 5 then now() + interval '15 minutes'
          else null
        end,
        updated_at = now()
    where login_name = v_login_name;
    return json_build_object('success', false, 'error', 'ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง');
  end if;

  v_session_token := encode(extensions.gen_random_bytes(32), 'hex');
  delete from public.login_sessions where expires_at <= now();
  insert into public.login_sessions (token_hash, caretaker_id, expires_at)
  values (
    extensions.digest(v_session_token, 'sha256'),
    v_caretaker.id,
    now() + interval '12 hours'
  );
  delete from public.login_attempts where login_name = v_login_name;

  return json_build_object(
    'success', true,
    'session_token', v_session_token,
    'caretaker', json_build_object(
      'id', v_caretaker.id,
      'name', v_caretaker.name,
      'role', v_caretaker.role
    )
  );
end;
$$;

revoke all on function public.login_caretaker(text, text) from public, anon, authenticated, service_role;
grant execute on function public.login_caretaker(text, text) to anon;

create or replace function public.current_caretaker()
returns json
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select json_build_object('id', c.id, 'name', c.name, 'role', c.role)
  from public.caretakers c
  where c.id = public.app_session_user_id()
    and c.disabled_at is null;
$$;

revoke all on function public.current_caretaker() from public, anon, authenticated, service_role;
grant execute on function public.current_caretaker() to anon, authenticated;

create or replace function public.logout_caretaker()
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  delete from public.login_sessions
  where token_hash = extensions.digest(
    nullif(current_setting('request.headers', true), '')::json ->> 'x-app-session',
    'sha256'
  )
    and caretaker_id = public.app_session_user_id();
end;
$$;

revoke all on function public.logout_caretaker() from public, anon, authenticated, service_role;
grant execute on function public.logout_caretaker() to anon, authenticated;

create or replace function public.manage_caretaker(
  p_id uuid,
  p_name text,
  p_pin text,
  p_role text
)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_id uuid;
  v_old_role text;
  v_active_admins integer;
begin
  if not public.app_has_role(array['admin']) then
    return json_build_object('success', false, 'error', 'รายการนี้อนุญาตเฉพาะผู้ดูแลระบบ');
  end if;
  if p_name is null or trim(p_name) = '' then
    return json_build_object('success', false, 'error', 'กรุณาระบุชื่อบัญชี');
  end if;
  if p_role not in ('admin', 'caretaker') then
    return json_build_object('success', false, 'error', 'บทบาทบัญชีไม่ถูกต้อง');
  end if;
  if p_id is null and (p_pin is null or p_pin !~ '^[0-9]{4,6}$') then
    return json_build_object('success', false, 'error', 'PIN ต้องเป็นตัวเลข 4–6 หลัก');
  end if;
  if p_pin is not null and p_pin !~ '^[0-9]{4,6}$' then
    return json_build_object('success', false, 'error', 'PIN ต้องเป็นตัวเลข 4–6 หลัก');
  end if;

  if p_id is null then
    insert into public.caretakers (name, pin_hash, role)
    values (trim(p_name), crypt(p_pin, gen_salt('bf')), p_role)
    returning id into v_id;
  else
    select role into v_old_role from public.caretakers where id = p_id;
    if v_old_role = 'admin' and p_role != 'admin' then
      select count(*) into v_active_admins
      from public.caretakers
      where role = 'admin' and disabled_at is null;
      if v_active_admins <= 1 then
        return json_build_object('success', false, 'error', 'ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 บัญชี');
      end if;
    end if;

    update public.caretakers set
      name = trim(p_name),
      role = p_role,
      pin_hash = case when p_pin is null then pin_hash else crypt(p_pin, gen_salt('bf')) end
    where id = p_id
    returning id into v_id;
    if v_id is null then
      return json_build_object('success', false, 'error', 'ไม่พบบัญชีนี้');
    end if;
  end if;

  return json_build_object('success', true, 'id', v_id);
end;
$$;

revoke all on function public.manage_caretaker(uuid, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.manage_caretaker(uuid, text, text, text) to anon, authenticated;

create or replace function public.update_caretaker_profile(
  p_id uuid,
  p_name text,
  p_pin text default null
)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if public.app_session_user_id() is null or p_id is distinct from public.app_session_user_id()
    or not public.app_has_role(array['admin', 'caretaker']) then
    return json_build_object('success', false, 'error', 'ไม่มีสิทธิ์แก้ไขบัญชีนี้');
  end if;
  if p_name is null or trim(p_name) = '' then
    return json_build_object('success', false, 'error', 'กรุณาระบุชื่อ');
  end if;
  if p_pin is not null and p_pin !~ '^[0-9]{4,6}$' then
    return json_build_object('success', false, 'error', 'PIN ต้องเป็นตัวเลข 4–6 หลัก');
  end if;

  update public.caretakers set
    name = trim(p_name),
    pin_hash = case when p_pin is null then pin_hash else crypt(p_pin, gen_salt('bf')) end
  where id = p_id
    and disabled_at is null;

  if not found then
    return json_build_object('success', false, 'error', 'ไม่พบบัญชีที่ใช้งานอยู่');
  end if;
  return json_build_object('success', true);
end;
$$;

revoke all on function public.update_caretaker_profile(uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.update_caretaker_profile(uuid, text, text) to anon, authenticated;

create or replace function public.set_caretaker_disabled(p_id uuid, p_disabled boolean)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_role text;
  v_active_admins integer;
begin
  if not public.app_has_role(array['admin']) then
    return json_build_object('success', false, 'error', 'รายการนี้อนุญาตเฉพาะผู้ดูแลระบบ');
  end if;
  select role into v_role from public.caretakers where id = p_id;
  if v_role is null then
    return json_build_object('success', false, 'error', 'ไม่พบบัญชีนี้');
  end if;

  if p_disabled and v_role = 'admin' then
    select count(*) into v_active_admins
    from public.caretakers
    where role = 'admin' and disabled_at is null;
    if v_active_admins <= 1 then
      return json_build_object('success', false, 'error', 'ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 บัญชี');
    end if;
  end if;

  update public.caretakers
  set disabled_at = case when p_disabled then now() else null end
  where id = p_id;

  return json_build_object('success', true);
end;
$$;

revoke all on function public.set_caretaker_disabled(uuid, boolean) from public, anon, authenticated, service_role;
grant execute on function public.set_caretaker_disabled(uuid, boolean) to anon, authenticated;

create or replace function public.create_case_full(
  p_case_type text,
  p_other_text text,
  p_details text,
  p_scheduled_at timestamptz,
  p_created_by uuid,
  p_student_ids uuid[],
  p_caretaker_ids uuid[]
)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_case_id uuid;
  v_id uuid;
  v_all_caretaker_ids uuid[];
begin
  if public.app_session_user_id() is null or p_created_by is distinct from public.app_session_user_id()
    or not public.app_has_role(array['admin', 'caretaker']) then
    return json_build_object('success', false, 'error', 'ไม่มีสิทธิ์สร้างเคส');
  end if;
  if p_case_type not in ('low_confidence', 'feel_not_smart', 'other') then
    return json_build_object('success', false, 'error', 'ประเภทเคสไม่ถูกต้อง');
  end if;
  if p_case_type = 'other' and (p_other_text is null or trim(p_other_text) = '') then
    return json_build_object('success', false, 'error', 'กรุณาระบุรายละเอียดสำหรับประเภทอื่นๆ');
  end if;
  if coalesce(cardinality(p_student_ids), 0) = 0 then
    return json_build_object('success', false, 'error', 'ต้องเลือกนักเรียนอย่างน้อย 1 คน');
  end if;
  if not exists (
    select 1 from public.caretakers
    where id = p_created_by and disabled_at is null
  ) then
    return json_build_object('success', false, 'error', 'ไม่พบบัญชีผู้สร้างเคสที่ใช้งานอยู่');
  end if;
  if exists (
    select 1 from unnest(p_student_ids) as u(student_id)
    left join public.students s on s.id = u.student_id
    where s.id is null or s.disabled_at is not null
  ) then
    return json_build_object('success', false, 'error', 'มีนักเรียนที่ถูกปิดใช้งานอยู่ในรายการ');
  end if;

  v_all_caretaker_ids := array(
    select distinct unnest(coalesce(p_caretaker_ids, array[]::uuid[]) || array[p_created_by])
  );
  if exists (
    select 1 from unnest(v_all_caretaker_ids) as u(caretaker_id)
    left join public.caretakers c on c.id = u.caretaker_id
    where c.id is null or c.disabled_at is not null
  ) then
    return json_build_object('success', false, 'error', 'มีบัญชีผู้ดูแลที่ปิดใช้งานอยู่ในรายการ');
  end if;

  insert into public.cases (case_type, other_text, details, scheduled_at, created_by)
  values (p_case_type, p_other_text, p_details, p_scheduled_at, p_created_by)
  returning id into v_case_id;

  foreach v_id in array p_student_ids loop
    insert into public.case_students (case_id, student_id) values (v_case_id, v_id)
    on conflict do nothing;
  end loop;
  foreach v_id in array v_all_caretaker_ids loop
    insert into public.case_caretakers (case_id, caretaker_id) values (v_case_id, v_id)
    on conflict do nothing;
  end loop;

  return json_build_object('success', true, 'case_id', v_case_id);
end;
$$;

revoke all on function public.create_case_full(text, text, text, timestamptz, uuid, uuid[], uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.create_case_full(text, text, text, timestamptz, uuid, uuid[], uuid[]) to anon, authenticated;

create or replace function public.update_case_full(
  p_case_id uuid,
  p_case_type text,
  p_other_text text,
  p_details text,
  p_scheduled_at timestamptz,
  p_status text,
  p_student_ids uuid[],
  p_caretaker_ids uuid[]
)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_id uuid;
begin
  if not public.app_has_role(array['admin', 'caretaker']) then
    return json_build_object('success', false, 'error', 'ไม่มีสิทธิ์แก้ไขเคส');
  end if;
  if p_case_type not in ('low_confidence', 'feel_not_smart', 'other')
    or p_status not in ('planned', 'done') then
    return json_build_object('success', false, 'error', 'ข้อมูลเคสไม่ถูกต้อง');
  end if;
  if p_case_type = 'other' and (p_other_text is null or trim(p_other_text) = '') then
    return json_build_object('success', false, 'error', 'กรุณาระบุรายละเอียดสำหรับประเภทอื่นๆ');
  end if;
  if coalesce(cardinality(p_student_ids), 0) = 0 then
    return json_build_object('success', false, 'error', 'ต้องเลือกนักเรียนอย่างน้อย 1 คน');
  end if;
  if exists (
    select 1 from unnest(p_student_ids) as u(student_id)
    left join public.students s on s.id = u.student_id
    where s.id is null or s.disabled_at is not null
  ) then
    return json_build_object('success', false, 'error', 'มีนักเรียนที่ถูกปิดใช้งานอยู่ในรายการ');
  end if;
  if exists (
    select 1 from unnest(coalesce(p_caretaker_ids, array[]::uuid[])) as u(caretaker_id)
    left join public.caretakers c on c.id = u.caretaker_id
    where c.id is null or c.disabled_at is not null
  ) then
    return json_build_object('success', false, 'error', 'มีบัญชีผู้ดูแลที่ปิดใช้งานอยู่ในรายการ');
  end if;

  update public.cases set
    case_type = p_case_type,
    other_text = p_other_text,
    details = p_details,
    scheduled_at = p_scheduled_at,
    status = p_status
  where id = p_case_id;
  if not found then
    return json_build_object('success', false, 'error', 'ไม่พบเคสนี้');
  end if;

  delete from public.case_students where case_id = p_case_id;
  foreach v_id in array p_student_ids loop
    insert into public.case_students (case_id, student_id) values (p_case_id, v_id);
  end loop;

  delete from public.case_caretakers where case_id = p_case_id;
  foreach v_id in array coalesce(p_caretaker_ids, array[]::uuid[]) loop
    insert into public.case_caretakers (case_id, caretaker_id) values (p_case_id, v_id)
    on conflict do nothing;
  end loop;

  return json_build_object('success', true);
end;
$$;

revoke all on function public.update_case_full(uuid, text, text, text, timestamptz, text, uuid[], uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.update_case_full(uuid, text, text, text, timestamptz, text, uuid[], uuid[]) to anon, authenticated;

create or replace function public.get_student_case_count(p_student_id uuid)
returns integer
language sql
security definer
set search_path = public, extensions, pg_temp
as $$
  select case when public.app_has_role(array['admin', 'caretaker']) then (
  select count(*)::integer
  from public.case_students
  where student_id = p_student_id
  ) else null end;
$$;

revoke all on function public.get_student_case_count(uuid) from public, anon, authenticated, service_role;
grant execute on function public.get_student_case_count(uuid) to anon, authenticated;
